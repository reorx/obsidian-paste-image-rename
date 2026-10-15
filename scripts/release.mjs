import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ASSETS = ['main.js', 'manifest.json', 'styles.css'];
export const BOOTSTRAP = {
  version: '1.7.1',
  parent: 'ec796dae3f65e3f0589268d41696858455404dac',
  subject: 'ci: bootstrap automated release 1.7.1',
};
const repository = 'reorx/obsidian-paste-image-rename';
const hash = data => createHash('sha256').update(data).digest('hex');
const json = file => JSON.parse(readFileSync(file, 'utf8'));
const git = (...args) => execFileSync('git', args, {encoding: 'utf8'}).trim();

export function validateEvent({version, ref, sha, eventName, event, head, parents, subject}) {
  assert.match(version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, 'Version must be plain x.y.z');
  assert.match(sha, /^[0-9a-f]{40}$/, 'Expected a full commit SHA');
  assert.equal(head, sha, 'Checkout must equal the event commit');
  assert.equal(eventName, 'push', 'Only explicit push events can release');
  assert.equal(event.deleted, false, 'Deleted refs cannot release');
  assert.equal(event.forced, false, 'Force pushes cannot release');
  if (ref === `refs/tags/${version}`) {
    // GitHub may report the tag object's SHA in after for an annotated tag;
    // GITHUB_SHA and the checkout still identify its dereferenced commit.
    assert.equal(event.ref, ref);
    return 'tag';
  }
  assert.equal(ref, 'refs/heads/master', 'Tag must match manifest version exactly');
  assert.equal(event.ref, ref);
  assert.equal(version, BOOTSTRAP.version, 'Bootstrap is limited to one version');
  assert.equal(event.before, BOOTSTRAP.parent, 'Bootstrap must start at the reviewed release commit');
  assert.equal(event.after, sha, 'Bootstrap event must identify this exact commit');
  assert.deepEqual(parents, [BOOTSTRAP.parent], 'Bootstrap must have exactly the reviewed direct parent');
  assert.equal(subject, BOOTSTRAP.subject, 'Bootstrap needs the exact one-time commit subject');
  return 'bootstrap';
}

function validateCheckout() {
  assert.equal(process.env.GITHUB_REPOSITORY, repository, 'Unexpected repository');
  const manifest = json('manifest.json'), pkg = json('package.json'), lock = json('package-lock.json');
  const versions = json('versions.json');
  assert.equal(pkg.version, manifest.version);
  assert.equal(lock.version, manifest.version);
  assert.equal(lock.packages[''].version, manifest.version);
  assert.equal(versions[manifest.version], manifest.minAppVersion);
  const sha = process.env.GITHUB_SHA;
  const mode = validateEvent({version: manifest.version, ref: process.env.GITHUB_REF, sha,
    eventName: process.env.GITHUB_EVENT_NAME, event: json(process.env.GITHUB_EVENT_PATH),
    head: git('rev-parse', 'HEAD'), parents: git('show', '-s', '--format=%P', 'HEAD').split(' ').filter(Boolean),
    subject: git('show', '-s', '--format=%s', 'HEAD')});
  if (mode === 'tag') assert.equal(git('rev-parse', `refs/tags/${manifest.version}^{commit}`), sha, 'Tag moved since the event');
  const notes = readFileSync(`docs/releases/${manifest.version}.md`, 'utf8');
  assert.ok(notes.trim(), 'Release notes are required');
  return {version: manifest.version, sha, mode, repository, notes};
}

export function inspectAssets(directory, version) {
  assert.deepEqual(readdirSync(directory).sort(), [...ASSETS].sort(), 'Only the three plugin assets may be staged');
  const assets = ASSETS.map(name => {
    const file = path.join(directory, name), data = readFileSync(file);
    assert.ok(statSync(file).isFile() && data.length > 0 && data.length < 5_000_000, `Invalid asset: ${name}`);
    return {name, size: data.length, sha256: hash(data)};
  });
  assert.equal(json(path.join(directory, 'manifest.json')).version, version);
  const main = readFileSync(path.join(directory, 'main.js'), 'utf8');
  assert.ok(main.includes(`version: "${version}"`), 'Bundle version differs from the manifest');
  assert.ok(!main.includes('sourceMappingURL=') && !main.includes('node:test') && !main.includes('tests/obsidian-mock') && !main.includes('.test-build'), 'Tests or source maps in bundle');
  assert.ok(!/gh[pousr]_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|sk-(?:proj-)?[A-Za-z0-9_-]{30,}/.test(main), 'Credential-like content in bundle');
  assert.ok(main.includes(readFileSync('THIRD_PARTY_LICENSES.txt', 'utf8')), 'Third-party notices missing');
  return assets;
}

export async function publishRelease(plan, client, bytes) {
  assert.equal(plan.repository, repository);
  assert.match(plan.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.match(plan.sha, /^[0-9a-f]{40}$/);
  assert.deepEqual(plan.assets.map(a => a.name).sort(), [...ASSETS].sort());
  for (const asset of plan.assets) {
    const data = bytes(asset.name);
    assert.equal(data.length, asset.size);
    assert.equal(hash(data), asset.sha256, `Staged asset changed: ${asset.name}`);
  }
  const base = `/repos/${repository}`;
  const refPath = `${base}/git/ref/tags/${plan.version}`;
  let tag = await client.get(refPath, true);
  const resolve = async object => {
    for (let i = 0; i < 8; i++) {
      if (object.type === 'commit') return object.sha;
      assert.equal(object.type, 'tag', 'Unexpected tag object type');
      object = (await client.get(`${base}/git/tags/${object.sha}`)).object;
    }
    throw Error('Tag nesting exceeds the safety limit');
  };
  if (tag) assert.equal(await resolve(tag.object), plan.sha, 'Existing version tag points to another commit');
  let release = await client.get(`${base}/releases/tags/${plan.version}`, true);
  // Drafts are not guaranteed to be returned by the tag lookup. Enumerate them
  // before creating anything, and fail closed if the tag has ambiguous releases.
  const matches = new Map(release ? [[release.id, release]] : []);
  for (let page = 1; ; page++) {
    assert.ok(page <= 20, 'Release inventory exceeds the safety limit');
    const listed = await client.get(`${base}/releases?per_page=100&page=${page}`);
    assert.ok(Array.isArray(listed));
    for (const item of listed) if (item.tag_name === plan.version) matches.set(item.id, item);
    if (listed.length < 100) break;
  }
  assert.ok(matches.size <= 1, 'Multiple releases use this tag; manual inspection required');
  release = [...matches.values()][0];
  const assertRelease = (current, expectedDraft, expectedId) => {
    assert.ok(current && Number.isSafeInteger(current.id) && current.id > 0, 'Invalid release identity');
    if (expectedId !== undefined) assert.equal(current.id, expectedId, 'Release identity changed');
    assert.equal(current.tag_name, plan.version);
    assert.equal(current.target_commitish, plan.sha, 'Release target differs from the verified commit');
    assert.equal(current.name, plan.version, 'Existing release title differs');
    assert.equal(current.body, plan.notes, 'Existing release notes differ; refusing to overwrite');
    assert.equal(current.prerelease, false, 'Unexpected prerelease');
    if (expectedDraft !== undefined) assert.equal(current.draft, expectedDraft, 'Release publication state changed');
  };
  if (release) {
    assert.ok(tag, 'An existing release must have its verified tag');
    assertRelease(release);
  }
  const verifyAssets = async (current, complete) => {
    const assets = await client.get(`${base}/releases/${current.id}/assets?per_page=100`);
    assert.ok(assets.length <= ASSETS.length, 'Unexpected release assets');
    assert.equal(new Set(assets.map(a => a.name)).size, assets.length, 'Duplicate release asset names');
    for (const asset of assets) {
      const expected = plan.assets.find(a => a.name === asset.name);
      assert.ok(expected, `Unexpected release asset: ${asset.name}`);
      assert.equal(asset.state, 'uploaded', 'Incomplete upload needs manual inspection');
      assert.equal(asset.size, expected.size, `Existing asset size differs: ${asset.name}`);
      const downloaded = await client.download(asset);
      assert.equal(downloaded.length, expected.size);
      assert.equal(hash(downloaded), expected.sha256, `Existing asset bytes differ: ${asset.name}`);
    }
    if (complete) assert.deepEqual(assets.map(a => a.name).sort(), [...ASSETS].sort(), 'Published release is missing assets');
    return assets;
  };
  const existing = release ? await verifyAssets(release, !release.draft) : [];
  if (release && !release.draft) return release.html_url; // Verified no-op; never modify a published release.
  if (!tag) {
    await client.post(`${base}/git/refs`, {ref: `refs/tags/${plan.version}`, sha: plan.sha});
    tag = await client.get(refPath);
    assert.equal(await resolve(tag.object), plan.sha, 'New tag target could not be verified');
  }
  if (!release) release = await client.post(`${base}/releases`, {
    tag_name: plan.version, target_commitish: plan.sha, name: plan.version,
    body: plan.notes, draft: true, prerelease: false,
  });
  assertRelease(release, true);
  const releaseId = release.id;
  for (const asset of plan.assets) if (!existing.some(a => a.name === asset.name)) {
    assertRelease(await client.get(`${base}/releases/${releaseId}`), true, releaseId);
    await client.upload(release.id, asset.name, bytes(asset.name));
  }
  assertRelease(await client.get(`${base}/releases/${releaseId}`), true, releaseId);
  await verifyAssets(release, true);
  assert.equal(await resolve((await client.get(refPath)).object), plan.sha, 'Tag changed before publishing');
  assertRelease(await client.get(`${base}/releases/${releaseId}`), true, releaseId);
  release = await client.patch(`${base}/releases/${release.id}`, {draft: false, make_latest: 'true'});
  assertRelease(release, false, releaseId);
  const published = await client.get(`${base}/releases/tags/${plan.version}`);
  assertRelease(published, false, releaseId);
  await verifyAssets(published, true);
  return published.html_url;
}

function githubClient(token) {
  assert.ok(token, 'The built-in GitHub Actions token is required');
  const api = async (method, pathname, body, missing = false, host = 'https://api.github.com') => {
    const response = await fetch(host + pathname, {method, redirect: 'error',
      headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', ...(body instanceof Uint8Array ? {'Content-Type': 'application/octet-stream'} : {'Content-Type': 'application/json'})},
      body: body === undefined ? undefined : body instanceof Uint8Array ? body : JSON.stringify(body)});
    if (missing && response.status === 404) return null;
    if (!response.ok) throw Error(`GitHub ${method} ${pathname}: HTTP ${response.status}`);
    return response.json();
  };
  return {
    get: (p, missing) => api('GET', p, undefined, missing),
    post: (p, b) => api('POST', p, b),
    patch: (p, b) => api('PATCH', p, b),
    upload: (id, name, data) => api('POST', `/repos/${repository}/releases/${id}/assets?name=${encodeURIComponent(name)}`, data, false, 'https://uploads.github.com'),
    download: async asset => {
      // Use the authenticated API for draft assets, but never forward its token to a CDN.
      let response = await fetch(`https://api.github.com/repos/${repository}/releases/assets/${asset.id}`, {
        redirect: 'manual', headers: {Authorization: `Bearer ${token}`, Accept: 'application/octet-stream', 'X-GitHub-Api-Version': '2022-11-28'}});
      if (response.status === 302) {
        const location = new URL(response.headers.get('location'));
        assert.ok(location.protocol === 'https:' && location.hostname.endsWith('.githubusercontent.com'), 'Unexpected asset download destination');
        response = await fetch(location, {redirect: 'error'});
      }
      assert.ok(response.ok, `Asset download failed: HTTP ${response.status}`);
      const data = Buffer.from(await response.arrayBuffer());
      assert.equal(data.length, asset.size, 'Downloaded asset size differs');
      return data;
    },
  };
}

async function main() {
  const mode = process.argv[2], checked = validateCheckout();
  if (mode === 'validate') { console.log(`Validated ${checked.mode} release ${checked.version} at ${checked.sha}`); return; }
  const directory = process.env.RELEASE_DIR;
  assert.ok(directory && path.isAbsolute(directory), 'RELEASE_DIR must be an absolute temporary path');
  if (mode === 'prepare') {
    const assets = inspectAssets('build', checked.version);
    assert.deepEqual(json('build/manifest.json'), json('manifest.json'));
    mkdirSync(path.join(directory, 'assets'), {recursive: true});
    for (const name of ASSETS) copyFileSync(path.join('build', name), path.join(directory, 'assets', name));
    writeFileSync(path.join(directory, 'plan.json'), JSON.stringify({...checked, assets}, null, 2) + '\n');
    console.log(JSON.stringify({version: checked.version, sha: checked.sha, assets}, null, 2));
  } else if (mode === 'publish') {
    assert.deepEqual(readdirSync(directory).sort(), ['assets', 'plan.json']);
    const plan = json(path.join(directory, 'plan.json'));
    for (const key of ['version', 'sha', 'repository', 'notes', 'mode']) assert.equal(plan[key], checked[key], `Artifact ${key} does not match checkout`);
    assert.deepEqual(inspectAssets(path.join(directory, 'assets'), plan.version), plan.assets);
    const url = await publishRelease(plan, githubClient(process.env.GITHUB_TOKEN), name => readFileSync(path.join(directory, 'assets', name)));
    console.log(`Verified release: ${url}`);
    if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `Published and verified [${plan.version}](${url}) at ${plan.sha}.\n\n${plan.assets.map(a => `- ${a.name}: SHA256 ${a.sha256}`).join('\n')}\n`);
  } else throw Error('Expected validate, prepare, or publish');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ASSETS, BOOTSTRAP, inspectAssets, publishRelease, validateEvent} from '../scripts/release.mjs';

const sha = 'a'.repeat(40), other = 'b'.repeat(40);
const tagEvent = () => ({version: '1.7.1', ref: 'refs/tags/1.7.1', sha, head: sha, parents: [BOOTSTRAP.parent], subject: 'release', eventName: 'push', event: {ref: 'refs/tags/1.7.1', after: sha, before: '0'.repeat(40), forced: false, deleted: false}});
const bootstrapEvent = () => ({...tagEvent(), ref: 'refs/heads/master', subject: BOOTSTRAP.subject, event: {ref: 'refs/heads/master', after: sha, before: BOOTSTRAP.parent, forced: false, deleted: false}});

test('plain exact version tag and exact one-time bootstrap are accepted', () => {
  assert.equal(validateEvent(tagEvent()), 'tag');
  assert.equal(validateEvent(bootstrapEvent()), 'bootstrap');
});
test('prefixed/mismatched tags, forced/deleted pushes and wrong checkout fail closed', () => {
  for (const patch of [{ref: 'refs/tags/v1.7.1'}, {ref: 'refs/tags/1.7.2'}, {head: other}, {version: '01.7.1'}, {eventName: 'pull_request'}]) assert.throws(() => validateEvent({...tagEvent(), ...patch}));
  for (const field of ['forced', 'deleted']) { const e = tagEvent(); e.event[field] = true; assert.throws(() => validateEvent(e)); }
});
test('bootstrap cannot be replayed from another parent, subject or version', () => {
  for (const patch of [{parents: [other]}, {parents: [BOOTSTRAP.parent, other]}, {subject: 'release'}, {version: '1.7.2'}]) assert.throws(() => validateEvent({...bootstrapEvent(), ...patch}));
  for (const field of ['before', 'after']) { const e = bootstrapEvent(); e.event[field] = other; assert.throws(() => validateEvent(e)); }
});

function fixture() {
  const data = Object.fromEntries(ASSETS.map(name => [name, Buffer.from(`reviewed ${name}`)]));
  const plan = {repository: 'reorx/obsidian-paste-image-rename', version: '1.7.1', sha, notes: 'Reviewed release notes\n', assets: ASSETS.map(name => ({name, size: data[name].length, sha256: createHash('sha256').update(data[name]).digest('hex')}))};
  const state = {tag: null, release: null, assets: [], mutations: [], failUpload: false};
  const client = {
    async get(p, missing) {
      if (p.includes('/git/ref/')) return state.tag;
      if (p.endsWith('/releases/tags/1.7.1')) return state.release;
      if (p.includes('/releases?per_page=')) return state.release ? [state.release] : [];
      if (p.endsWith('/releases/1')) return state.release;
      if (p.endsWith('/assets?per_page=100')) return state.assets;
      throw Error(`Unexpected GET ${p} ${missing}`);
    },
    async post(p, body) {
      state.mutations.push({kind: 'post', p, body});
      if (p.endsWith('/git/refs')) { state.tag = {object: {type: 'commit', sha: body.sha}}; return state.tag; }
      assert.ok(p.endsWith('/releases'));
      state.release = {...body, id: 1, html_url: 'https://github.com/reorx/obsidian-paste-image-rename/releases/tag/1.7.1'};
      return state.release;
    },
    async patch(p, body) { state.mutations.push({kind: 'patch', p, body}); Object.assign(state.release, body); return state.release; },
    async upload(id, name, bytes) {
      assert.equal(id, 1); assert.deepEqual(bytes, data[name]);
      state.mutations.push({kind: 'upload', name});
      if (state.failUpload) throw Error('Simulated upload failure');
      state.assets.push({id: state.assets.length + 1, name, state: 'uploaded', size: bytes.length});
    },
    async download(asset) { return data[asset.name]; },
  };
  const seed = (draft = false, names = ASSETS) => {
    state.tag = {object: {type: 'commit', sha}};
    state.release = {id: 1, tag_name: plan.version, target_commitish: sha, name: plan.version, body: plan.notes, draft, prerelease: false, html_url: 'release-url'};
    state.assets = names.map((name, i) => ({id: i + 1, name, state: 'uploaded', size: data[name].length}));
  };
  return {plan, data, state, client, seed, run: () => publishRelease(plan, client, name => data[name])};
}
test('fresh release creates exact tag, uploads only three assets, verifies before publishing', async () => {
  const f = fixture(); await f.run();
  assert.equal(f.state.tag.object.sha, sha);
  assert.deepEqual(f.state.mutations.filter(m => m.kind === 'upload').map(m => m.name), ASSETS);
  assert.equal(f.state.mutations.at(-1).kind, 'patch');
  assert.equal(f.state.release.draft, false);
});
test('complete published release is a byte-verified no-op', async () => {
  const f = fixture(); f.seed(); assert.equal(await f.run(), 'release-url'); assert.deepEqual(f.state.mutations, []);
});
test('partial draft resumes without replacing existing valid assets', async () => {
  const f = fixture(); f.seed(true, ['main.js']); await f.run();
  assert.deepEqual(f.state.mutations.filter(m => m.kind === 'upload').map(m => m.name), ['manifest.json', 'styles.css']);
  assert.equal(f.state.release.draft, false);
});
test('mismatched tag aborts before any write', async () => {
  const f = fixture(); f.seed(); f.state.tag.object.sha = other; await assert.rejects(f.run(), /another commit/); assert.deepEqual(f.state.mutations, []);
});
test('unrelated release notes abort without overwriting a draft', async () => {
  const f = fixture(); f.seed(true); f.state.release.body = 'Somebody else wrote this'; await assert.rejects(f.run(), /notes differ/); assert.deepEqual(f.state.mutations, []);
});
test('unexpected or duplicate assets abort before any write', async () => {
  for (const extra of ['extra.zip', 'main.js']) { const f = fixture(); f.seed(true, ['main.js']); f.state.assets.push({id: 5, name: extra, size: 1, state: 'uploaded'}); await assert.rejects(f.run()); assert.deepEqual(f.state.mutations, []); }
});
test('corrupt existing asset is never clobbered', async () => {
  const f = fixture(); f.seed(true, ['main.js']); f.client.download = async () => Buffer.alloc(f.data['main.js'].length); await assert.rejects(f.run(), /bytes differ/); assert.deepEqual(f.state.mutations, []);
});
test('incomplete published release is never repaired by mutation', async () => {
  const f = fixture(); f.seed(false, ['main.js']); await assert.rejects(f.run(), /missing assets/); assert.deepEqual(f.state.mutations, []);
});
test('changed staged bytes fail before calling GitHub', async () => {
  const f = fixture(); f.data['main.js'] = Buffer.from('unreviewed'); f.client.get = async () => assert.fail('No GitHub reads expected'); await assert.rejects(f.run()); assert.deepEqual(f.state.mutations, []);
});
test('uncertain upload fails with draft retained and no publish', async () => {
  const f = fixture(); f.state.failUpload = true; await assert.rejects(f.run(), /upload failure/); assert.equal(f.state.release.draft, true); assert.ok(!f.state.mutations.some(m => m.kind === 'patch'));
});
test('tag change during upload stops before release publication', async () => {
  const f = fixture(); const upload = f.client.upload; f.client.upload = async (...args) => { await upload(...args); f.state.tag.object.sha = other; }; await assert.rejects(f.run(), /Tag changed/); assert.ok(!f.state.mutations.some(m => m.kind === 'patch'));
});
test('asset inspection checks exact names, embedded version and license notices', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'plugin-release-test-'));
  try {
    writeFileSync(path.join(directory, 'main.js'), `version: "1.7.1"\n${readFileSync('THIRD_PARTY_LICENSES.txt', 'utf8')}`);
    writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({version: '1.7.1'}));
    writeFileSync(path.join(directory, 'styles.css'), 'body {}');
    assert.deepEqual(inspectAssets(directory, '1.7.1').map(a => a.name), ASSETS);
    assert.throws(() => inspectAssets(directory, '1.7.2'));
    writeFileSync(path.join(directory, 'secret.txt'), 'not for release');
    assert.throws(() => inspectAssets(directory, '1.7.1'), /three plugin assets/);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

test('draft hidden from tag lookup is resumed through release enumeration', async () => {
  const f = fixture(); f.seed(true, ['main.js']); const get = f.client.get;
  f.client.get = (p, missing) => p.endsWith('/releases/tags/1.7.1') && f.state.release.draft ? null : get(p, missing);
  await f.run(); assert.equal(f.state.release.draft, false);
  assert.ok(!f.state.mutations.some(m => m.kind === 'post'));
});
test('duplicate drafts for one tag abort without writes', async () => {
  const f = fixture(); f.seed(true, []); const get = f.client.get;
  f.client.get = (p, missing) => p.includes('/releases?per_page=') ? [f.state.release, {...f.state.release, id: 2}] : get(p, missing);
  await assert.rejects(f.run(), /Multiple releases/); assert.deepEqual(f.state.mutations, []);
});
test('draft published by someone else before upload is not modified', async () => {
  const f = fixture(); f.seed(true, []); const get = f.client.get;
  f.client.get = (p, missing) => p.endsWith('/releases/1') ? {...f.state.release, draft: false} : get(p, missing);
  await assert.rejects(f.run(), /publication state changed/); assert.deepEqual(f.state.mutations, []);
});
test('unexpected newly-created release metadata prevents asset uploads', async () => {
  const f = fixture(); const post = f.client.post;
  f.client.post = async (p, body) => { const r = await post(p, body); if (p.endsWith('/releases')) r.target_commitish = other; return r; };
  await assert.rejects(f.run(), /target differs/); assert.ok(!f.state.mutations.some(m => ['upload', 'patch'].includes(m.kind)));
});

test('metadata change during final byte verification blocks publication', async () => {
  const f = fixture(); const download = f.client.download; let reads = 0;
  f.client.download = async asset => { const bytes = await download(asset); if (++reads === 3) f.state.release.body = 'Changed while verifying'; return bytes; };
  await assert.rejects(f.run(), /notes differ/); assert.equal(f.state.release.draft, true);
  assert.ok(!f.state.mutations.some(m => m.kind === 'patch'));
});

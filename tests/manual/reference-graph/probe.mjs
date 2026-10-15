#!/usr/bin/env node
/**
 * Read-only synthetic reference-graph experiment for issues #73 / #78.
 * Usage: node probe.mjs /absolute/path/to/obsidian-paste-image-rename > results.json
 * Uses the checkout's existing esbuild and Obsidian test mock; installs nothing.
 * Compiles the real renderer in memory. Never loads a vault or invokes mutations.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve, posix } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';

const repo = resolve(process.argv[2] || '.');
const require = createRequire(resolve(repo, 'package.json'));
const { build } = require('esbuild');
const compiled = await build({
  stdin: {
    contents: `export { default as Plugin } from './src/main';\nexport { TFile } from 'obsidian';\nexport { allocateName } from './src/rename-core';`,
    resolveDir: repo, loader: 'ts', sourcefile: 'read-only-graph-probe.ts',
  },
  bundle: true, write: false, platform: 'node', format: 'cjs',
  alias: { obsidian: resolve(repo, 'tests/obsidian-mock.ts') },
  define: { 'process.env.BUILD_ENV': '"production"' }, logLevel: 'silent',
});
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(require, module, module.exports);
const { Plugin, TFile, allocateName } = module.exports;
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const defaults = {
  imageNamePattern: '{{fileName}}', dupNumberAtStart: false, dupNumberDelimiter: '-',
  dupNumberAlways: false, dupNumberAcrossExtensions: false, dupNumberWidth: 1,
};
const fixedClock = Object.freeze({ format: pattern => {
  const values = { YYYY: '2026', MM: '10', DD: '15', YYYYMMDD: '20261015', HHmmss: '080000', YYYYMMDD_HHmmss: '20261015_080000' };
  assert.ok(pattern in values, `Add an explicit synthetic clock format: ${pattern}`);
  return values[pattern];
} });
let mutationAttempts = 0;
let assertionCount = 0;
const check = (condition, message) => { assertionCount++; assert.ok(condition, message); };
const equal = (actual, expected, message) => { assertionCount++; assert.deepEqual(actual, expected, message); };
const deny = () => { mutationAttempts++; throw new Error('Mutation forbidden in read-only probe'); };
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
function file(path) {
  const name = posix.basename(path), extension = name.slice(name.lastIndexOf('.') + 1);
  const parentPath = posix.dirname(path) === '.' ? '' : posix.dirname(path);
  return freeze(Object.assign(new TFile(), {
    path, name, basename: name.slice(0, -extension.length - 1), extension,
    parent: { path: parentPath, name: posix.basename(parentPath) },
    stat: { ctime: 0, mtime: 0, size: 0 },
  }));
}
function fixture(attachmentPaths, noteSpecs, extraPaths = [], folderPaths = []) {
  const files = new Map([...attachmentPaths, ...extraPaths, ...noteSpecs.map(n => n.path)].map(p => [p, file(p)]));
  const cache = new Map(), resolutions = new Map();
  for (const note of noteSpecs) {
    const refs = (note.refs || []).map((r, index) => {
      const link = r.link || r.target;
      const key = `${note.path}\0${link}`;
      const target = files.get(r.target);
      check(!!target, 'Every synthetic link target exists');
      check(!resolutions.has(key) || resolutions.get(key) === target, 'One link text/source resolves to one exact target');
      resolutions.set(key, target);
      return { ...r, link, position: { start: { line: r.line ?? index } } };
    });
    cache.set(files.get(note.path), freeze({
      frontmatter: note.frontmatter || {},
      headings: (note.headings || []).map(([line, heading, level = 2]) => ({ heading, level, position: { start: { line } } })),
      embeds: refs.filter(r => r.kind !== 'link'), links: refs.filter(r => r.kind === 'link'),
    }));
  }
  const plugin = Object.create(Plugin.prototype);
  plugin.settings = { ...defaults };
  // Deny all action methods even if later probe edits accidentally call one.
  plugin.renameFile = plugin.batchRenameAllImages = plugin.openBatchRenameModal = deny;
  plugin.app = {
    metadataCache: {
      getFileCache: source => cache.get(source),
      getFirstLinkpathDest: (link, sourcePath) => resolutions.get(`${sourcePath}\0${link}`),
    },
    vault: {
      getAbstractFileByPath: path => files.get(path),
      create: deny, modify: deny, delete: deny, trash: deny, rename: deny,
      adapter: {
        list: async directory => ({
          files: [...files.values()].filter(f => f.parent.path === directory).map(f => f.path),
          folders: folderPaths.filter(p => posix.dirname(p) === directory),
        }),
        write: deny, mkdir: deny, remove: deny, rename: deny, copy: deny,
      },
    },
    fileManager: { renameFile: deny, trashFile: deny },
  };
  return { files, cache, plugin, notes: noteSpecs.map(n => files.get(n.path)) };
}
function proposals(graph, pattern, clock = fixedClock, notes = graph.notes) {
  graph.plugin.settings.imageNamePattern = pattern;
  const groups = new Map();
  for (const source of notes) {
    const metadata = graph.cache.get(source);
    const refs = [...metadata.embeds, ...metadata.links];
    const perSource = new Map();
    for (const ref of refs) {
      const target = graph.plugin.app.metadataCache.getFirstLinkpathDest(ref.link, source.path);
      if (!perSource.has(target)) perSource.set(target, []);
      perSource.get(target).push(ref);
    }
    for (const [target, references] of perSource) {
      const generated = graph.plugin.generateNewName(target, source, clock);
      if (!groups.has(target)) groups.set(target, { originalPath: target.path, originalDirectory: target.parent.path, sources: [] });
      const proposedPath = posix.join(target.parent.path, generated.newName);
      equal(posix.dirname(proposedPath), target.parent.path || '.', 'Proposal preserves the exact attachment directory');
      groups.get(target).sources.push({
        sourcePath: source.path,
        referenceOccurrences: references.length,
        earliestReferenceLine: Math.min(...references.map(r => r.position.start.line)),
        hasEmbed: references.some(r => r.kind !== 'link'),
        proposedBasename: generated.newName, proposedPath, meaningful: generated.isMeaningful,
      });
    }
  }
  return [...groups.values()].map(group => ({
    ...group,
    distinctProposedBasenames: [...new Set(group.sources.map(s => s.proposedBasename))].sort(),
    classification: group.sources.length === 1 ? 'single-source' : new Set(group.sources.map(s => s.proposedBasename)).size === 1 ? 'shared-agreement' : 'shared-conflict',
    // No selected source or final destination: that policy is deliberately absent.
  })).sort((a, b) => a.originalPath.localeCompare(b.originalPath));
}
const notesFor = (target, extraA = {}, extraB = {}) => [
  { path: 'notes/Alpha.md', refs: [{ target, line: 5 }], ...extraA },
  { path: 'notes/Beta.md', refs: [{ target, line: 5 }], ...extraB },
];
const cases = [];
const add = (id, pattern, graph, extra = {}) => {
  const observations = proposals(graph, pattern);
  cases.push({ id, pattern, observations, ...extra }); return observations;
};

// 1. Unique source.
let graph = fixture(['assets/raw.png'], [{ path: 'notes/Alpha.md', refs: [{ target: 'assets/raw.png', line: 5 }] }]);
equal(add('unique-source', '{{fileName}}', graph)[0].distinctProposedBasenames, ['Alpha.png']);

// 2. Shared target, matching source data: one exact target, two agreeing sources.
graph = fixture(['assets/shared.png'], notesFor('assets/shared.png', { frontmatter: { imageNameKey: 'Shared' } }, { frontmatter: { imageNameKey: 'Shared' } }));
let observation = add('shared-matching-frontmatter', '{{imageNameKey}}', graph)[0];
equal(observation.classification, 'shared-agreement'); equal(observation.distinctProposedBasenames, ['Shared.png']); equal(observation.sources.length, 2);

// 3-5. Each source-derived token can disagree independently.
graph = fixture(['assets/shared.png'], notesFor('assets/shared.png',
  { frontmatter: { project: 'Red' }, headings: [[0, 'Alpha Section']] },
  { frontmatter: { project: 'Blue' }, headings: [[0, 'Beta Section']] }));
for (const [id, pattern, expected] of [
  ['shared-filename-conflict', '{{fileName}}', ['Alpha.png', 'Beta.png']],
  ['shared-frontmatter-conflict', '{{frontmatter:project}}', ['Blue.png', 'Red.png']],
  ['shared-heading-conflict', '{{nearestHeading}}', ['Alpha Section.png', 'Beta Section.png']],
]) {
  observation = add(id, pattern, graph)[0];
  equal(observation.classification, 'shared-conflict'); equal(observation.distinctProposedBasenames, expected);
  equal(proposals(graph, pattern, fixedClock, [...graph.notes].reverse())[0].distinctProposedBasenames, expected, 'Enumerating backwards preserves the unresolved proposal set');
}
const sourceProposals = proposals(graph, '{{fileName}}')[0].sources;
cases.push({ id: 'iteration-order-counterexample', note: 'These are hypothetical policy outputs, not performed operations or chosen precedence.',
  firstSourceWins: { AlphaThenBeta: sourceProposals[0].proposedBasename, BetaThenAlpha: sourceProposals[1].proposedBasename },
  lastSourceWins: { AlphaThenBeta: sourceProposals[1].proposedBasename, BetaThenAlpha: sourceProposals[0].proposedBasename },
});

// 6. Repeated references are one target/source pair; earliest resolved link wins heading.
graph = fixture(['assets/repeat.png'], [{ path: 'notes/Alpha.md',
  headings: [[0, 'Top', 1], [2, 'Earliest Link'], [8, 'First Embed'], [20, 'Later Embed']],
  refs: [
    { target: 'assets/repeat.png', line: 25 },
    { target: 'assets/repeat.png', line: 10 },
    { target: 'assets/repeat.png', line: 4, kind: 'link' },
  ],
}]);
observation = add('repeated-references', '{{nearestHeading}}', graph)[0];
equal(observation.sources.length, 1); equal(observation.sources[0].referenceOccurrences, 3); equal(observation.distinctProposedBasenames, ['Earliest Link.png']);

// 7. Duplicate basenames resolve independently using source context and full identity.
graph = fixture(['a/assets/same.png', 'b/assets/same.png'], [
  { path: 'a/Alpha.md', frontmatter: { imageNameKey: 'Shared' }, refs: [{ target: 'a/assets/same.png', link: 'same.png', line: 3 }] },
  { path: 'b/Beta.md', frontmatter: { imageNameKey: 'Shared' }, refs: [{ target: 'b/assets/same.png', link: 'same.png', line: 3 }] },
]);
observation = add('duplicate-basenames-different-directories', '{{imageNameKey}}', graph);
equal(observation.length, 2); equal(observation.flatMap(g => g.sources.map(s => s.proposedPath)), ['a/assets/Shared.png', 'b/assets/Shared.png']);

// 8. Raw generation does not allocate collisions. Existing read-only allocator does.
graph = fixture(['assets/raw.png'], [{ path: 'notes/Alpha.md', refs: [{ target: 'assets/raw.png', line: 5 }] }], ['assets/Alpha.png']);
observation = add('existing-target-collision', '{{fileName}}', graph)[0];
const collision = await graph.plugin.deduplicateNewName(observation.sources[0].proposedBasename, graph.files.get('assets/raw.png'));
equal(collision.name, 'Alpha-1.png');
cases.at(-1).allocationAgainstExistingSiblings = { basename: collision.name, proposedPath: `assets/${collision.name}` };
// Two unallocated targets with the same proposal compete even without existing names.
const allocateOrder = targets => {
  const reserved = [], result = {};
  for (const target of targets) {
    const name = allocateName('Shared.png', reserved, target, defaults);
    result[target] = name; reserved.push(name);
  }
  return result;
};
const forward = allocateOrder(['one.png', 'two.png']), backward = allocateOrder(['two.png', 'one.png']);
equal(forward, { 'one.png': 'Shared.png', 'two.png': 'Shared-1.png' });
equal(backward, { 'two.png': 'Shared.png', 'one.png': 'Shared-1.png' });
cases.push({ id: 'planned-target-collision-order', sameDirectory: 'assets', forward, backward,
  note: 'Pure allocator simulation only; a stable allocation order must be specified if suffix ownership matters.' });

// 9. Original-name input means current pre-operation stem, not a historical name.
graph = fixture(['assets/shared.v1.png'], notesFor('assets/shared.v1.png'));
for (const token of ['attachmentName', 'originalAttachmentFileName']) {
  observation = add(`shared-${token}`, `{{${token}}}`, graph)[0];
  equal(observation.distinctProposedBasenames, ['shared.v1.png']); equal(observation.classification, 'shared-agreement');
}
observation = add('unknown-originalAttachmentName-token', '{{originalAttachmentName}}', graph)[0];
equal(observation.distinctProposedBasenames, ['{{originalAttachmentName}}.png']);
observation = add('source-prefix-original-name-conflict', '{{fileName}}-{{attachmentName}}', graph)[0];
equal(observation.distinctProposedBasenames, ['Alpha-shared.v1.png', 'Beta-shared.v1.png']);
// Immutable alternate inputs model hypothetical per-note chaining, never a rename.
const afterAlpha = file('assets/Alpha-shared.v1.png'), afterBeta = file('assets/Beta-shared.v1.png');
graph.plugin.settings.imageNamePattern = '{{fileName}}-{{attachmentName}}';
const chainedAB = graph.plugin.generateNewName(afterAlpha, graph.notes[1], fixedClock).newName;
const chainedBA = graph.plugin.generateNewName(afterBeta, graph.notes[0], fixedClock).newName;
equal(chainedAB, 'Beta-Alpha-shared.v1.png'); equal(chainedBA, 'Alpha-Beta-shared.v1.png');
cases.push({ id: 'original-name-chaining-counterexample', hypotheticalAlphaThenBeta: chainedAB, hypotheticalBetaThenAlpha: chainedBA,
  note: 'Constructed independent immutable file snapshots; no TFile was changed. Repeated per-note rendering can accumulate prefixes.' });

// 10. One captured clock gives consistent proposals; a new operation gets a new time.
let clockCaptures = 0;
const captureClock = () => { const label = `snapshot${++clockCaptures}`; return Object.freeze({ format: () => label }); };
const snapshot = captureClock();
const dateShared = proposals(graph, '{{DATE:YYYYMMDD_HHmmss}}-{{DATE:YYYY}}', snapshot);
equal(clockCaptures, 1); equal(dateShared[0].distinctProposedBasenames, ['snapshot1-snapshot1.png']);
const nextDate = proposals(graph, '{{DATE:YYYYMMDD_HHmmss}}-{{DATE:YYYY}}', captureClock());
equal(nextDate[0].distinctProposedBasenames, ['snapshot2-snapshot2.png']);
cases.push({ id: 'single-date-snapshot', firstPlan: dateShared, newPlan: nextDate, clockCaptures,
  note: 'Synthetic injected clock proves propagation; it does not test Moment formatting. A full plan must explicitly reuse one captured clock.' });

// 11. Each call generates fresh randomness even for the same target/source.
const randomPattern = '{{UUID}}--{{UUID}}--{{HEX}}';
const randomFirst = proposals(graph, randomPattern), randomSecond = proposals(graph, randomPattern);
for (const group of [...randomFirst, ...randomSecond]) for (const source of group.sources) {
  const [uuid, repeated, hex] = source.proposedBasename.slice(0, -4).split('--');
  check(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid), 'Valid UUIDv4');
  equal(uuid, repeated); equal(hex, uuid.replaceAll('-', ''));
}
check(randomFirst[0].sources[0].proposedBasename !== randomSecond[0].sources[0].proposedBasename, 'Separate renders generated different observed IDs');
cases.push({ id: 'uuid-hex-render-scope', pattern: randomPattern, firstPlan: randomFirst, secondPlan: randomSecond,
  note: 'Observed values intentionally vary. Per-source rendering generates artificial shared conflicts even with no source-derived token; freeze one chosen render per unique attachment only after an explicit design decision.' });

// Re-check every frozen input remains intact and no mutation API was attempted.
for (const [path, object] of graph.files) equal(object.path, path, 'Input path unchanged');
equal(mutationAttempts, 0);
const sourceFiles = ['src/main.ts', 'src/template.ts', 'src/rename-core.ts', 'tests/obsidian-mock.ts'];
console.log(JSON.stringify({
  kind: 'read-only synthetic naming experiment, not a whole-vault rename command',
  commit: execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sourceSha256: Object.fromEntries(sourceFiles.map(path => [path, createHash('sha256').update(readFileSync(resolve(repo, path))).digest('hex')])),
  node: process.version, assertionCount, mutationAttempts,
  scope: 'Explicit in-memory link/embed graph only. No real vault scan, parsing, rename, move, delete, link rewrite, or GitHub change.',
  randomOutput: 'UUID values intentionally differ between executions; deterministic assertions cover their relationships.',
  cases,
}, null, 2));

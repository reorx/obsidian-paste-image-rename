import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Plugin from '../src/main';
import { ImageBatchRenameModal } from '../src/batch';
import { uuidV4 } from '../src/rename-core';
import { MarkdownView, sdkApi, setApiAvailability } from './obsidian-mock';

test('UUID uses host window cryptography and preserves injected bytes and version bits', () => {
  const previous = globalThis.window;
  let calls = 0;
  globalThis.window = {crypto: {getRandomValues(bytes: Uint8Array) { calls++; return bytes.fill(0); }}} as any;
  try {
    assert.equal(uuidV4(), '00000000-0000-4000-8000-000000000000');
    assert.equal(calls, 1);
    const bytes = new Uint8Array(16).fill(255);
    assert.equal(uuidV4(bytes), 'ffffffff-ffff-4fff-bfff-ffffffffffff');
    assert.deepEqual(bytes, new Uint8Array(16).fill(255));
    assert.equal(calls, 1);
  } finally { globalThis.window = previous; }
});

test('native paste/drop observers leave events uncancelled and invalidate older proof on handled gestures', async () => {
  const plugin = new Plugin(null as any, null as any);
  const handlers = new Map<string, Function>();
  const previous = sdkApi.supported;
  sdkApi.supported = true;
  Object.assign(plugin, {
    app: {workspace: {on: (name: string, fn: Function) => { handlers.set(name, fn); }, getLeavesOfType: () => [], onLayoutReady() {}}},
    loadSettings: async () => {}, registerEvent() {}, addCommand() {}, addSettingTab() {},
  });
  try {
    await plugin.onload();
    const controller = (plugin as any).discardController;
    let cancellations = 0;
    controller.tracker.cancel = () => { cancellations++; };
    const view = Object.assign(new MarkdownView(), {file: {}, editor: {}});
    for (const name of ['editor-paste', 'editor-drop']) {
      for (const defaultPrevented of [false, true]) {
        const event = {defaultPrevented, isTrusted: false, preventDefault() { assert.fail('Native insertion must not be cancelled'); }};
        handlers.get(name)!(event, view.editor, view);
      }
    }
    assert.equal(cancellations, 4);
    assert.ok(handlers.has('editor-change'));
  } finally { sdkApi.supported = previous; }
});

test('older API hosts keep discard observers disabled', async () => {
  const plugin = new Plugin(null as any, null as any);
  const previous = sdkApi.supported;
  sdkApi.supported = false;
  Object.assign(plugin, {app: {workspace: {on() { assert.fail('Unsupported event registration'); }, getLeavesOfType: () => [], onLayoutReady() {}}}, loadSettings: async () => {}, registerEvent() {}, addCommand() {}, addSettingTab() {}});
  try { await plugin.onload(); assert.equal((plugin as any).discardController, undefined); }
  finally { sdkApi.supported = previous; }
});

test('batch validation reveals a CSS-class error without static inline styles', async () => {
  const modal = new ImageBatchRenameModal({} as any, {} as any, async () => {}, () => {});
  modal.open();
  const input = (modal.contentEl as any).find('input');
  await input.emit('keydown', {key: 'Enter', preventDefault() {}});
  const error = (modal.contentEl as any).find('div', 'Error: "Name pattern" could not be empty');
  assert.ok(error.classList.contains('is-visible'));
  assert.deepEqual(error.style, {});
});

test('reviewed source and build hygiene remains explicit', () => {
  const main = readFileSync('src/main.ts', 'utf8'), utils = readFileSync('src/utils.ts', 'utf8');
  assert.ok(!main.includes("require('../package.json')"));
  assert.ok(!/console\.log\(/.test(main + utils));
  for (const name of ['src/main.ts', 'src/batch.ts']) assert.ok(!/style\s*:|\.style\.display/.test(readFileSync(name, 'utf8')));
  const config = readFileSync('esbuild.config.mjs', 'utf8');
  assert.ok(config.includes("from 'node:module'"));
  assert.ok(config.includes('JSON.stringify(JSON.parse(fs.readFileSync'));
  const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
  assert.equal(manifest.minAppVersion, '0.12.0');
  assert.ok(manifest.description.endsWith('.'));
  assert.ok(!manifest.description.includes('attchments'));
});

 test('Obsidian 0.12 host without requireApiVersion still loads without newer events', async () => {
  const plugin = new Plugin(null as any, null as any);
  setApiAvailability(false);
  Object.assign(plugin, {app: {workspace: {on() { assert.fail('Unsupported event registration'); }, onLayoutReady() {}}}, loadSettings: async () => {}, registerEvent() {}, addCommand() {}, addSettingTab() {}});
  try { await plugin.onload(); assert.equal((plugin as any).discardController, undefined); }
  finally { setApiAvailability(true); }
});

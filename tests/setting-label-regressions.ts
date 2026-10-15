import test from 'node:test';
import assert from 'node:assert/strict';
import Plugin from '../src/main';
import { ImageBatchRenameModal } from '../src/batch';
import { Setting, MockElement } from './obsidian-mock';

const labels = ['Image name pattern', 'Duplicate number at start (or end)',
  'Duplicate number delimiter', 'Always add duplicate number',
  'Share duplicate numbers across extensions', 'Duplicate number minimum digits',
  'Rename input selection', 'Auto rename', 'Handle all attachments',
  'Exclude extension pattern', 'Excluded folders', 'Disable rename notice'];

async function settingsFixture() {
  const plugin = new Plugin(null as any, null as any);
  const saved: unknown[] = [];
  let tab: any;
  Object.assign(plugin, {app: {workspace: {onLayoutReady() {}}}, loadData: async () => ({}),
    saveData: async (data: unknown) => { saved.push(structuredClone(data)); },
    addCommand() {}, addSettingTab(value: unknown) { tab = value; }});
  await plugin.onload();
  tab.containerEl = new MockElement('settings');
  const first = Setting.created.length;
  tab.display();
  return {plugin, saved, tab, settings: Setting.created.slice(first)};
}

test('all twelve settings labels, controls, defaults and render order remain unchanged', async () => {
  const f = await settingsFixture();
  assert.deepEqual(f.settings.map(setting => setting.nameEl.innerText), labels);
  assert.equal(f.settings[0].controlEl.find('input')!.value, '{{fileName}}');
  assert.equal(f.settings[2].controlEl.find('input')!.value, '-');
  assert.equal(f.settings[5].controlEl.find('input')!.value, '1');
  assert.equal(f.settings[6].controlEl.find('select')!.value, 'end');
  for (const index of [1, 3, 4, 7, 8, 11]) assert.equal((f.settings[index].controlEl.find('toggle') as any).checked, false);
  for (const index of [9, 10]) assert.equal(f.settings[index].controlEl.find('input')!.value, '');
  assert.deepEqual(f.saved, []);
  const initial = structuredClone(f.plugin.settings);
  const first = Setting.created.length;
  f.tab.display();
  assert.deepEqual(Setting.created.slice(first).map(setting => setting.nameEl.innerText), labels);
  assert.deepEqual(f.plugin.settings, initial);
  assert.equal(f.tab.containerEl.children.length, 12);
});

test('DOM label rendering retains setting sanitization, validation and persistence callbacks', async () => {
  const f = await settingsFixture();
  const delimiter = f.settings[2].controlEl.find('input')!;
  delimiter.value = '*/'; await delimiter.emit('change');
  assert.equal(f.plugin.settings.dupNumberDelimiter, '-');
  const width = f.settings[5].controlEl.find('input')!;
  const saves = f.saved.length;
  width.value = '0'; await width.emit('change');
  assert.equal(f.plugin.settings.dupNumberWidth, 1); assert.equal(f.saved.length, saves);
  width.value = '3'; await width.emit('change');
  assert.equal(f.plugin.settings.dupNumberWidth, 3);
  const position = f.settings[6].controlEl.find('select')!;
  position.value = 'start'; await position.emit('change');
  assert.equal(f.plugin.settings.nameInputPosition, 'start');
  const auto = f.settings[7].controlEl.find('toggle') as any;
  auto.checked = true; await auto.emit('change');
  assert.equal(f.plugin.settings.autoRename, true);
  assert.equal(f.saved.length, saves + 3);
});

test('batch modal renders all three exact labels and preserves preview input callbacks', async () => {
  const first = Setting.created.length;
  const modal = new ImageBatchRenameModal({} as any, {} as any, async () => {}, () => {});
  modal.open();
  const settings = Setting.created.slice(first);
  assert.deepEqual(settings.map(setting => setting.nameEl.innerText).filter(Boolean), ['Name pattern', 'Extension pattern', 'Name replace']);
  for (const [index, key, value] of [[0, 'namePattern', '^old'], [1, 'extPattern', 'png'], [2, 'nameReplace', 'new']] as const) {
    const input = settings[index].controlEl.find('input')!;
    input.value = value; await input.emit('change');
    assert.equal(modal.state[key], value);
    assert.deepEqual(modal.state.renameTasks, []);
  }
});

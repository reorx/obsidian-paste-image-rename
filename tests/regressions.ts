import './creation-regressions';
import './batch-regressions';
import './core';
import test from 'node:test';
import assert from 'node:assert/strict';
import Plugin from '../src/main';
import { renderTemplate } from '../src/template';
import { TFile } from 'obsidian';
(globalThis as any).window = { moment: () => ({ format: (s: string) => s === 'YYYY' ? '2026' : '10' }) };
const settings = { imageNamePattern: '{{fileName}}', dupNumberAtStart: false, dupNumberDelimiter: '-', dupNumberAlways: false, autoRename: true, handleAllAttachments: false, excludeExtensionPattern: '', excludedFolders: '', disableRenameNotice: true };
function file(name: string) { return Object.assign(new TFile(), { name, basename: name.split('.').slice(0, -1).join('.'), extension: name.split('.').at(-1), path: name, parent: { path: '', name: '' }, stat: { ctime: Date.now(), mtime: Date.now() } }); }
function fixture(names = ['old.png']) {
    const plugin = Object.create(Plugin.prototype) as Plugin;
    plugin.settings = { ...settings };
    plugin.modals = [];
    const files = names.map(file);
    const note = file('Note.md');
    const renamed: string[] = [];
    const app: any = { metadataCache: { getFileCache: () => ({ embeds: files.map(f => ({ link: f.path })) }), getFirstLinkpathDest: (p: string) => files.find(f => f.path === p) }, vault: { getAbstractFileByPath: (p: string) => files.find(f => f.path === p), adapter: { list: async () => ({ files: files.map(f => f.path), folders: [] }) } }, fileManager: { generateMarkdownLink: (f: TFile) => `[[${f.name}]]`, renameFile: async (f: TFile, p: string) => { assert.ok(!files.some(o => o !== f && o.path === p), 'collision'); renamed.push(p); f.path = p; f.name = p; f.basename = p.split('.').slice(0, -1).join('.'); } }, workspace: { getActiveViewOfType: () => ({ file: note, editor: null }) } };
    plugin.app = app;
    return { plugin, files, note, app, renamed };
}
test('batch skips missing and non-image embeds and renames later images', async () => { const f = fixture(['document.pdf', 'old.png']); f.app.metadataCache.getFileCache = () => ({ embeds: [{ link: 'missing.png' }, ...f.files.map(x => ({ link: x.path }))] }); await f.plugin.batchRenameAllImages(); assert.deepEqual(f.renamed, ['Note.png']); });
test('batch processes repeated references only once', async () => { const f = fixture(); f.app.metadataCache.getFileCache = () => ({ embeds: [{ link: 'old.png' }, { link: 'old.png' }] }); await f.plugin.batchRenameAllImages(); assert.deepEqual(f.renamed, ['Note.png']); });
test('same filename is not its own duplicate', async () => { const f = fixture(['Note.png']); assert.equal((await f.plugin.deduplicateNewName('Note.png', f.files[0])).name, 'Note.png'); });
test('concurrent renames allocate unique destinations', async () => { const f = fixture(['one.png', 'two.png']); await Promise.all(f.files.map(x => f.plugin.renameFile(x, 'Note.png', f.note.path))); assert.deepEqual(f.renamed, ['Note.png', 'Note-1.png']); });
test('rename failure leaves editor text untouched', async () => { const f = fixture(); let edits = 0; f.app.workspace.getActiveViewOfType = () => ({ file: f.note, editor: { getCursor: () => ({ line: 0, ch: 0 }), getLine: () => '![[old.png]]', transaction: () => edits++ } }); f.app.fileManager.renameFile = async () => { throw Error('disk failure'); }; await assert.rejects(f.plugin.renameFile(f.files[0], 'Note.png', f.note.path, true)); assert.equal(edits, 0); });
test('switching notes while renaming never edits the newly active note', async () => { const f = fixture(); let edits = 0; let active = f.note; const editor = { getCursor: () => ({ line: 0, ch: 0 }), getLine: () => '![[old.png]]', transaction: () => edits++ }; f.app.workspace.getActiveViewOfType = () => ({ file: active, editor }); const rename = f.app.fileManager.renameFile; f.app.fileManager.renameFile = async (...a: any[]) => { active = file('Other.md'); await rename(...a); }; await f.plugin.renameFile(f.files[0], 'Note.png', f.note.path, true); assert.equal(edits, 0); });
test('date and frontmatter tokens render repeatedly without shared regex state', () => { (globalThis as any).window = { moment: () => ({ format: (s: string) => s === 'YYYY' ? '2026' : '10' }) }; const data = { fileName: 'Note', dirName: '', imageNameKey: '', firstHeading: '' }; for (let i = 0; i < 3; i++)
    assert.equal(renderTemplate('{{DATE:YYYY}}-{{DATE:MM}}-{{frontmatter:a}}-{{frontmatter:b}}', data, { a: 'A', b: 'B' }), '2026-10-A-B'); });
test('frontmatter zero and false are retained as text', () => { (globalThis as any).window = { moment: () => ({ format: () => '' }) }; assert.equal(renderTemplate('{{frontmatter:a}}/{{frontmatter:b}}', { fileName: '', dirName: '', imageNameKey: '', firstHeading: '' }, { a: 0, b: false }), '0/false'); });
test('batch is idempotent with existing numbered images', async () => { const f = fixture(['Note.png', 'Note-1.png', 'Note-2.png']); await f.plugin.batchRenameAllImages(); await f.plugin.batchRenameAllImages(); assert.deepEqual(f.renamed, []); });
test('failed rename does not poison queue', async () => { const f = fixture(['one.png', 'two.png']); const rename = f.app.fileManager.renameFile; let first = true; f.app.fileManager.renameFile = async (...a: any[]) => { if (first) {
    first = false;
    throw Error('disk failure');
} return rename(...a); }; await assert.rejects(f.plugin.renameFile(f.files[0], 'Note.png', f.note.path)); await f.plugin.renameFile(f.files[1], 'Note.png', f.note.path); assert.deepEqual(f.renamed, ['Note.png']); });
test('links-disabled mode blocks before any rename', async () => { const f = fixture(); f.app.vault.config = { alwaysUpdateLinks: false }; await assert.rejects(f.plugin.renameFile(f.files[0], 'Note.png', f.note.path), /Automatically update internal links/); assert.deepEqual(f.renamed, []); });
test('batch guards absent active note', async () => { const f = fixture(); f.app.workspace.getActiveViewOfType = () => null; await f.plugin.batchRenameAllImages(); f.plugin.openBatchRenameModal(); assert.deepEqual(f.renamed, []); });
test('plain rename preserves attachment directory', async () => { const f = fixture(); f.files[0].path = 'assets/old.png'; f.files[0].parent.path = 'assets'; await f.plugin.renameFile(f.files[0], 'Note.png', f.note.path); assert.deepEqual(f.renamed, ['assets/Note.png']); });
test('path and traversal requests fail without mutation', async () => { const f = fixture(); for (const name of ['../Note.png', '/Note.png', 'folder/Note.png', '.png'])
    await assert.rejects(f.plugin.renameFile(f.files[0], name, f.note.path)); assert.deepEqual(f.renamed, []); });
function embedFixture(original = '![[old.png|200]]') {
    const f = fixture();
    const lines = [original, '`![[old.png]]`'];
    const embed = { link: 'old.png', original, position: { start: { line: 0, col: 0, offset: 0 }, end: { line: 0, col: original.length, offset: original.length } } };
    f.app.metadataCache.getFileCache = () => ({ embeds: [embed] });
    const changes: any[] = [];
    const editor = { getLine: (i: number) => lines[i], transaction: (t: any) => { changes.push(...t.changes); for (const c of [...t.changes].reverse())
            lines[c.from.line] = lines[c.from.line].slice(0, c.from.ch) + c.text + lines[c.to.line].slice(c.to.ch); } };
    f.app.workspace.getActiveViewOfType = () => ({ file: f.note, editor });
    return { ...f, lines, changes, embed };
}
test('metadata-scoped fallback preserves width and never edits code examples', async () => { const f = embedFixture(); await f.plugin.renameFile(f.files[0], 'Note.png', f.note.path, true); assert.deepEqual(f.lines, ['![[Note.png|200]]', '`![[old.png]]`']); });
test('fallback skips stale positions after user edits during rename', async () => { const f = embedFixture(); const rename = f.app.fileManager.renameFile; f.app.fileManager.renameFile = async (...a: any[]) => { f.lines[0] = 'User edited this'; await rename(...a); }; await f.plugin.renameFile(f.files[0], 'Note.png', f.note.path, true); assert.equal(f.lines[0], 'User edited this'); assert.deepEqual(f.changes, []); });
test('fallback ignores same-text embed resolving to another attachment', async () => { const f = embedFixture(); f.app.metadataCache.getFirstLinkpathDest = () => file('other/old.png'); await f.plugin.renameFile(f.files[0], 'Note.png', f.note.path, true); assert.deepEqual(f.changes, []); });
test('folder exclusions match attachment and source note independently', () => { const f = fixture(); f.plugin.settings.excludedFolders = 'Telegram\nPrivate'; f.files[0].path = 'Telegram/photos/a.png'; assert.equal(f.plugin.isExcluded(f.files[0], f.note), true); f.files[0].path = 'Telegram2/a.png'; assert.equal(f.plugin.isExcluded(f.files[0], f.note), false); f.note.path = 'Private/Note.md'; assert.equal(f.plugin.isExcluded(f.files[0], f.note), true); });
test('invalid extension exclusion fails closed', () => { const f = fixture(); f.plugin.settings.excludeExtensionPattern = '['; assert.equal(f.plugin.testExcludeExtension(f.files[0]), true); });
test('batch renames 35 mixed images beyond unsupported embeds', async () => { const names = ['a.pdf', ...Array.from({ length: 35 }, (_, i) => `old${i}.${i % 2 ? 'webp' : 'png'}`), 'end.mp4']; const f = fixture(names); await f.plugin.batchRenameAllImages(); assert.equal(f.renamed.length, 35); assert.equal(new Set(f.renamed).size, 35); const first = [...f.renamed]; await f.plugin.batchRenameAllImages(); assert.deepEqual(f.renamed, first); });
test('deleted source line during rename never throws or edits another line', async () => { const f = embedFixture(); const rename = f.app.fileManager.renameFile; f.app.fileManager.renameFile = async (...a: any[]) => { f.lines.length = 0; await rename(...a); }; await f.plugin.renameFile(f.files[0], 'Note.png', f.note.path, true); assert.deepEqual(f.changes, []); });
test('manual batch does not need a source editor even with positioned embeds', async () => { const f = embedFixture(); f.app.workspace.getActiveViewOfType = () => ({ file: f.note, editor: null }); await f.plugin.renameFile(f.files[0], 'Note.png', f.note.path, false); assert.deepEqual(f.renamed, ['Note.png']); });
test('unload during asynchronous destination allocation cancels before mutation', async () => { const f = fixture(); f.app.vault.adapter.list = async () => { (f.plugin as any).unloaded = true; return { files: [], folders: [] }; }; await f.plugin.renameFile(f.files[0], 'Note.png', f.note.path); assert.deepEqual(f.renamed, []); });
test('all images in one batch use one timestamp snapshot', async () => { const f = fixture(['one.png', 'two.png']); f.plugin.settings.imageNamePattern = '{{DATE:HHmmss}}'; let calls = 0; const previous = (globalThis as any).window.moment; (globalThis as any).window.moment = () => { const value = ++calls; return { format: () => `time${value}` }; }; try {
    await f.plugin.batchRenameAllImages();
    assert.equal(calls, 1);
    assert.deepEqual(f.renamed, ['time1.png', 'time1-1.png']);
}
finally {
    (globalThis as any).window.moment = previous;
} });
test('template clock is injectable without an Obsidian window', () => { const previous = (globalThis as any).window; delete (globalThis as any).window; try {
    assert.equal(renderTemplate('{{DATE:YYYY}}', { fileName: '', dirName: '', firstHeading: '', imageNameKey: '' }, undefined, { format: () => '2026' }), '2026');
}
finally {
    (globalThis as any).window = previous;
} });
test('a folder occupying the desired filename is treated as a collision', async () => { const f = fixture(); f.app.vault.adapter.list = async () => ({ files: ['old.png'], folders: ['Note.png'] }); assert.equal((await f.plugin.deduplicateNewName('Note.png', f.files[0])).name, 'Note-1.png'); });
test('unsafe cross-platform batch names fail before filesystem mutation', async () => { const f = fixture(); for (const name of ['CON.png', 'aux.txt', 'cOm¹.png', 'lPt².more.png', 'COM³.txt', 'bad:name.png', 'bad#link.png', 'bad\nname.png'])
    await assert.rejects(f.plugin.renameFile(f.files[0], name, f.note.path), /not safe/); assert.deepEqual(f.renamed, []); });
test('separate batches acquire fresh clock snapshots', async () => { const f = fixture(); f.plugin.settings.imageNamePattern = '{{DATE:HHmmss}}'; let calls = 0; const previous = (globalThis as any).window.moment; (globalThis as any).window.moment = () => { const value = ++calls; return { format: () => `run${value}` }; }; try {
    await f.plugin.batchRenameAllImages();
    await f.plugin.batchRenameAllImages();
    assert.equal(calls, 2);
    assert.deepEqual(f.renamed, ['run1.png', 'run2.png']);
}
finally {
    (globalThis as any).window.moment = previous;
} });
test('external file move during allocation rejects a stale rename request', async () => { const f = fixture(); f.app.vault.adapter.list = async () => { f.files[0].path = 'elsewhere/old.png'; return { files: [], folders: [] }; }; await assert.rejects(f.plugin.renameFile(f.files[0], 'Note.png', f.note.path), /moved while/); assert.deepEqual(f.renamed, []); });
test('unload closes every modal even when close unregisters itself', () => { const f = fixture(); (f.plugin as any).pendingAttachments = new Map(); let closed = 0; f.plugin.modals = Array.from({ length: 3 }, () => ({ close() { closed++; f.plugin.modals.splice(f.plugin.modals.indexOf(this as any), 1); } } as any)); f.plugin.onunload(); assert.equal(closed, 3); assert.deepEqual(f.plugin.modals, []); });
test('repeated modal close cannot unregister another open modal', () => { const f = fixture(); f.app.vault.getResourcePath = () => ''; f.plugin.openRenameModal(f.files[0], 'first', f.note.path); f.plugin.openRenameModal(f.files[0], 'second', f.note.path); const [first, second] = f.plugin.modals; first.close(); first.close(); assert.deepEqual(f.plugin.modals, [second]); second.close(); });
test('empty modal button does not rename and failure keeps modal available', async () => { const f = fixture(); f.app.vault.getResourcePath = () => ''; let calls = 0; f.plugin.renameFile = async () => { calls++; throw Error('test failure'); }; f.plugin.openRenameModal(f.files[0], '', f.note.path); const modal = f.plugin.modals[0] as any; await modal.contentEl.find('button', 'Rename').emit('click'); assert.equal(calls, 0); const input = modal.contentEl.find('input'); input.value = 'valid'; await input.emit('change'); await modal.contentEl.find('button', 'Rename').emit('click'); await Promise.resolve(); assert.equal(calls, 1); assert.equal(f.plugin.modals.length, 1); });
test('original attachment variables preserve the pre-operation stem without doubling extension', () => { const f = fixture(['invoice.v1.pdf']); f.plugin.settings.imageNamePattern = '{{fileName}}-{{attachmentName}}'; assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, 'Note-invoice.v1.pdf'); f.plugin.settings.imageNamePattern = '{{originalAttachmentFileName}}'; assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, 'invoice.v1.pdf'); });
test('slug variable aliases lowercase and collapse whitespace while retaining Unicode', () => { const f = fixture(); f.note.basename = '  My 中文 ✅  Note  '; for (const variable of ['fileNameSlug', 'FileNameSlug']) {
    f.plugin.settings.imageNamePattern = `{{${variable}}}`;
    assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, 'my-中文-✅-note.png');
} });
test('Use original name fills a safe editable stem without submitting', async () => { const f = fixture(['my#original.v1.png']); f.app.vault.getResourcePath = () => ''; let calls = 0; f.plugin.renameFile = async () => { calls++; }; f.plugin.openRenameModal(f.files[0], 'Note', f.note.path); const modal = f.plugin.modals[0] as any; await modal.contentEl.find('button', 'Use original name').emit('click'); assert.equal(modal.contentEl.find('input').value, 'myoriginal.v1'); assert.equal(calls, 0); await modal.contentEl.find('button', 'Rename').emit('click'); await Promise.resolve(); assert.equal(calls, 1); });
test('placeholder-like filenames and frontmatter remain literal replacement values', () => { const date = { format: () => '2026' }; const data = { fileName: 'My {{attachmentName}}', dirName: '', firstHeading: '', imageNameKey: '{{fileName}}', attachmentName: '{{FileNameSlug}}' }; assert.equal(renderTemplate('{{fileName}}/{{attachmentName}}/{{imageNameKey}}/{{frontmatter:x}}', data, { x: '{{DATE:YYYY}}' }, date), 'My {{attachmentName}}/{{FileNameSlug}}/{{fileName}}/{{DATE:YYYY}}'); });
test('cursor placement is configurable without changing the end default', async () => { const f = fixture(); f.app.vault.getResourcePath = () => ''; for (const [mode, expected] of [['end', [4, 4]], ['start', [0, 0]], ['select', [0, 4]]] as const) {
    f.plugin.settings.nameInputPosition = mode;
    f.plugin.openRenameModal(f.files[0], 'Note', f.note.path);
    const modal = f.plugin.modals.at(-1) as any;
    const input = modal.contentEl.find('input');
    assert.deepEqual([input.selectionStart, input.selectionEnd], expected);
    modal.close();
} });
test('nearest-heading aliases use earliest source reference, not active cursor', () => { const f = fixture(); const headings = [{ level: 1, heading: 'Top', position: { start: { line: 0 } } }, { level: 2, heading: 'Section', position: { start: { line: 5 } } }, { level: 2, heading: 'Later', position: { start: { line: 20 } } }]; f.app.metadataCache.getFileCache = () => ({ headings, embeds: [{ link: 'old.png', position: { start: { line: 25 } } }, { link: 'old.png', position: { start: { line: 10 } } }] }); f.plugin.settings.imageNamePattern = '{{firstHeading}}-{{nearestHeading}}-{{headerName}}'; assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, 'Top-Section-Section.png'); });
test('nearest heading is empty when no preceding heading or no reference exists', () => { const f = fixture(); f.app.metadataCache.getFileCache = () => ({ headings: [{ level: 1, heading: 'After', position: { start: { line: 10 } } }], embeds: [{ link: 'old.png', position: { start: { line: 0 } } }] }); f.plugin.settings.imageNamePattern = 'prefix{{nearestHeading}}'; assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, 'prefix.png'); });
test('UUID and HEX tokens share one identifier within a render and refresh next render', () => { const data = { fileName: '', dirName: '', firstHeading: '', imageNameKey: '' }; const clock = { format: () => '' }; const result = renderTemplate('{{UUID}}|{{UUID}}|{{HEX}}', data, undefined, clock).split('|'); assert.match(result[0], /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/); assert.equal(result[0], result[1]); assert.equal(result[2], result[0].replace(/-/g, '')); assert.notEqual(renderTemplate('{{UUID}}', data, undefined, clock), result[0]); });
test('deleted/replaced TFile identity is rejected before queued rename', async () => { const f = fixture(); f.app.vault.getAbstractFileByPath = () => file('old.png'); await assert.rejects(f.plugin.renameFile(f.files[0], 'Note.png', f.note.path), /replaced or deleted/); assert.deepEqual(f.renamed, []); });
test('IME Enter does not submit until composition ends', async () => {
    const f = fixture(); f.app.vault.getResourcePath = () => ''; let calls = 0;
    f.plugin.renameFile = async () => { calls++; };
    f.plugin.openRenameModal(f.files[0], 'Note', f.note.path);
    const input = (f.plugin.modals[0] as any).contentEl.find('input');
    await input.emit('compositionstart'); await input.emit('keydown', {key: 'Enter', preventDefault() {}});
    assert.equal(calls, 0);
    await input.emit('compositionend'); await input.emit('keydown', {key: 'Enter', preventDefault() {}});
    await Promise.resolve(); assert.equal(calls, 1);
});
test('UUID prompt submits the displayed proposal without regenerating it', async () => {
    const f = fixture(); f.app.vault.getResourcePath = () => ''; f.plugin.settings.imageNamePattern = '{{UUID}}';
    const proposal = f.plugin.generateNewName(f.files[0], f.note); let submitted = '';
    f.plugin.renameFile = async (_file, name) => { submitted = name; };
    f.plugin.openRenameModal(f.files[0], proposal.stem, f.note.path);
    const modal = f.plugin.modals[0] as any;
    assert.equal(modal.contentEl.find('input').value, proposal.stem);
    await modal.contentEl.find('button', 'Rename').emit('click'); await Promise.resolve();
    assert.equal(submitted, proposal.newName);
});

test('slug arguments support all requested case and separator combinations', () => {
    const data = { fileName: ' Obsidian  Plugin\tTest File ', dirName: '', firstHeading: '', imageNameKey: '' };
    for (const alias of ['fileNameSlug', 'FileNameSlug']) {
        for (const [args, expected] of [
            ['lower:underscore', 'obsidian_plugin_test_file'],
            ['preserve:underscore', 'Obsidian_Plugin_Test_File'],
            ['lower:hyphen', 'obsidian-plugin-test-file'],
            ['preserve:hyphen', 'Obsidian-Plugin-Test-File'],
        ]) assert.equal(renderTemplate(`{{${alias}:${args}}}`, data), expected);
        assert.equal(renderTemplate(`{{${alias}}}`, data), 'obsidian-plugin-test-file');
    }
});
test('slug arguments preserve Unicode and never reparse replacement data', () => {
    const data = { fileName: ' 测试 ÉMOJI 🎉 {{UUID}} ', dirName: '', firstHeading: '', imageNameKey: '' };
    assert.equal(renderTemplate('{{fileNameSlug:preserve:underscore}}', data), '测试_ÉMOJI_🎉_{{UUID}}');
    assert.equal(renderTemplate('{{FileNameSlug:lower:hyphen}}', data), '测试-émoji-🎉-{{uuid}}');
    for (const token of ['fileNameSlug:upper:hyphen', 'fileNameSlug:lower:/', 'fileNameSlug:lower', 'fileNameSlug:preserve:underscore:extra']) {
        assert.equal(renderTemplate(`{{${token}}}`, data), `{{${token}}}`);
    }
});
test('slug option integrates into generated filename without changing extension', () => {
    const f = fixture(); f.note.basename = 'Obsidian Plugin Test File';
    f.plugin.settings.imageNamePattern = '{{FileNameSlug:preserve:underscore}}';
    assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, 'Obsidian_Plugin_Test_File.png');
});

test('explicit fileExt suffix produces one extension and a stem-only prompt', async () => {
    const f = fixture(['invoice.v1.PNG']); f.note.basename = 'NoteTitle';
    f.plugin.settings.imageNamePattern = '{{fileName}}-{{DATE:YYYYMMDD}}.{{fileExt}}';
    const proposed = f.plugin.generateNewName(f.files[0], f.note, {format: () => '20241115'});
    assert.equal(proposed.stem, 'NoteTitle-20241115');
    assert.equal(proposed.newName, 'NoteTitle-20241115.PNG');
    f.app.vault.getResourcePath = () => ''; let submitted = '';
    f.plugin.renameFile = async (_file, name) => { submitted = name; };
    f.plugin.openRenameModal(f.files[0], proposed.stem, f.note.path);
    const modal = f.plugin.modals.at(-1) as any;
    assert.equal(modal.contentEl.find('input').value, proposed.stem);
    await modal.contentEl.find('button', 'Rename').emit('click'); await Promise.resolve();
    assert.equal(submitted, proposed.newName);
});
test('fileExt in stem and terminal token preserve established filename behavior', () => {
    const f = fixture(['archive.tar.gz']); f.note.basename = 'Note.png';
    for (const [pattern, expected] of [
        ['{{fileName}}', 'Note.png.gz'],
        ['{{fileExt}}-{{fileName}}', 'gz-Note.png.gz'],
        ['{{attachmentName}}.{{fileExt}}', 'archive.tar.gz'],
        ['{{fileName}}.{{fileExt}}   ', 'Note.png.gz'],
        ['{{fileName}}.{{fileExt}}-copy', 'Note.png.gz-copy.gz'],
    ]) { f.plugin.settings.imageNamePattern = pattern; assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, expected); }
});
test('fileExt token never rescans filename or frontmatter replacement data', () => {
    const data = { fileName: 'Note.{{fileExt}}', fileExt: 'png', dirName: '', firstHeading: '', imageNameKey: '' };
    assert.equal(renderTemplate('{{fileName}}-{{frontmatter:a}}.{{fileExt}}', data, {a: '{{fileExt}}'}), 'Note.{{fileExt}}-{{fileExt}}.png');
});

test('fileExt suffix recognition follows actual parser boundaries without truncating data', () => {
    const f = fixture(); f.note.basename = 'MeaningfulNote';
    f.app.metadataCache.getFileCache = () => ({frontmatter: {'a.{{fileExt': 'MeaningfulName'}});
    f.plugin.settings.imageNamePattern = '{{frontmatter:a.{{fileExt}}';
    assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, 'MeaningfulName.png');
    f.plugin.settings.imageNamePattern = '{{unknown.{{fileExt}}';
    assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, '{{unknown.{{fileExt}}.png');
    f.files[0].extension = 'png ';
    f.plugin.settings.imageNamePattern = '{{fileName}}.{{fileExt}}  ';
    assert.equal(f.plugin.generateNewName(f.files[0], f.note).stem, 'MeaningfulNote');
});

test('DATETIME supports the requested mixed format and all bounded time padding modes', () => {
    const moment = require('moment'); const now = moment.utc('2026-10-14T03:04:05Z');
    const data = {fileName: 'Note', dirName: '', firstHeading: '', imageNameKey: ''};
    assert.equal(renderTemplate('{{DATETIME:YYYY-MM-DDT%_H:%M:%S}}', data, undefined, now), '2026-10-14T 3:04:05');
    assert.equal(renderTemplate('{{DATETIME:%H|%M|%S|%_H|%_M|%_S|%-H|%-M|%-S|%0H|%0M|%0S}}', data, undefined, now), '03|04|05| 3| 4| 5|3|4|5|03|04|05');
    assert.equal(renderTemplate('{{DATETIME:YYYY-MM-DD_HH-mm-ss}}', data, undefined, now), '2026-10-14_03-04-05');
});
test('DATETIME preserves Moment literals, explicit percent, unknown directives and DATE behavior', () => {
    const moment = require('moment'); const now = moment.utc('2026-10-14T13:24:35Z');
    const data = {fileName: '{{DATETIME:%H}}', dirName: '', firstHeading: '', imageNameKey: ''};
    assert.equal(renderTemplate('{{DATETIME:[%H] %% %Q %_Y %H}}', data, undefined, now), '%H % %Q %_Y 13');
    assert.equal(renderTemplate('{{DATETIME:[literal] \\H [%M] %S}}', data, undefined, now), 'literal H %M 35');
    assert.equal(renderTemplate('{{DATE:YYYY-MM-DDT%_H:%M:%S}}', data, undefined, now), now.format('YYYY-MM-DDT%_H:%M:%S'));
    assert.equal(renderTemplate('{{fileName}} {{DATETIME:}}', data, undefined, now), '{{DATETIME:%H}} {{DATETIME:}}');
});
test('DATE and DATETIME share batch clock and retain filename sanitization', async () => {
    const moment = require('moment'); const now = moment.utc('2026-10-14T03:04:05Z');
    const f = fixture(['a.png', 'b.png']); f.plugin.settings.imageNamePattern = '{{DATETIME:YYYY-MM-DDT%_H:%M:%S}}';
    const proposed = f.plugin.generateNewName(f.files[0], f.note, now);
    assert.equal(proposed.newName, '2026-10-14T 30405.png');
    let calls = 0; const previous = (globalThis as any).window.moment;
    (globalThis as any).window.moment = () => { calls++; return now; };
    try { f.plugin.settings.imageNamePattern = '{{DATE:YYYY}}-{{DATETIME:MM-DD_HH-mm-ss}}'; await f.plugin.batchRenameAllImages(); assert.equal(calls, 1); assert.deepEqual(f.renamed, ['2026-10-14_03-04-05.png', '2026-10-14_03-04-05-1.png']); }
    finally { (globalThis as any).window.moment = previous; }
});

test('DATETIME protects Moment greedy bracket-literal boundaries', () => {
    const moment = require('moment'); const now = moment.utc('2026-10-14T03:04:05Z');
    const data = {fileName: '', dirName: '', firstHeading: '', imageNameKey: ''};
    for (const pattern of ['[foo] %H]', '[%H\\]%M]', '[outer[inner %H] %M]', '[%H] [%M]']) {
        assert.equal(renderTemplate(`{{DATETIME:${pattern}}}`, data, undefined, now), now.format(pattern));
    }
});

test('mixed-extension batch can share numbering without changing defaults or repeated output', async () => {
    const f = fixture(['a.png','b.jpg','c.webp']); f.plugin.settings.dupNumberAcrossExtensions = true;
    await f.plugin.batchRenameAllImages(); assert.deepEqual(f.renamed, ['Note.png','Note-1.jpg','Note-2.webp']);
    await f.plugin.batchRenameAllImages(); assert.equal(f.renamed.length, 3);
});
test('queued cross-extension renames allocate unique stems', async () => {
    const f = fixture(['a.png','b.jpg']); f.plugin.settings.dupNumberAcrossExtensions = true;
    await Promise.all(f.files.map(image => f.plugin.renameFile(image, `Note.${image.extension}`, f.note.path)));
    assert.deepEqual(f.renamed, ['Note.png','Note-1.jpg']);
});

test('named template fallbacks select the first nonblank value or final literal', () => {
    const base = {imageNameKey: '', dirName: '', fileName: 'file_name', firstHeading: ''};
    const pattern = '{{imageNameKey|dirName|my_default_value}}-{{fileName}}';
    assert.equal(renderTemplate(pattern, {...base, imageNameKey: 'image_name_key', dirName: 'dir_name'}), 'image_name_key-file_name');
    assert.equal(renderTemplate(pattern, {...base, dirName: 'dir_name'}), 'dir_name-file_name');
    assert.equal(renderTemplate(pattern, base), 'my_default_value-file_name');
    assert.equal(renderTemplate(pattern, {...base, imageNameKey: '  ', dirName: '\t'}), 'my_default_value-file_name');
    assert.equal(renderTemplate('{{imageNameKey|dirName}}', base), '');
    assert.equal(renderTemplate('{{imageNameKey|}}', base), '');
});
test('fallbacks do not rescan replacement data or reinterpret existing formatted tokens', () => {
    const data = {imageNameKey: '{{UUID}}', dirName: '', fileName: 'Note', firstHeading: ''};
    assert.equal(renderTemplate('{{imageNameKey|dirName|default}}', data), '{{UUID}}');
    assert.equal(renderTemplate('{{imageNameKey|typo|default}}', data), '{{imageNameKey|typo|default}}');
    assert.equal(renderTemplate('{{unknown|default}}', data), '{{unknown|default}}');
    assert.equal(renderTemplate('{{DATE:YYYY|MM}}', data, undefined, {format: p => p}), 'YYYY|MM');
    assert.equal(renderTemplate('{{frontmatter:a|b}}', data, {'a|b': 'literal property'}), 'literal property');
});
test('fallbacks share UUID identity and filename generation keeps sanitization', () => {
    const data = {imageNameKey: '', dirName: '', fileName: 'Note', firstHeading: '', uuid: '12345678-1234-4234-8234-123456789012'};
    assert.equal(renderTemplate('{{imageNameKey|UUID}}-{{HEX}}', data), '12345678-1234-4234-8234-123456789012-12345678123442348234123456789012');
    const f = fixture(); f.plugin.settings.imageNamePattern = '{{imageNameKey|dirName|safe:default}}-{{fileName}}';
    assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, 'safedefault-Note.png');
});

test('fallback filename generation retains zero and false but skips nullish or blank imageNameKey', () => {
    const f = fixture(); f.note.parent.name = 'Folder';
    for (const [value, expected] of [[undefined,'Folder'],[null,'Folder'],[false,'false'],[0,'0'],['','Folder'],['  ','Folder'],['0','0'],['false','false']]) {
        f.app.metadataCache.getFileCache = () => ({frontmatter: {imageNameKey: value}});
        f.plugin.settings.imageNamePattern = '{{imageNameKey|dirName|default}}';
        assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, `${expected}.png`);
    }
    for (const value of [0, false]) {
        f.app.metadataCache.getFileCache = () => ({frontmatter: {imageNameKey: value}});
        f.plugin.settings.imageNamePattern = '{{imageNameKey}}';
        assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, `${value}.png`);
    }
});

test('conditional affixes omit both separators when a named variable is blank', () => {
    const base = {imageNameKey: '', dirName: '', fileName: 'file', firstHeading: ''};
    const pattern = '{{dirName:-}}{{__:imageNameKey:__}}{{fileName}}';
    assert.equal(renderTemplate(pattern, base), 'file');
    assert.equal(renderTemplate(pattern, {...base, dirName: 'Folder'}), 'Folder-file');
    assert.equal(renderTemplate(pattern, {...base, imageNameKey: 'key'}), '__key__file');
    assert.equal(renderTemplate(pattern, {...base, dirName: 'Folder', imageNameKey: 'key'}), 'Folder-__key__file');
    assert.equal(renderTemplate(pattern, {...base, dirName: '  ', imageNameKey: '\t'}), 'file');
    assert.equal(renderTemplate('{{pre:dirName:}}', {...base, dirName: 'Folder'}), 'preFolder');
});
test('conditional affixes preserve formatted-token precedence and literal replacement values', () => {
    const data = {imageNameKey: '{{UUID}}', dirName: 'Folder', fileName: 'Note', firstHeading: ''};
    assert.equal(renderTemplate('{{__:imageNameKey:__}}', data), '__{{UUID}}__');
    assert.equal(renderTemplate('{{DATE:HH:mm:ss}}', data, undefined, {format: p => p}), 'HH:mm:ss');
    assert.equal(renderTemplate('{{frontmatter:dirName:-}}', data, {'dirName:-': 'property'}), 'property');
    assert.equal(renderTemplate('{{unknown:-}}-{{pre:unknown:post}}', data), '{{unknown:-}}-{{pre:unknown:post}}');
    assert.equal(renderTemplate('{{fileNameSlug:preserve:underscore}}', data), 'Note');
    assert.equal(renderTemplate('{{dirName:-}}-{{imageNameKey|default}}', data), 'Folder--{{UUID}}');
});
test('conditional affixes retain zero/false values and ordinary filename safety', () => {
    const f = fixture(); f.plugin.settings.imageNamePattern = '{{pre:imageNameKey:post}}-{{fileName}}';
    for (const value of [0, false]) { f.app.metadataCache.getFileCache = () => ({frontmatter: {imageNameKey: value}}); assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, `pre${value}post-Note.png`); }
    f.plugin.settings.imageNamePattern = '{{fileName::bad}}';
    assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, '{{fileNamebad}}.png');
});


test('existing fallback final literals keep precedence over conditional-affix grammar', () => {
    const data = {imageNameKey: 'chosen', dirName: '', fileName: 'Note', firstHeading: ''};
    assert.equal(renderTemplate('{{imageNameKey|dirName|pre:fileName:post}}', data), 'chosen');
    assert.equal(renderTemplate('{{imageNameKey|dirName|pre:fileName:post}}', {...data, imageNameKey: ''}), 'pre:fileName:post');
    assert.equal(renderTemplate('{{:fileNameSlug:-}}', data), 'note-');
});

test('nearest-heading data resolves through bare, fallback and affix named-variable access', () => {
    const f = fixture(); f.app.metadataCache.getFileCache = () => ({headings: [{heading:'Section', level:2, position:{start:{line:2}}}], embeds:[{link:'old.png',position:{start:{line:4}}}]});
    for (const alias of ['nearestHeading','headerName']) {
        for (const [pattern, expected] of [[`{{${alias}}}`, 'Section.png'],[`{{${alias}|fileName}}`, 'Section.png'],[`{{${alias}:-}}{{fileName}}`, 'Section-Note.png'],[`{{pre:${alias}:post}}`, 'preSectionpost.png']]) {
            f.plugin.settings.imageNamePattern = pattern; assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName, expected);
        }
    }
});
test('heading extraction is lazy, memoized and never triggered by replacement data or unknown tokens', () => {
    const f = fixture(); let resolutions = 0;
    f.app.metadataCache.getFileCache = () => ({headings:[{heading:'Section',level:2,position:{start:{line:2}}}],embeds:[{link:'old.png',position:{start:{line:4}}}], frontmatter:{imageNameKey:'{{nearestHeading}}'}});
    f.app.metadataCache.getFirstLinkpathDest = () => {resolutions++; return f.files[0];};
    for (const pattern of ['{{imageNameKey|nearestHeading}}','{{unknown|nearestHeading}}','{{frontmatter:nearestHeading}}']) {f.plugin.settings.imageNamePattern=pattern; f.plugin.generateNewName(f.files[0], f.note);}
    assert.equal(resolutions,0);
    f.plugin.settings.imageNamePattern='{{nearestHeading}}-{{headerName:-}}';
    assert.equal(f.plugin.generateNewName(f.files[0], f.note).newName,'Section-Section-.png'); assert.equal(resolutions,1);
});

test('typed directory paths fail before rename instead of being silently sanitized', async () => {
    const f = fixture(); f.app.vault.getResourcePath = () => ''; let calls = 0;
    f.plugin.renameFile = async () => {calls++;};
    f.plugin.openRenameModal(f.files[0], 'Note', f.note.path); const modal = f.plugin.modals[0] as any;
    const input = modal.contentEl.find('input');
    for (const value of ['folder/name', '../name', '/name', 'C:\\name', 'C:name', ' C:name', '\tC:name', '../'.repeat(1000)+'name']) {
        input.value=value; await input.emit('change'); await modal.contentEl.find('button','Rename').emit('click'); await new Promise(resolve=>setImmediate(resolve)); assert.equal(calls,0);
    }
    await modal.contentEl.find('button','Use original name').emit('click');
    await modal.contentEl.find('button','Rename').emit('click'); await new Promise(resolve=>setImmediate(resolve)); assert.equal(calls,1);
});
test('template paths and direct allocator paths are rejected before filesystem mutation', async () => {
    const f = fixture();
    for (const pattern of ['folder/{{fileName}}', '../{{fileName}}', 'C:\\{{fileName}}', '/{{fileName}}', 'C:{{fileName}}', ' C:{{fileName}}', '\tC:{{fileName}}']) {
        f.plugin.settings.imageNamePattern=pattern; assert.throws(()=>f.plugin.generateNewName(f.files[0],f.note), /filename only/);
    }
    for (const name of ['folder/Note.png','C:\\Note.png','../'.repeat(1000)+'Note.png']) await assert.rejects(f.plugin.deduplicateNewName(name,f.files[0]), /filename only/);
    assert.deepEqual(f.renamed,[]);
});

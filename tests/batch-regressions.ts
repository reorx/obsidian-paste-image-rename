import test from 'node:test';
import assert from 'node:assert/strict';
import { ImageBatchRenameModal } from '../src/batch';
function fixture(cache: any) {
    const modal = Object.create(ImageBatchRenameModal.prototype) as ImageBatchRenameModal;
    const calls: any[] = [];
    modal.activeFile = { path: 'Note.md' } as any;
    modal.state = { namePattern: '[', extPattern: '', nameReplace: '', renameTasks: [{ file: { path: 'old.png' } as any, name: 'stale.png', originalPath: 'old.png' }] };
    modal.app = { vault: { getAbstractFileByPath: (path: string) => modal.state.renameTasks.find(task => task.file.path === path)?.file }, metadataCache: { getFileCache: () => cache } } as any;
    modal.renameFunc = async (...a) => { calls.push(a); };
    return { modal, calls, tbody: { empty() { } } as HTMLElement };
}
test('missing metadata invalidates previous batch preview', async () => { const f = fixture(null); f.modal.matchImageNames(f.tbody); await f.modal.renameAll(); assert.deepEqual(f.calls, []); });
test('invalid regex invalidates previous batch preview without throwing', async () => { const f = fixture({ embeds: [] }); f.modal.matchImageNames(f.tbody); await f.modal.renameAll(); assert.deepEqual(f.calls, []); });
test('moved preview target is rejected before rename', async () => { const f = fixture(null); f.modal.state.renameTasks[0].file.path = 'moved.png'; await assert.rejects(f.modal.renameAll(), /moved/); assert.deepEqual(f.calls, []); });
test('invalid later target is rejected before any batch mutation', async () => { const f = fixture(null); f.modal.state.renameTasks.push({ file: { path: 'second.png' } as any, name: 'CON.png', originalPath: 'second.png' }); await assert.rejects(f.modal.renameAll(), /not safe/); assert.deepEqual(f.calls, []); });
test('moved later preview file is rejected before any batch mutation', async () => { const f = fixture(null); f.modal.state.renameTasks.push({ file: { path: 'changed.png' } as any, name: 'second.png', originalPath: 'second.png' }); await assert.rejects(f.modal.renameAll(), /moved/); assert.deepEqual(f.calls, []); });
test('unexpected I/O failure reports partial batch progress', async () => { const f = fixture(null); f.modal.state.renameTasks.push({ file: { path: 'second.png' } as any, name: 'next.png', originalPath: 'second.png' }); let count = 0; f.modal.renameFunc = async () => { if (++count === 2)
    throw Error('disk error'); }; await assert.rejects(f.modal.renameAll(), /Renamed 1 of 2 files; stopped at second.png/); assert.deepEqual(f.modal.state.renameTasks, []); });
test('a later file moved during an earlier rename is not renamed elsewhere', async () => { const f = fixture(null); const second = { file: { path: 'second.png' } as any, name: 'next.png', originalPath: 'second.png' }; f.modal.state.renameTasks.push(second); let count = 0; f.modal.renameFunc = async () => { count++; second.file.path = 'elsewhere/second.png'; }; await assert.rejects(f.modal.renameAll(), /Renamed 1 of 2.*moved/); assert.equal(count, 1); });
test('closing a running batch stops remaining tasks after current operation', async () => { const f = fixture(null); f.modal.state.renameTasks.push({ file: { path: 'second.png' } as any, name: 'next.png', originalPath: 'second.png' }); (f.modal as any).contentEl = { empty() { } }; f.modal.onCloseExtra = () => { }; let calls = 0; f.modal.renameFunc = async () => { calls++; f.modal.onClose(); }; await f.modal.renameAll(); assert.equal(calls, 1); });
test('deleted/recreated later file with stale unchanged TFile.path stops before first rename', async () => { const f = fixture(null); f.modal.state.renameTasks.push({ file: { path: 'second.png' } as any, name: 'next.png', originalPath: 'second.png' }); f.modal.app.vault.getAbstractFileByPath = ((path: string) => path === 'old.png' ? f.modal.state.renameTasks[0].file : null) as any; await assert.rejects(f.modal.renameAll(), /replaced\/deleted/); assert.deepEqual(f.calls, []); });

test('batch text controls use SDK inputs despite preceding host decoration', async () => {
    const modal = new ImageBatchRenameModal({} as any, {} as any, async () => {}, () => {});
    let previews = 0;
    modal.matchImageNames = () => { previews++; };
    modal.open();
    const controls = (modal.contentEl as any).children.filter((child: any) => child.tag === 'control').slice(0, 3);
    const inputs = controls.map((control: any) => {
        assert.equal(control.children[0].tag, 'span');
        return control.find('input');
    });
    for (const [index, value] of ['old', 'png', 'new'].entries()) {
        inputs[index].value = value;
        await inputs[index].emit('change');
        await inputs[index].emit('keydown', {key: 'Enter', preventDefault() {}});
    }
    assert.equal(previews, 3);
    assert.deepEqual([modal.state.namePattern, modal.state.extPattern, modal.state.nameReplace], ['old', 'png', 'new']);
    for (const input of [inputs[0], inputs[2]]) {
        await input.emit('compositionstart');
        await input.emit('keydown', {key: 'Enter', preventDefault() {}});
        assert.equal(previews, 3);
        await input.emit('compositionend');
    }
    modal.close();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateName, compileExtensionPattern, isExcludedPath, isTemporaryAttachment, updateEmbedDestination } from '../src/rename-core';
import { sanitizer } from '../src/utils';
const options = { dupNumberAtStart: false, dupNumberDelimiter: '-', dupNumberAlways: false };
test('folder exclusion boundaries, descendants, slashes and empty lines', () => { assert.equal(isExcludedPath('Telegram/photos/a.png', '/Telegram/\nZotero'), true); assert.equal(isExcludedPath('Telegram2/a.png', 'Telegram'), false); assert.equal(isExcludedPath('a.png', '\n'), false); });
test('extension regex respects first line and invalid patterns reject', () => { assert.equal(compileExtensionPattern('tmp\n[')?.test('tmp'), true); assert.throws(() => compileExtensionPattern('[')); });
test('temporary sync and hidden files are excluded', () => { for (const p of ['.syncthing.photo.png.tmp', 'image.tmp', 'path/.hidden/a.png', 'a.crdownload'])
    assert.equal(isTemporaryAttachment(p), true); assert.equal(isTemporaryAttachment('photo.png'), false); });
test('Unicode filename characters and delimiter spacing survive', () => { assert.equal(sanitizer.filename('✅ 中文「」！？（）／–—'), '✅ 中文「」！？（）／–—'); assert.equal(sanitizer.filename('a/b\\c:*?<>|#[]^"'), 'abc'); assert.equal(sanitizer.delimiter(' - IMG'), ' - IMG'); });
test('numbering preserves suffix and prefix members', () => { assert.equal(allocateName('Note.png', ['Note.png', 'Note-1.png'], 'Note-1.png', options), 'Note-1.png'); assert.equal(allocateName('Note.png', ['1-Note.png'], '1-Note.png', { ...options, dupNumberAtStart: true, dupNumberAlways: true }), '1-Note.png'); });
test('duplicate delimiters and extensions are regex literals', () => { assert.equal(allocateName('Note.p+', ['Note.p+', 'Note(2.p+'], undefined, { ...options, dupNumberDelimiter: '(' }), 'Note(3.p+'); });
test('wiki repair preserves width or alias and markdown repair preserves alt and title', () => { assert.equal(updateEmbedDestination('![[old.png|200]]', '[[Note.png]]'), '![[Note.png|200]]'); assert.equal(updateEmbedDestination('![alt|200](old.png "Title")', '[](Note%20image.png)'), '![alt|200](Note%20image.png "Title")'); assert.equal(updateEmbedDestination('`![[old.png]]`', '[[new.png]]'), null); });
test('new counters support padding while existing numbered names stay stable', () => { assert.equal(allocateName('Note.png', ['Note.png', 'Note-001.png', 'Note-2.png'], undefined, { ...options, dupNumberWidth: 3 }), 'Note-003.png'); assert.equal(allocateName('Note.png', [], undefined, { ...options, dupNumberAtStart: true, dupNumberAlways: true, dupNumberWidth: 3 }), '001-Note.png'); assert.equal(allocateName('Note.png', ['Note-1.png'], 'Note-1.png', { ...options, dupNumberWidth: 3 }), 'Note-1.png'); });
test('large imported counters increment exactly without selecting an occupied name', () => {
    assert.equal(allocateName('Note.png', ['Note.png', 'Note-9007199254740992.png'], undefined, options), 'Note-9007199254740993.png');
    assert.equal(allocateName('Note.png', ['Note.png', 'Note-999999999999999999999.png'], undefined, options), 'Note-1000000000000000000000.png');
});

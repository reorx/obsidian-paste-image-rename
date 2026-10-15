import test, { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import Plugin from '../src/main';
import { TFile } from 'obsidian';

// These exercise production plugin logic with real temporary directories, PNG
// bytes, fs.rename and SHA256 verification. Obsidian metadata/link maintenance
// and event ordering are simulated. They do not run Docxer or native Obsidian,
// reproduce its parser/clipboard, or certify Windows/macOS filesystem behavior.
const settings = {
    imageNamePattern: '{{fileName}}', dupNumberAtStart: false,
    dupNumberDelimiter: '-', dupNumberAlways: false,
    dupNumberAcrossExtensions: false, dupNumberWidth: 1,
    nameInputPosition: 'end' as const, autoRename: true,
    handleAllAttachments: true, excludeExtensionPattern: '',
    excludedFolders: '', disableRenameNotice: true,
};
const hash = (bytes: Buffer) => crypto.createHash('sha256').update(bytes).digest('hex');
function crc32(bytes: Buffer) {
    let value = 0xffffffff;
    for (const byte of bytes) {
        value ^= byte;
        for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return (value ^ 0xffffffff) >>> 0;
}
function chunk(type: string, bytes: Buffer) {
    const prefix = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
    length.writeUInt32BE(bytes.length);
    crc.writeUInt32BE(crc32(Buffer.concat([prefix, bytes])));
    return Buffer.concat([length, prefix, bytes, crc]);
}
function png(id: number) {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4);
    header[8] = 8; header[9] = 6;
    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', header), chunk('tEXt', Buffer.from(`FixtureID\0${id}`)),
        chunk('IDAT', zlib.deflateSync(Buffer.from([0, id & 255, (id >>> 8) & 255, (id >>> 16) & 255, 255]))),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}
function fixture(t: TestContext, count = 3, stem = 'Note') {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pir-filesystem-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const registry = new Map<string, TFile>();
    const renames: { oldPath: string; newPath: string }[] = [];
    const references: string[] = [];
    const diskPath = (relative: string) => path.join(root, relative);
    function register(relative: string, bytes: Buffer | string) {
        fs.mkdirSync(path.dirname(diskPath(relative)), { recursive: true });
        fs.writeFileSync(diskPath(relative), bytes);
        const extension = path.extname(relative).slice(1);
        const file = Object.assign(new TFile(), {
            path: relative, name: path.basename(relative),
            basename: path.basename(relative, `.${extension}`), extension,
            parent: { path: path.dirname(relative) === '.' ? '' : path.dirname(relative), name: path.basename(path.dirname(relative)) },
        });
        registry.set(relative, file);
        return file;
    }
    const source = register(`${stem}.md`, '');
    const images = Array.from({ length: count }, (_, i) => register(`assets/imported-${i}.png`, png(i)));
    references.push(...images.map(file => file.path));
    const originalHashes = images.map(file => hash(fs.readFileSync(diskPath(file.path))));
    const writeSource = () => fs.writeFileSync(diskPath(source.path), references.map(link => `![[${link}]]`).join('\n') + '\n');
    writeSource();
    const plugin = Object.create(Plugin.prototype) as Plugin;
    plugin.settings = { ...settings };
    plugin.modals = [];
    let afterRename: ((file: TFile) => Promise<void>) | undefined;
    async function move(file: TFile, destination: string, updateLinks = true) {
        const original = file.path;
        fs.mkdirSync(path.dirname(diskPath(destination)), { recursive: true });
        await fs.promises.rename(diskPath(original), diskPath(destination));
        registry.delete(original);
        Object.assign(file, {
            path: destination, name: path.basename(destination),
            basename: path.basename(destination, `.${file.extension}`),
            parent: { path: path.dirname(destination) === '.' ? '' : path.dirname(destination), name: path.basename(path.dirname(destination)) },
        });
        registry.set(destination, file);
        if (updateLinks) {
            for (let i = 0; i < references.length; i++) if (references[i] === original) references[i] = destination;
            writeSource();
        }
    }
    plugin.app = {
        workspace: { getActiveViewOfType: () => ({ file: source, editor: null }) },
        metadataCache: {
            getFileCache: () => ({ embeds: references.map(link => ({ link })) }),
            getFirstLinkpathDest: (link: string) => registry.get(link) || null,
        },
        vault: {
            config: { alwaysUpdateLinks: true },
            getAbstractFileByPath: (relative: string) => registry.get(relative) || null,
            adapter: { list: async (relative: string) => {
                const entries = await fs.promises.readdir(diskPath(relative), { withFileTypes: true });
                return {
                    files: entries.filter(entry => entry.isFile()).map(entry => path.posix.join(relative, entry.name)),
                    folders: entries.filter(entry => entry.isDirectory()).map(entry => path.posix.join(relative, entry.name)),
                };
            } },
        },
        fileManager: {
            generateMarkdownLink: (file: TFile) => `[[${file.path}]]`,
            renameFile: async (file: TFile, destination: string) => {
                const original = file.path;
                await move(file, destination);
                renames.push({ oldPath: original, newPath: destination });
                await afterRename?.(file);
            },
        },
    } as any;
    function assertMapping() {
        assert.deepEqual(references.slice(0, count).map(link => hash(fs.readFileSync(diskPath(link)))), originalHashes);
        assert.equal(new Set(images.map(file => file.path)).size, count);
    }
    return {
        root, plugin, source, images, references, renames, move, assertMapping, writeSource,
        savedSource: () => fs.readFileSync(diskPath(source.path), 'utf8'),
        setAfterRename: (callback: (file: TFile) => Promise<void>) => { afterRename = callback; },
    };
}

test('filesystem: importer-style duplicate basenames retain ordered hashes and repeat stability', async t => {
    const f = fixture(t, 4, 'Imported');
    for (let i = 0; i < 4; i++) {
        const folder = i < 2 ? 'alpha' : 'beta';
        const name = i % 2 ? 'A screenshot of a computer AI-generated content may be incorrect 1.png' : 'attachment 1.png';
        await f.move(f.images[i], `${folder}/${name}`);
    }
    f.references.push(f.references[0], f.references[2], 'missing.png');
    f.writeSource();
    await f.plugin.batchRenameAllImages();
    f.assertMapping();
    assert.equal(f.renames.length, 4);
    assert.equal(f.references[4], f.references[0]);
    assert.equal(f.references[5], f.references[2]);
    const saved = f.savedSource();
    await f.plugin.batchRenameAllImages();
    assert.equal(f.renames.length, 4);
    assert.equal(f.savedSource(), saved);
    f.assertMapping();
});

test('filesystem: reported issue 119 stem continues beyond 303 through 349', async t => {
    const stem = 'CS50P-Week8-Lecture-Object-Oriented Programming';
    const f = fixture(t, 350, stem);
    f.plugin.settings.autoRename = false;
    f.plugin.settings.excludeExtensionPattern = 'docx?|xlsx?|pptx?|zip|rar';
    for (let i = 0; i < 304; i++) await f.move(f.images[i], `assets/${stem}${i ? `-${i}` : ''}.png`);
    await f.plugin.batchRenameAllImages();
    f.assertMapping();
    assert.equal(f.renames.length, 46);
    assert.equal(f.images[304].name, `${stem}-304.png`);
    assert.equal(f.images[349].name, `${stem}-349.png`);
    const saved = f.savedSource();
    await f.plugin.batchRenameAllImages();
    assert.equal(f.renames.length, 46);
    assert.equal(f.savedSource(), saved);
    f.assertMapping();
});

test('filesystem: instant batch refuses a later attachment moved during an earlier rename', async t => {
    const f = fixture(t);
    f.setAfterRename(async file => {
        if (file === f.images[0]) await f.move(f.images[1], 'outside-scope/second.png');
    });
    await assert.rejects(f.plugin.batchRenameAllImages(), /Batch stopped: assets\/imported-1.png moved/);
    assert.equal(f.renames.length, 1);
    assert.equal(f.images[0].path, 'assets/Note.png');
    assert.equal(f.images[1].path, 'outside-scope/second.png');
    assert.equal(f.images[2].path, 'assets/imported-2.png');
    f.assertMapping();
});

test('filesystem: instant batch refuses a source renamed during an earlier attachment rename', async t => {
    const f = fixture(t);
    f.setAfterRename(async file => {
        if (file === f.images[0]) await f.move(f.source, 'Changed.md', false);
    });
    await assert.rejects(f.plugin.batchRenameAllImages(), /original source note is no longer available/);
    assert.equal(f.renames.length, 1);
    assert.equal(f.source.path, 'Changed.md');
    assert.deepEqual(f.images.map(file => file.name), ['Note.png', 'imported-1.png', 'imported-2.png']);
    f.assertMapping();
});

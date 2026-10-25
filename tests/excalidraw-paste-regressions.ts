import test from 'node:test';
import assert from 'node:assert/strict';
import { MarkdownView, TFile } from 'obsidian';
import { compressToBase64 } from 'lz-string';
import { decodeDrawing, excalidrawMarkdownBody, ExcalidrawPasteController } from '../src/excalidraw-paste';
const suffix = '\n%%\n# Excalidraw Data\n\n## Drawing\n```json\n{"elements":[],"files":{}}\n```\n%%';
const header = '---\nexcalidraw-plugin: parsed\nallow-paste-image-rename: true\n---\n';
function makeFile(path: string) { return Object.assign(new TFile(), {path, name:path.split('/').at(-1), extension:path.split('.').at(-1), stat:{mtime:1,ctime:1,size:1}}) }
function fixture(cursorOverride?: number) {
    const source=makeFile('Note.md'), image=makeFile('assets/new.png'), bytes=new Uint8Array([137,80,78,71,13,10,26,10]).buffer;
    const before=header+'body '+suffix, inserted='![[new.png]]', cursor=cursorOverride ?? header.length+5;
    let text=before, active: any, selection='', binary=bytes;
    const notes=new Map<TFile,string>([[source,before]]), files=[source]; image.stat.size=bytes.byteLength;
    const editor:any={getValue:()=>text,getSelection:()=>selection,getCursor:()=>({line:0,ch:cursor}),posToOffset:(p:any)=>p.ch};
    const view=Object.assign(new MarkdownView(),{file:source,editor}); active=view;
    const leaves:any[]=[{view}];
    const app:any={workspace:{getActiveViewOfType:()=>active,getLeavesOfType:(type:string)=>type==='markdown'?leaves:[]},metadataCache:{getFirstLinkpathDest:(target:string)=>['new','new.png','assets/new.png'].includes(target)?image:null},vault:{getFiles:()=>files,getAbstractFileByPath:(path:string)=>files.find(file=>file.path===path),readBinary:async()=>binary,read:async(file:TFile)=>notes.get(file),adapter:{stat:async(path:string)=>{const file=files.find(file=>file.path===path);return file?{type:'file',mtime:file.stat.mtime,size:file.stat.size}:null}}}};
    const controller=new ExcalidrawPasteController(app, (link, sourcePath) => app.metadataCache.getFirstLinkpathDest(link, sourcePath));
    const event:any={isTrusted:true,defaultPrevented:false,clipboardData:{files:[{size:bytes.byteLength,arrayBuffer:async()=>bytes}]}};
    const paste=async()=>{controller.observe(event,editor,view);files.push(image);controller.created(image);text=before.slice(0,cursor)+inserted+before.slice(cursor);notes.set(source,text);return controller.prepare(image,source,text,{embeds:[{link:'new.png',original:inserted,position:{start:{offset:cursor},end:{offset:cursor+inserted.length}}}]} as any)};
    return {controller,app,source,image,files,notes,event,editor,view,leaves,paste,before,inserted,cursor,bytes,setText:(v:string)=>{text=v;notes.set(source,v)},setActive:(v:any)=>active=v,setSelection:(v:string)=>selection=v,setBinary:(v:ArrayBuffer)=>binary=v};
}
test('Excalidraw compatibility needs explicit boolean opt-in and unambiguous commented data',()=>{
    assert.ok(excalidrawMarkdownBody(header+'body'+suffix));
    assert.ok(excalidrawMarkdownBody('\uFEFF'+(header+'body'+suffix).replace(/\n/g,'\r\n')));
    for(const text of [(header+'body'+suffix).replace('true','"true"'),(header+'body'+suffix).replace('true','false'),header+'body'+suffix+'\ntrailing',header+'%% body'+suffix,header+'body'+suffix+suffix,(header+'body'+suffix).replace('## Drawing','## Lost')]) assert.equal(excalidrawMarkdownBody(text),undefined,text);
});
test('bounded compressed decoder matches lz-string and stops expansion before output grows',()=>{
    for(const value of ['hello',JSON.stringify({elements:[{link:'![[new.png]]'}],files:{}}),'中文😀'.repeat(800)]) assert.equal(decodeDrawing(compressToBase64(value)),value);
    assert.throws(()=>decodeDrawing(compressToBase64('A'.repeat(100_000)),1000),/limit/);
    assert.throws(()=>decodeDrawing('not!base64'));
});
test('single trusted raster body insertion yields a narrow stable rename proof',async()=>{
    const f=fixture(), proof=await f.paste();assert.ok(proof);assert.equal(proof.file,f.image);assert.equal(proof.source,f.source);proof.assertCurrent();const stable=await proof.preflight();stable();
});
test('untrusted, prevented, selected and multi-file gestures never grant compatibility',async()=>{
    for(const mode of ['untrusted','prevented','selection','multi']) {const f=fixture();if(mode==='untrusted')f.event.isTrusted=false;if(mode==='prevented')f.event.defaultPrevented=true;if(mode==='selection')f.setSelection('x');if(mode==='multi')f.event.clipboardData.files.push(f.event.clipboardData.files[0]);assert.equal(await f.paste(),undefined,mode)}
});
test('changed bytes, second created file, unsupported file extension fail closed',async()=>{
    for(const mode of ['bytes','multiple','svg']) {const f=fixture();if(mode==='bytes')f.setBinary(new Uint8Array([1]).buffer);if(mode==='svg')f.image.extension='svg';if(mode==='multiple'){const created=f.controller.created.bind(f.controller);f.controller.created=(file)=>{created(file);created(makeFile('another.png'))}}assert.equal(await f.paste(),undefined,mode)}
});
test('mode switch, source rename, editor edit, image mutation and unload revoke proof',async()=>{
    for(const mode of ['mode','source','text','image','unload']) {const f=fixture(),proof=await f.paste();assert.ok(proof);if(mode==='mode')f.setActive({file:f.source});if(mode==='source')f.source.path='Moved.md';if(mode==='text')f.setText(f.before);if(mode==='image')f.controller.modified(f.image);if(mode==='unload')f.controller.stop();assert.throws(()=>proof.assertCurrent(),undefined,mode)}
});
test('plain, encoded and compressed drawing references reject shared images',async()=>{
    for(const text of ['![[new.png]]','![[new]]','[x](n%65w.png)','---\nimage: "\\x6eew.png"\n---','%%\n# Excalidraw Data\n## Embedded Files\nid: [[new.png]]\n%%','## Drawing\n```compressed-json\n'+compressToBase64(JSON.stringify({elements:[{link:'![[new.png]]'}]}))+'\n```']) {const f=fixture(),other=makeFile('Other.md');f.files.push(other);f.notes.set(other,text);const proof=await f.paste();assert.ok(proof);await assert.rejects(proof.preflight(),undefined,text)}
});
test('unrelated compressed drawing is allowed but malformed compressed drawing fails closed',async()=>{
    for(const malformed of [false,true]) {const f=fixture(),other=makeFile('Other.md');f.files.push(other);f.notes.set(other,'## Drawing\n```compressed-json\n'+(malformed?'!!!':compressToBase64(JSON.stringify({elements:[{text:'hello'}],files:{}})))+'\n```');const proof=await f.paste();assert.ok(proof);if(malformed)await assert.rejects(proof.preflight());else (await proof.preflight())()}
});
test('unsaved other editor reference and source disk mismatch reject before rename',async()=>{
    for(const mode of ['editor','source']) {const f=fixture(),proof=await f.paste();assert.ok(proof);if(mode==='source')f.notes.set(f.source,f.before);else {const other=makeFile('Other.md');f.files.push(other);f.notes.set(other,'plain');f.leaves.push({view:{file:other,editor:{getValue:()=>'![[new.png]]'}}})}await assert.rejects(proof.preflight(),undefined,mode)}
});
test('vault changes during async scan or after scan invalidate final retained guard',async()=>{
    for(const after of [false,true]) {const f=fixture(),proof=await f.paste();assert.ok(proof);if(after){const stable=await proof.preflight();f.controller.modified();assert.throws(stable)}else {const read=f.app.vault.read;f.app.vault.read=async(file:TFile)=>{const text=await read(file);f.controller.modified(file);return text};await assert.rejects(proof.preflight())}}
});

test('source frontmatter must begin at offset zero, and drawing block must be standard',()=>{
    assert.equal(excalidrawMarkdownBody('text\n'+header+'body'+suffix),undefined);
    assert.equal(excalidrawMarkdownBody((header+'body'+suffix).replace('```json','```unsupported')),undefined);
});
test('cancel revokes proof and physical watcher lag refuses a stale attachment',async()=>{
    const a=fixture(),cancelled=await a.paste();assert.ok(cancelled);cancelled.cancel();assert.throws(cancelled.assertCurrent);
    const f=fixture(),proof=await f.paste();assert.ok(proof);const stat=f.app.vault.adapter.stat;f.app.vault.adapter.stat=async(path:string)=>path===f.image.path?{type:'file',size:99,mtime:99}:stat(path);await assert.rejects(proof.preflight(),/Physical file/);
});

test('live Canvas or Excalidraw scenes prevent proof and revoke pending proof',async()=>{
    for(const type of ['canvas','excalidraw']) {
        const f=fixture(),proof=await f.paste();assert.ok(proof);const get=f.app.workspace.getLeavesOfType;f.app.workspace.getLeavesOfType=(name:string)=>name===type?[{view:{}}]:get(name);assert.throws(proof.assertCurrent);
        const before=fixture(),getBefore=before.app.workspace.getLeavesOfType;before.app.workspace.getLeavesOfType=(name:string)=>name===type?[{view:{}}]:getBefore(name);assert.equal(await before.paste(),undefined);
    }
});

test('ordinary Markdown opening with unrelated links is not mistaken for a JSON container',async()=>{
    const f=fixture(),other=makeFile('Other.md');f.files.push(other);f.notes.set(other,'[other](elsewhere.png)');const proof=await f.paste();assert.ok(proof);(await proof.preflight())();
});

test('common harmless HTML entities are allowed, encoded filenames remain protected',async()=>{
    for(const text of ['hello &amp; goodbye','new&#46;png','n&#x65;w.png','&unknown;']) {const f=fixture(),other=makeFile('Other.md');f.files.push(other);f.notes.set(other,text);const proof=await f.paste();assert.ok(proof);if(text.startsWith('hello'))(await proof.preflight())();else await assert.rejects(proof.preflight())}
});

test('extensionless titled and reference-definition Markdown links are protected',async()=>{
    for(const text of ['![x](new "title")','![x][ref]\n\n[ref]: new','[link](<new> "title")']) {const f=fixture(),other=makeFile('Other.md');f.files.push(other);f.notes.set(other,text);const proof=await f.paste();assert.ok(proof);await assert.rejects(proof.preflight(),undefined,text)}
});


test('expired proof rejects before rename and cannot be revived by editor state',async()=>{
    const original=Date.now; let now=1_000;
    Date.now=()=>now;
    try {const f=fixture(),proof=await f.paste();assert.ok(proof);now+=30_001;assert.throws(proof.assertCurrent);await assert.rejects(proof.preflight());assert.equal(f.controller.canTrack(f.image,f.source),false)}
    finally {Date.now=original}
});
test('cursor in frontmatter, drawing payload or after closing comment never grants permission',async()=>{
    const text=header+'body '+suffix;
    for(const cursor of [3,text.indexOf('# Excalidraw Data')+5,text.indexOf('"elements"'),text.length]) {const f=fixture(cursor);assert.equal(await f.paste(),undefined,String(cursor))}
});
test('duplicate candidate metadata embeds cannot prove a single insertion',async()=>{
    const f=fixture(),proof=await f.paste();assert.ok(proof);
    const ref={link:'new.png',original:f.inserted,position:{start:{offset:f.cursor},end:{offset:f.cursor+f.inserted.length}}};
    const next=await f.controller.prepare(f.image,f.source,f.editor.getValue(),{embeds:[ref,ref]} as any);assert.equal(next,undefined);
});
test('drawing suffix mutation during insertion refuses proof even if body embed is valid',async()=>{
    const f=fixture();const prepare=f.controller.prepare.bind(f.controller);
    f.controller.prepare=async(file,source,data,cache)=>{const changed=data!.replace('"elements":[]','"elements":[{"text":"changed"}]');f.setText(changed);return prepare(file,source,changed,cache)};
    assert.equal(await f.paste(),undefined);
});
test('new compressed drawing reference introduced during awaited scan invalidates verification',async()=>{
    const f=fixture(),other=makeFile('Other.md');f.files.push(other);f.notes.set(other,'unrelated');const proof=await f.paste();assert.ok(proof);
    const read=f.app.vault.read;let changed=false;
    f.app.vault.read=async(file:TFile)=>{const text=await read(file);if(!changed){changed=true;f.notes.set(other,'## Drawing\n```compressed-json\n'+compressToBase64(JSON.stringify({elements:[{link:'![[new]]'}]}))+'\n```');f.controller.modified(other)}return text};
    await assert.rejects(proof.preflight(),/Vault changed/);
});
test('temporary source view/editor replacement blocks proof while changed but unchanged restoration is safe',async()=>{
    const f=fixture(),proof=await f.paste();assert.ok(proof);f.setActive({file:f.source,editor:f.editor});assert.throws(proof.assertCurrent);f.setActive(f.view);proof.assertCurrent();
    f.view.editor={getValue:()=>f.editor.getValue()} as any;assert.throws(proof.assertCurrent);f.view.editor=f.editor;proof.assertCurrent();(await proof.preflight())();
});

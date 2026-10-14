import test from 'node:test';
import assert from 'node:assert/strict';
import {TFile} from 'obsidian';
import {DiscardController} from '../src/discard-controller';
import {assertNoAttachmentReference} from '../src/discard-policy';
function makeFile(path:string) {return Object.assign(new TFile(),{path,name:path.split('/').at(-1),extension:path.split('.').at(-1),stat:{mtime:1,ctime:1,size:3}});}
function fixture() {
    const source=makeFile('Note.md'), image=makeFile('new.png'), bytes=new Uint8Array([137,80,78,71,13,10,26,10]).buffer;
    const before='prefix  suffix', inserted='![[new.png]]'; let text=before, disk=before, calls=0, saves=0;
    image.stat.size=bytes.byteLength;
    const files=[source]; const notes=new Map<TFile,string>(); const binary=new Map([[image,bytes]]); let trash:ArrayBuffer|undefined;
    let controller:DiscardController;
    const editor:any={getValue:()=>text,getSelection:()=>'',getCursor:()=>({line:0,ch:7}),posToOffset:(pos:any)=>pos.ch,offsetToPos:(offset:number)=>({line:0,ch:offset}),transaction:(t:any)=>{for(const c of t.changes)text=text.slice(0,c.from.ch)+c.text+text.slice(c.to.ch);controller.changed(source);}};
    const view:any={file:source,editor,save:async()=>{saves++;disk=text;source.stat.mtime++;controller.changed(source);}};
    const leaves:any[]=[{view}];
    const app:any={workspace:{getLeavesOfType:()=>leaves},metadataCache:{getFirstLinkpathDest:(target:string)=>['new','new.png'].includes(target)?image:null},vault:{getFiles:()=>files,getAbstractFileByPath:(path:string)=>files.find(f=>f.path===path),readBinary:async(f:TFile)=>binary.get(f)!,read:async(f:TFile)=>f===source?disk:notes.get(f)||'',adapter:{exists:async(path:string)=>files.some(f=>f.path===path),stat:async(path:string)=>{const file=files.find(f=>f.path===path);return file?{...file.stat,type:'file'}:null;},list:async()=>({files:files.map(f=>f.path),folders:[]})},trash:async(f:TFile,system:boolean)=>{assert.equal(system,false);calls++;trash=binary.get(f);files.splice(files.indexOf(f),1);binary.delete(f);controller.changed(f);}}};
    controller=new DiscardController(app,()=>undefined);
    const event:any={isTrusted:true,defaultPrevented:false,clipboardData:{files:[{size:bytes.byteLength,arrayBuffer:async()=>bytes}]}};
    const prepare=async()=>{controller.observe(event,editor,view);files.push(image);controller.changed(image,true);text='prefix '+inserted+' suffix';disk=text;return controller.prepare(image,source,text,{embeds:[{link:'new.png',original:inserted,position:{start:{offset:7},end:{offset:19}}}]} as any);};
    return {controller,source,image,bytes,app,view,editor,files,leaves,notes,event,prepare,state:()=>({text,disk,calls,saves,trash}),edit:(value:string)=>{text=value;controller.changed(source);},write:(value:string)=>{disk=value;controller.changed(source);},binary};
}
test('concrete discard removes exact saved reference and locally trashes matching bytes once',async()=>{
    const f=fixture(), action=await f.prepare();assert.ok(action.execute);await action.execute!();assert.equal(f.state().text,'prefix  suffix');assert.equal(f.state().disk,'prefix  suffix');assert.equal(f.state().calls,1);assert.deepEqual(f.state().trash,f.bytes);await assert.rejects(action.execute!(),/already attempted/);assert.equal(f.state().calls,1);
});
test('unsupported containers, SVG, shared links and dirty editors refuse before mutation',async()=>{
    for(const mode of ['canvas','svg','drawing','shared','dirty','entity','uri']){
        const f=fixture(),other=makeFile(mode==='canvas'?'Other.canvas':mode==='svg'?'Other.svg':'Other.md');f.files.push(other);
        f.notes.set(other,mode==='drawing'?'---\nexcalidraw-plugin: parsed\n---':mode==='shared'?'[link](new)':mode==='entity'?'&period;':mode==='uri'?'[x](obsidian://open?vault=x)':'plain');
        if(mode==='dirty')f.leaves.push({view:{file:other,editor:{getValue:()=>'dirty'}}});
        const action=await f.prepare();
        await assert.rejects(action.execute!());assert.equal(f.state().calls,0,mode);assert.equal(f.state().text,'prefix ![[new.png]] suffix',mode);
    }
});
test('cancellation, file modification and replaced source reject deletion',async()=>{
    for(const mode of ['cancel','modify','replace','close']){
        const f=fixture(),action=await f.prepare();if(mode==='cancel')action.cancel();if(mode==='modify'){f.binary.set(f.image,new Uint8Array([9]).buffer);f.controller.changed(f.image);}if(mode==='replace')f.files[0]=makeFile('Note.md');if(mode==='close')f.leaves.length=0;
        await assert.rejects(action.execute!());assert.equal(f.state().calls,0);assert.equal(f.state().text,'prefix ![[new.png]] suffix');
    }
});
test('file size is checked before reading clipboard bytes',async()=>{
    const f=fixture();let reads=0;f.event.clipboardData.files[0]={size:20_000_001,arrayBuffer:async()=>{reads++;return f.bytes;}};f.controller.observe(f.event,f.editor,f.view);assert.equal(reads,0);
});
test('ownership parser detects encoded, wiki, reference-definition and YAML links conservatively',()=>{
    const resolves=(target:string)=>target==='new';
    for(const text of ['![[new]]','[x][ref]\n\n[ref]: new','[x](n%65w.png)','![](new\\.png)','---\nimage: "new"\n---','---\nimage: "\\x6eew.png"\n---','<img src="elsewhere">','[x](file:///x)'])assert.throws(()=>assertNoAttachmentReference(text,'new.png',resolves),undefined,text);
    assert.doesNotThrow(()=>assertNoAttachmentReference('ordinary text ![[other.png]] [web](https://example.com)', 'new.png',resolves));
});
test('raster extension alone does not hide a structured container',async()=>{
    const f=fixture(),other=makeFile('disguised.png');f.files.push(other);f.binary.set(other,new TextEncoder().encode('<svg><image href="new.png"/></svg>').buffer);const action=await f.prepare();await assert.rejects(action.execute!(),/Unverified raster/);assert.equal(f.state().calls,0);
});
test('unindexed physical files and stale physical stat refuse deletion',async()=>{
    for(const mode of ['file','stat']){
        const f=fixture(),action=await f.prepare();
        if(mode==='file')f.app.vault.adapter.list=async()=>({files:[...f.files.map(file=>file.path),'hidden-new.md'],folders:[]});
        else f.app.vault.adapter.stat=async()=>({type:'file',mtime:99,size:99});
        await assert.rejects(action.execute!());assert.equal(f.state().calls,0);assert.equal(f.state().text,'prefix ![[new.png]] suffix');
    }
});
test('renaming source during insertion byte proof cannot produce a discard action',async()=>{
    const f=fixture();const read=f.app.vault.readBinary;f.app.vault.readBinary=async(file:TFile)=>{const data=await read(file);f.source.path='Moved.md';return data;};
    const action=await f.prepare();assert.equal(action.execute,undefined);assert.equal(f.state().calls,0);
});
test('new silent dirty editor and watcher-lag disk change are rejected during final checks',async()=>{
    for(const mode of ['editor','disk']){
        const f=fixture(),other=makeFile('Other.md');f.files.push(other);f.notes.set(other,'plain');const action=await f.prepare();const read=f.app.vault.read;
        f.app.vault.read=async(file:TFile)=>{const data=await read(file);if(file===other){if(mode==='editor')f.leaves.push({view:{file:other,editor:{getValue:()=>'unsaved ![[new.png]]'}}});else {const stat=f.app.vault.adapter.stat;f.app.vault.adapter.stat=async(path:string)=>path===other.path?{type:'file',mtime:99,size:99}:stat(path);}}return data;};
        await assert.rejects(action.execute!());assert.equal(f.state().calls,0);assert.equal(f.state().text,'prefix ![[new.png]] suffix');
    }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { Notice, TFile, parseYaml } from 'obsidian';
import Plugin from '../src/main';
import { VaultImageRenamePlan } from '../src/vault-rename';
import { sdkClock } from './obsidian-mock';

const defaults = {imageNamePattern:'{{fileName}}',dupNumberAtStart:false,dupNumberDelimiter:'-',dupNumberAlways:false,dupNumberAcrossExtensions:false,dupNumberWidth:1,excludedFolders:'',excludeExtensionPattern:'',disableRenameNotice:true};
function deferred() { let resolve: () => void; const promise = new Promise<void>(done => {resolve=done;}); return {promise,resolve:()=>resolve!()}; }
function fixture(input: Record<string,string> = {'Alpha.md':'![[old.png]]','old.png':'image'}) {
    const plugin = Object.create(Plugin.prototype) as Plugin; plugin.settings={...defaults} as any; plugin.modals=[];
    const texts = new Map<TFile,string>(), files:TFile[]=[], folders=new Set<string>(), events=new Map<string,Set<Function>>();
    const cacheOverrides = new Map<TFile,any>(); const views:any[]=[]; const renamed:string[]=[];
    let readHook:((file:TFile)=>Promise<void>)|undefined, listHook:(()=>Promise<void>)|undefined, statHook:((path:string)=>Promise<void>)|undefined;
    function file(path:string, text:string) {
        const name=path.split('/').at(-1)!; const parent=path.includes('/')?path.slice(0,path.lastIndexOf('/')):'';
        if(parent) folders.add(parent);
        const f=Object.assign(new TFile(),{path,name,basename:name.slice(0,name.lastIndexOf('.')),extension:name.split('.').at(-1),parent:{path:parent,name:parent.split('/').at(-1)||''},stat:{mtime:1,ctime:1,size:Buffer.byteLength(text)}});
        files.push(f);texts.set(f,text);return f;
    }
    for(const [path,text] of Object.entries(input)) file(path,text);
    const get=(path:string)=>files.find(f=>f.path===path)!;
    const resolve=(link:string,source:string)=>{
        let p=link.split('#')[0];try{p=decodeURIComponent(p);}catch{return null;}
        const parent=source.includes('/')?source.slice(0,source.lastIndexOf('/')):'';
        const relative=require('node:path').posix.normalize((parent?parent+'/':'')+p);
        return files.find(f=>f.path===p) || files.find(f=>f.path===relative) || files.find(f=>f.name===p) || files.find(f=>f.basename===p) || null;
    };
    function cache(f:TFile) {
        if(cacheOverrides.has(f))return cacheOverrides.get(f);
        const text=texts.get(f)!;const result:any={links:[],embeds:[],headings:[]};
        const front=/^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
        if(front)result.frontmatter=parseYaml(front[1]);
        const re=/!?\[\[[^\]\n]+\]\]|!?\[(?:\\.|[^\]\\])*\]\((?:<[^>]*>|[^()\s]+)(?:\s+"[^"]*")?\)/g;
        let m:RegExpExecArray|null;
        while((m=re.exec(text))) {
            const original=m[0];const wiki=/^!?\[\[([^|\]]+)/.exec(original);const md=/\]\((<[^>]*>|[^\s)]+)/.exec(original);
            const link=wiki?wiki[1]:md![1].replace(/^<|>$/g,'');
            const prefix=text.slice(0,m.index), line=prefix.split('\n').length-1,col=prefix.split('\n').at(-1)!.length;
            result[original.startsWith('!')?'embeds':'links'].push({link,original,position:{start:{offset:m.index,line,col},end:{offset:m.index+original.length,line,col:col+original.length}}});
        }
        let offset=0;
        for(const [line,s] of text.split('\n').entries()) {const h=/^(#{1,6})\s+(.*)$/.exec(s);if(h)result.headings.push({heading:h[2],level:h[1].length,position:{start:{line,col:0,offset},end:{line,col:s.length,offset:offset+s.length}}});offset+=s.length+1;}
        return result;
    }
    const on=(name:string,cb:Function)=>{let set=events.get(name);if(!set)events.set(name,set=new Set());set.add(cb);return {name,cb};};
    const offref=(ref:any)=>events.get(ref.name)?.delete(ref.cb);
    const emit=(name:string,file:TFile)=>{for(const cb of events.get(name)||[])cb(file);};
    const app:any={
        vault:{config:{alwaysUpdateLinks:true},on,offref,getFiles:()=>[...files],getAbstractFileByPath:(path:string)=>get(path)||(folders.has(path)?{path}:null),
            read:async(f:TFile)=>{await readHook?.(f);return texts.get(f)!;},readBinary:async(f:TFile)=>{await readHook?.(f);return new Uint8Array(Buffer.from(texts.get(f)!)).buffer;},
            adapter:{list:async(path:string)=>{await listHook?.();return {files:files.filter(f=>(f.path.includes('/')?f.path.slice(0,f.path.lastIndexOf('/')):'')===path).map(f=>f.path),folders:[...folders].filter(p=>(p.includes('/')?p.slice(0,p.lastIndexOf('/')):'')===path)};},stat:async(path:string)=>{await statHook?.(path);const f=get(path);return f?{type:'file',...f.stat}:folders.has(path)?{type:'folder',mtime:1,size:0}:null;}}},
        metadataCache:{getFileCache:cache,getFirstLinkpathDest:resolve,on,offref},workspace:{getActiveViewOfType:()=>views[0]||null,getLeavesOfType:()=>views.map(view=>({view})),on,offref},
        fileManager:{renameFile:async(f:TFile,path:string)=>{
            assert.ok(!get(path)&&!folders.has(path),'never overwrite');const old=f.path,oldName=f.name;
            const before=files.filter(n=>n.extension==='md').map(n=>({n,refs:[...cache(n).links,...cache(n).embeds].filter((r:any)=>resolve(r.link,n.path)===f)}));
            Object.assign(f,{path,name:path.split('/').at(-1),basename:path.split('/').at(-1)!.split('.').slice(0,-1).join('.')});renamed.push(path);emit('rename',f);
            for(const {n,refs} of before){let text=texts.get(n)!;for(const r of [...refs].sort((a,b)=>b.position.start.offset-a.position.start.offset)){const replacement=r.original.replace(r.link,r.link===old?path:r.link===oldName?f.name:path);text=text.slice(0,r.position.start.offset)+replacement+text.slice(r.position.end.offset);}if(text!==texts.get(n)){texts.set(n,text);n.stat.mtime++;n.stat.size=Buffer.byteLength(text);emit('modify',n);}}
        }}
    };
    plugin.app=app;
    const edit=(path:string,text:string,signal=true)=>{const f=get(path);texts.set(f,text);f.stat.size=Buffer.byteLength(text);f.stat.mtime++;if(signal)emit('modify',f);};
    return {plugin,app,files,folders,texts,views,renamed,get,file,edit,emit,cache,cacheOverrides,plan:()=>VaultImageRenamePlan.create(plugin),setReadHook:(hook:typeof readHook)=>{readHook=hook;},setListHook:(hook:typeof listHook)=>{listHook=hook;},setStatHook:(hook:typeof statHook)=>{statHook=hook;},listeners:()=>[...events.values()].reduce((n,s)=>n+s.size,0)};
}

test('vault preview is read-only and shared source conflicts never select a winner',async()=>{
    const f=fixture({'Beta.md':'[[assets/shared.png]]','Alpha.md':'![[assets/shared.png]]','assets/shared.png':'image'});
    const plan=await f.plan();assert.deepEqual(f.renamed,[]);assert.equal(plan.rows.length,1);assert.match(plan.rows[0].reason!,/Conflicting/);assert.deepEqual(plan.rows[0].proposals.map(p=>p.name),['Alpha.png','Beta.png']);
    assert.deepEqual((await plan.apply()).renamed,[]);assert.equal(f.listeners(),0);
});
test('vault agreeing shared links and embeds produce one exact rename preserving image bytes and directory',async()=>{
    const f=fixture({'Alpha.md':'---\nimageNameKey: Shared\n---\n![[assets/old.png|200]]\n[[assets/old.png|alias]]','Beta.md':'---\nimageNameKey: Shared\n---\n[label](assets/old.png)','assets/old.png':'image'});
    f.plugin.settings.imageNamePattern='{{imageNameKey}}';const plan=await f.plan();assert.equal(plan.rows[0].targetPath,'assets/Shared.png');assert.equal(plan.rows[0].reason,undefined);
    const result=await plan.apply();assert.equal(result.stopped,undefined);assert.deepEqual(f.renamed,['assets/Shared.png']);assert.equal(f.texts.get(f.get('assets/Shared.png')),'image');assert.match(f.texts.get(f.get('Alpha.md'))!,/\|200/);assert.match(f.texts.get(f.get('Beta.md'))!,/\[label\]\(assets\/Shared.png\)/);
});
test('vault links-only scope, duplicate refs and no-ref images are explicit',async()=>{
    const f=fixture({'Alpha.md':'[[old.png]]\n[[old.png]]','old.png':'image','orphan.png':'image'});const plan=await f.plan();
    assert.equal(plan.rows[0].proposals.length,1);assert.match(plan.rows[1].reason!,/No verified/);await plan.apply();assert.deepEqual(f.renamed,['Alpha.png']);
});
test('vault dates and UUID/HEX are one snapshot per plan/target and never rerendered on Apply',async()=>{
    const f=fixture({'Alpha.md':'![[one.png]]\n![[two.png]]','Beta.md':'[[one.png]]\n[[two.png]]','one.png':'one','two.png':'two'});f.plugin.settings.imageNamePattern='{{DATE:YYYY}}-{{UUID}}-{{HEX}}';
    const old=sdkClock.now;let clock=0;sdkClock.now=()=>{clock++;return {format:()=>clock===1?'2026':'2027'};};
    try{const plan=await f.plan();assert.equal(clock,1);assert.ok(plan.rows.every(r=>!r.reason));assert.ok(plan.rows.every(r=>new Set(r.proposals.map(p=>p.name)).size===1));assert.notEqual(plan.rows[0].targetPath,plan.rows[1].targetPath);
    for(const row of plan.rows){const match=/^2026-([a-f0-9-]{36})-([a-f0-9]{32})\.png$/.exec(row.targetPath!)!;assert.equal(match[1].replace(/-/g,''),match[2]);}
    const exact=plan.rows.map(r=>r.targetPath);f.plugin.generateNewName=()=>{throw Error('must not rerender');};const result=await plan.apply();assert.equal(result.stopped,undefined);assert.deepEqual(f.renamed,exact);assert.equal(clock,1);}finally{sdkClock.now=old;}
});
test('vault preview reserves files, folders, old paths and earlier planned destinations deterministically',async()=>{
    const f=fixture({'B.md':'![[b.png]]','A.md':'![[a.png]]','a.png':'a','b.png':'b','Shared.png':'existing'});f.folders.add('Shared-1.png');f.plugin.settings.imageNamePattern='Shared';
    const plan=await f.plan();assert.equal(plan.rows.find(r=>r.originalPath==='a.png')!.targetPath,'Shared-2.png');assert.equal(plan.rows.find(r=>r.originalPath==='b.png')!.targetPath,'Shared-3.png');assert.equal((await plan.apply()).stopped,undefined);assert.deepEqual(f.renamed,['Shared-2.png','Shared-3.png']);
});
test('vault keeps original-name inputs and conforming numbered names stable',async()=>{
    const f=fixture({'A.md':'![[Shared.png]]\n![[Shared-1.png]]','Shared.png':'one','Shared-1.png':'two'});f.plugin.settings.imageNamePattern='Shared';const p=await f.plan();assert.ok(p.rows.every(r=>r.reason?.includes('Already')));await p.apply();assert.deepEqual(f.renamed,[]);
    f.plugin.settings.imageNamePattern='{{attachmentName}}';const p2=await f.plan();assert.ok(p2.rows.every(r=>r.reason?.includes('Already')));p2.close();
});
test('vault honors cross-extension numbering and case-insensitive physical collisions',async()=>{
    const f=fixture({'A.md':'![[a.png]]','a.png':'a','shared.JPG':'existing'});f.plugin.settings.imageNamePattern='Shared';f.plugin.settings.dupNumberAcrossExtensions=true;const p=await f.plan();assert.equal(p.rows.find(r=>r.originalPath==='a.png')!.targetPath,'Shared-1.png');p.close();
    const g=fixture({'A.md':'![[old.png]]','old.png':'a','ALPHA.PNG':'existing'});g.plugin.settings.imageNamePattern='Alpha';const q=await g.plan();assert.equal(q.rows.find(r=>r.originalPath==='old.png')!.targetPath,'Alpha-1.png');q.close();
});
test('vault skips case-only and normalization-only renames',async()=>{
    for(const [original,desired] of [['alpha.png','Alpha'],['e\u0301.png','é']]){const f=fixture({'A.md':`![[${original}]]`,[original]:'image'});f.plugin.settings.imageNamePattern=desired;const p=await f.plan();assert.match(p.rows[0].reason!,/Case-only/);p.close();}
});
test('vault excluded source or target and extension exclusion skip, rather than discard source votes',async()=>{
    for(const kind of ['source','target','extension']){const f=fixture({'A.md':'![[old.png]]','excluded/B.md':'[[old.png]]','old.png':'image'});f.plugin.settings.imageNamePattern='Shared';if(kind==='source')f.plugin.settings.excludedFolders='excluded';if(kind==='target')f.plugin.settings.excludedFolders='old.png';if(kind==='extension')f.plugin.settings.excludeExtensionPattern='png';const p=await f.plan();assert.ok(p.rows[0].reason);await p.apply();assert.deepEqual(f.renamed,[]);}
});
test('vault invalid exclusion and unsafe template paths fail closed',async()=>{
    const f=fixture();f.plugin.settings.excludeExtensionPattern='[';await assert.rejects(f.plan());assert.equal(f.listeners(),0);
    for(const pattern of ['../{{fileName}}','folder/{{fileName}}','C:{{fileName}}','']){f.plugin.settings.excludeExtensionPattern='';f.plugin.settings.imageNamePattern=pattern;const p=await f.plan();assert.ok(p.rows[0].reason);await p.apply();}assert.deepEqual(f.renamed,[]);
});
test('vault drawing, Canvas text/background, SVG and unknown containers conservatively block all rows',async()=>{
    for(const [path,text] of [['board.canvas','{"nodes":[{"type":"group","background":"old.png"}]}'],['Drawing.excalidraw','{}'],['Drawing.excalidraw.md',''],['drawing.md','---\nexcalidraw-plugin: parsed\n---\n'],['icon.svg','<svg/>'],['data.pdf','opaque']]){const f=fixture({'A.md':'![[old.png]]','old.png':'image',[path]:text});const p=await f.plan();assert.ok(p.rows.every(r=>r.reason));await p.apply();assert.deepEqual(f.renamed,[]);}
});
test('vault frontmatter references and unindexed extensionless/wiki/Markdown refs protect targets',async()=>{
    for(const text of ['[[old]]','[label](old.png)','---\nasset: old.png\n---\n']){const f=fixture({'A.md':'![[old.png]]','Other.md':text,'old.png':'image'});if(!text.startsWith('---'))f.cacheOverrides.set(f.get('Other.md'),{links:[],embeds:[],headings:[]});const p=await f.plan();assert.match(p.rows[0].reason!,/reference|Frontmatter/);await p.apply();assert.deepEqual(f.renamed,[]);}
});
test('vault missing/stale cache positions, line numbers, headings and frontmatter fail safely before mutation',async()=>{
    for(const kind of ['missing','offset','line','heading','frontmatter']){const f=fixture({'A.md':'# Actual\n![[old.png]]','old.png':'image'});const c=f.cache(f.get('A.md'));if(kind==='missing')f.cacheOverrides.set(f.get('A.md'),null);else{if(kind==='offset')c.embeds[0].position.start.offset++;if(kind==='line')c.embeds[0].position.start.line++;if(kind==='heading')c.headings[0].heading='Stale';if(kind==='frontmatter')c.frontmatter={imageNameKey:'Stale'};f.cacheOverrides.set(f.get('A.md'),c);}
    if(kind==='frontmatter'){const p=await f.plan();assert.ok(p.rows[0].reason);p.close();}else await assert.rejects(f.plan(),/metadata|Preview is stale/);assert.deepEqual(f.renamed,[]);}
});
test('vault stale YAML context is skipped even when link ranges still match',async()=>{
    const f=fixture({'A.md':'---\nimageNameKey: Real\n---\n![[old.png]]','old.png':'image'});f.plugin.settings.imageNamePattern='{{imageNameKey}}';const c=f.cache(f.get('A.md'));c.frontmatter.imageNameKey='Stale';f.cacheOverrides.set(f.get('A.md'),c);const p=await f.plan();assert.match(p.rows[0].reason!,/frontmatter/);await p.apply();assert.deepEqual(f.renamed,[]);
});
test('vault disabled, missing or unreadable automatic-link settings and old capability gaps block',async()=>{
    for(const value of [false,undefined]){const f=fixture();f.app.vault.config.alwaysUpdateLinks=value;await assert.rejects(f.plan(),/Automatically update/);assert.equal(f.listeners(),0);}
    const f=fixture();delete f.app.vault.config;await assert.rejects(f.plan(),/Automatically update/);
    const g=fixture();delete g.app.metadataCache.getFirstLinkpathDest;await assert.rejects(g.plan(),/newer Obsidian/);
});
test('vault unsaved or uninspectable background Markdown editors fail closed',async()=>{
    for(const editor of [{getValue:()=> 'unsaved'},{}]){const f=fixture();f.views.push({file:f.get('Alpha.md'),editor});await assert.rejects(f.plan(),/editor|view/);assert.deepEqual(f.renamed,[]);}
});
test('vault stale sources, reference graphs, targets, destination, settings and container changes cause zero renames',async()=>{
    for(const kind of ['source','new-note','new-reference','target-bytes','target-move','target-replace','occupied','folder','settings','config','metadata']){
        const f=fixture();const p=await f.plan();
        if(kind==='source')f.edit('Alpha.md','changed');if(kind==='new-note')f.file('Added.md','');if(kind==='new-reference')f.edit('Alpha.md','![[old.png]]\n[[missing.png]]');if(kind==='target-bytes')f.edit('old.png','changed');if(kind==='target-move')f.get('old.png').path='moved.png';if(kind==='target-replace'){const old=f.get('old.png');f.files.splice(f.files.indexOf(old),1);f.file('old.png','image');}if(kind==='occupied')f.file('Alpha.png','occupied');if(kind==='folder')f.folders.add('Alpha.png');if(kind==='settings')f.plugin.settings.imageNamePattern='Other';if(kind==='config')f.app.vault.config.alwaysUpdateLinks=false;if(kind==='metadata'){const c=f.cache(f.get('Alpha.md'));c.embeds[0].link='different';f.cacheOverrides.set(f.get('Alpha.md'),c);}
        const r=await p.apply();assert.ok(r.stopped,kind);assert.deepEqual(f.renamed,[],kind);
    }
});
test('vault detects same-size same-stat target byte replacements and watcher-lag note writes',async()=>{
    for(const kind of ['binary','note']){const f=fixture();const p=await f.plan();if(kind==='binary')f.texts.set(f.get('old.png'),'other');else f.texts.set(f.get('Alpha.md'),'![[old.png]]\nchanged');const r=await p.apply();assert.ok(r.stopped);assert.deepEqual(f.renamed,[]);}
});
test('vault in-place mutable metadata is not allowed to mutate the immutable preview baseline',async()=>{
    const f=fixture();const c=f.cache(f.get('Alpha.md'));f.cacheOverrides.set(f.get('Alpha.md'),c);const p=await f.plan();c.frontmatter={imageNameKey:'changed'};const r=await p.apply();assert.ok(r.stopped);assert.deepEqual(f.renamed,[]);
});
test('vault rejects unindexed physical files and bounded scan limits without partial mutation',async()=>{
    const f=fixture();f.app.vault.adapter.list=async()=>({files:['Alpha.md','old.png','unknown.md'],folders:[]});await assert.rejects(f.plan(),/physical files/);
    const g=fixture();g.get('old.png').stat.size=20_000_001;await assert.rejects(g.plan(),/20 MB/);
    const h=fixture();for(let i=0;i<2000;i++)h.file(`extra${i}.png`,'');await assert.rejects(h.plan(),/2000 files/);
    const j=fixture({'A.md':'x'.repeat(2_000_001),'old.png':'image'});await assert.rejects(j.plan(),/2 million/);
});
test('vault checks changes during awaited reads/list/stat and before queued Apply',async()=>{
    for(const kind of ['read','list','stat','queue']){const f=fixture();const p=await f.plan();let fired=false;const change=async()=>{if(!fired){fired=true;f.plugin.settings.imageNamePattern='changed';}};if(kind==='read')f.setReadHook(change);if(kind==='list')f.setListHook(change);if(kind==='stat')f.setStatHook(change);if(kind==='queue'){const wait=deferred();(f.plugin as any).renameQueue=wait.promise;await f.plugin.openVaultImageRename();const modal=f.plugin.modals[0] as any;const click=modal.contentEl.find('button','Apply image renames').emit('click');f.plugin.settings.imageNamePattern='changed';wait.resolve();await click;p.close();}else{const r=await p.apply();assert.ok(r.stopped);}assert.deepEqual(f.renamed,[],kind);}
});
test('vault accepts only destination rewrites and stops after concurrent content, alias, reference or target changes',async()=>{
    for(const kind of ['content','alias','new-reference','later-target','in-flight-destination','source-rename']){const f=fixture({'A.md':'![[one.png|200]]\n![[two.png]]','one.png':'one','two.png':'two'});f.plugin.settings.imageNamePattern='Shared';const p=await f.plan();const rename=f.app.fileManager.renameFile;f.app.fileManager.renameFile=async(...args:any[])=>{await rename(...args);if(kind==='content')f.edit('A.md',f.texts.get(f.get('A.md'))+'\nuser edit');if(kind==='alias')f.edit('A.md',f.texts.get(f.get('A.md'))!.replace('|200','|300'));if(kind==='new-reference')f.file('Other.md','[[two.png]]');if(kind==='later-target')f.edit('two.png','changed');if(kind==='in-flight-destination')f.file('Shared-1.png','occupied');if(kind==='source-rename')f.get('A.md').path='B.md';};const r=await p.apply();assert.ok(r.stopped,kind);assert.deepEqual(f.renamed,['Shared.png'],kind);assert.equal(r.renamed.length,1);}
});
test('vault partial failures and uncertain host completions never retry or roll back',async()=>{
    for(const kind of ['throw','unchanged']){const f=fixture({'A.md':'![[one.png]]\n![[two.png]]','one.png':'one','two.png':'two'});f.plugin.settings.imageNamePattern='Shared';const p=await f.plan();let calls=0;const rename=f.app.fileManager.renameFile;f.app.fileManager.renameFile=async(...args:any[])=>{calls++;if(calls===2){if(kind==='throw')throw Error('disk failure');return;}await rename(...args);};const r=await p.apply();assert.equal(r.renamed.length,1);assert.ok(r.attempted);assert.ok(r.stopped);await p.apply();assert.equal(calls,2);assert.deepEqual(f.renamed,['Shared.png']);}
});
test('vault cancellation before Apply, while queued and during host rename stops remaining operations',async()=>{
    const f=fixture();const p=await f.plan();p.close();assert.equal((await p.apply()).cancelled,true);assert.deepEqual(f.renamed,[]);
    const g=fixture({'A.md':'![[one.png]]\n![[two.png]]','one.png':'one','two.png':'two'});g.plugin.settings.imageNamePattern='Shared';const q=await g.plan();const rename=g.app.fileManager.renameFile;g.app.fileManager.renameFile=async(...args:any[])=>{await rename(...args);q.close();};const r=await q.apply();assert.equal(r.cancelled,true);assert.deepEqual(g.renamed,['Shared.png']);
    const h=fixture();const gate=deferred();(h.plugin as any).renameQueue=gate.promise;await h.plugin.openVaultImageRename();const m=h.plugin.modals[0] as any;const click=m.contentEl.find('button','Apply image renames').emit('click');m.close();gate.resolve();await click;assert.deepEqual(h.renamed,[]);
});
test('vault modal explicit Apply is single-use, reports exact paths, and Close prevents detached clicks',async()=>{
    const f=fixture();await f.plugin.openVaultImageRename();const modal=f.plugin.modals[0] as any;assert.deepEqual(f.renamed,[]);assert.ok(modal.contentEl.find('p','old.png → Alpha.png'));const button=modal.contentEl.find('button','Apply image renames');const first=button.emit('click'),second=button.emit('click');await Promise.all([first,second]);assert.deepEqual(f.renamed,['Alpha.png']);assert.equal(button.disabled,true);modal.close();await button.emit('click');assert.deepEqual(f.renamed,['Alpha.png']);assert.equal(f.listeners(),0);
    const g=fixture();await g.plugin.openVaultImageRename();const m=g.plugin.modals[0] as any,b=m.contentEl.find('button','Apply image renames');m.close();await b.emit('click');assert.deepEqual(g.renamed,[]);
});
test('vault unresolved destination references block the corresponding allocation',async()=>{
    const f=fixture({'Alpha.md':'![[old.png]]\n[[Alpha.png]]','old.png':'image'});const p=await f.plan();assert.match(p.rows[0].reason!,/unresolved/);await p.apply();assert.deepEqual(f.renamed,[]);
});

test('vault destination cannot shadow another file through resolved shorthand, encoded or casefolded references',async()=>{
    for(const link of ['Shared.png','Shared','Shared%2Epng','shared.PNG','B/Shared.png']){
        const f=fixture({'A/Source.md':'![[A/old.png]]','A/Other.md':`[[${link}]]`,'A/old.png':'image','B/Shared.png':'other'});f.plugin.settings.imageNamePattern='Shared';const p=await f.plan();const row=p.rows.find(r=>r.originalPath==='A/old.png')!;assert.match(row.reason!,/shadow/,link);await p.apply();assert.deepEqual(f.renamed,[],link);
    }
});
test('vault preview rejects total size and folder caps before any mutation',async()=>{
    const f=fixture();for(let i=0;i<11;i++)f.file(`large${i}.png`,'').stat.size=20_000_000;await assert.rejects(f.plan(),/200 MB/);assert.deepEqual(f.renamed,[]);
    const g=fixture();for(let i=0;i<2001;i++)g.folders.add(`folder${i}`);await assert.rejects(g.plan(),/folder limit/);assert.deepEqual(g.renamed,[]);
});
test('vault sees watcher-lag disk additions or modifications occurring during other file reads',async()=>{
    for(const kind of ['added','modified']){const f=fixture();const p=await f.plan();let triggered=false;const originalList=f.app.vault.adapter.list, originalStat=f.app.vault.adapter.stat;f.setReadHook(async file=>{if(file.extension==='png')triggered=true;});if(kind==='added')f.app.vault.adapter.list=async(path:string)=>{const r=await originalList(path);if(triggered&&path==='')r.files.push('unindexed.png');return r;};else f.app.vault.adapter.stat=async(path:string)=>{const r=await originalStat(path);return triggered&&path==='Alpha.md'?{...r,mtime:r.mtime+1}:r;};const r=await p.apply();assert.ok(r.stopped,kind);assert.deepEqual(f.renamed,[]);}
});
test('vault modest multi-image fixture exposes full revalidation read volume',async()=>{
    const input:Record<string,string>={'A.md':''};for(let i=0;i<12;i++){const name=`image-${String(i).padStart(2,'0')}.png`;input[name]='x'.repeat(1024);input['A.md']+=`![[${name}]]\n`;}
    const f=fixture(input);f.plugin.settings.imageNamePattern='Shared';let reads=0;f.setReadHook(async file=>{if(file.extension==='png')reads++;});const start=performance.now();const p=await f.plan();const r=await p.apply();const elapsed=Math.round(performance.now()-start);assert.equal(r.stopped,undefined);assert.equal(reads,12*(12+2));assert.equal(f.renamed.length,12);console.log(`Whole-vault mock measurement: 12 x 1 KiB images, ${reads} binary reads (${reads} KiB), ${elapsed} ms. This is not native disk performance.`);
});

test('vault shadow guard includes parsed unindexed references and frontmatter paths',async()=>{
    for(const [text,cache] of [['[label][ref]\n\n[ref]: Shared.png',{links:[],embeds:[],headings:[]}],['---\nasset: Shared.png\n---\n',null]] as const){const f=fixture({'A/Source.md':'![[A/old.png]]','A/Other.md':text,'A/old.png':'image','B/Shared.png':'other'});f.plugin.settings.imageNamePattern='Shared';if(cache)f.cacheOverrides.set(f.get('A/Other.md'),cache);const p=await f.plan();assert.match(p.rows.find(r=>r.originalPath==='A/old.png')!.reason!,/shadow/);await p.apply();assert.deepEqual(f.renamed,[]);}
});
test('vault encoded unresolved destination cannot bind after allocation',async()=>{
    const f=fixture({'A.md':'![[old.png]]\n[future](Alpha%20Beta.png)','old.png':'image'});f.plugin.settings.imageNamePattern='Alpha Beta';const p=await f.plan();assert.match(p.rows[0].reason!,/unresolved/);await p.apply();assert.deepEqual(f.renamed,[]);
});

test('vault rechecks shadowing introduced by an earlier core rewrite before the next mutation',async()=>{
    const f=fixture({'B/Note.md':'![[old1.png]]','B/Else.md':'![[old2.png]]','A/old1.png':'one','B/old2.png':'two'});f.plugin.settings.imageNamePattern='Shared';const p=await f.plan();assert.ok(p.rows.every(r=>!r.reason));const r=await p.apply();assert.deepEqual(f.renamed,['A/Shared.png']);assert.match(r.stopped!,/shadow/);assert.equal(f.app.metadataCache.getFirstLinkpathDest('Shared.png','B/Note.md'),f.get('A/Shared.png'));assert.ok(f.get('B/old2.png'));
});
test('vault synchronous final guard detects resolver-table changes after awaited verification',async()=>{
    const f=fixture({'Alpha.md':'![[old.png]]','old.png':'image','other.png':'other'});const p=await f.plan();const verify=(p as any).verify.bind(p);(p as any).verify=async()=>{const guard=await verify();f.app.metadataCache.getFirstLinkpathDest=()=>f.get('other.png');return guard;};const r=await p.apply();assert.match(r.stopped!,/resolution/);assert.deepEqual(f.renamed,[]);
});

test('vault closed partial-result Notice retains exact completed paths and uncertain destinations',async()=>{
    for(const uncertain of [false,true]){const f=fixture({'A.md':'![[one.png]]\n![[two.png]]','one.png':'one','two.png':'two'});f.plugin.settings.imageNamePattern='Shared';await f.plugin.openVaultImageRename();const modal=f.plugin.modals[0] as any;const rename=f.app.fileManager.renameFile;let calls=0;f.app.fileManager.renameFile=async(...args:any[])=>{calls++;if(uncertain&&calls===2){modal.close();throw Error('unknown result');}await rename(...args);if(!uncertain)modal.close();};await modal.contentEl.find('button','Apply image renames').emit('click');const notice=(Notice as any).messages.at(-1);assert.equal(notice.timeout,0);assert.match(notice.text,/Completed paths:\nShared.png/);if(uncertain)assert.match(notice.text,/two.png → Shared-1.png is uncertain/);assert.equal(f.listeners(),0);}
});

test('vault HTML attributes, CSS references and opaque code/plugin blocks globally fail closed',async()=>{
    for(const text of ['<video poster="old.png"></video>','<img srcset="old.png 1x">','<div style="background-image: url(old.png)"></div>','<br>','```dataviewjs\ndv.paragraph("![[old.png]]");\n```','```unknown-plugin\ndynamic content\n```','    opaque plugin code','`= image("old.png")`']){const f=fixture({'Alpha.md':'![[old.png]]','Other.md':text,'old.png':'image'});const p=await f.plan();assert.ok(p.rows[0].reason,text);await p.apply();assert.deepEqual(f.renamed,[],text);}
});
test('vault local file and Obsidian URI link containers cannot evade reference protection',async()=>{
    for(const uri of ['file:///vault/old.png','obsidian://open?vault=Test&file=old.png']){const f=fixture({'Alpha.md':'![[old.png]]','Other.md':`[image](${uri})`,'old.png':'image'});const p=await f.plan();assert.ok(p.rows[0].reason);await p.apply();assert.deepEqual(f.renamed,[]);}
});

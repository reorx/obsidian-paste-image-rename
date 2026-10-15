import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import Plugin from 'pir-current';
import Legacy from 'pir-legacy';
import { TFile } from 'obsidian';

async function main() {
const root = process.env.PIR_TEST_ROOT!;
const fixtureInfo=JSON.parse(fs.readFileSync(root+'/fixtures.json','utf8'));
const realDate = Date;
const now = 1_800_000_000_000;
(globalThis as any).Date = class extends realDate { constructor(...args:any[]) { super(...(args.length ? args : [now]) as [any]); } static now() {return now;} };
const log = console.log; console.log = () => {};
const currentRef=process.env.PIR_CURRENT_REF!;
const legacyRef=process.env.PIR_LEGACY_REF!;
const report:any = {head:currentRef, legacy:legacyRef, rows:[], scenarios:[], disk:[]};
function file(name:string, age=0, size=8192) {
  const path = name;
  return Object.assign(new TFile(), {name:path.split('/').at(-1), basename:path.split('/').at(-1)!.split('.').slice(0,-1).join('.'), path, parent:{path:path.includes('/')?path.split('/').slice(0,-1).join('/'):'',name:'assets'}, extension:path.split('.').at(-1), stat:{ctime:age===Infinity?0:now-age,mtime:now,size}});
}
async function fixture(legacy=false, opts:any={}) {
  let clock=0, next=0, ready:(()=>void)|undefined, cache:any={embeds:[]}, links:string[]=[];
  const timers = new Map<number,{at:number,fn:()=>void}>();
  (globalThis as any).window = {moment:()=>({format:()=> '2026'}),setTimeout:(fn:()=>void, delay:number)=>{timers.set(++next,{at:clock+delay,fn}); return next;},clearTimeout:(n:number)=>timers.delete(n)};
  const p:any = new (legacy?Legacy:Plugin)(null as any,null as any), source=file('Note.md');
  const a=file(opts.name || 'Pasted image 202610150001.png',opts.age||0,opts.size||8192), files=[source,a], calls:any[]=[], renamed:string[]=[], vaultEvents:any={}, metadataEvents:any={};
  let active:any=source;
  p.settings={imageNamePattern:'{{fileName}}',dupNumberAtStart:false,dupNumberDelimiter:'-',dupNumberAlways:false,dupNumberWidth:1,dupNumberAcrossExtensions:false,nameInputPosition:'end',autoRename:opts.auto??false,handleAllAttachments:opts.all??false,excludeExtensionPattern:'',excludedFolders:'',disableRenameNotice:true};
  p.app={workspace:{getActiveViewOfType:()=>({file:active,editor:null}),onLayoutReady:(fn:()=>void)=>{ready=fn;}}, metadataCache:{getFileCache:()=>cache,getFirstLinkpathDest:(path:string)=> files.find(f=>f.path===path)||null,on:(event:string,fn:any)=>{metadataEvents[event]=fn;}}, vault:{on:(event:string,fn:any)=>{vaultEvents[event]=fn;},getAbstractFileByPath:(path:string)=>files.find(f=>f.path===path),getResourcePath:(f:TFile)=>{calls.push(['resource',f.path]);return 'file://'+root+'/'+f.path;},adapter:{list:async()=>({files:files.map(f=>f.path),folders:[]})},readBinary:()=>{throw Error('unexpected binary read');},modifyBinary:()=>{throw Error('unexpected binary write');}},fileManager:{generateMarkdownLink:(f:TFile)=>`[[${f.name}]]`,renameFile:async(f:TFile,path:string)=>{renamed.push(path);if(opts.disk) fs.renameSync(root+'/'+f.path,root+'/'+path); links=links.map(l=>l===f.path?path:l); Object.assign(f,{path,name:path.split('/').at(-1),basename:path.split('/').at(-1)!.split('.').slice(0,-1).join('.')}); cache={embeds:links.map(link=>({link}))};}}};
  Object.assign(p,{loadData:async()=>p.settings,registerEvent:()=>{},addCommand:()=>{},addSettingTab:()=>{}});
  if(!opts.actual) p.startRenameProcess=async(...args:any[])=>{calls.push(args);};
  await p.onload();
  const link=(paths=[a.path])=>{links=paths;cache={embeds:links.map(link=>({link}))};};
  const change=()=>metadataEvents.changed?.(source,'note',cache);
  const advance=(ms:number)=>{clock+=ms;for(const [id,t] of [...timers])if(t.at<=clock){timers.delete(id);t.fn();}};
  return {p,a,source,calls,renamed,files,timers,ready:()=>ready?.(),create:()=>vaultEvents.create?.(a),change,link,advance,setCache:(v:any)=>cache=v,switchSource:()=>active=file('Other.md'),delete:()=>vaultEvents.delete?.(a),idle:async()=>{await Promise.resolve();await p.renameQueue;await Promise.resolve();}};
}

// 192 old/current x mode x filename x timestamp cells. Real onload + event handlers.
for(const legacy of [true,false])for(const auto of [false,true])for(const all of [false,true])for(const name of ['Pasted image 202610150001.png','Pasted image 202610150001.WEBP','Screenshot 2026-10-15 at 07.45.00.png','IMG_1234.HEIC'])for(const age of [0,1000,1001,90_000,Infinity, -1000]) {
  const f=await fixture(legacy,{name,age,auto,all}); f.ready(); f.create(); f.link(); f.change(); await f.idle();
  const expected=(!legacy || age<=1000) && (all||name.startsWith('Pasted image '));
  assert.equal(f.calls.length,Number(expected),JSON.stringify({legacy,auto,all,name,age}));
  report.rows.push({version:legacy?legacyRef:currentRef,auto,all,name,ctimeAge:age===Infinity?'zero':age,triggered:f.calls.length});f.p.onunload();
}
const scenarios:any[]=[
  {name:'creation before layout ready',run:(f:any)=>{f.create();f.link();f.ready();f.change();},expected:0,classification:'intentional startup exclusion'},
  {name:'normal create then metadata 29999ms later',run:(f:any)=>{f.ready();f.create();f.advance(29999);f.link();f.change();},expected:1,classification:'supported delayed import'},
  {name:'metadata exactly at 30000ms after timeout',run:(f:any)=>{f.ready();f.create();f.advance(30000);f.link();f.change();},expected:0,classification:'intentional expiry'},
  {name:'metadata 45000ms after creation',run:(f:any)=>{f.ready();f.create();f.advance(45000);f.link();f.change();},expected:0,classification:'intentional expiry'},
  {name:'cache absent at create then arrives',run:(f:any)=>{f.ready();f.setCache(null);f.create();f.link();f.change();},expected:0,classification:'conservative source safety guard drops insertion'},
  {name:'cache absent once while pending then recovers',run:(f:any)=>{f.ready();f.create();f.setCache(null);f.change();f.link();f.change();},expected:0,classification:'conservative source safety guard cancels insertion'},
  {name:'link available before create event',run:(f:any)=>{f.ready();f.link();f.change();f.create();f.change();},expected:0,classification:'intentional already-referenced restoration guard'},
  {name:'200 repeated create/change events',run:(f:any)=>{f.ready();for(let i=0;i<100;i++)f.create();f.link();for(let i=0;i<100;i++)f.change();},expected:1,classification:'deduplicated identity'},
  {name:'source switches before cache arrives at 29000ms',run:(f:any)=>{f.ready();f.create();f.switchSource();f.advance(29000);f.link();f.change();},expected:1,classification:'captured source retained'},
  {name:'delete event cancels pending identity',run:(f:any)=>{f.ready();f.create();f.delete();f.link();f.change();},expected:0,classification:'deleted identity excluded'},
];
for(const s of scenarios){const f=await fixture();s.run(f);await f.idle();assert.equal(f.calls.length,s.expected,s.name);report.scenarios.push({name:s.name,triggered:f.calls.length,classification:s.classification});f.p.onunload();}

// Current actual startRenameProcess/performRename path, not a start-method spy.
for(const name of ['Pasted image file.webp','Pasted image file.WEBP','Screenshot 2026-10-15 at 07.45.00.png','IMG_1234.HEIC','nonimage.zip'])for(const all of [false,true])for(const auto of [false,true]) {
  const f=await fixture(false,{actual:true,name,all,auto,age:Infinity,size:134_217_728}); f.ready();f.create();f.link();f.change();await f.idle();
  const eligible=all||name.startsWith('Pasted image ');const expectedRenames=eligible&&auto?1:0,expectedModals=eligible&&!auto?1:0;
  assert.equal(f.renamed.length,expectedRenames);assert.equal(f.p.modals.length,expectedModals);
  report.scenarios.push({name:'actual entry '+name,all,auto,size:134217728,renames:f.renamed.length,modals:f.p.modals.length,bytesRead:0});f.p.onunload();
}

// Real 128MiB+ valid rectangular PNG and tiny WEBP disk fixtures; the adapter delegates
// only filesystem rename, rather than pretending to run the native Obsidian host.
for(const fixtureName of ['Pasted image huge.png','Pasted image wide.webp']){
  const p=root+'/'+fixtureName,size=fs.statSync(p).size,before=createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  const f=await fixture(false,{actual:true,name:fixtureName,all:false,auto:true,age:Infinity,size,disk:true});f.ready();f.create();f.link();f.change();await f.idle();
  assert.equal(f.renamed.length,1);const after=createHash('sha256').update(fs.readFileSync(root+'/'+f.a.path)).digest('hex');assert.equal(before,after);
  report.disk.push({input:fixtureName,output:f.a.path,...fixtureInfo[fixtureName],size,before,after,binaryReads:0,binaryWrites:0,nativeDecodingTested:false});f.p.onunload();
}

// Is uppercase Markdown a file candidate when the host exposes that extension?
for(const name of ['linked.md','linked.MD','linked.Md']) { const f=await fixture(false,{actual:true,all:true,auto:true,name});f.ready();f.create();f.link();f.change();await f.idle();report.scenarios.push({name:'markdown case probe '+name,renames:f.renamed});f.p.onunload();}

console.log=log;
fs.writeFileSync(root+'/results.json',JSON.stringify(report,null,2));
log(JSON.stringify({matrixCells:report.rows.length,scenarioChecks:report.scenarios.length,disk:report.disk,uppercase:report.scenarios.filter((x:any)=>x.name.startsWith('markdown'))},null,2));

}
main().catch(error=>{console.error(error);process.exitCode=1;});

import test from 'node:test';
import assert from 'node:assert/strict';
import {discardInsertedAttachment, DiscardFailure, DiscardIO, proveSingleInsertion, equalBytes} from '../src/discard-core';
const original='![[new.png]]', before='before  after', text='before '+original+' after';
const snapshot={text,from:7,to:7+original.length,original};
function fixture() {
    let editor=text,disk=text,present=true; let trashes=0,saves=0,edits=0,checks=0;
    const io:DiscardIO={preflight:async()=>{checks++;return ()=>{};},assertSource:(expected)=>{assert.equal(editor,expected);},replace:(from,to,replacement)=>{edits++;editor=editor.slice(0,from)+replacement+editor.slice(to);},save:async()=>{saves++;disk=editor;},readSource:async()=>({text:disk,assertCurrent:()=>{}}),trash:async()=>{trashes++;present=false;},confirmTrashed:async()=>{assert.equal(present,false);},proveRetainedFile:async()=>present?()=>{assert.equal(present,true);}:undefined};
    return {io,state:()=>({editor,disk,present,trashes,saves,edits,checks}),edit:(value:string)=>{editor=value;},write:(value:string)=>{disk=value;},gone:()=>{present=false;}};
}
test('discard insertion proof requires one exact new reference and whitespace-only host insertion',()=>{
    assert.deepEqual(proveSingleInsertion(before,text,7,[snapshot]),{from:7,to:19,original});
    assert.equal(proveSingleInsertion(before,text,7,[snapshot,snapshot]),undefined);
    assert.equal(proveSingleInsertion(before,'other '+original+' after',7,[snapshot]),undefined);
    assert.equal(proveSingleInsertion(before,text+'extra',7,[snapshot]),undefined);
    assert.equal(proveSingleInsertion(before,before,7,[]),undefined);
    assert.equal(proveSingleInsertion(before,text,NaN,[snapshot]),undefined);
    const bytes=new Uint8Array([1,2]).buffer;assert.equal(equalBytes(bytes,new Uint8Array([1,2]).buffer),true);assert.equal(equalBytes(bytes,new Uint8Array([1,3]).buffer),false);
});
test('discard saves exact span removal before one trash call',async()=>{
    const f=fixture();await discardInsertedAttachment(snapshot,f.io);
    assert.deepEqual(f.state(),{editor:before,disk:before,present:false,trashes:1,saves:1,edits:1,checks:2});
});
test('discard preflight and final synchronous epoch failures leave file intact',async()=>{
    for(const late of [false,true]){const f=fixture();let checks=0;f.io.preflight=async()=>{checks++;if(!late)throw Error('shared');return ()=>{if(checks===2)throw Error('changed');};};await assert.rejects(discardInsertedAttachment(snapshot,f.io),DiscardFailure);assert.equal(f.state().present,true);assert.equal(f.state().trashes,0);assert.equal(f.state().editor,text);}
});
test('save and trash failures compensate only the exact unchanged document',async()=>{
    for(const stage of ['save','trash']){const f=fixture();if(stage==='save'){let first=true;const save=f.io.save;f.io.save=async()=>{if(first){first=false;throw Error('save failed');}await save();};}else f.io.trash=async()=>{throw Error('trash failed');};await assert.rejects(discardInsertedAttachment(snapshot,f.io),DiscardFailure);assert.equal(f.state().present,true);assert.equal(f.state().editor,text);assert.equal(f.state().disk,text);}
});
test('concurrent edits prevent compensation and never trash the attachment',async()=>{
    const f=fixture();f.io.save=async()=>{f.edit('unrelated new text');f.write('unrelated new text');};await assert.rejects(discardInsertedAttachment(snapshot,f.io),/could not be restored safely/);assert.equal(f.state().editor,'unrelated new text');assert.equal(f.state().present,true);assert.equal(f.state().trashes,0);
});
test('uncertain trash outcome never retries or restores a dangling link',async()=>{
    const f=fixture();let attempts=0;f.io.trash=async()=>{attempts++;f.gone();throw Error('response lost');};await assert.rejects(discardInsertedAttachment(snapshot,f.io),/outcome is uncertain/);assert.equal(attempts,1);assert.equal(f.state().editor,before);assert.equal(f.state().edits,1);
});

import {SingleInsertionTracker, GestureInput} from '../src/discard-core';
function gesture() {return {trusted:true,defaultPrevented:false,fileCount:1,source:{},view:{},editor:{},before,cursor:7,selection:'',clipboardBytes:Promise.resolve(new Uint8Array([1,2,3]).buffer)};}
test('single gesture token proves exact bytes, source/editor and parsed new span',async()=>{
    const tracker=new SingleInsertionTracker(()=>100);const input=gesture(),file={};const token=tracker.begin(input)!;tracker.created(file);
    const proof=await tracker.prove(token,file,input.source,input.view,input.editor,text,()=>text,[snapshot],async()=>new Uint8Array([1,2,3]).buffer);
    assert.deepEqual(proof,snapshot);
});
test('untrusted, prevented, multi-file and selected-text gestures never grant deletion',()=>{
    for(const patch of [{trusted:false},{defaultPrevented:true},{fileCount:2},{fileCount:0},{selection:'selected'}]){const tracker=new SingleInsertionTracker();assert.equal(tracker.begin({...gesture(),...patch}),undefined);}
});
test('token rejects reused, multiple-created, modified, expired and replaced gesture files',async()=>{
    for(const action of ['reused','multiple','modified','expired','new-gesture','editor','bytes','stale-text']){
        let now=0;const tracker=new SingleInsertionTracker(()=>now),input=gesture(),file={};const token=tracker.begin(input)!;
        if(action!=='reused')tracker.created(file);if(action==='multiple')tracker.created({});if(action==='modified')tracker.modified(file);if(action==='expired')now=30001;if(action==='new-gesture')tracker.begin(gesture());
        const proof=await tracker.prove(token,file,input.source,input.view,action==='editor'?{}:input.editor,text,()=>action==='stale-text'?'changed':text,[snapshot],async()=>new Uint8Array(action==='bytes'?[9]:[1,2,3]).buffer);assert.equal(proof,undefined,action);
    }
});
test('token is rechecked after clipboard and vault byte awaits',async()=>{
    const tracker=new SingleInsertionTracker(),input=gesture(),file={};const token=tracker.begin(input)!;tracker.created(file);
    const proof=await tracker.prove(token,file,input.source,input.view,input.editor,text,()=>text,[snapshot],async()=>{tracker.modified(file);return new Uint8Array([1,2,3]).buffer;});assert.equal(proof,undefined);
});
test('readback epoch changes prevent compensation over newer disk state',async()=>{
    const f=fixture();f.io.save=async()=>{throw Error('failed save');};f.io.readSource=async()=>({text,assertCurrent:()=>{throw Error('disk changed after read');}});
    await assert.rejects(discardInsertedAttachment(snapshot,f.io),/could not be restored safely/);assert.equal(f.state().present,true);assert.equal(f.state().edits,1);assert.equal(f.state().trashes,0);
});
test('an editor exception after mutation is treated as a partial edit and compensated safely',async()=>{
    const f=fixture();const replace=f.io.replace;let first=true;f.io.replace=(...args)=>{replace(...args);if(first){first=false;throw Error('editor failed after edit');}};
    await assert.rejects(discardInsertedAttachment(snapshot,f.io),DiscardFailure);assert.equal(f.state().editor,text);assert.equal(f.state().present,true);assert.equal(f.state().trashes,0);
});
test('synchronous editor listeners changing source prevent an unvalidated save',async()=>{
    const f=fixture();const replace=f.io.replace;f.io.replace=(...args)=>{replace(...args);f.edit('different document');};
    await assert.rejects(discardInsertedAttachment(snapshot,f.io),DiscardFailure);assert.equal(f.state().saves,0);assert.equal(f.state().trashes,0);assert.equal(f.state().editor,'different document');
});
test('cached presence without fresh retained bytes cannot authorize compensation',async()=>{
    const f=fixture();f.io.trash=async()=>{throw Error('physical move may have happened');};f.io.proveRetainedFile=async()=>undefined;
    await assert.rejects(discardInsertedAttachment(snapshot,f.io),/outcome is uncertain/);assert.equal(f.state().editor,before);assert.equal(f.state().edits,1);
});
test('missing file before any trash is reported separately from uncertain trash',async()=>{
    const f=fixture();f.io.preflight=async()=>{throw Error('file missing');};f.io.proveRetainedFile=async()=>undefined;
    await assert.rejects(discardInsertedAttachment(snapshot,f.io),/trash was not attempted/);assert.equal(f.state().edits,0);
});
test('synchronous inverse-edit listener prevents compensation save on switched source',async()=>{
    const f=fixture();let saves=0,edits=0;const replace=f.io.replace;
    f.io.save=async()=>{saves++;throw Error('save failure');};
    f.io.replace=(...args)=>{replace(...args);if(++edits===2)f.edit('other source');};
    await assert.rejects(discardInsertedAttachment(snapshot,f.io),DiscardFailure);assert.equal(saves,1);assert.equal(f.state().editor,'other source');assert.equal(f.state().trashes,0);
});
test('same source/editor in a different view cannot reuse insertion proof',async()=>{
    const tracker=new SingleInsertionTracker(),input=gesture(),file={};const token=tracker.begin(input)!;tracker.created(file);
    assert.equal(await tracker.prove(token,file,input.source,{},input.editor,text,()=>text,[snapshot],async()=>new Uint8Array([1,2,3]).buffer),undefined);
});
test('verified trash followed by a source change reports the confirmed partial result',async()=>{
    const f=fixture();const confirm=f.io.confirmTrashed;f.io.confirmTrashed=async()=>{await confirm();f.edit('concurrent edit after trash');};
    await assert.rejects(discardInsertedAttachment(snapshot,f.io),/verified moved to trash/);assert.equal(f.state().edits,1);assert.equal(f.state().present,false);
});

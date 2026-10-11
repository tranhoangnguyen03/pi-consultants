import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {CaseStore} from '../src/cases.mjs';
import {temp} from './helpers.mjs';

test('[EV-M01] A new consultation recovers its case, distinguishes evidence and preserves superseded decisions',async t=>{
 const d=await temp(t),s=new CaseStore(d);await s.open({client:'acme',project:'upgrade',title:'Upgrade',sessionId:'one'});
 const old=await s.note('acme','upgrade',{kind:'decision',state:'confirmed',text:'Keep API v1',sources:['user-turn:3'],sessionId:'one'});
 await s.note('acme','upgrade',{kind:'superseded',state:'confirmed',text:'API v2 approved for the next major version',sources:['user-turn:9'],supersedes:old.id});
 const next=await new CaseStore(d).open({client:'acme',project:'upgrade',title:'Upgrade',sessionId:'two'});
 assert.equal(next.notes.length,2);assert.equal(next.notes[1].supersedes,old.id);assert.deepEqual(next.sessions,['one','two']);
});
test('[EV-M02] Concurrent brief updates surface a conflict instead of overwriting another consultation',async t=>{
 const s=new CaseStore(await temp(t));await s.open({client:'c',project:'p',title:'P'});
 const r=await Promise.allSettled([s.brief('c','p',0,'Direction A',[]),s.brief('c','p',0,'Direction B',[])]);
 assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.equal((await s.read('c','p')).revision,1);
});
test('[EV-M03] HQ records remain absolute, client-separated and reject invented confirmation',async t=>{
 const root=await temp(t),s=new CaseStore(path.join(root,'cases'));
 await s.open({client:'a',project:'same',title:'A'});await s.open({client:'b',project:'same',title:'B'});
 await assert.rejects(()=>s.note('a','same',{kind:'decision',state:'confirmed',text:'Approved',sources:[]}),/evidence/);
 await s.note('a','same',{kind:'proposal',state:'proposed',text:'Review on Friday',sources:[]});
 assert.equal((await s.read('b','same')).notes.length,0);assert.throws(()=>s.directory('../escape','p'),/Invalid/);
});

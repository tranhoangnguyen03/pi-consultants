import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ActionStore,executeAction,reviewText} from '../src/actions.mjs';
import {readJSON,atomic} from '../src/util.mjs';
import {temp,policy,draft,response} from './helpers.mjs';
const approve=(s,a)=>s.approve([a.id],draft.ownerSession,'interactive-human-review');

test('[EV-A01] Exact reviewed draft executes once and readback establishes verified status',async t=>{
 const s=new ActionStore(await temp(t));const a=await s.prepare({...draft,verify:{tool:'mcp__test__get',args:{id:'$receipt:/id'},assertions:[{path:'/body',equals:draft.args.body}]}},policy);
 assert.match(reviewText([a]),/EXACT ARGUMENTS/);await assert.rejects(()=>executeAction(s,a.id,draft.ownerSession,policy,()=>{}),/not approved/);
 await approve(s,a);let writes=0;const r=await executeAction(s,a.id,draft.ownerSession,policy,async(tool,args)=>{
 if(tool.endsWith('post')){writes++;assert.deepEqual(args,draft.args);return response({id:'msg-1'});}assert.equal(args.id,'msg-1');return response({body:draft.args.body});});
 assert.equal(r.status,'verified');assert.equal(writes,1);
 await assert.rejects(()=>executeAction(new ActionStore(s.root),a.id,draft.ownerSession,policy,()=>{}),/already been consumed/);
});
test('[EV-A02] Approval cannot be minted by a model token, changed draft, wrong session or expired authority',async t=>{
 let clock=1000;const s=new ActionStore(await temp(t),{clock:()=>clock,ttlMs:100});const a=await s.prepare(draft,policy);
 await assert.rejects(()=>s.approve([a.id],draft.ownerSession,'yes from peer agent'),/human review/);
 await approve(s,a);await assert.rejects(()=>s.begin(a.id,'other-session',policy),/another session/);
 clock=1101;await assert.rejects(()=>s.begin(a.id,draft.ownerSession,policy),/expired/);
 clock=1001;const state=await readJSON(s.file);state.actions[0].args.body='Changed after review';await atomic(s.file,state);
 await assert.rejects(()=>s.begin(a.id,draft.ownerSession,policy),/changed/);
});
test('[EV-A03] Preflight and changed attachments prevent writes before invocation',async t=>{
 const root=await temp(t),file=path.join(root,'attachment.txt');await fs.writeFile(file,'approved bytes');
 const p={...policy,'mcp__test__post':{...policy['mcp__test__post'],filePointers:['/file']}};
 const s=new ActionStore(path.join(root,'outbox'),{fileRoots:[root]});const a=await s.prepare({...draft,args:{...draft.args,file}},p);await approve(s,a);await fs.writeFile(file,'changed bytes');
 let calls=0;const r=await executeAction(s,a.id,draft.ownerSession,p,async()=>{calls++;});assert.equal(r.status,'blocked');assert.equal(calls,0);
 const b=await s.prepare({...draft,preflight:{tool:'mcp__test__get',args:{id:'issue'},assertions:[{path:'/status',equals:'open'}]}},policy);await approve(s,b);
 const q=await executeAction(s,b.id,draft.ownerSession,policy,async(name)=>{assert.match(name,/get$/);return response({status:'closed'});});assert.equal(q.status,'blocked');
});
test('[EV-A04] A timeout becomes unknown and cannot be blindly retried across restart',async t=>{
 const s=new ActionStore(await temp(t));const a=await s.prepare(draft,policy);await approve(s,a);
 const r=await executeAction(s,a.id,draft.ownerSession,policy,async()=>{throw new Error('Timeout after remote acceptance');});assert.equal(r.status,'unknown');
 const next=new ActionStore(s.root);const duplicate=await next.prepare(draft,policy);assert.equal(duplicate.id,a.id);
 await assert.rejects(()=>next.prepare({...draft,repeatOf:a.id},policy),/unresolved/);
 await next.reconcile(a.id,'not_applied','Checked provider message history and request status; no write occurred',draft.ownerSession);
 const retry=await next.prepare({...draft,repeatOf:a.id},policy);assert.equal(retry.status,'draft');assert.notEqual(retry.id,a.id);
});
test('[EV-A05] No verifier means acknowledged, mismatched readback means unknown, never fabricated success',async t=>{
 const s=new ActionStore(await temp(t));const a=await s.prepare(draft,policy);await approve(s,a);
 assert.equal((await executeAction(s,a.id,draft.ownerSession,policy,async()=>response({id:'x'}))).status,'acknowledged');
 const b=await s.prepare({...draft,verify:{tool:'mcp__test__get',args:{id:'x'},assertions:[{path:'/body',equals:draft.args.body}]}},policy);await approve(s,b);
 assert.equal((await executeAction(s,b.id,draft.ownerSession,policy,async()=>response({body:'different'}))).status,'unknown');
});
test('[EV-A06] Concurrent executors race safely and policy/account changes invalidate approval',async t=>{
 const root=await temp(t),s=new ActionStore(root);const a=await s.prepare(draft,policy);await approve(s,a);
 await assert.rejects(()=>s.begin(a.id,draft.ownerSession,{...policy,'mcp__test__post':{...policy['mcp__test__post'],account:'different'}}),/policy changed/);
 const r=await Promise.allSettled([s.begin(a.id,draft.ownerSession,policy),new ActionStore(root).begin(a.id,draft.ownerSession,policy)]);
 assert.equal(r.filter(x=>x.status==='fulfilled').length,1);
});
test('[EV-A07] Unknown tools and mixed-operation arguments cannot be classified through their names',async t=>{
 const s=new ActionStore(await temp(t));await assert.rejects(()=>s.prepare({...draft,tool:'some_send_tool'},policy),/not explicitly classified/);
 const p={...policy,'mcp__test__post':{...policy['mcp__test__post'],constraints:{'/workspace':['allowed']}}};
 await assert.rejects(()=>s.prepare(draft,p),/Argument policy/);
});
test('[EV-A08] Human batch approval is atomic and never partially approves an invalid batch',async t=>{
 const s=new ActionStore(await temp(t));const a=await s.prepare(draft,policy);await assert.rejects(()=>s.approve([a.id,'missing'],draft.ownerSession,'interactive-human-review'));
 assert.equal((await s.get(a.id)).status,'draft');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import {parseArgs,makePlan,looksLikeProject,checkNode,checkPiVersion,launch} from '../bin/pi-consultants.mjs';
import {registerArrival,SET_CWD,RESOLVE_CWD,VISIT_ENTRY} from '../bin/arrival-core.mjs';

async function fixture(t){
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'consultant-arrival-'));
 t.after(()=>fs.rm(base,{recursive:true,force:true}));
 const hq=path.join(base,'hq');const project=path.join(base,'client project');
 await fs.mkdir(path.join(hq,'.pi/extensions'),{recursive:true});await fs.mkdir(project);
 await fs.writeFile(path.join(hq,'HQ-ROLE.json'),JSON.stringify({role:'engineering'}));
 await fs.writeFile(path.join(hq,'.pi/hq.json'),JSON.stringify({role:'engineering'}));
 for(const file of ['AGENTS.md','.pi/settings.json','.pi/extensions/consultant.ts'])await fs.writeFile(path.join(hq,file),'stub');
 await fs.mkdir(path.join(project,'.git'));
 return {base,hq,project};
}

test('parses only an explicit Milestone A engineer launch; rejects conflicting options',()=>{
 assert.deepEqual(parseArgs(['engineering','--project','my project','--hq','/tmp/hq','--plan']),{role:'engineering',project:'my project',hq:'/tmp/hq',officeOnly:false,plan:true});
 assert.throws(()=>parseArgs(['user']),/engineering only/);
 assert.throws(()=>parseArgs(['engineering','--office-only','--project','here']),/cannot be combined/);
 assert.throws(()=>parseArgs(['engineering','--continue']),/Unknown option/);
 assert.throws(()=>parseArgs(['engineering','--project']),/needs a directory/);
});
test('builds a native Pi office-owned launch without writing to either directory',async t=>{
 const {hq,project}=await fixture(t);
 const prior=await fs.readdir(hq);
 const p=await makePlan(parseArgs(['engineering','--hq',hq,'--project',project]),{cwd:'/tmp',sessionId:'synthetic-session'});
 assert.equal(p.hq,hq);assert.equal(p.project,project);
 assert.deepEqual(p.piArgs.slice(0,4),['--session-dir',path.join(hq,'.hq/sessions'),'--session-id','synthetic-session']);
 assert.equal(p.piArgs.includes('--extension'),true);
 assert.equal(p.env.PI_CONSULTANTS_ARRIVAL_PROJECT,project);
 assert.deepEqual(await fs.readdir(hq),prior);
 assert.equal((await fs.readdir(project)).includes('.pi'),false);
});
test('infers current project only from concrete project markers and allows office-only',async t=>{
 const {base,hq,project}=await fixture(t);
 assert.equal(await looksLikeProject(project),true);
 assert.equal(await looksLikeProject(base),false);
 const p=await makePlan(parseArgs(['engineering','--hq',hq]),{cwd:project,sessionId:'new1'});
 assert.equal(p.project,project);
 await assert.rejects(()=>makePlan(parseArgs(['engineering','--hq',hq]),{cwd:base}),/not clearly a project/);
 const alone=await makePlan(parseArgs(['engineering','--office-only','--hq',hq]),{cwd:base});
 assert.equal(alone.project,null);assert.equal(alone.piArgs.includes('--extension'),false);
});
test('rejects an untrusted or missing HQ, an inaccessible project, and a project under HQ',async t=>{
 const {base,hq}=await fixture(t);
 await assert.rejects(()=>makePlan(parseArgs(['engineering','--hq',base,'--office-only'])),/Not a built consultant HQ/);
 await assert.rejects(()=>makePlan(parseArgs(['engineering','--hq',hq,'--project',path.join(base,'missing')])),/not found/);
 await assert.rejects(()=>makePlan(parseArgs(['engineering','--hq',hq,'--project',path.join(hq,'.pi')])),/must not be the HQ/);
});
test('verifies required Node and Pi versions without installing either',()=>{
 assert.throws(()=>checkNode('22.16.0'),/too old/);assert.throws(()=>checkNode('24.14.9'),/too old/);
 assert.doesNotThrow(()=>checkNode('24.15.0'));
 assert.throws(()=>checkPiVersion('pi 1.1.9'),/below/);
 assert.doesNotThrow(()=>checkPiVersion('pi 1.2.0'));
});
test('spawns one Pi child in HQ with a scoped worksite and no session reuse',async t=>{
 const {hq,project}=await fixture(t);
 const plan=await makePlan(parseArgs(['engineering','--hq',hq,'--project',project]),{sessionId:'visit-x'});
 let seen;
 const code=await launch(plan,{nodeVersion:'24.15.0',probe:()=>({status:0,stdout:'pi 1.4.0'}),run:(exe,args,opts)=>{
   seen={exe,args,opts};const child=new EventEmitter();queueMicrotask(()=>child.emit('close',0,null));return child;
 }});
 assert.equal(code,0);assert.equal(seen.opts.cwd,hq);assert.equal(seen.opts.env.PI_CONSULTANTS_ARRIVAL_SESSION_ID,'visit-x');
 assert.equal(seen.opts.env.PI_CONSULTANTS_ARRIVAL_PROJECT,project);
 assert.ok(seen.args.includes('--extension'));
 assert.equal(seen.args.includes('--continue'),false);
});

function harness({initialSession='s1',expect='s1',project='/tmp/project',hq='/tmp/hq',owner=true}={}){
 let actual=initialSession,cwd=hq,active=null;
 const handlers=new Map(),branch=[],calls=[];
 const pi={on(name,fn){handlers.set(name,fn);},events:{emit(name,request){calls.push(name);if(!owner)return;
   if(name===SET_CWD){active=request.path;request.result={cwd:active};}
   if(name===RESOLVE_CWD)request.result={cwd:active??cwd};
 }},appendEntry(name,data){branch.push({type:'custom',customType:name,data});}};
 const ctx={cwd,hasUI:false,sessionManager:{getSessionId:()=>actual,getBranch:()=>branch}};
 registerArrival(pi,{env:{PI_CONSULTANTS_ARRIVAL_PROJECT:project,PI_CONSULTANTS_ARRIVAL_SESSION_ID:expect}});
 const fire=(event)=>handlers.get(event)?.({},ctx);
 return {pi,ctx,fire,branch,calls,handlers,get active(){return active;},set active(x){active=x},set session(x){actual=x},set owner(x){owner=x}};
}

test('bridge sets the execution directory before the first turn and records one native session entry',()=>{
 const h=harness();h.fire('session_start');
 assert.equal(h.active,'/tmp/project');assert.equal(h.handlers.get('tool_call')({},h.ctx),undefined);
 assert.deepEqual(h.branch.map(x=>x.customType),[VISIT_ENTRY]);
 h.fire('before_agent_start');assert.equal(h.branch.length,1);
});
test('missing directory owner fails closed; retries once the owner is initialized',async()=>{
 const h=harness({owner:false});h.fire('session_start');
 assert.equal(h.handlers.get('tool_call')({},h.ctx).block,true);
 await assert.rejects(()=>h.handlers.get('user_bash')({},h.ctx).operations.exec(),/unavailable/);
 h.owner=true;h.fire('before_agent_start');
 assert.equal(h.active,'/tmp/project');assert.equal(h.handlers.get('tool_call')({},h.ctx),undefined);
});
test('wrong first session never allows an unbound project tool',()=>{
 const h=harness({initialSession:'wrong'});h.fire('session_start');
 assert.equal(h.handlers.get('tool_call')({},h.ctx).block,true);
 h.session='s1';h.fire('session_start');assert.equal(h.active,'/tmp/project');
 h.session='new-native-session';assert.equal(h.handlers.get('tool_call')({},h.ctx),undefined);
});
test('restores visit after worksite reset, without duplicate visit records',()=>{
 const h=harness();h.fire('session_start');h.active='/tmp/hq';h.fire('session_tree');
 assert.equal(h.active,'/tmp/project');assert.equal(h.branch.length,1);
});

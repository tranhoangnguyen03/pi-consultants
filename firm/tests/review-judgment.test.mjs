/** Executable scenario facts and target isolation, NOT a model-behavior evaluation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {cases} from '../eval/review-judgment/cases.mjs';
import {prepareCase} from '../eval/review-judgment/prepare.mjs';

async function workspace(t,id,variant='default',stage) {
 const parent=await fs.mkdtemp(path.join(os.tmpdir(),'review-judgment-'));
 t.after(()=>fs.rm(parent,{recursive:true,force:true}));
 return prepareCase(id,variant,path.join(parent,'project'),stage);
}
const load=(target,file)=>import(pathToFileURL(path.join(target,file)).href);
const exists=file=>fs.access(file).then(()=>true,()=>false);
const validInstall={projectRoot:'/fixture',providers:[],otherOffices:[]};

test('every scenario/variant is a real clean Git target with passing author checks; controls stay outside',async t=>{
 for(const [id,scenario] of Object.entries(cases)) for(const variant of Object.keys(scenario.variants)) {
  const result=await workspace(t,id,variant);
  assert.match(result.base,/^[0-9a-f]{40}$/); assert.notEqual(result.head,result.base);
  const status=spawnSync('git',['status','--porcelain'],{cwd:result.target,encoding:'utf8'});
  assert.equal(status.status,0,status.stderr); assert.equal(status.stdout,'');
  const checks=spawnSync(process.execPath,['--test'],{cwd:result.target,encoding:'utf8'});
  assert.equal(checks.status,0,id+'/'+variant+'\n'+checks.stdout+'\n'+checks.stderr);
  for(const name of ['cases.mjs','score.json','peer.md','rubric.md']) assert.equal(await exists(path.join(result.target,name)),false);
  await assert.rejects(prepareCase(id,variant,result.target),{code:'EEXIST'});
 }
});

test('notification target keeps useful redaction/cancellation and demonstrates persisted delivery across instances',async t=>{
 const {target}=await workspace(t,'RJ-01');
 const {Jobs}=await load(target,'src/jobs.mjs'); const {Delivery}=await load(target,'src/delivery.mjs');
 const {finish}=await load(target,'src/runner.mjs'); const {tick}=await load(target,'src/worker.mjs');
 const directory=path.join(target,'.state'),jobs=new Jobs(directory),delivery=new Delivery(directory);
 await finish(jobs,delivery,{id:'j1',status:'failed',error:'failed token=private-value'});
 await finish(jobs,delivery,{id:'j2',status:'cancelled',error:''});
 const sent=[]; await tick(new Delivery(directory),async notice=>sent.push(notice));
 assert.deepEqual(sent,[{jobId:'j1',body:'failed token=[redacted]'}]);
 assert.equal((await new Jobs(directory).all()).length,2);
 assert.equal((await new Delivery(directory).read('receipts')).length,1);
 const best=await fs.readFile(path.join(target,'docs/request.md'),'utf8');
 const durable=await workspace(t,'RJ-01','durable');
 const changed=await fs.readFile(path.join(durable.target,'docs/request.md'),'utf8');
 assert.notEqual(best,changed); // Same implementation, different accepted guarantee.
 const plan=await workspace(t,'RJ-01','plan');
 assert.equal(await exists(path.join(plan.target,'src/delivery.mjs')),false);
 assert.equal(await exists(path.join(plan.target,'docs/plan.md')),true);
});

test('installer: shared gate prevents adoption of a rolled-back profile; unrelated preflight can still block normal use',async t=>{
 const {target}=await workspace(t,'RJ-02');
 const {Gate}=await load(target,'src/gate.mjs'); const {installGlobal,adoptProject}=await load(target,'src/installer.mjs');
 const {preflight}=await load(target,'src/preflight.mjs');
 assert.throws(()=>preflight({...validInstall,providers:[{name:'unused',enabled:false}]}),/credential/);
 assert.throws(()=>preflight({...validInstall,otherOffices:[{configVersion:1}]}),/other-office/);
 for(const guarded of [false,true]) {
  let arrived,release;
  const created=new Promise(r=>{arrived=r;}),finish=new Promise(r=>{release=r;});
  const gate=guarded?new Gate():{run:work=>work()},root=path.join(target,'.state',String(guarded)),project={};
  const global=installGlobal(gate,root,'engineer',async()=>{arrived();await finish;throw new Error('commit failed');},validInstall).then(()=>null,error=>error);
  await created;
  const adopted=adoptProject(gate,root,'engineer',project,validInstall).then(value=>({value}),error=>({error}));
  if(!guarded) assert.equal((await adopted).value.name,'engineer');
  release(); assert.match((await global).message,/commit failed/);
  if(guarded) { assert.equal((await adopted).error.code,'ENOENT');assert.equal(project.profilePath,undefined); }
  else assert.equal(await exists(project.profilePath),false);
 }
 const resolved=await workspace(t,'RJ-02','resolved');
 const repaired=await load(resolved.target,'src/preflight.mjs');
 assert.doesNotThrow(()=>repaired.preflight({...validInstall,providers:[{enabled:false}],otherOffices:[{configVersion:1}]}));
});

test('settings: happy-path author tests conceal broken first use, discovery and unavailable results, but disclosure guard matters',async t=>{
 const {target}=await workspace(t,'RJ-03'),{open}=await load(target,'src/commands.mjs');
 const config={decision:{enabled:false,engine:'local'},llm:{enabled:false,engine:'local'}};
 assert.throws(()=>open(config),/both providers/);
 const command=open(config,{DECISION_TOKEN:'fixture',LLM_TOKEN:'fixture'});
 assert.equal(command.settings().settings,undefined);
 assert.throws(()=>command.configure(config),/Restart/);
 const external=open({...config,llm:{enabled:true,engine:'remote'}},{DECISION_TOKEN:'fixture',LLM_TOKEN:'fixture'});
 assert.deepEqual(await external.run({text:'hello'}),{status:'ok',text:''});
 await assert.rejects(external.run({text:'private',private:true}),/disclosure/);
});

test('ambiguous remote timeout duplicates a committed action; resolved decision and implementation preserve uncertainty',async t=>{
 const review=await workspace(t,'RJ-04');
 const {Mailbox}=await load(review.target,'src/remote.mjs'),{sendAdminNotice}=await load(review.target,'src/api.mjs');
 const remote=new Mailbox();remote.loseNextResponse=true;
 assert.equal((await sendAdminNotice(remote,'one notice')).status,'sent');
 assert.equal(remote.messages.length,2);
 const fixed=await workspace(t,'RJ-04','resolved');
 const {Mailbox:FixedMailbox}=await load(fixed.target,'src/remote.mjs'),api=await load(fixed.target,'src/api.mjs');
 const safe=new FixedMailbox();safe.loseNextResponse=true;
 assert.equal((await api.sendAdminNotice(safe,'one notice')).status,'uncertain'); assert.equal(safe.messages.length,1);
 const oneShot=await workspace(t,'RJ-04','oneShot');
 assert.equal(await exists(path.join(oneShot.target,'docs/decision.md')),false);
});

test('full lifecycle exposes stale active mirror while old-session pinning remains required',async t=>{
 for(const variant of ['default','resolved']) {
  const {target}=await workspace(t,'RJ-05',variant),api=await load(target,'src/commands.mjs'),state=api.createState();
  api.publish(state,'engineer',1);api.install(state,'engineer');api.invoke(state,'engineer','old');
  api.publish(state,'engineer',2);api.upgrade(state,'engineer');
  assert.equal(api.list(state,'engineer').version,2);
  assert.equal(api.invoke(state,'engineer','new').version,variant==='default'?1:2);
  assert.equal(api.resume(state,'old').version,1);
 }
});

test('follow-up snapshots retain real history but never leak future repairs; cosmetic and genuine fixes differ',async t=>{
 const config={decision:{enabled:false,engine:'local'},llm:{enabled:false,engine:'local'}};
 const stages={};
 for(const stage of ['initial','cosmetic','resolved']) {
  const review=await workspace(t,'RJ-06','default',stage);stages[stage]=review;
  const {open}=await load(review.target,'src/commands.mjs');
  if(stage==='resolved') assert.equal((await open(config).run({text:'hello'})).text,'hello');
  else assert.throws(()=>open(config),/both providers/);
  const commits=spawnSync('git',['rev-list','--count','--all'],{cwd:review.target,encoding:'utf8'});
  assert.equal(Number(commits.stdout),{initial:2,cosmetic:3,resolved:4}[stage]);
 }
 assert.equal(stages.initial.head,stages.cosmetic.revisions.initial);
 assert.equal(stages.cosmetic.head,stages.resolved.revisions.cosmetic);
 const {open}=await load(stages.cosmetic.target,'src/commands.mjs');
 const cmd=open(config,{DECISION_TOKEN:'fixture',LLM_TOKEN:'fixture'});
 assert.doesNotThrow(()=>cmd.configure(config));
 const remote=open({...config,llm:{enabled:true,engine:'remote'}},{DECISION_TOKEN:'fixture',LLM_TOKEN:'fixture'});
 assert.equal((await remote.run({text:'hello'})).status,'unavailable');
});

test('active protocol differences justify adapter; facts-only and small-change controls have bounded diffs',async t=>{
 const {target}=await workspace(t,'RJ-07'),{planRun}=await load(target,'src/controller.mjs');
 assert.deepEqual(planRun('direct','x').request,{text:'x'});
 assert.equal(planRun('stream','x').request.stream,true);
 assert.equal(planRun('batch','x').request.async,true);
 assert.equal(planRun('batch','x').read({status:'complete',output:'done'}).state,'done');
 assert.equal(planRun('stream','x').cancel('id').path,'/streams/id/stop');
 const small=await workspace(t,'RJ-07','small');
 const diff=spawnSync('git',['diff','--name-only',small.base+'...'+small.head],{cwd:small.target,encoding:'utf8'});
 assert.equal(diff.stdout.trim(),'src/adapter.mjs');
});

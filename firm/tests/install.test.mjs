import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {temp} from './helpers.mjs';
import {loadHQConfig,saveHQPolicy} from '../src/config.mjs';
import {hash} from '../src/util.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
async function pair(t){const d=await temp(t),out=path.join(d,'repos');const r=spawnSync(process.execPath,[path.join(root,'scripts/build-hqs.mjs'),out],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);const offices=JSON.parse(await fs.readFile(path.join(root,'offices.json'),'utf8'));return {d,out,b:path.join(out,'engineering-consultant'),c:path.join(out,'project-consultant'),all:offices.map(o=>[path.join(out,o.folder),o.role])};}
function run(repo,args=[]){return spawnSync(process.execPath,[path.join(repo,'.runtime/bin/hq.mjs'),...args],{cwd:repo,encoding:'utf8'});}
async function bootstrap(repo,env={}){
 return spawnSync(process.execPath,['--no-warnings','--experimental-loader',path.join(root,'tests/fixtures/ts-contract-loader.mjs'),path.join(root,'tests/fixtures/native-bootstrap.mjs')],{cwd:repo,env:{...process.env,...env},encoding:'utf8'});
}
test('[EV-I01] Each standalone HQ repository exposes local settings, role-selected skills and three prompts without changing global files',async t=>{
 const p=await pair(t),source=path.join(p.d,'daily-driver');await fs.mkdir(source);const global=path.join(source,'settings.json');await fs.writeFile(global,'{"packages":["daily-driver"]}');const before=hash(await fs.readFile(global));
 for(const [repo,role] of p.all){
  const config=await loadHQConfig(path.join(repo,'.pi/hq.json'));assert.equal(config.role,role);assert.equal(config.hq,repo);assert.equal(config.stateDir,path.join(repo,'.hq'));assert.deepEqual(config.sessionRoots,[path.join(repo,'.hq/sessions')]);
  const settings=JSON.parse(await fs.readFile(path.join(repo,'.pi/settings.json'),'utf8'));assert.equal(settings.sessionDir,'.hq/sessions');assert(!JSON.stringify(settings).includes('PI_CODING_AGENT_DIR'));
  assert(!settings.packages.some(x=>String(x).includes('pi-profile-switch')));
  const skills=await fs.readdir(path.join(repo,'.pi/skills'));assert.deepEqual(skills.sort(),[...await fs.readdir(path.join(root,'skills',role)),...await fs.readdir(path.join(root,'skills/shared'))].sort());assert.equal(skills.includes('asd-ste100'),role==='engineering');assert.equal((await fs.readdir(path.join(repo,'.pi/prompts'))).length,3);
  const r=run(repo,['configure','--projects',p.d,'--sessions',source]);assert.equal(r.status,0,r.stderr);
 }
 assert.equal(hash(await fs.readFile(global)),before);
});
test('[EV-I02] Native usage replaces old launcher commands; no alias, wrapper or profile selection is required',async t=>{
 const p=await pair(t);const help=run(p.b,['help']);assert.equal(help.status,0);assert.match(help.stdout,/cd \/path\/to\/HQ && pi/);
 assert.notEqual(run(p.b,['launch']).status,0);
 for(const repo of p.all.map(([r])=>r)){const entry=await fs.readFile(path.join(repo,'.runtime/extensions/index.ts'),'utf8');assert.match(entry,/fileURLToPath\(import.meta.url\)/);assert.doesNotMatch(entry,/process\.env\.[A-Z_]+\s*=/);}
});
test('[EV-N01] Shipped native entry registers the correct consultant and persists at HQ despite stale launcher variables',async t=>{
 const p=await pair(t);
 for(const [repo,role] of p.all){
  const r=await bootstrap(repo,{CONSHQ_CONFIG:'/wrong/hq.json',CONSHQ_HOME:'/wrong',PI_PROFILE_SWITCH_DIR:'/wrong'});assert.equal(r.status,0,r.stderr);
  const report=JSON.parse(r.stdout.trim());assert.equal(report.firstSkillReadableBeforeCase,true);assert(report.tools.includes('session_consult'));assert(report.tools.includes('hq_case'));assert(report.commands.includes('hq'));
  assert(report.notifications.some(n=>n.includes(`Consultant: ${role}`)&&n.includes(`HQ: ${repo}`)));
  assert((await fs.readdir(path.join(repo,'.hq/cases'))).length>0);
 }
});
test('[EV-N02] Moving one HQ away from its sibling preserves entry resolution and relocates only its private state',async t=>{
 const p=await pair(t),moved=path.join(p.d,'a moved HQ with spaces');await fs.rename(p.b,moved);await fs.rm(p.c,{recursive:true});
 const r=await bootstrap(moved);assert.equal(r.status,0,r.stderr);assert(JSON.parse(r.stdout).notifications.some(n=>n.includes(moved)));
 const c=await loadHQConfig(path.join(moved,'.pi/hq.json'));assert.equal(c.stateDir,path.join(moved,'.hq'));assert.equal(c.kitRoot,moved);
 assert.equal(await fs.access(p.b).then(()=>true,()=>false),false);
});
test('[EV-N03] Local policy review persists only an ignored overlay and does not absolutize the portable configuration',async t=>{
 const p=await pair(t),file=path.join(p.c,'.pi/hq.json'),before=await fs.readFile(file,'utf8');
 const policy={'mcp__fixture__get':{effect:'read',service:'fixture',account:'test'}};await saveHQPolicy(file,policy);
 assert.equal(await fs.readFile(file,'utf8'),before);assert.deepEqual((await loadHQConfig(file)).policy,policy);
 const local=JSON.parse(await fs.readFile(path.join(p.c,'.pi/hq.local.json'),'utf8'));assert.equal(local.hq,undefined);
});
test('[EV-N04] Native inheritance is additive; neither global resources nor the global append prompt are replaced by the HQ',async t=>{
 const p=await pair(t);for(const repo of p.all.map(([r])=>r)){
  const settings=JSON.parse(await fs.readFile(path.join(repo,'.pi/settings.json'),'utf8'));
  for(const k of ['skills','extensions','prompts','themes'])assert.equal(settings[k],undefined);
  assert(settings.defaultTools.every(x=>x.startsWith('+')));
  assert.equal(await fs.access(path.join(repo,'.pi/APPEND_SYSTEM.md')).then(()=>true,()=>false),false);
  assert.equal(await fs.access(path.join(repo,'.pi/SYSTEM.md')).then(()=>true,()=>false),false);
 }
});
test('[EV-N05] Migration retains completed receipts and source bytes but invalidates unused approvals',async t=>{
 const p=await pair(t),old=path.join(p.d,'old');await fs.mkdir(path.join(old,'outbox'),{recursive:true});await fs.mkdir(path.join(old,'cases'),{recursive:true});
 await fs.writeFile(path.join(old,'hq.json'),JSON.stringify({version:1,role:'coordination',hq:old,sessionRoots:[],projectRoots:[],policy:{}}));
 const state={version:1,actions:[{id:'done',status:'verified',history:[],receipt:{id:'external-1'}},{id:'pending',status:'approved',history:[]},{id:'maybe',status:'in_flight',history:[]}]};
 await fs.writeFile(path.join(old,'outbox/outbox.json'),JSON.stringify(state));const before=hash(await fs.readFile(path.join(old,'outbox/outbox.json')));
 const r=run(p.c,['migrate','--from',old]);assert.equal(r.status,0,r.stderr);
 const next=JSON.parse(await fs.readFile(path.join(p.c,'.hq/outbox/outbox.json'),'utf8'));assert.deepEqual(next.actions[0],state.actions[0]);assert.equal(next.actions[1].status,'rejected');assert.equal(next.actions[2].status,'unknown');
 assert.equal(hash(await fs.readFile(path.join(old,'outbox/outbox.json'))),before);assert.notEqual(run(p.c,['migrate','--from',old]).status,0);
});

test('Migration rejects symlink state before copying or mutating source',async t=>{
 const p=await pair(t),old=path.join(p.d,'old'),external=path.join(p.d,'external');await fs.mkdir(old);await fs.mkdir(external);
 await fs.writeFile(path.join(old,'hq.json'),JSON.stringify({role:'coordination'}));
 const file=path.join(external,'outbox.json'),before=JSON.stringify({actions:[{status:'approved',history:[]}]});await fs.writeFile(file,before);await fs.symlink(external,path.join(old,'outbox'));
 const r=run(p.c,['migrate','--from',old]);assert.notEqual(r.status,0);assert.match(r.stderr,/symlink/);assert.equal(await fs.readFile(file,'utf8'),before);assert.equal(await fs.access(path.join(p.c,'.hq/outbox')).then(()=>true,()=>false),false);
});

test('Factory output is lean, inventoried, private-free and refuses overwrite',async t=>{
 const p=await pair(t);
 for(const repo of p.all.map(([r])=>r)){
  for(const name of ['src','profiles','skills','tests','scripts','docs','.hq','.env','organization/PLAYBOOK.md'])assert.equal(await fs.access(path.join(repo,name)).then(()=>true,()=>false),false,name);
  const manifest=JSON.parse(await fs.readFile(path.join(repo,'HQ-ROLE.json'),'utf8'));
  for(const [file,digest] of Object.entries(manifest.generated))assert.equal(hash(await fs.readFile(path.join(repo,file))),digest);
  assert.equal(JSON.parse(await fs.readFile(path.join(repo,'.pi/settings.json'),'utf8')).quietStartup,true);
 }
 const retry=spawnSync(process.execPath,[path.join(root,'scripts/build-hqs.mjs'),p.out],{encoding:'utf8'});assert.notEqual(retry.status,0);
});

test('Bundled setup examples work and doctor accepts Pi 1.x without hiding Node prerequisites',async t=>{
 const p=await pair(t),pi=path.join(p.d,'fake-pi');await fs.writeFile(pi,'#!/bin/sh\necho 1.0.2\n',{mode:0o700});
 for(const repo of p.all.map(([r])=>r)){
  const help=run(repo,['help']);assert.doesNotMatch(help.stdout,/npm run/);assert.match(help.stdout,/node \.runtime\/bin\/hq.mjs configure/);
  const readme=await fs.readFile(path.join(repo,'README.md'),'utf8');assert.match(readme,/cp organization\/PLAYBOOK.example.md organization\/PLAYBOOK.md/);
  assert.equal(run(repo,['configure','--root',repo,'--projects',p.d]).status,0);
  const doctor=run(repo,['doctor','--pi',pi]);const report=JSON.parse(doctor.stdout);assert.equal(report.checks.find(c=>c.name==='Pi baseline').passed,true);
  assert.equal(report.checks.find(c=>c.name==='Role skills').passed,true);
  assert.match(report.scope,/not a real Pi startup test/);
  assert.equal(doctor.status,report.checks.every(c=>c.passed)?0:1);
 }
});
test('Approved check 6: doctor names missing machine software with its install hint',async t=>{
 const p=await pair(t),bin=path.join(p.d,'empty-bin');await fs.mkdir(bin);
 const r=spawnSync(process.execPath,[path.join(p.b,'.runtime/bin/hq.mjs'),'doctor','--pi',process.execPath],{cwd:p.b,encoding:'utf8',env:{...process.env,PATH:bin}});
 const report=JSON.parse(r.stdout);
 const git=report.checks.find(c=>c.name==='git');assert.equal(git.passed,false);assert.match(git.detail,/Install: https:\/\/git-scm.com/);
 assert.equal(report.verdict,'prerequisites_unmet');assert.notEqual(r.status,0);
 const gh=report.software.find(s=>s.name==='gh');assert.equal(gh.found,false);assert.equal(gh.required,false);assert.match(gh.install,/cli.github.com/);
});

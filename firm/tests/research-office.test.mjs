import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {temp} from './helpers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo=path.resolve(root,'..');
const required=['paper-lookup','literature-review','scientific-critical-thinking','hypothesis-generation','experimental-design','statistical-analysis','scientific-writing','last30days'];
test('Research Scientist E is a generated independent HQ with exactly eight specialty skills',async()=>{
 const source=path.join(root,'skills/research'),office=path.join(repo,'offices/research-consultant');
 assert.deepEqual((await fs.readdir(source)).sort(),required.slice().sort());
 assert.deepEqual((await fs.readdir(path.join(office,'.pi/skills'))).sort(),[...required,...await fs.readdir(path.join(root,'skills/shared'))].sort());
 const settings=JSON.parse(await fs.readFile(path.join(office,'.pi/settings.json'),'utf8'));
 const role=JSON.parse(await fs.readFile(path.join(office,'.pi/hq.json'),'utf8'));
 assert.equal(role.role,'research');assert.equal(settings.sessionDir,'.hq/sessions');
 assert.match(await fs.readFile(path.join(office,'AGENTS.md'),'utf8'),/research scientist/);
 const lock=JSON.parse(await fs.readFile(path.join(root,'research-sources.json'),'utf8'));
 assert.equal(lock.kDense.skills.length,7);
 for(const name of required){
  await fs.access(path.join(source,name,'SKILL.md'));
  await fs.access(path.join(office,'.pi/skills',name,'SKILL.md'));
 }
 for(const name of required.filter(x=>x!=='last30days'))await fs.access(path.join(source,name,'UPSTREAM-LICENSE.md'));
 await fs.access(path.join(source,'last30days/UPSTREAM-LICENSE'));
 await fs.access(path.join(source,'last30days/UPSTREAM-SKILL.md'));
});
test('Research vendoring preserves the local literature-review method across repeated refreshes',async t=>{
 const d=await temp(t),upstream=path.join(d,'upstream'),firm=path.join(d,'firm');
 const addition=await fs.readFile(path.join(root,'research-additions/literature-review.md'),'utf8');
 const expected=await fs.readFile(path.join(root,'skills/research/literature-review/SKILL.md'),'utf8');
 assert(expected.includes(addition+'\n'));
 for(const name of required){
  const dir=path.join(upstream,'skills',name);await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,'SKILL.md'),name==='literature-review'?expected.replace(addition+'\n',''):`# ${name}\n`);
 }
 await fs.mkdir(path.join(upstream,'skills/last30days/scripts'));
 await fs.writeFile(path.join(upstream,'skills/last30days/scripts/last30days.py'),'# Fixture engine\n');
 for(const file of ['LICENSE','LICENSE.md'])await fs.writeFile(path.join(upstream,file),'Fixture license\n');
 const git=(...args)=>execFileSync('git',['-C',upstream,...args],{encoding:'utf8'});
 git('init','-q');git('add','.');
 git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Fixture upstream');
 const commit=git('rev-parse','HEAD').trim();
 await fs.mkdir(path.join(firm,'scripts'),{recursive:true});
 for(const file of ['vendor-research.mjs','research-last30days-runner.mjs'])await fs.copyFile(path.join(root,'scripts',file),path.join(firm,'scripts',file));
 await fs.cp(path.join(root,'research-additions'),path.join(firm,'research-additions'),{recursive:true});
 await fs.writeFile(path.join(firm,'research-sources.json'),JSON.stringify({
  kDense:{repository:upstream,commit,skills:required.filter(name=>name!=='last30days')},
  last30days:{repository:upstream,commit}
 }));
 for(let run=0;run<2;run++){
  const result=spawnSync(process.execPath,[path.join(firm,'scripts/vendor-research.mjs')],{encoding:'utf8',timeout:30000});
  assert.equal(result.status,0,result.stderr);
  assert.equal(await fs.readFile(path.join(firm,'skills/research/literature-review/SKILL.md'),'utf8'),expected);
 }
});
test('last30days direct engine is not the HQ entrypoint; safe runner rejects unsupported flags',async()=>{
 const rootSkill=path.join(root,'skills/research/last30days');
 const text=await fs.readFile(path.join(rootSkill,'SKILL.md'),'utf8');
 assert.match(text,/HQ-safe entrypoint/);
 const wrapper=await fs.readFile(path.join(rootSkill,'scripts/hq-safe-run.mjs'),'utf8');
 for(const term of ["AGENTCOOKIE:'off'","FROM_BROWSER:'off'","BROWSER_CONSENT:'false'","LAST30DAYS_CONFIG_DIR","XDG_CONFIG_HOME"])assert(wrapper.includes(term),term);
 const r=spawnSync(process.execPath,[path.join(rootSkill,'scripts/hq-safe-run.mjs'),'--publish-html'],{encoding:'utf8'});
 assert.equal(r.status,2);assert.match(r.stderr,/Usage/);
});

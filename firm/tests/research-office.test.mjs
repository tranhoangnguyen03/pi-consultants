import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
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
test('last30days direct engine is not the HQ entrypoint; safe runner rejects unsupported flags',async()=>{
 const rootSkill=path.join(root,'skills/research/last30days');
 const text=await fs.readFile(path.join(rootSkill,'SKILL.md'),'utf8');
 assert.match(text,/HQ-safe entrypoint/);
 const wrapper=await fs.readFile(path.join(rootSkill,'scripts/hq-safe-run.mjs'),'utf8');
 for(const term of ["AGENTCOOKIE:'off'","FROM_BROWSER:'off'","BROWSER_CONSENT:'false'","LAST30DAYS_CONFIG_DIR","XDG_CONFIG_HOME"])assert(wrapper.includes(term),term);
 const r=spawnSync(process.execPath,[path.join(rootSkill,'scripts/hq-safe-run.mjs'),'--publish-html'],{encoding:'utf8'});
 assert.equal(r.status,2);assert.match(r.stderr,/Usage/);
});

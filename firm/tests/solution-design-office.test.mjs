import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildOffice,loadFirm} from '../scripts/factory.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('[EV-G01] Solution Design G builds independently with only shared and own methods',async t=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'hq-solution-'));
 t.after(()=>fs.rm(temp,{recursive:true,force:true}));
 const {offices,toolset}=await loadFirm(root);
 const g=offices.find(o=>o.role==='solution-design');
 assert(g,'G exists in canonical office registry');
 assert.equal(g.letter,'G');
 assert.equal(g.folder,'solution-design-consultant');
 assert.equal(new Set(offices.map(o=>o.letter)).size,offices.length);
 const hq=await buildOffice(root,g,toolset,path.join(temp,g.folder));
 const cfg=JSON.parse(await fs.readFile(path.join(hq,'.pi/hq.json'),'utf8'));
 assert.equal(cfg.role,'solution-design');
 assert.equal(cfg.office.title,'SOLUTION DESIGN');
 assert.equal(cfg.stateDir,'../.hq');
 const skills=(await fs.readdir(path.join(hq,'.pi/skills'))).sort();
 const shared=await fs.readdir(path.join(root,'skills/shared'));
 const own=await fs.readdir(path.join(root,'skills/solution-design'));
 assert.deepEqual(own.sort(),['solution-design-loop','solution-shaping']);
 assert.deepEqual(skills,[...shared,...own].sort());
 for(const name of ['shower','readchk','re0-memo','solution-shaping','solution-design-loop'])assert(skills.includes(name),name);
 for(const name of ['engineering-plan-design','plan-design','impeccable','prism','design-direction'])assert(!skills.includes(name),name);
 const profile=await fs.readFile(path.join(hq,'AGENTS.md'),'utf8');
 assert.match(profile,/consultant G, the solution design consultant/);
 assert.match(profile,/Consultation is the entry point/);
 assert.match(profile,/revisable plan/);
 assert.match(profile,/genuine fresh reviewer/);
 assert.match(profile,/Do not require referrals/);
 const marker=JSON.parse(await fs.readFile(path.join(hq,'HQ-ROLE.json'),'utf8'));
 assert.equal(marker.role,'solution-design');
 assert.equal(marker.folder,'solution-design-consultant');
 assert(Object.keys(marker.generated).some(k=>k.startsWith('.pi/skills/solution-shaping/')));
 assert(!Object.keys(marker.generated).some(k=>k.startsWith('.pi/skills/design-direction/')));
 assert(!Object.keys(marker.generated).some(k=>k.startsWith('.pi/skills/plan-design/')));
 const settings=JSON.parse(await fs.readFile(path.join(hq,'.pi/settings.json'),'utf8'));
 assert.deepEqual(settings.packages,toolset.packages,'no role-only dependencies');
 assert.equal((await fs.readdir(path.join(hq,'.pi/prompts'))).length,3,'same light HQ interface');
});

test('[EV-G02] G reuses shared cold-read rather than deploying an invented reviewer runtime',async()=>{
 const [loop,shaping,shared]=await Promise.all([
  fs.readFile(path.join(root,'skills/solution-design/solution-design-loop/SKILL.md'),'utf8'),
  fs.readFile(path.join(root,'skills/solution-design/solution-shaping/SKILL.md'),'utf8'),
  fs.readFile(path.join(root,'skills/shared/shower/SKILL.md'),'utf8'),
 ]);
 assert.match(loop,/consultant-shower/);
 assert.match(loop,/Never claim independence for self-critique/);
 assert.match(loop,/Do not require zero objections/);
 assert.match(shaping,/agreed design lives at its Site/);
 assert.match(shared,/If a genuine fresh reviewer is unavailable/);
});

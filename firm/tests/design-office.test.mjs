import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildOffice,loadFirm} from '../scripts/factory.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('[EV-F01] F builds as an isolated design HQ with only its own and shared skills',async t=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'hq-design-'));
 t.after(()=>fs.rm(temp,{recursive:true,force:true}));
 const {offices,toolset}=await loadFirm(root);
 const f=offices.find(o=>o.role==='design');
 assert(f);assert.equal(f.letter,'F');
 const hq=await buildOffice(root,f,toolset,path.join(temp,f.folder));
 const cfg=JSON.parse(await fs.readFile(path.join(hq,'.pi/hq.json'),'utf8'));
 assert.equal(cfg.role,'design');assert.equal(cfg.stateDir,'../.hq');
 const skills=(await fs.readdir(path.join(hq,'.pi/skills'))).sort();
 assert.deepEqual(skills,[...await fs.readdir(path.join(root,'skills/shared')),...await fs.readdir(path.join(root,'skills/design'))].sort());
 for(const skill of ['design-direction','frontend-implementation','visual-review','composition'])assert(skills.includes(skill),skill);
 for(const skill of ['ui-critique','asd-ste100','prism'])assert(!skills.includes(skill),skill);
 const profile=await fs.readFile(path.join(hq,'AGENTS.md'),'utf8');
 assert.match(profile,/consultant F, the design and front-end consultant/);
 assert.match(profile,/visual character/);assert.match(profile,/Consultation is the entry point/);
 const marker=JSON.parse(await fs.readFile(path.join(hq,'HQ-ROLE.json'),'utf8'));
 assert.equal(marker.role,'design');
 assert(Object.keys(marker.generated).some(k=>k.startsWith('.pi/skills/design-direction/')));
 assert(!Object.keys(marker.generated).some(k=>k.includes('/ui-critique/')));
});

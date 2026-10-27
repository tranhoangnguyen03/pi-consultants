import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildOffice,loadFirm} from '../scripts/factory.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=(file,args=[],env={})=>spawnSync(process.execPath,[file,...args],{encoding:'utf8',env:{...process.env,...env}});

test('F and E receive only their own optional capabilities',async t=>{
 const d=await fs.mkdtemp(path.join(os.tmpdir(),'hq-tool-'));t.after(()=>fs.rm(d,{recursive:true,force:true}));
 const {offices,toolset}=await loadFirm(root);
 for(const role of ['design','research']){
  const office=offices.find(x=>x.role===role),hq=await buildOffice(root,office,toolset,path.join(d,office.folder));
  const skills=await fs.readdir(path.join(hq,'.pi/skills'));
  if(role==='design'){assert(skills.includes('pixel-art-production'));assert(skills.includes('open-toonz-animation'));assert(!skills.includes('facebook-community-research'));}
  else {assert(skills.includes('facebook-community-research'));assert(!skills.includes('pixel-art-production'));}
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(hq,'.pi/settings.json'),'utf8')).packages,toolset.packages);
 }
});
test('Pxl wrapper refuses unknown installation and removes model credentials from child',async t=>{
 const d=await fs.mkdtemp(path.join(os.tmpdir(),'pxl-fake-'));t.after(()=>fs.rm(d,{recursive:true,force:true}));
 const adapter=path.join(root,'skills/design/pixel-art-production/scripts/pxl.mjs');
 assert.equal(run(adapter,['build','art.px.js'],{PXL_CLI:''}).status,2);
 const fake=path.join(d,'fake-pxl.js');
 await fs.writeFile(fake,"console.log(JSON.stringify({args:process.argv.slice(2),key:process.env.OPENAI_API_KEY??null}));\n");
 const r=run(adapter,['build','art.px.js'],{PXL_CLI:fake,OPENAI_API_KEY:'test-secret'});
 assert.equal(r.status,0,r.stderr);
 assert.deepEqual(JSON.parse(r.stdout),{args:['build','art.px.js'],key:null});
});
test('Facebook adapter blocks all write actions and requires platform permission',async t=>{
 const d=await fs.mkdtemp(path.join(os.tmpdir(),'fb-fake-'));t.after(()=>fs.rm(d,{recursive:true,force:true}));
 const adapter=path.join(root,'skills/research/facebook-community-research/scripts/fb-read.mjs');
 for(const cmd of ['post','send','comment','react','delete','unsend','login','batch','eval','page','unlock','shot']){
  assert.equal(run(adapter,[cmd,'x'],{FB_RESEARCH_PERMISSION:'explicit-authorization'}).status,2,cmd);
 }
 assert.equal(run(adapter,['search','topic'],{FB_RESEARCH_PERMISSION:''}).status,2);
 const fake=path.join(d,'fb-mock');
 await fs.writeFile(fake,"#!/bin/sh\nprintf '%s\\n' \"$@\"\n");await fs.chmod(fake,0o755);
 const r=run(adapter,['search','one topic','--type','posts'],{FB_RESEARCH_PERMISSION:'explicit-authorization',FB_BIN:fake});
 assert.equal(r.status,0,r.stderr);assert.deepEqual(r.stdout.trim().split('\n'),['search','one topic','--type','posts']);
 assert.equal(run(adapter,['view','p123','--eval'],{FB_RESEARCH_PERMISSION:'explicit-authorization',FB_BIN:fake}).status,2);
});
test('OpenToonz probe never renders, only reports installed binaries',()=>{
 const r=run(path.join(root,'skills/design/open-toonz-animation/scripts/doctor.mjs'),[],{OPENTOONZ_TCOMPOSER:'/missing/opentoonz-binary'});
 assert.equal(r.status,0,r.stderr);
 const d=JSON.parse(r.stdout);assert.equal(d.tcomposer,false);assert.match(d.meaning,/NOT verified/);
});

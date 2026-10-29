#!/usr/bin/env node
/** Opt-in, network/browser test with synthetic content only. No model calls, accounts or credentials. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadFirm,buildOffice} from './factory.mjs';
import {serve} from '../tests/fixtures/design-evidence/site.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'f-browser-smoke-')),server=await serve();
const output=path.resolve(process.argv[2]??path.join(root,'results/design-evidence'));
try{
 const {offices,toolset}=await loadFirm(root),definition=offices.find(o=>o.role==='design');
 const hq=await buildOffice(root,definition,toolset,path.join(tmp,'design office'));
 const worksite=path.join(tmp,'visited project');await fs.mkdir(worksite);
 const caseDir=path.join(hq,'.hq/cases/synthetic/visual');await fs.mkdir(caseDir,{recursive:true});
 const before=JSON.stringify({version:2,client:'synthetic',project:'visual',papers:[],notes:[]});await fs.writeFile(path.join(caseDir,'case.json'),before);
 const alias=path.join(tmp,'office-alias');await fs.symlink(hq,alias,'dir');
 const script=path.join(alias,'.pi/skills/visual-review/scripts/visual-qa.mjs');
 const origin='http://127.0.0.1:'+server.address().port;
 const run=async suffix=>new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[script,'capture','--case','synthetic/visual','--build','production',origin+'/landing'+suffix,origin+'/app'+suffix],{cwd:worksite,stdio:['ignore','pipe','inherit']});let text='';child.stdout.on('data',x=>text+=x);child.on('error',reject);child.on('exit',code=>{try{assert.equal(code,0,'capture failed: '+text);resolve(JSON.parse(text));}catch(e){reject(e);}});
 });
 const broken=await run('?broken=1'),fixed=await run('');assert.notEqual(broken.run,fixed.run);
 const read=async run=>JSON.parse(await fs.readFile(path.join(run,'manifest.json'),'utf8'));
 const bad=await read(broken.run),good=await read(fixed.run);
 for(const report of [bad,good]){
  assert.equal(report.status,'captured');assert.equal(report.pages.length,2);
  for(const p of report.pages)assert.equal(p.variants.length,3);
 }
 for(let i=0;i<2;i++){
  const b=bad.pages[i].variants.find(v=>v.name==='mobile'),g=good.pages[i].variants.find(v=>v.name==='mobile');
  assert.equal(b.dom.overflow,true);assert.equal(g.dom.overflow,false);
  assert(b.accessibility.violations.some(v=>v.id==='button-name'));assert(!g.accessibility.violations.some(v=>v.id==='button-name'));
  const reduced=good.pages[i].variants.find(v=>v.name==='reduced');assert.equal(reduced.dom.reducedMotion,true);
  for(const v of good.pages[i].variants)for(const file of v.files)assert((await fs.stat(path.join(fixed.run,file))).size>0);
 }
 assert.equal(await fs.readFile(path.join(caseDir,'case.json'),'utf8'),before);assert.deepEqual(await fs.readdir(worksite),[]);
 await fs.mkdir(output,{recursive:true});for(const [name,run] of [['broken',broken.run],['fixed',fixed.run]])await fs.cp(run,path.join(output,name),{recursive:true});
 console.log('Real Chromium + axe: both page types captured; seeded mobile overflow and unnamed buttons detected, fixes observed; case/project unchanged.');
 console.log('Synthetic evidence only. No claim of improved model output, user validation or live Pi startup. Artifacts: '+output);
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await fs.rm(tmp,{recursive:true,force:true});}

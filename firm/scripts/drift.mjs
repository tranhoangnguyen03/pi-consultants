#!/usr/bin/env node
/** Drift check: the offices in DIR (default: <repo>/offices) must match what firm/ builds now. Exit 1 lists every difference. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readJSON,hash} from '../src/util.mjs';
import {loadFirm,buildOffice} from './factory.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.resolve(process.argv[2]??path.join(path.dirname(root),'offices'));
const {offices,toolset}=await loadFirm(root);
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'hq-drift-')),problems=[];
try{
 for(const office of offices){
  const shipped=path.join(dir,office.folder);
  if(!await fs.access(shipped).then(()=>true,()=>false)){problems.push(`${office.folder}: missing`);continue;}
  const next=(await readJSON(path.join(await buildOffice(root,office,toolset,path.join(tmp,office.folder)),'HQ-ROLE.json'))).generated;
  const old=(await readJSON(path.join(shipped,'HQ-ROLE.json'),{})).generated??{};
  for(const p of Object.keys(next)){const actual=await fs.readFile(path.join(shipped,p)).then(hash,()=>null);if(actual!==next[p])problems.push(`${office.folder}/${p}: ${actual?'differs':'missing'}`);}
  for(const p of Object.keys(old))if(!(p in next)&&await fs.access(path.join(shipped,p)).then(()=>true,()=>false))problems.push(`${office.folder}/${p}: no longer shipped`);
 }
}finally{await fs.rm(tmp,{recursive:true,force:true});}
if(problems.length){console.error(`Shipped offices differ from firm/. Rebuild them (npm run setup -- --rebuild) before release:\n  ${problems.join('\n  ')}`);process.exitCode=1;}
else console.log(`Shipped offices in ${dir} match firm/.`);

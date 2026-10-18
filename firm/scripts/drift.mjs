#!/usr/bin/env node
/** Drift check: the offices in DIR (default: <repo>/offices) must match what firm/ builds now. Exit 1 lists every difference. */
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readJSON,hash,canonical} from '../src/util.mjs';
import {loadFirm,buildOffice} from './factory.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.resolve(process.argv[2]??path.join(path.dirname(root),'offices'));
const {offices,toolset}=await loadFirm(root);
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'hq-drift-')),problems=[];
const rel=p=>p.split(path.sep).join('/');

/** Tracked files under dir, as paths relative to dir, from git. Outside a git repository (an --out directory) there is no authoritative file list, so the unlisted-file check is skipped. */
function tracked(below){
 const r=spawnSync('git',['-C',below,'ls-files'],{encoding:'utf8'});
 return r.status===0?r.stdout.split('\n').filter(Boolean).map(p=>path.join(below,p)):null;
}

try{
 // Build every office once; the fresh marker is the reference for both checks below.
 const fresh=new Map();
 for(const office of offices)fresh.set(office.folder,await readJSON(path.join(await buildOffice(root,office,toolset,path.join(tmp,office.folder)),'HQ-ROLE.json')));
 for(const office of offices){
  const shipped=path.join(dir,office.folder),next=fresh.get(office.folder);
  if(!await fs.access(shipped).then(()=>true,()=>false)){problems.push(`${office.folder}: missing`);continue;}
  const old=await readJSON(path.join(shipped,'HQ-ROLE.json'),null);
  // Whole-marker comparison: catches version, role and stale fields that generated-file hashes cannot see.
  if(!old)problems.push(`${office.folder}: no HQ-ROLE.json`);
  else if(canonical(old)!==canonical(next))problems.push(`${office.folder}/HQ-ROLE.json: differs from a fresh build`);
  for(const [p,digest] of Object.entries(next.generated)){
   const actual=await fs.readFile(path.join(shipped,p)).then(hash,()=>null);
   if(actual!==digest)problems.push(`${office.folder}/${rel(p)}: ${actual?'differs':'missing'}`);
  }
 }
 // Unlisted files: a file committed under an office that the factory does not produce. Pi auto-loads .pi/extensions and .pi/skills, so an unlisted file is executable code the gate would otherwise pass.
 const all=tracked(dir);
 if(all===null)console.warn('Not a git repository: skipping the unlisted-file check (no authoritative file list).');
 else for(const file of all){
  const office=offices.find(o=>file.startsWith(path.join(dir,o.folder)+path.sep));
  if(!office){problems.push(`${rel(path.relative(dir,file))}: outside any shipped office; the factory does not produce it`);continue;}
  const name=rel(path.relative(path.join(dir,office.folder),file));
  if(name!=='HQ-ROLE.json'&&!(name in fresh.get(office.folder).generated))problems.push(`${office.folder}/${name}: not produced by the factory; remove it or move it into firm/`);
 }
}finally{await fs.rm(tmp,{recursive:true,force:true});}
if(problems.length){console.error(`Shipped offices differ from firm/. Rebuild them (npm run setup -- --rebuild) before release:\n  ${problems.join('\n  ')}`);process.exitCode=1;}
else console.log(`Shipped offices in ${dir} match firm/.`);

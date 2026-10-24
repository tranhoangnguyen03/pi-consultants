#!/usr/bin/env node
/** Dependency-free skill metadata and office routing checks. Run against canonical firm/ and shipped offices/. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const firm=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo=path.dirname(firm);
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg);};
const entries=async dir=>fs.readdir(dir,{withFileTypes:true});
const read=async file=>fs.readFile(file,'utf8');

export function skillHeader(text,where='SKILL.md'){
 const match=text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
 if(!match)throw new Error(`${where}: missing complete frontmatter`);
 const props={};let inMetadata=false;
 for(const line of match[1].split(/\r?\n/)){
  if(!line.trim())continue;
  // Routing uses top-level fields, not the upstream metadata mapping.
  if(inMetadata&&/^ +\S/.test(line))continue;
  const m=line.match(/^([a-z][a-z0-9-]*):\s*(.*)$/);
  if(!m)throw new Error(`${where}: invalid frontmatter line: ${line}`);
  const [,key,value]=m;
  if(Object.hasOwn(props,key))throw new Error(`${where}: duplicate frontmatter key ${key}`);
  if(!value&&key!=='metadata')throw new Error(`${where}: empty frontmatter field ${key}`);
  props[key]=value.trim().replace(/^["']([\s\S]*)["']$/,'$1');
  inMetadata=key==='metadata'&&!value;
 }
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(props.name??''))throw new Error(`${where}: invalid skill name`);
 if(!props.description?.trim()||props.description.length>1024)throw new Error(`${where}: missing or overlong description`);
 if(props['disable-model-invocation']!==undefined&&!['true','false'].includes(props['disable-model-invocation']))
  throw new Error(`${where}: disable-model-invocation must be true or false`);
 return props;
}

async function sourceSkills(role){
 const dir=path.join(firm,'skills',role);
 const out=[];
 for(const item of await entries(dir)){
  check(item.isDirectory(),`${dir}: only skill directories belong at this level (${item.name})`);
  if(!item.isDirectory())continue;
  const skill=path.join(dir,item.name,'SKILL.md');
  try{out.push({dir:item.name,header:skillHeader(await read(skill),skill)});}
  catch(e){failures.push(e.message);}
 }
 return out;
}
const offices=JSON.parse(await read(path.join(firm,'offices.json')));
const roles=new Set(offices.map(o=>o.role));
check(roles.size===offices.length,'office roles must be unique for source selection');
const shared=await sourceSkills('shared');
const roleSkills=Object.fromEntries(await Promise.all([...roles].map(async role=>[role,await sourceSkills(role)])));
for(const office of offices){
 const expected=[...shared,...roleSkills[office.role]],seen=new Set();
 for(const skill of expected){
  check(!seen.has(skill.header.name),`${office.folder}: duplicate skill name ${skill.header.name}`);
  seen.add(skill.header.name);
 }
 const deployed=path.join(repo,'offices',office.folder,'.pi','skills');
 try{
  const actual=await entries(deployed);
  const expectedDirs=expected.map(x=>x.dir).sort();
  check(JSON.stringify(actual.map(x=>x.name).sort())===JSON.stringify(expectedDirs),
   `${office.folder}: deployed skill directories do not match firm source`);
  for(const e of actual){
   check(e.isDirectory(),`${office.folder}: unexpected file or link in .pi/skills: ${e.name}`);
   if(!e.isDirectory())continue;
   const file=path.join(deployed,e.name,'SKILL.md');
   try{
    const hdr=skillHeader(await read(file),file);
    const source=expected.find(x=>x.dir===e.name);
    check(source?.header.name===hdr.name,`${office.folder}: wrong skill identity for ${e.name}`);
   }catch(err){failures.push(err.message);}
  }
 }catch(e){failures.push(`${office.folder}: ${e.message}`);}
}
if(failures.length){console.error('Skill and role checks failed:\n'+failures.map(x=>` - ${x}`).join('\n'));process.exitCode=1;}
else console.log(`Skill and role checks passed: ${offices.length} offices, ${shared.length} shared skills, ${[...roles].reduce((n,r)=>n+roleSkills[r].length,0)} role skills.`);

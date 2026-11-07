import fs from 'node:fs/promises';
import path from 'node:path';
import {locked,atomic,assert,hash} from './util.mjs';

// Operator must quiesce old writers first; a new lock cannot constrain already-loaded legacy code.
export async function upgradeCase(store,client,project,{backupRoot,quiesced=false}={}) {
 assert(quiesced,'Stop all writers and confirm quiesced before upgrading');
 assert(path.isAbsolute(backupRoot??''),'Provide an absolute private backupRoot outside case discovery');
 const root=await fs.realpath(store.root);await fs.mkdir(backupRoot,{recursive:true,mode:0o700});const backup=await fs.realpath(backupRoot);
 const rel=path.relative(root,backup);assert(rel==='..'||rel.startsWith(`..${path.sep}`)||path.isAbsolute(rel),'Backups must be outside case discovery');
 const dir=store.directory(client,project);
 return locked(dir,async()=>{
  const file=path.join(dir,'case.json'),bytes=await fs.readFile(file);const c=JSON.parse(bytes);
  assert([1,2].includes(c.version),'Unsupported case version');
  if(c.version===2)return {status:'already-upgraded',caseKey:`${client}/${project}`};
  assert(c.client===client&&c.project===project,'Case identity does not match its directory');
  const saved=path.join(backup,`${client}--${project}--${hash(bytes)}.json`);
  try{const handle=await fs.open(saved,'wx',0o600);try{await handle.writeFile(bytes);await handle.sync();}finally{await handle.close();}}catch(e){if(e.code!=='EEXIST')throw e;assert((await fs.readFile(saved)).equals(bytes),'Backup differs; refusing upgrade');}
  const backupDir=await fs.open(backup,'r');try{await backupDir.sync();}finally{await backupDir.close();}
  // Preserve unknown fields and legacy notes without invented attribution or objective history.
  c.version=2;c.navigation??=null;c.workRefs??=[];c.engagements??=[];c.papers??=[];
  await atomic(file,c);return {status:'upgraded',caseKey:`${client}/${project}`,backup:saved,sha256:hash(bytes),recovery:'Do not overwrite newer work with this backup. Quiesce writers and compare before any separately authorized restore.'};
 });
}

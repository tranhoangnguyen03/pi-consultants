#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(['node_modules','.git','.runtime','results'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else files.push(p);}}
await walk(root);const errors=[];let js=0,json=0;
for(const p of files){if(p.endsWith('.mjs')){js++;const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status!==0)errors.push(`${path.relative(root,p)}: ${r.stderr}`);}if(p.endsWith('.json')){json++;try{JSON.parse(await fs.readFile(p,'utf8'));}catch(e){errors.push(`${p}: ${e.message}`);}}}
const skills=files.filter(p=>p.endsWith('SKILL.md'));
for(const p of skills){
 const content=await fs.readFile(p,'utf8');
 const end=content.startsWith('---\n')?content.indexOf('\n---\n',4):-1;
 const header=end>=0?content.slice(4,end):'';
 const name=header.match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1];
 const description=header.match(/^description:\s*(.+)$/m)?.[1];
 if(!name||!description?.trim())errors.push('Invalid Agent Skills frontmatter: '+p);
}
console.log(`Syntax checked ${js} ESM files; parsed ${json} JSON files; checked ${skills.length} skill headers.`);
console.log('This is syntax/structure validation, not TypeScript host compatibility or a model-quality evaluation.');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('Structure checks passed.');

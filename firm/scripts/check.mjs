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
const skills=files.filter(p=>p.endsWith('SKILL.md'));for(const p of skills){const text=await fs.readFile(p,'utf8');if(!/^---\nname: [a-z0-9-]+\ndescription: .+\n(?:disable-model-invocation: true\n)?---/m.test(text))errors.push(`Invalid minimal skill frontmatter: ${p}`);}
console.log(`Syntax checked ${js} ESM files; parsed ${json} JSON files; checked ${skills.length} skill headers.`);
console.log('This is syntax/structure validation, not TypeScript host compatibility or a model-quality evaluation.');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('Structure checks passed.');

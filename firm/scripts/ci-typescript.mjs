#!/usr/bin/env node
/** Parse native TypeScript entrypoints with the selected Node runtime; host API behavior is checked by npm test. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const firm=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo=path.dirname(firm);
const offices=JSON.parse(await fs.readFile(path.join(firm,'offices.json'),'utf8'));
const files=[path.join(firm,'extensions/index.ts'),...offices.map(x=>path.join(repo,'offices',x.folder,'.pi/extensions/consultant.ts'))];
let failed=0;
for(const file of files){
 const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
 if(result.status!==0){failed++;console.error(`${file}: ${result.stderr}`);}
}
if(failed)process.exitCode=1;
else console.log(`TypeScript entry syntax passed (${files.length} entries). Simulated extension host contracts run in npm test; this is not full type checking.`);

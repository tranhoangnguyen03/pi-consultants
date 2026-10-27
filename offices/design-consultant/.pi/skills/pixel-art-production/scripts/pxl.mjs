#!/usr/bin/env node
// Explicitly configured local Pxl: no automatic install or model credentials.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const cli=process.env.PXL_CLI;
const available=Boolean(cli&&path.isAbsolute(cli)&&cli.endsWith('.js')&&fs.existsSync(cli)&&fs.statSync(cli).isFile());
const v=process.versions.node.split('.').map(Number);
const supported=v[0]>22||(v[0]===22&&v[1]>=18);
const cmd=process.argv[2];
if(cmd==='doctor'){
 console.log(JSON.stringify({node:process.versions.node,nodeSupported:supported,configured:available,cli:available?cli:null,needs:'PXL_CLI=/absolute/reviewed/claude-pxl/bin/pxl.js'},null,2));
 process.exitCode=available&&supported?0:1;
}else if(!['build','serve','ascii','list'].includes(cmd??'')){
 console.error('Usage: node pxl.mjs doctor|build|serve|ascii|list [Pxl arguments]');process.exitCode=2;
}else if(!supported||!available){
 console.error('Pxl unavailable: Node >=22.18 and a reviewed absolute PXL_CLI are required');process.exitCode=2;
}else{
 const env={PATH:process.env.PATH??'',HOME:process.env.HOME??'',TMPDIR:process.env.TMPDIR??'',LANG:process.env.LANG??''};
 const run=spawnSync(process.execPath,[cli,...process.argv.slice(2)],{cwd:process.cwd(),stdio:'inherit',env});
 if(run.error){console.error(run.error.message);process.exitCode=1;}else process.exitCode=run.status??1;
}

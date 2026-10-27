#!/usr/bin/env node
// Optional CLI invocation, strictly limited to read commands. No login or automation setup.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const commands=new Set(['feed','posts','view','profile','search']);
const cmd=process.argv[2],args=process.argv.slice(3),binary=process.env.FB_BIN??'fb';
const fileOk=!path.isAbsolute(binary)||fs.existsSync(binary);
if(cmd==='doctor'){
 console.log(JSON.stringify({readOnly:true,installed:'not checked: browser is never started by doctor',binary:fileOk?binary:null,authorized:process.env.FB_RESEARCH_PERMISSION==='explicit-authorization',needs:'documented platform permission and reviewed local fb executable'},null,2));
}else if(!commands.has(cmd)){
 console.error('Blocked: only feed, posts, view, profile, search and doctor are supported; no mutation, messaging, batch, login or browser escape');process.exitCode=2;
}else if(process.env.FB_RESEARCH_PERMISSION!=='explicit-authorization'){
 console.error('Blocked: Meta platform permission must pre-exist; set FB_RESEARCH_PERMISSION=explicit-authorization only when authorized');process.exitCode=2;
}else if(!fileOk||args.some(a=>['--eval','--batch','--from','--visible'].includes(a))){
 console.error('Blocked: unsupported binary path or flag in read-only research adapter');process.exitCode=2;
}else{
 const result=spawnSync(binary,[cmd,...args],{cwd:process.cwd(),stdio:'inherit',env:process.env});
 if(result.error){console.error(result.error.message);process.exitCode=1;}else process.exitCode=result.status??1;
}

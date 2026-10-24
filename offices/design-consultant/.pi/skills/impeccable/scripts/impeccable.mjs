#!/usr/bin/env node
/** F-only Impeccable detector: HQ-owned tooling; client project remains read-only. */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const PIN={package:'4.7.0',engine:'0.1.16'};
export const officeRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..');
const toolRoot=path.join(officeRoot,'.hq','tools','impeccable-'+PIN.package);
const packageFile=path.join(toolRoot,'node_modules','impeccable','package.json');
const runnerFile=path.join(toolRoot,'node_modules','impeccable','cli','bin','cli.js');

function safeEnv(source=process.env,caller=process.cwd()){
 const home=path.join(toolRoot,'home');
 const env={
  PATH:source.PATH??'',HOME:home,USERPROFILE:home,
  XDG_CONFIG_HOME:path.join(home,'.config'),XDG_CACHE_HOME:path.join(home,'.cache'),
  XDG_STATE_HOME:path.join(home,'.state'),
  TMPDIR:path.join(toolRoot,'tmp'),TMP:path.join(toolRoot,'tmp'),TEMP:path.join(toolRoot,'tmp'),
  npm_config_cache:path.join(toolRoot,'npm-cache'),npm_config_userconfig:path.join(home,'.npmrc'),
  npm_config_audit:'false',npm_config_fund:'false',npm_config_update_notifier:'false',
  npm_config_ignore_scripts:'true',
  IMPECCABLE_HOME:path.join(toolRoot,'state'),
  IMPECCABLE_NO_TELEMETRY:'1',DO_NOT_TRACK:'1'
 };
 for(const k of ['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','http_proxy','https_proxy','all_proxy','no_proxy','SYSTEMROOT','WINDIR','COMSPEC']){
  if(source[k])env[k]=source[k];
 }
 for(const k of ['NODE_EXTRA_CA_CERTS','SSL_CERT_FILE']){
  if(source[k])env[k]=path.resolve(caller,source[k]);
 }
 return env;
}
function assertVersion(){
 if(!fs.existsSync(packageFile))return false;
 let pkg;
 try{pkg=JSON.parse(fs.readFileSync(packageFile,'utf8'));}
 catch{throw new Error('Impeccable installation has an invalid package manifest; inspect private HQ tools.');}
 if(pkg.version!==PIN.package)throw new Error('Impeccable version mismatch: expected '+PIN.package+', found '+pkg.version+'. Do not update automatically.');
 if(!Object.values(pkg.optionalDependencies??{}).includes(PIN.engine))throw new Error('Impeccable engine pin mismatch; expected '+PIN.engine+'.');
 if(!fs.existsSync(runnerFile))throw new Error('Impeccable CLI missing; local HQ installation is incomplete.');
 return true;
}
function prepare(){
 for(const p of [toolRoot,path.join(toolRoot,'home'),path.join(toolRoot,'tmp')])fs.mkdirSync(p,{recursive:true,mode:0o700});
}

function withinOffice(candidate,realOffice){
 return candidate===realOffice||candidate.startsWith(realOffice+path.sep);
}
function requireGeneratedOffice(){
 const hqConfig=path.join(officeRoot,'.pi/hq.json');
 if(!fs.existsSync(hqConfig))throw new Error('Run the copy shipped in a generated consultant office.');
 let config;
 try{config=JSON.parse(fs.readFileSync(hqConfig,'utf8'));}
 catch{throw new Error('Generated consultant office has unreadable .pi/hq.json.');}
 if(config.role!=='design')throw new Error('Impeccable integration belongs to the design consultant office.');
 return fs.realpathSync(officeRoot);
}
function detectInvocation(args,caller,realOffice){
 // Pi starts in the office; /cd moves the execution cwd to the client project.
 // --project is optional for explicit paths; the older <project> <target> form remains valid.
 const valueFlags=new Set(['--scope','--viewport','--cdp','--target']);
 const switches=new Set(['--json','--quiet','--no-advisory','--no-config','--no-inline-ignores','--no-design-system','--no-consent-hiding','--no-overlay-hiding','--fast','--gpt','--gemini']);
 let project=null,forwarded=[],positional=[],cdp=false,viewport=false,pageTarget=false;
 for(let i=0;i<args.length;i++){
  const raw=args[i],flag=raw.startsWith('--')?raw.split('=',1)[0]:null;
  if(flag==='--project'){
   const value=raw.includes('=')?raw.slice(raw.indexOf('=')+1):args[++i];
   if(!value||value.startsWith('--')||project!==null)throw new Error('Use --project <client-directory> once.');
   project=value;
   continue;
  }
  if(flag&&valueFlags.has(flag)){
   const value=raw.includes('=')?raw.slice(raw.indexOf('=')+1):args[++i];
   if(!value||value.startsWith('--'))throw new Error(flag+' requires a value.');
   if(flag==='--cdp')cdp=true;
   if(flag==='--viewport')viewport=true;
   if(flag==='--target')pageTarget=true;
   if(raw.includes('='))forwarded.push(raw);
   else forwarded.push(flag,value);
   continue;
  }
  if(flag){
   if(!switches.has(raw))throw new Error('Unsupported detector flag '+raw+'. Pass an explicit file or URL target.');
   forwarded.push(raw);continue;
  }
  if(raw.startsWith('-'))throw new Error('Unsupported detector flag '+raw);
  positional.push(raw);forwarded.push(raw);
 }
 // Compatibility with previously documented: detect /project src/
 if(project===null&&positional.length>=2&&path.isAbsolute(positional[0])&&fs.existsSync(positional[0])&&fs.statSync(positional[0]).isDirectory()){
  project=positional.shift();
  forwarded.splice(forwarded.indexOf(project),1);
 }
 // --cdp is a genuine alternate target: a running local Chromium app.
 if(cdp){
  if(positional.length)throw new Error('--cdp scans a running app and takes no file/URL targets.');
  if(viewport)throw new Error('--viewport cannot be combined with --cdp.');
 }else{
  if(pageTarget)throw new Error('--target only selects a page when --cdp is supplied.');
  if(!positional.length)throw new Error('Supply a file, directory or URL to scan; flag values are not targets.');
 }
 const cwd=fs.realpathSync(path.resolve(caller,project??'.'));
 if(!fs.statSync(cwd).isDirectory())throw new Error('Project must be a directory.');
 if(withinOffice(cwd,realOffice))throw new Error('Use /cd to travel to a client repo or pass --project; scanning inside the consultant office is forbidden.');
 for(const target of positional){
  if(/^https?:\/\//i.test(target))continue;
  const local=target.startsWith('file://')?fileURLToPath(target):path.resolve(cwd,target);
  const resolved=fs.existsSync(local)?fs.realpathSync(local):path.resolve(local);
  if(withinOffice(resolved,realOffice))throw new Error('Cannot scan the consultant office or its private files as a client target.');
 }
 return {cwd,targets:forwarded};
}

export function run(argv,{spawn=spawnSync,environment=process.env,caller=process.cwd()}={}){
 const [verb,...args]=argv;
 if(!['install','version','detect'].includes(verb))throw new Error('Use: impeccable.mjs <install|version|detect>. This adapter intentionally excludes upstream init, document, live, generate and project-state workflows.');
 // Must fail before prepare()/npm when invoked from firm/ source.
 const realOffice=requireGeneratedOffice();
 let cwd,targets;
 if(verb==='detect'){
  ({cwd,targets}=detectInvocation(args,caller,realOffice));
 }else if(args.length){throw new Error(verb+' takes no arguments');}
 prepare();
 const env=safeEnv(environment,caller);
 if(!assertVersion()){
  const cmd=['install','--prefix',toolRoot,'--no-save','--no-package-lock','--ignore-scripts','--no-audit','--no-fund','--no-update-notifier','impeccable@'+PIN.package];
  const r=spawn(process.platform==='win32'?'npm.cmd':'npm',cmd,{cwd:toolRoot,env,stdio:['inherit',2,2]});
  if(r.error)throw r.error;
  if(r.status!==0)throw new Error('Impeccable download/install failed (exit '+(r.status??'signal')+'). No change made to the client project.');
  if(!assertVersion())throw new Error('Impeccable install succeeded but pinned CLI was not found.');
 }
 if(verb==='install'||verb==='version'){
  console.log('Impeccable '+PIN.package+' (engine '+PIN.engine+'); installed under private HQ tools. Telemetry disabled.');
  return 0;
 }
 const r=spawn(process.execPath,[runnerFile,'detect','--json',...targets],{cwd,env,stdio:'inherit'});
 if(r.error)throw r.error;
 if(r.status===null)throw new Error('Impeccable detector terminated by '+(r.signal??'unknown signal'));
 // 0=no primary findings; 2=findings; 1=operational failure.
 return r.status;
}

if(process.argv[1]&&fs.realpathSync(process.argv[1])===fileURLToPath(import.meta.url)){
 try{process.exitCode=run(process.argv.slice(2));}
 catch(e){console.error('impeccable-hq: '+e.message);process.exitCode=1;}
}

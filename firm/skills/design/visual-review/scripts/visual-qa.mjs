#!/usr/bin/env node
/** Optional browser evidence for F. No case creation, acceptance, deployment or project writes. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

export const PIN={playwright:'1.57.0','axe-core':'4.10.3'};
const here=path.dirname(fileURLToPath(import.meta.url));
const office=path.resolve(here,'../../../..');
const within=(root,file)=>{const r=path.relative(root,file);return r===''||(!r.startsWith('..'+path.sep)&&r!=='..'&&!path.isAbsolute(r));};
const requireTrue=(ok,message)=>{if(!ok)throw new Error(message);};

export function parse(args){
 const out={command:args[0],urls:[],build:'unknown'};
 requireTrue(['capture','install'].includes(out.command),'Use: visual-qa.mjs capture --case client/project [--build production|development|unknown] [--browser /path/to/chromium] <URL...> | install');
 const allowed=new Set(['--case','--build','--browser']),seen=new Set();
 for(let i=1;i<args.length;i++){
  const a=args[i];
  if(a.startsWith('-')){
   requireTrue(allowed.has(a)&&!seen.has(a),'Unknown or repeated option: '+a);
   const value=args[++i];requireTrue(value&&!value.startsWith('-'),'Missing value for '+a);seen.add(a);out[a.slice(2)]=value;
  }else out.urls.push(a);
 }
 if(out.command==='install'){requireTrue(!seen.size&&!out.urls.length,'install takes no arguments');return out;}
 requireTrue(/^[a-z0-9][a-z0-9_-]{0,79}\/[a-z0-9][a-z0-9_-]{0,79}$/.test(out.case??''),'Supply an existing HQ --case client/project.');
 requireTrue(['production','development','unknown'].includes(out.build),'Invalid --build mode.');
 requireTrue(out.urls.length>0&&out.urls.length<=3,'Supply one to three explicit page URLs; this tool does not crawl.');
 out.urls=out.urls.map(raw=>{const u=new URL(raw);requireTrue(['http:','https:'].includes(u.protocol)&&!u.username&&!u.password,'Use HTTP(S) URLs without embedded credentials.');u.hash='';return u.href;});
 return out;
}

export async function resolveCase(hq,caseKey){
 hq=await fs.realpath(hq);
 await fs.access(path.join(hq,'.pi/hq.json')).catch(()=>{throw new Error('Run the copy shipped in a generated consultant office, not firm/.');});
 const {loadHQConfig}=await import(pathToFileURL(path.join(hq,'.runtime/src/config.mjs')).href);
 const config=await loadHQConfig(path.join(hq,'.pi/hq.json'));
 requireTrue(config.hq===hq&&config.role==='design'&&config.version===2,'Use a generated design office with current HQ configuration.');
 if(!caseKey)return {hq,stateDir:config.stateDir};
 requireTrue(/^[a-z0-9][a-z0-9_-]{0,79}\/[a-z0-9][a-z0-9_-]{0,79}$/.test(caseKey),'Invalid case key.');
 const root=path.join(config.stateDir,'cases'),dir=path.join(root,...caseKey.split('/'));
 // Reject aliasing across cases as well as escapes from this HQ.
 for(const p of [root,...caseKey.split('/').map((_,i,a)=>path.join(root,...a.slice(0,i+1))),path.join(dir,'case.json')]){
  const stat=await fs.lstat(p);requireTrue(!stat.isSymbolicLink(),'Case paths cannot be symlink aliases.');
 }
 const real=await fs.realpath(dir);requireTrue(within(hq,real),'Case resolves outside this HQ.');
 const record=JSON.parse(await fs.readFile(path.join(real,'case.json'),'utf8'));
 requireTrue(record.client+'/'+record.project===caseKey,'Case record identity does not match its path.');
 requireTrue(record.version===2,'Select or explicitly upgrade the case through HQ tools before capture.');
 return {hq,stateDir:config.stateDir,caseDir:real,caseKey};
}

export async function newRun(caseDir){
 let root=caseDir;
 for(const component of ['papers','visual-qa']){
  root=path.join(root,component);
  await fs.mkdir(root,{mode:0o700}).catch(e=>{if(e.code!=='EEXIST')throw e;});
  const stat=await fs.lstat(root);requireTrue(stat.isDirectory()&&!stat.isSymbolicLink(),'Evidence path must be a real case directory.');
 }
 return fs.mkdtemp(path.join(root,new Date().toISOString().replaceAll(':','-')+'-'));
}

export function childEnvironment(tool,source=process.env){
 const home=path.join(tool,'home');
 const env={PATH:source.PATH??'',HOME:home,USERPROFILE:home,TMPDIR:path.join(tool,'tmp'),TMP:path.join(tool,'tmp'),TEMP:path.join(tool,'tmp'),
  XDG_CONFIG_HOME:path.join(home,'.config'),XDG_CACHE_HOME:path.join(home,'.cache'),XDG_STATE_HOME:path.join(home,'.state'),
  PLAYWRIGHT_BROWSERS_PATH:path.join(tool,'browsers'),PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:'1',
  DO_NOT_TRACK:'1',DISABLE_TELEMETRY:'1',NEXT_TELEMETRY_DISABLED:'1',ASTRO_TELEMETRY_DISABLED:'1',
  npm_config_userconfig:path.join(home,'.npmrc'),npm_config_cache:path.join(tool,'npm-cache'),npm_config_ignore_scripts:'true',npm_config_audit:'false',npm_config_fund:'false'};
 for(const k of ['SYSTEMROOT','WINDIR','COMSPEC','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','http_proxy','https_proxy','all_proxy','no_proxy','NODE_EXTRA_CA_CERTS','SSL_CERT_FILE'])if(source[k])env[k]=source[k];
 return env;
}

async function pinned(tool){
 try{for(const [name,version] of Object.entries(PIN))if(JSON.parse(await fs.readFile(path.join(tool,'node_modules',name,'package.json'),'utf8')).version!==version)return false;return true;}catch{return false;}
}
export async function prepareTool(stateDir,{spawn=spawnSync,source=process.env}={}){
 const tool=path.join(stateDir,'tools','visual-qa-'+PIN.playwright+'-'+PIN['axe-core']);
 // Refuse symlinked intermediate directories before any install or cache write.
 for(const dir of [stateDir,path.join(stateDir,'tools'),tool,...['home','tmp'].map(x=>path.join(tool,x))]){
  await fs.mkdir(dir,{mode:0o700}).catch(e=>{if(e.code!=='EEXIST')throw e;});
  requireTrue(!(await fs.lstat(dir)).isSymbolicLink(),'Tool state cannot be a symlink.');
 }
 const env=childEnvironment(tool,source);
 if(!await pinned(tool)){
  const lock=path.join(tool,'.install-lock');await fs.mkdir(lock).catch(()=>{throw new Error('Visual QA installation is locked; check the active installer before retrying.');});
  try{
   if(!await pinned(tool)){
    const result=spawn('npm',['install','--prefix',tool,'--no-save','--ignore-scripts','--no-audit','--no-fund',...Object.entries(PIN).map(([n,v])=>n+'@'+v)],{cwd:tool,env,stdio:['ignore',2,2],timeout:180000});
    requireTrue(!result.error&&result.status===0&&await pinned(tool),'Pinned visual QA download failed. See stderr; no client project was changed.');
   }
  }finally{await fs.rmdir(lock);}
 }
 return {tool,env};
}

function revision(cwd){
 const git=a=>spawnSync('git',['-C',cwd,...a],{encoding:'utf8',timeout:3000});
 const head=git(['rev-parse','HEAD']),state=git(['status','--porcelain']);
 return {head:head.status===0?head.stdout.trim():null,dirty:state.status===0?Boolean(state.stdout.trim()):null};
}

export async function main(args){
 const opts=parse(args),home=await resolveCase(office,opts.command==='capture'?opts.case:null);
 const cwd=await fs.realpath(process.cwd());
 if(opts.command==='capture')requireTrue(!within(home.hq,cwd),'Travel with /cd into the client project before capture. HQ records stay at the office.');
 let browser=opts.browser?await fs.realpath(path.resolve(cwd,opts.browser)):null;
 // Validate case/arguments/cwd before downloads. No project dependencies or records are written.
 const {tool,env}=await prepareTool(home.stateDir);
 if(opts.command==='install'){console.log(JSON.stringify({tool,pins:PIN,telemetry:false}));return 0;}
 const run=await newRun(home.caseDir);
 const spec={version:1,caseKey:opts.case,run,urls:opts.urls,build:{mode:opts.build,basis:'caller-supplied, not independently verified',...revision(cwd)},worksite:cwd,tool,browser,pins:PIN};
 await fs.writeFile(path.join(run,'request.json'),JSON.stringify(spec,null,2)+'\n',{mode:0o600});
 const worker=path.join(here,'capture.mjs');
 const result=spawnSync(process.execPath,[worker,path.join(run,'request.json')],{cwd:tool,env,stdio:['ignore',2,2],timeout:180000});
 let manifest;try{manifest=JSON.parse(await fs.readFile(path.join(run,'manifest.json'),'utf8'));}catch{}
 if(result.error||!manifest||(result.status!==0&&manifest.status==='captured')){
  manifest={...(manifest??spec),status:'incomplete',error:result.error?.message??'Browser capture failed; inspect stderr and retained partial evidence.'};
  await fs.writeFile(path.join(run,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{mode:0o600});
  await fs.writeFile(path.join(run,'report.md'),'# Incomplete visual QA capture\n\n'+manifest.error+'\n\nDo not infer a clean result from missing evidence.\n',{mode:0o600});
 }
 console.log(JSON.stringify({caseKey:opts.case,status:manifest.status,run,report:path.relative(home.caseDir,path.join(run,'report.md')),register:'Use hq_paper with this existing case and relative report path; save only supported findings through hq_note.'},null,2));
 return manifest.status==='captured'?0:1;
}
if(process.argv[1]&&await fs.realpath(process.argv[1]).catch(()=>null)===fileURLToPath(import.meta.url)){
 try{process.exitCode=await main(process.argv.slice(2));}catch(e){console.error('visual-qa: '+e.message);process.exitCode=1;}
}

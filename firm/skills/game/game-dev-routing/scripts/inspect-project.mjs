#!/usr/bin/env node
// Read-only game-engine fingerprint. Evidence is a hint, not a verified engine install.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const text=async p=>fs.readFile(p,'utf8').catch(e=>{if(e.code==='ENOENT'||e.code==='EISDIR')return null;throw e;});
const names=async p=>fs.readdir(p).catch(e=>{if(e.code==='ENOENT')return [];throw e;});
export async function inspect(root){
 const dir=path.resolve(root),list=await names(dir),matches=[];
 const add=(engine,signal,version=null)=>matches.push({engine,signal,version});
 const gd=await text(path.join(dir,'project.godot'));
 if(gd!==null)add('godot','project.godot',gd.match(/config\/features\s*=\s*PackedStringArray\("([^"]+)/)?.[1]??null);
 const un=await text(path.join(dir,'ProjectSettings/ProjectVersion.txt'));
 if(un!==null&&list.includes('Assets'))add('unity','ProjectSettings/ProjectVersion.txt + Assets',un.match(/m_EditorVersion:\s*(\S+)/)?.[1]??null);
 const up=list.find(s=>s.endsWith('.uproject'));
 if(up){let version=null;try{version=JSON.parse(await text(path.join(dir,up))).EngineAssociation??null;}catch{}add('unreal',up,version);}
 const go=await text(path.join(dir,'go.mod'));
 if(go?.includes('github.com/hajimehoshi/ebiten/v2'))add('ebitengine','go.mod',go.match(/github\.com\/hajimehoshi\/ebiten\/v2\s+(v\S+)/)?.[1]??null);
 const cargo=await text(path.join(dir,'Cargo.toml'));
 if(cargo&&/(?:^|\n)\s*bevy\s*=\s*/.test(cargo))add('bevy','Cargo.toml',cargo.match(/(?:^|\n)\s*bevy\s*=\s*["']([^"']+)/)?.[1]??null);
 const pkg=await text(path.join(dir,'package.json'));
 if(pkg)try{const o=JSON.parse(pkg),deps={...o.dependencies,...o.devDependencies};for(const [dep,engine] of [['phaser','phaser'],['pixi.js','pixijs'],['three','threejs']])if(deps[dep])add(engine,'package.json: '+dep,deps[dep]);}catch{}
 if(list.includes('game.project'))add('defold','game.project');
 const lua=await text(path.join(dir,'main.lua'));
 if(list.includes('conf.lua')||lua&&/\blove\./.test(lua))add('love2d',list.includes('conf.lua')?'conf.lua':'main.lua');
 for(const f of list.filter(s=>s.endsWith('.py')).slice(0,25))if(/\b(?:import|from)\s+pygame\b/.test(await text(path.join(dir,f))??'')){add('pygame',f);break;}
 if(list.some(s=>/\.rbxlx?$|\.project\.json$/.test(s)))add('roblox','Roblox place / Rojo project');
 return {root:dir,status:matches.length===0?'unknown':matches.length===1?'detected':'ambiguous',matches};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv.length>3)throw Error('Usage: node inspect-project.mjs [project-directory]');
  const out=await inspect(process.argv[2]??process.cwd());
  console.log(JSON.stringify(out,null,2));if(out.status==='ambiguous')process.exitCode=2;
 }catch(e){console.error(e.message);process.exitCode=1;}
}

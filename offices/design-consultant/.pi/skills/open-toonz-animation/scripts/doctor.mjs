#!/usr/bin/env node
// Detect binaries only; no startup, rendering or filesystem writes.
import fs from 'node:fs';
import path from 'node:path';
const isFile=p=>{try{return fs.statSync(p).isFile();}catch{return false;}};
const locate=names=>{for(const name of names){if(path.isAbsolute(name)&&isFile(name))return name;for(const dir of (process.env.PATH??'').split(path.delimiter).filter(Boolean)){const f=path.join(dir,name);if(isFile(f))return f;}}return null;};
const chosen=process.env.OPENTOONZ_TCOMPOSER;
const tcomposer=chosen?(path.isAbsolute(chosen)&&isFile(chosen)?chosen:null):locate(process.platform==='win32'?['tcomposer.exe','tcomposer']:['tcomposer']);
const ffmpeg=locate(process.platform==='win32'?['ffmpeg.exe','ffmpeg']:['ffmpeg']);
console.log(JSON.stringify({tcomposer:Boolean(tcomposer),rendererPath:tcomposer,ffmpeg:Boolean(ffmpeg),ffmpegPath:ffmpeg,meaning:'Presence only; scene rendering and headless ToonzScript NOT verified'},null,2));

// Node 22 test-only loader. Our native .ts entrypoints use JS-compatible syntax.
// This checks the shipped import path, not Pi's actual jiti/resource-loader implementation.
import fs from 'node:fs/promises';
export async function resolve(specifier,context,next){
 if(specifier==='@earendil-works/pi-ai')return {url:new URL('./host-type.mjs',import.meta.url).href,shortCircuit:true};
 return next(specifier,context);
}
export async function load(url,context,next){
 if(url.startsWith('file:')&&url.endsWith('.ts'))return {format:'module',source:await fs.readFile(new URL(url),'utf8'),shortCircuit:true};
 return next(url,context);
}

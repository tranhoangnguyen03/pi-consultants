/** Assemble an office's AGENTS.md: the role's title and intro, the shared practice, then the role's own sections. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {assert} from '../src/util.mjs';
export async function agentsMd(root,{role,identity}){
  const own=await fs.readFile(path.join(root,'profiles',role,'AGENTS.md'),'utf8');
  const shared=(await fs.readFile(path.join(root,'profiles/shared/AGENTS.md'),'utf8')).replaceAll('{{identity}}',identity);
  assert(identity&&!shared.includes('{{'),`Office ${role} needs an identity for profiles/shared/AGENTS.md`);
  const cut=own.indexOf('\n## ');assert(cut>0,`profiles/${role}/AGENTS.md needs a title and intro before its first section`);
  return `${own.slice(0,cut).trimEnd()}\n\n${shared.trimEnd()}\n\n${own.slice(cut+1)}`;
}

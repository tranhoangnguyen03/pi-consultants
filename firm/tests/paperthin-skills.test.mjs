import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash} from '../src/util.mjs';
const firm=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),repo=path.dirname(firm);
const offices=['engineering-consultant','project-consultant','user-consultant'],shared=['readchk','shower','re0-memo'];
const read=p=>fs.readFile(p,'utf8');
test('Paperthin pilot distribution and build manifests',async()=>{
 for(const office of offices){
  const root=path.join(repo,'offices',office);
  const marker=JSON.parse(await read(path.join(root,'HQ-ROLE.json')));
  for(const name of shared){
   const rel=`.pi/skills/${name}/SKILL.md`,src=await read(path.join(firm,'skills/shared',name,'SKILL.md')),deployed=await read(path.join(root,rel));
   assert.equal(deployed,src);
   assert.equal(marker.generated[rel],hash(deployed),rel);
   assert.ok(src.startsWith(`---\nname: ${name}\ndescription: `));
  }
  const noticePath='.pi/skills/PAPERTHIN-NOTICE.md',text=await read(path.join(root,noticePath));
  assert.equal(text,await read(path.join(firm,'skills/shared/PAPERTHIN-NOTICE.md')));
  assert.equal(marker.generated[noticePath],hash(text));
  const prismRel='.pi/skills/prism/SKILL.md';
  if(office==='project-consultant'){
   const text=await read(path.join(root,prismRel));
   assert.equal(text,await read(path.join(firm,'skills/coordination/prism/SKILL.md')));
   assert.match(text,/disable-model-invocation: true/);
   assert.equal(marker.generated[prismRel],hash(text));
  }else{
   await assert.rejects(fs.access(path.join(root,prismRel)),{code:'ENOENT'});
   assert.equal(marker.generated[prismRel],undefined);
  }
 }
});

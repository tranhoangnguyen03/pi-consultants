#!/usr/bin/env node
/** Produce one independent repository tree per office in offices.json; shared source is bundled, never linked to another working directory. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assert} from '../src/util.mjs';
import {loadFirm,buildOffice} from './factory.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(process.argv[2]??path.join(root,'dist'));
assert(output!==root,'Output cannot be the source root');
await fs.mkdir(output,{recursive:true});
const {offices,toolset}=await loadFirm(root);
for(const office of offices)console.log(await buildOffice(root,office,toolset,path.join(output,office.folder)));

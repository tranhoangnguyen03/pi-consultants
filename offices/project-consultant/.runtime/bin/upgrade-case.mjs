#!/usr/bin/env node
import path from 'node:path';
import {CaseStore} from '../src/cases.mjs';
import {upgradeCase} from '../src/upgrade.mjs';
const [root,key,backupRoot,confirmation]=process.argv.slice(2);
if(!root||!key||!backupRoot||confirmation!=='--writers-stopped')throw new Error('Usage: node upgrade-case.mjs CASE_ROOT client/project PRIVATE_BACKUP_ROOT --writers-stopped. Stop old writers first; never run against an office without explicit rollout authorization.');
const parts=key.split('/');if(parts.length!==2)throw new Error('Use client/project');
console.log(JSON.stringify(await upgradeCase(new CaseStore(path.resolve(root)),...parts,{backupRoot:path.resolve(backupRoot),quiesced:true}),null,2));

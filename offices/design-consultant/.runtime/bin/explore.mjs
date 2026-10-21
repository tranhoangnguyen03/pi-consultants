#!/usr/bin/env node
// Interactive inspection entry point for disposable offices; never defaults to a live HQ.
import path from 'node:path';
import {CaseStore} from '../src/cases.mjs';
import * as nav from '../src/navigation.mjs';
const [root,operation,json='{}']=process.argv.slice(2);
if(!root||!operation){console.error('Usage: node explore.mjs /absolute/disposable/cases index|get|create|curate|paper|engage \'{...}\'');process.exit(1);}
if(!path.isAbsolute(root))throw new Error('Specify an absolute disposable case-store path');
const store=new CaseStore(root),params=JSON.parse(json);
const operations={index:()=>nav.index(store,params),get:()=>nav.get(store,params),create:()=>nav.create(store,params),curate:()=>nav.curate(store,params),paper:()=>nav.paper(store,params,'manual-exploration'),engage:()=>nav.engage(store,params,'manual-exploration')};
if(!operations[operation])throw new Error('Unknown operation');
try {console.log(JSON.stringify(await operations[operation](),null,2));}catch(e){console.error(e.message);process.exitCode=1;}

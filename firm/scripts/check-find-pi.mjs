#!/usr/bin/env node
// Opt-in host validation without a model call; PI_AI_MODULE may name an installed pi-ai entry URL.
import assert from 'node:assert/strict';
import {host} from '../tests/helpers.mjs';
import {registerHQ} from '../src/pi-extension.mjs';
const {Type,validateToolArguments}=await import(process.env.PI_AI_MODULE??'@earendil-works/pi-ai');
const cleanup=[];
try {
 const h=await host({after:fn=>cleanup.push(fn)},{configExtra:{version:2,stateDir:'hq/.hq'}});
 await registerHQ(h.pi,{Type,configPath:h.configPath});
 const tool=h.tools.get('hq_find');
 assert.deepEqual(Object.keys(tool.parameters.properties),['query','limit','after']);
 assert.equal(tool.parameters.additionalProperties,false);
 const validate=arguments_=>validateToolArguments(tool,{name:'hq_find',arguments:arguments_});
 assert.deepEqual(validate({query:'synthetic',limit:null,after:null}),{query:'synthetic'});
 for(const args of [{caseKey:''},{scope:'case'},{aliases:[]},{offset:0},{includeSuperseded:false},{limit:0},{limit:31}])assert.throws(()=>validate(args));
 const result=await h.call('hq_find',validate({}));
 assert.equal(result.details.outcome,'empty');assert.equal(result.details.context.targetCaseKey,null);
 const legacy=h.tools.get('hq_navigate');
 const padded=validateToolArguments(legacy,{name:'hq_navigate',arguments:{operation:'index',query:'synthetic',caseKey:'',scope:'all',length:1000,offset:0,includeSuperseded:false}});
 await assert.rejects(h.call('hq_navigate',padded),/hq_find/);
 console.log('Actual Pi schema/argument validation passed; no provider inference or live office was exercised.');
} finally {for(const fn of cleanup.reverse())await fn();}

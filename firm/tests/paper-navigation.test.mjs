import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {host} from './helpers.mjs';
test('Private papers stay within case, expose headings and invalidate stale file offsets',async t=>{
 const h=await host(t,{configExtra:{version:2,stateDir:'hq/.hq'}});await h.call('hq_navigate',{operation:'create',client:'demo',project:'one',title:'One',purpose:'Synthetic'});
 const dir=h.state.cases.directory('demo','one');await fs.writeFile(path.join(dir,'draft.md'),'# First\nSynthetic draft\n## Second\nMore');
 const saved=(await h.call('hq_paper',{caseKey:'demo/one',title:'Draft',purpose:'Working prose',file:'draft.md'})).details;
 const read={operation:'get',...saved.saved,length:10};const r=(await h.call('hq_navigate',read)).details;assert.equal(r.body.length,10);assert.equal(r.outline.length,2);assert.equal(r.nextOffset,10);
 await fs.appendFile(path.join(dir,'draft.md'),'\nChanged');assert.equal((await h.call('hq_navigate',{...read,expectedRevision:r.revision,contentRevision:r.contentRevision,offset:10})).details.status,'changed');
 await fs.symlink(h.configPath,path.join(dir,'escape'));await assert.rejects(h.call('hq_paper',{caseKey:'demo/one',title:'Escape',purpose:'Must reject',file:'escape'}),/outside/);
 await fs.rm(path.join(dir,'draft.md'));assert.equal((await h.call('hq_navigate',read)).details.status,'unavailable');
});

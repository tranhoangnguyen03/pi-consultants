import test from 'node:test';
import assert from 'node:assert/strict';
import {skillHeader} from '../scripts/ci-contracts.mjs';
import {forbiddenPath,secretMatches} from '../scripts/ci-private-files.mjs';

test('skill CI headers accept opt-in invocation and reject malformed metadata',()=>{
 assert.equal(skillHeader('---\nname: prism\ndescription: Multi-lens review\ndisable-model-invocation: true\n---\n').name,'prism');
 const nested=skillHeader('---\nname: research\ndescription: Research review\nmetadata:\n  version: "1.0"\n  openclaw:\n    envVars:\n    - name: OPTIONAL_KEY\n      description: Nested description\ndisable-model-invocation: true\n---\n');
 assert.equal(nested.name,'research');assert.equal(nested.description,'Research review');
 assert.equal(nested['disable-model-invocation'],'true');
 assert.throws(()=>skillHeader('---\nname: research\ndescription: A\n  misplaced: nested\n---\n'),/invalid frontmatter line/);
 assert.throws(()=>skillHeader('---\nname: research\ndescription: A\nmetadata:\n  version: "1"\nmetadata:\n---\n'),/duplicate/);
 assert.throws(()=>skillHeader('---\nname: uppercase Skill\ndescription: Bad\n---\n'),/invalid skill name/);
 assert.throws(()=>skillHeader('---\nname: okay\ndescription: A\nname: second\n---\n'),/duplicate/);
 assert.throws(()=>skillHeader('---\nname: okay\ndescription: A\ndisable-model-invocation: maybe\n---\n'),/true or false/);
});
test('private-state guard blocks credentials without rejecting public examples',()=>{
 for(const p of ['offices/a/.hq/cases/secret.json','offices/a/.pi/hq.local.json','offices/a/.pi/mcp.json','offices/a/organization/PLAYBOOK.md','.env','src/.env.production','id_ed25519'])assert.ok(forbiddenPath(p),p);
 for(const p of ['offices/a/organization/PLAYBOOK.example.md','offices/a/.pi/mcp.json.example','.env.example','firm/skills/shared/readchk/NOTICE.md'])assert.equal(forbiddenPath(p),null,p);
 assert.deepEqual(secretMatches('example: xxx'),[]);
 assert.deepEqual(secretMatches(['-----BEGIN','PRIVATE KEY-----'].join(' ')),['private key']);
});

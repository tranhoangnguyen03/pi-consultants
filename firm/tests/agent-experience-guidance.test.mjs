import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Packaging/evidence checks, not a model-quality or live-integration evaluation.
const repo = fileURLToPath(new URL('../../', import.meta.url));
const user = path.join(repo, 'firm/skills/user');
const guides = [
  'designing-agent-interfaces.md',
  'designing-agent-context.md',
  'designing-delegation.md',
  'designing-recovery-and-control.md',
];
const read = p => fs.readFile(p, 'utf8');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function markdownFiles(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await markdownFiles(p));
    else if (entry.name.endsWith('.md')) result.push(p);
  }
  return result;
}

async function checkLocalLinks(file, boundary) {
  const text = await read(file);
  for (const match of text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
    const target = match[1];
    if (/^https?:\/\//.test(target) || target.startsWith('#')) continue;
    const full = path.resolve(path.dirname(file), target.split('#')[0]);
    const relative = path.relative(boundary, full);
    assert.ok(relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), `Link leaves package: ${file} -> ${target}`);
    assert.ok((await fs.stat(full)).isFile(), `Missing local reference: ${file} -> ${target}`);
  }
}

function jsonExamples(text) {
  return [...text.matchAll(/```json\r?\n([\s\S]*?)```/g)].map(match => JSON.parse(match[1]));
}

async function checkGenerated(role, skillNames) {
  const office = path.join(repo, 'offices', `${role}-consultant`);
  const manifest = JSON.parse(await read(path.join(office, 'HQ-ROLE.json')));
  for (const skill of skillNames) {
    const sourceRoot = path.join(repo, 'firm/skills', role, skill);
    for (const source of await markdownFiles(sourceRoot)) {
      const relative = path.posix.join('.pi/skills', skill, path.relative(sourceRoot, source).split(path.sep).join('/'));
      const sourceBytes = await fs.readFile(source);
      assert.deepEqual(await fs.readFile(path.join(office, relative)), sourceBytes, relative);
      assert.equal(manifest.generated[relative], sha256(sourceBytes), relative);
    }
  }
}

test('existing skill identities stay stable and entries remain bounded', async () => {
  for (const [relative, name] of [
    ['user/agent-experience', 'user-agent-experience'],
    ['user/delegation-experience', 'user-delegation-experience'],
    ['engineering/agent-experience', 'engineering-agent-experience'],
  ]) {
    const text = await read(path.join(repo, 'firm/skills', relative, 'SKILL.md'));
    const header = text.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(header, relative);
    assert.equal(header[1].match(/^name: (.+)$/m)?.[1], name);
    const description = header[1].match(/^description: (.+)$/m)?.[1];
    assert.ok(description && description.length <= 1024, relative);
    assert.ok(text.length < 6000, `${relative}: move growing detail into references`);
  }
});

test('D discovers all four guides directly, without new skill entries', async () => {
  const entry = await read(path.join(user, 'agent-experience/SKILL.md'));
  const root = path.join(user, 'agent-experience');
  const files = await markdownFiles(root);
  for (const guide of guides) {
    assert.ok(entry.includes(`(references/${guide})`), guide);
    assert.ok(files.includes(path.join(root, 'references', guide)), guide);
  }
  assert.deepEqual(files.filter(p => path.basename(p) === 'SKILL.md'), [path.join(root, 'SKILL.md')]);
});

test('D source references and delegation links resolve locally', async () => {
  for (const skill of ['agent-experience', 'delegation-experience']) {
    for (const file of await markdownFiles(path.join(user, skill))) await checkLocalLinks(file, user);
  }
});

test('D reference links survive relocation without a firm checkout', async t => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'hq-ax-links-'));
  t.after(() => fs.rm(temp, {recursive: true, force: true}));
  for (const skill of ['agent-experience', 'delegation-experience']) {
    await fs.cp(path.join(user, skill), path.join(temp, skill), {recursive: true});
  }
  for (const file of await markdownFiles(temp)) await checkLocalLinks(file, temp);
});

test('worked JSON examples parse and keep coverage/effect distinctions', async () => {
  const interfaces = jsonExamples(await read(path.join(user, 'agent-experience/references/designing-agent-interfaces.md')));
  const page = interfaces.find(x => Array.isArray(x.items));
  assert.ok(page, 'bounded-list example exists');
  assert.equal(page.returned, page.items.length);
  assert.ok(page.total > page.returned);
  assert.equal(page.complete, false);
  assert.ok(page.nextCursor);
  const rejected = interfaces.find(x => x.status === 'rejected');
  assert.equal(rejected?.effect, 'not_started');
  const recovery = jsonExamples(await read(path.join(user, 'agent-experience/references/designing-recovery-and-control.md')));
  const unknown = recovery.find(x => x.status === 'unknown');
  assert.equal(unknown?.effect, 'may_have_completed');
  assert.equal(unknown?.next.id, unknown?.operationId);
  assert.notEqual(unknown?.effect, rejected?.effect);
});

test('generated D resources match source and inventory hashes', () => checkGenerated('user', ['agent-experience', 'delegation-experience']));
test('generated B method matches source and inventory hash', () => checkGenerated('engineering', ['agent-experience']));

test('maintainer guide points to existing canonical material', () => checkLocalLinks(path.join(repo, 'docs/agent-experience-design.md'), repo));

test('link and JSON checks reject broken fixtures', async t => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'hq-ax-negative-'));
  t.after(() => fs.rm(temp, {recursive: true, force: true}));
  const file = path.join(temp, 'SKILL.md');
  await fs.writeFile(file, '[missing](missing.md)\n');
  await assert.rejects(checkLocalLinks(file, temp), /ENOENT/);
  await fs.writeFile(file, '[outside](../outside.md)\n');
  await assert.rejects(checkLocalLinks(file, temp), /leaves package/);
  assert.throws(() => jsonExamples('```json\n{not json}\n```'), SyntaxError);
});

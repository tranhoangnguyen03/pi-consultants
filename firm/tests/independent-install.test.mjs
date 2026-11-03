import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  digest,
  install,
  inventory,
  readJSON,
  registerRun,
  verifyBundle,
  writeJSON,
} from '../independent/installation.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'engineering-install-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return { root, home: path.join(root, 'installed home') };
}

async function put(root, name, contents, mode) {
  const file = path.join(root, name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, contents, mode === undefined ? undefined : { mode });
  return file;
}

async function bundleFixture(root, version, { retiredPrompt = false, newPrompt = false } = {}) {
  const bundle = path.join(root, `release-${version}`);
  const office = path.join(bundle, 'office');
  const practice = {
    'AGENTS.md': `# Engineering\nMaintained practice ${version}.\n`,
    '.pi/hq.json': JSON.stringify({ version: 2, role: 'engineering', hq: '..', stateDir: '../.hq' }) + '\n',
    '.pi/settings.defaults.json': JSON.stringify({ quietStartup: true, packages: [], fixtureRelease: version }) + '\n',
    '.pi/toolset.json': JSON.stringify({ version: 1, packages: [] }) + '\n',
    '.pi/skills/review/SKILL.md': '---\nname: review\ndescription: Review a proposed change.\n---\nRead references/method.md before reviewing.\n',
    '.pi/skills/review/references/method.md': `Review method ${version}.\n`,
    'organization/PLAYBOOK.example.md': '# Organization playbook\nAdd your local policy in PLAYBOOK.md.\n',
    '.runtime/bin/hq.mjs': `// Installed consultant runtime ${version}.\n`,
  };
  if (retiredPrompt) practice['.pi/prompts/retired.md'] = 'An old maintained prompt.\n';
  if (newPrompt) practice['.pi/prompts/new.md'] = `A new maintained prompt ${version}.\n`;
  for (const [name, contents] of Object.entries(practice)) await put(office, name, contents);

  // These executables are inert: lifecycle tests exercise installation, not the engine.
  for (const name of ['runtime/node/bin/node', 'runtime/engineering', 'packages/example/bin/tool']) {
    const executable = await put(bundle, name, '#!/bin/sh\nexit 0\n', 0o755);
    await fs.chmod(executable, 0o755);
  }
  await put(bundle, 'app/launcher.mjs', '// Fixture application entry point.\n');
  await fs.mkdir(path.join(bundle, 'packages/.bin'), { recursive: true });
  await fs.symlink('../example/bin/tool', path.join(bundle, 'packages/.bin/example'));
  const files = await inventory(bundle);
  const officeInventory = await inventory(office);
  const officeFiles = Object.fromEntries(Object.entries(officeInventory).map(([name, entry]) => [name, entry.sha256]));
  const release = {
    id: 'engineering',
    version,
    stateSchema: 1,
    platform: process.platform,
    arch: process.arch,
    buildId: `${version}-${process.platform}-${process.arch}-${digest(JSON.stringify(files)).slice(0, 16)}`,
    officeFiles,
    files,
  };
  await writeJSON(path.join(bundle, 'release.json'), release);
  assert.deepEqual(await verifyBundle(bundle), release);
  return { bundle, release };
}

async function marker(home) {
  return readJSON(path.join(home, '.agent/installed.json'));
}

async function bytes(root, name) {
  return fs.readFile(path.join(root, name), 'utf8');
}

async function absent(file) {
  await assert.rejects(fs.lstat(file), { code: 'ENOENT' });
}

test('initial install creates a complete stable home that survives removal of its source bundle', async t => {
  const { root, home } = await fixture(t);
  const first = await bundleFixture(root, '1.0.0');
  const result = await install(first.bundle, home);
  assert.equal(result.home, await fs.realpath(home));
  assert.equal(result.command, path.join(result.home, 'bin/engineering-agent'));
  assert.equal((await marker(home)).buildId, first.release.buildId);
  assert.equal(await fs.readlink(path.join(home, '.agent/current')), path.join('releases', first.release.buildId));
  assert.equal(await bytes(home, '.pi/settings.json'), await bytes(first.bundle, 'office/.pi/settings.defaults.json'));
  assert.equal(await bytes(home, '.pi/skills/review/references/method.md'), 'Review method 1.0.0.\n');
  assert.ok((await fs.stat(path.join(home, '.hq/sessions'))).isDirectory());
  assert.ok((await fs.stat(result.command)).mode & 0o111);
  const wrapper = await fs.readFile(result.command, 'utf8');
  assert.ok(wrapper.includes('$agent_home/.agent/current/runtime/node/bin/node'));
  assert.ok(!wrapper.includes(first.bundle));

  await fs.rm(first.bundle, { recursive: true });
  const retained = path.join(home, '.agent/releases', first.release.buildId);
  assert.deepEqual(await verifyBundle(retained), first.release);
  assert.equal(await fs.readlink(path.join(retained, 'packages/.bin/example')), '../example/bin/tool');
  const endRun = await registerRun(home, first.release);
  await endRun();
});

test('upgrade replaces practice while preserving settings, private records, credentials and organization configuration', async t => {
  const { root, home } = await fixture(t);
  const first = await bundleFixture(root, '1.0.0', { retiredPrompt: true });
  const second = await bundleFixture(root, '1.1.0', { newPrompt: true });
  const installed = await install(first.bundle, home);
  const privateFiles = {
    '.pi/settings.json': '{"quietStartup":false,"localPreference":"keep"}\n',
    '.pi/auth.json': '{"fixture":"private credential sentinel"}\n',
    '.pi/local.json': '{"localSetting":"keep"}\n',
    '.pi/toolset.local.json': '{"localTool":"keep"}\n',
    '.env': 'FIXTURE_PRIVATE_VALUE=keep\n',
    '.hq/cases/example/notes.md': 'Private case work.\n',
    '.hq/sessions/saved.jsonl': '{"fixture":"saved conversation"}\n',
    '.hq/outbox/pending.json': '{"fixture":"pending human review"}\n',
    '.hq/tools/local-tool.mjs': '// A locally installed tool.\n',
    'organization/PLAYBOOK.md': '# Local policy\nKeep this organization policy.\n',
    'organization/context.json': '{"fixture":"local organization"}\n',
    '.pi/skills/review/references/local.md': 'An additional private reference.\n',
  };
  for (const [name, contents] of Object.entries(privateFiles)) await put(home, name, contents);
  const before = Object.fromEntries(await Promise.all(Object.keys(privateFiles).map(async name => [name, await bytes(home, name)])));

  const updated = await install(second.bundle, home);
  assert.equal(updated.home, installed.home);
  assert.equal(updated.command, installed.command);
  assert.equal((await marker(home)).buildId, second.release.buildId);
  assert.equal(await bytes(home, 'AGENTS.md'), await bytes(second.bundle, 'office/AGENTS.md'));
  assert.equal(await bytes(home, '.pi/skills/review/references/method.md'), 'Review method 1.1.0.\n');
  assert.equal(await bytes(home, '.pi/prompts/new.md'), 'A new maintained prompt 1.1.0.\n');
  await absent(path.join(home, '.pi/prompts/retired.md'));
  for (const [name, contents] of Object.entries(before)) assert.equal(await bytes(home, name), contents, name);
  assert.deepEqual(await verifyBundle(path.join(home, '.agent/releases', first.release.buildId)), first.release);
  const backups = await fs.readdir(path.join(home, '.agent/backups'));
  assert.equal(backups.length, 1);
  assert.equal(await bytes(path.join(home, '.agent/backups', backups[0]), 'AGENTS.md'), await bytes(first.bundle, 'office/AGENTS.md'));
});

test('an edited practice file blocks the entire update before any managed file replacement', async t => {
  const { root, home } = await fixture(t);
  const first = await bundleFixture(root, '1.0.0');
  const second = await bundleFixture(root, '1.1.0', { newPrompt: true });
  await install(first.bundle, home);
  await put(home, '.pi/skills/review/SKILL.md', '# Locally improved review\nKeep this change.\n');
  const before = await inventory(home);
  await assert.rejects(install(second.bundle, home), /No files changed[\s\S]*\.pi\/skills\/review\/SKILL\.md/);
  assert.deepEqual(await inventory(home), before);
  assert.equal((await marker(home)).buildId, first.release.buildId);
  await absent(path.join(home, '.agent/releases', second.release.buildId));
});

test('new release files cannot silently replace an untracked local addition', async t => {
  const { root, home } = await fixture(t);
  const first = await bundleFixture(root, '1.0.0');
  const second = await bundleFixture(root, '1.1.0', { newPrompt: true });
  await install(first.bundle, home);
  await put(home, '.pi/prompts/new.md', 'A private prompt with the same filename.\n');
  const before = await inventory(home);
  await assert.rejects(install(second.bundle, home), /No files changed[\s\S]*\.pi\/prompts\/new\.md/);
  assert.deepEqual(await inventory(home), before);
});

test('an active registered run blocks update until the run ends', async t => {
  const { root, home } = await fixture(t);
  const first = await bundleFixture(root, '1.0.0');
  const second = await bundleFixture(root, '1.1.0');
  await install(first.bundle, home);
  const endRun = await registerRun(home, first.release);
  t.after(endRun);
  await assert.rejects(install(second.bundle, home), /Engineering is running/);
  assert.equal((await marker(home)).buildId, first.release.buildId);

  // A surviving engine must still block update if its original launcher has exited.
  await endRun.track(process.pid);
  const recordFile = path.join(home, '.agent/runs', `${process.pid}.json`);
  const record = await readJSON(recordFile);
  assert.equal(record.childPid, process.pid);
  await writeJSON(recordFile, { ...record, pid: 2147483647 });
  await assert.rejects(install(second.bundle, home), /Engineering is running/);
  await endRun();
  await install(second.bundle, home);
  assert.equal((await marker(home)).buildId, second.release.buildId);
});

test('an interrupted update blocks launch and another release, then resumes without losing private work', async t => {
  const { root, home } = await fixture(t);
  const first = await bundleFixture(root, '1.0.0', { retiredPrompt: true });
  const second = await bundleFixture(root, '1.1.0', { newPrompt: true });
  const third = await bundleFixture(root, '1.2.0');
  await install(first.bundle, home);
  await put(home, '.hq/cases/saved.md', 'Private work survives interrupted installation.\n');
  await writeJSON(path.join(home, '.agent/pending-install.json'), { buildId: second.release.buildId, version: second.release.version });
  await put(home, 'AGENTS.md', await bytes(second.bundle, 'office/AGENTS.md'));
  await fs.rm(path.join(home, '.pi/prompts/retired.md'));
  const interrupted = await inventory(home);
  await assert.rejects(registerRun(home, first.release), /install was interrupted/i);
  await assert.rejects(install(third.bundle, home), /Finish the interrupted install/);
  assert.deepEqual(await inventory(home), interrupted);

  await install(second.bundle, home);
  assert.equal((await marker(home)).buildId, second.release.buildId);
  await absent(path.join(home, '.agent/pending-install.json'));
  for (const [name, expected] of Object.entries(second.release.officeFiles)) {
    assert.equal(digest(await fs.readFile(path.join(home, name))), expected, name);
  }
  assert.equal(await bytes(home, '.hq/cases/saved.md'), 'Private work survives interrupted installation.\n');
  const endRun = await registerRun(home, second.release);
  await endRun();
});

test('a bundle whose practice bytes changed after release creation cannot update an installed home', async t => {
  const { root, home } = await fixture(t);
  const first = await bundleFixture(root, '1.0.0');
  const second = await bundleFixture(root, '1.1.0');
  await install(first.bundle, home);
  const before = await inventory(home);
  await put(second.bundle, 'office/AGENTS.md', 'Changed after release creation.\n');
  await assert.rejects(install(second.bundle, home), /Release integrity check failed: office\/AGENTS\.md/);
  assert.deepEqual(await inventory(home), before);
});

for (const [field, value] of [['id', 'another-specialist'], ['stateSchema', 2]]) {
  test(`a conflicting installed ${field} is refused without changing the home`, async t => {
    const { root, home } = await fixture(t);
    const first = await bundleFixture(root, '1.0.0');
    const second = await bundleFixture(root, '1.1.0');
    await install(first.bundle, home);
    await writeJSON(path.join(home, '.agent/installed.json'), { ...await marker(home), [field]: value });
    const before = await inventory(home);
    await assert.rejects(install(second.bundle, home), /different agent or state schema/);
    assert.deepEqual(await inventory(home), before);
  });
}

for (const name of ['.pi/skills', '.pi/settings.json', '.hq']) {
  test(`a symlink at ${name} is refused before practice replacement or writes outside the home`, async t => {
    const { root, home } = await fixture(t);
    const first = await bundleFixture(root, '1.0.0');
    const second = await bundleFixture(root, '1.1.0');
    await install(first.bundle, home);
    const outside = path.join(root, 'another-office');
    await fs.mkdir(outside);
    const target = path.join(outside, 'borrowed');
    await fs.rename(path.join(home, name), target);
    await fs.symlink(target, path.join(home, name));
    const before = await inventory(home);
    const outsideBefore = await inventory(outside);
    await assert.rejects(install(second.bundle, home), /Managed path is a symlink/);
    assert.deepEqual(await inventory(home), before);
    assert.deepEqual(await inventory(outside), outsideBefore);
    assert.equal((await marker(home)).buildId, first.release.buildId);
  });
}

test('a retained release path cannot redirect the installed application through a symlink', async t => {
  const { root, home } = await fixture(t);
  const first = await bundleFixture(root, '1.0.0');
  const second = await bundleFixture(root, '1.1.0');
  await install(first.bundle, home);
  const outside = path.join(root, 'outside-release');
  await fs.cp(second.bundle, outside, { recursive: true, dereference: false, verbatimSymlinks: true });
  await fs.symlink(outside, path.join(home, '.agent/releases', second.release.buildId));
  const before = await inventory(home);
  const outsideBefore = await inventory(outside);
  await assert.rejects(install(second.bundle, home), /Managed path is a symlink/);
  assert.deepEqual(await inventory(home), before);
  assert.deepEqual(await inventory(outside), outsideBefore);
});

test('explicit rollback selects an older compatible release without rolling back private state', async t => {
  const { root, home } = await fixture(t);
  const first = await bundleFixture(root, '1.0.0', { retiredPrompt: true });
  const second = await bundleFixture(root, '1.1.0', { newPrompt: true });
  await install(first.bundle, home);
  await install(second.bundle, home);
  await put(home, '.pi/settings.json', '{"localPreference":"set after upgrade"}\n');
  await put(home, '.hq/cases/current.md', 'Work completed after upgrade.\n');
  await put(home, '.hq/sessions/current.jsonl', '{"fixture":"conversation after upgrade"}\n');
  const stableCommand = await bytes(home, 'bin/engineering-agent');
  await fs.rm(first.bundle, { recursive: true });

  await install(path.join(home, '.agent/releases', first.release.buildId), home);
  assert.equal((await marker(home)).buildId, first.release.buildId);
  assert.equal(await bytes(home, 'AGENTS.md'), '# Engineering\nMaintained practice 1.0.0.\n');
  assert.equal(await bytes(home, '.pi/prompts/retired.md'), 'An old maintained prompt.\n');
  await absent(path.join(home, '.pi/prompts/new.md'));
  assert.equal(await bytes(home, '.pi/settings.json'), '{"localPreference":"set after upgrade"}\n');
  assert.equal(await bytes(home, '.hq/cases/current.md'), 'Work completed after upgrade.\n');
  assert.equal(await bytes(home, '.hq/sessions/current.jsonl'), '{"fixture":"conversation after upgrade"}\n');
  assert.equal(await bytes(home, 'bin/engineering-agent'), stableCommand);
  assert.deepEqual(await verifyBundle(path.join(home, '.agent/releases', second.release.buildId)), second.release);
  const endRun = await registerRun(home, first.release);
  await endRun();
});

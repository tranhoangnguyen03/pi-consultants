#!/usr/bin/env node
/** Exercise a real native release with a deterministic, local model provider.
 * No model account, developer fixture, source checkout, or external service is used
 * by the installed agents. Temporary offices contain synthetic records only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { RpcClient } from './rpc-client.mjs';

if (process.argv.length !== 4 || process.argv[2] !== '--bundle') {
  console.error('Usage: node firm/independent/smoke.mjs --bundle firm/dist/independent/bundle');
  process.exit(2);
}
const inputBundle = path.resolve(process.argv[3]);
const reportFile = path.join(path.dirname(inputBundle), 'smoke-report.json');
const report = {
  formatVersion: 1, status: 'running', startedAt: new Date().toISOString(), checks: [],
  scope: 'Relocated native release; installed parent and peer; real PiG, Node extensions, native tools, HQ persistence and agent_ask over RPC. Only model decisions are scripted by a loopback HTTP provider.',
  limits: [
    'This is an integration smoke test, not an evaluation of a live model’s reasoning or adherence to instructions.',
    'No provider login, real credentials, external MCP service, web search account, browser download or LibreOffice conversion is exercised.',
    'Only the platform and architecture reported below are executed. Other release targets require their own run.',
    'No human approval is synthesized. External-action approval behavior and RPC cancellation edge cases have separate fixture tests.',
  ],
};
const clients = new Set(), processes = new Set(), events = [];
let temporary, server, deadline, fixtureError, currentCheck;
let requestCount = 0, dialogCount = 0;
const budget = new AbortController();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const readJSON = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const writeJSON = (file, value) => fs.writeFile(file, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
const textOf = value => typeof value === 'string' ? value : (value ?? []).map(item => item.text ?? '').join('\n');
const inside = (file, root) => file === root || file.startsWith(root + path.sep);
const clean = text => String(text).split(temporary || '\0').join('$SMOKE_TMP');
// These arguments reach the real bash tool; temporary paths may contain quotes.
const shellQuote = value => `'${String(value).replaceAll("'", "'\"'\"'")}'`;

async function check(name, work) {
  currentCheck = name;
  const start = Date.now();
  try {
    budget.signal.throwIfAborted();
    const detail = await work();
    report.checks.push({ name, status: 'passed', milliseconds: Date.now() - start, ...(detail ? { detail } : {}) });
    console.log(`PASS ${name}`);
  } catch (error) {
    report.checks.push({ name, status: 'failed', milliseconds: Date.now() - start, error: clean(error.message) });
    throw error;
  }
}

async function command(executable, args, { cwd, env = {}, timeoutMs = 30000 } = {}) {
  budget.signal.throwIfAborted();
  const child = spawn(executable, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  processes.add(child);
  let stdout = '', stderr = '';
  child.stdout.on('data', bytes => { stdout += bytes; });
  child.stderr.on('data', bytes => { stderr = (stderr + bytes).slice(-16384); });
  let timedOut = false;
  const stop = () => child.kill('SIGKILL');
  const timer = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
  budget.signal.addEventListener('abort', stop, { once: true });
  try {
    const [code, signal] = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (...result) => resolve(result));
    });
    budget.signal.throwIfAborted();
    assert.ok(!timedOut, `${path.basename(executable)} exceeded its ${timeoutMs / 1000}-second CLI deadline: ${stderr}`);
    assert.equal(code, 0, `${path.basename(executable)} failed (${signal ?? code}): ${stderr}`);
    return stdout;
  } finally {
    clearTimeout(timer);
    budget.signal.removeEventListener('abort', stop);
    processes.delete(child);
  }
}

function fixturePDF() {
  const stream = 'BT /F1 18 Tf 72 720 Td (PORTABLE_NATIVE_PDF_MARKER) Tj ET\n';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let result = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(result));
    result += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(result);
  result += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) result += `${String(offset).padStart(10, '0')} 00000 n \n`;
  return result + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
}

async function main() {
  const release = await readJSON(path.join(inputBundle, 'release.json'));
  report.release = { id: release.id, version: release.version, buildId: release.buildId, platform: release.platform, arch: release.arch, runtime: release.runtime, source: release.source };
  assert.equal(release.platform, process.platform);
  assert.equal(release.arch, process.arch);
  // macOS may expose /var and /tmp through symlinks; the installer canonicalizes homes.
  temporary = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'pi-consultants smoke ')));
  const relocated = path.join(temporary, 'relocated release');
  // Copy before the execution budget: a large release can take longer on slow disks.
  await fs.cp(inputBundle, relocated, { recursive: true, dereference: false, verbatimSymlinks: true });
  report.relocation = 'Release copied to a different temporary path containing spaces; installed agents use their own release copies.';
  deadline = setTimeout(() => {
    budget.abort(new Error('Smoke execution exceeded the ten-minute budget'));
    for (const child of processes) child.kill('SIGKILL');
    for (const client of clients) void client.close();
    server?.closeAllConnections();
  }, 600000);

  const parentHome = path.join(temporary, 'parent home'), peerHome = path.join(temporary, 'peer home');
  const helperName = 'engineering-smoke-helper';
  const helperSource = path.join(temporary, 'offline npm fixture');
  const helperTarball = path.join(helperSource, `${helperName}-1.0.0.tgz`);
  const privatePrefix = path.join(parentHome, '.hq/tools/npm');
  const privateCache = path.join(parentHome, '.hq/cache/npm');
  const installedHelper = path.join(privatePrefix, 'lib/node_modules', helperName);
  const helperBin = path.join(privatePrefix, 'bin', helperName);
  const helperCode = '#!/usr/bin/env node\nconsole.log("PRIVATE_NPM_HELPER_VERIFIED");\n';
  const initial = path.join(temporary, 'initial project'), target = path.join(temporary, 'target project'), peerProject = path.join(temporary, 'peer project');
  for (const dir of [initial, target, peerProject]) await fs.mkdir(dir);
  await fs.writeFile(path.join(initial, 'marker.txt'), 'WRONG_INITIAL_DIRECTORY\n');
  await fs.writeFile(path.join(target, 'marker.txt'), 'CORRECT_TARGET_DIRECTORY\n');
  await fs.writeFile(path.join(peerProject, 'peer-marker.txt'), 'PEER_OWN_WORKSPACE\n');
  const pdf = path.join(target, 'native fixture.pdf');
  await fs.writeFile(pdf, fixturePDF());
  const releaseCommand = path.join(relocated, 'engineering-agent');
  const env = { PIG_OFFLINE: '1', PI_OFFLINE: '1', PIG_PIGLET_PATH: '', PIG_PIGLET_NAME: '' };
  const args = ['--no-mcp', '--approve', '--provider', 'study', '--model', 'probe', '--thinking', 'off', '--no-context-files'];

  await check('CLI install and installed release identity', async () => {
    // Full bundle hashing/copying is materially slower on hosted Intel macOS.
    for (const home of [parentHome, peerHome]) await command(releaseCommand, ['install', '--home', home], { cwd: initial, env, timeoutMs: 180000 });
    const description = JSON.parse(await command(path.join(parentHome, 'bin/engineering-agent'), ['describe'], { cwd: initial, env }));
    assert.equal(description.id, 'engineering');
    assert.equal(description.buildId, release.buildId);
    assert.equal(description.home, parentHome);
    const version = (await command(path.join(relocated, 'runtime/node/bin/node'), ['--version'])).trim();
    assert.equal(version, `v${release.runtime.node}`);
    return { homeCount: 2, bundledNode: version, buildId: release.buildId };
  });

  await check('Installed application doctor uses bundled runtimes', async () => {
    const health = JSON.parse(await command(path.join(parentHome, 'bin/engineering-agent'), ['doctor'], { cwd: initial, env }));
    assert.equal(health.verdict, 'prerequisites_met');
    assert.equal(health.home, parentHome);
    assert.equal(health.buildId, release.buildId);
    assert.ok(health.checks.every(item => item.passed));
    assert.ok(health.checks.some(item => item.name === 'Bundled Node'));
    assert.deepEqual(health.checks.filter(item => !item.name.startsWith('Package ') && /\bpi(?:g)?\b/i.test(item.name)).map(item => item.name), ['Bundled PiG'], 'Doctor must not require a host Pi installation');
    return { verdict: health.verdict, checks: health.checks.map(item => item.name), externalServicesTested: false };
  });

  const skillNames = [...new Set(Object.keys(release.officeFiles).map(name => name.match(/^\.pi\/skills\/([^/]+)\/SKILL\.md$/)?.[1]).filter(Boolean))].sort();
  await check('Complete Engineering skills and companion package assets', async () => {
    assert.equal(skillNames.length, 14, 'Engineering must ship all fourteen factory skills');
    const skillFiles = Object.entries(release.officeFiles).filter(([name]) => name.startsWith('.pi/skills/'));
    for (const home of [parentHome, peerHome]) {
      for (const [name, expected] of skillFiles) assert.equal(sha(await fs.readFile(path.join(home, name))), expected, `Installed skill asset ${name}`);
      const ownRelease = path.join(home, '.agent/current');
      for (const relative of [
        'packages/node_modules/pi-change-working-dir/cwd-context.ts',
        'packages/node_modules/pi-web-access/dist/index.js',
        'packages/node_modules/pi-docparser/extensions/docparser/native-worker.mjs',
        'packages/node_modules/pi-docparser/skills/parse-document/SKILL.md',
        'packages/node_modules/pi-agent-browser/extensions/agent-browser.ts',
        'packages/diagram-design/skills/diagram-design/SKILL.md',
        'packages/diagram-design/skills/diagram-design/scripts',
        'packages/diagram-design/skills/diagram-design/references',
        'packages/diagram-design/prompts/import-mermaid.md',
      ]) await fs.access(path.join(ownRelease, relative));
    }
    return { skills: skillNames, skillFiles: skillFiles.length, packageCount: release.packages.length, companionSkills: ['parse-document', 'diagram-design'] };
  });

  const plans = new Map();
  const records = new Map();
  const schemas = new Map();
  let delegatedSession;
  const expectText = fragment => value => assert.ok(value.includes(fragment), `Expected tool result to contain ${fragment}`);
  const expectJSON = test => value => test(JSON.parse(value));
  const note = (text, extra = {}) => ({ kind: 'finding', state: 'observed', text, sources: ['fixture:local-integration'], attribution: 'deterministic smoke fixture', scope: 'case', ...extra });
  const parentNote = 'PARENT_PRIVATE_NOTE_MARKER', resumedNote = 'PARENT_EXPLICIT_RESUME_MARKER', rejectedNote = 'REJECTED_RESTORED_WRITE_MARKER', peerNote = 'PEER_PRIVATE_NOTE_MARKER';
  const step = (tool, params, verify) => ({ tool, params, verify });
  plans.set('parent:npm-tools', [
    step('bash', { command: 'npm config get prefix --loglevel=error' }, value => assert.equal(value.trim(), privatePrefix)),
    step('bash', { command: 'npm config get cache --loglevel=error' }, value => assert.equal(value.trim(), privateCache)),
    step('bash', { command: ['npm', 'install', '-g', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error', helperTarball].map(shellQuote).join(' ') }, value => assert.match(value, /added 1 package/)),
    step('bash', { command: `command -v ${shellQuote(helperName)}` }, value => assert.equal(value.trim(), helperBin)),
    step('bash', { command: shellQuote(helperName) }, value => assert.equal(value.trim(), 'PRIVATE_NPM_HELPER_VERIFIED')),
  ]);
  plans.set('parent:parent-work', [
    step('agent_identity', {}, expectJSON(value => { assert.equal(value.id, 'engineering'); assert.equal(value.home, parentHome); assert.equal(value.version, release.version); })),
    step('change_dir', { path: target }, expectText(target)),
    step('read', { path: 'marker.txt' }, expectText('CORRECT_TARGET_DIRECTORY')),
    step('bash', { command: 'pwd' }, value => assert.equal(value.trim(), target)),
    step('document_parse', { path: pdf, ocr: 'off', format: 'text' }, expectText('PORTABLE_NATIVE_PDF_MARKER')),
    step('hq_navigate', { operation: 'create', client: 'fixture', project: 'parent', title: 'Parent integration fixture', purpose: 'Exercise private case continuity with synthetic evidence.' }, expectJSON(value => { assert.equal(value.created, true); assert.equal(value.caseKey, 'fixture/parent'); })),
    step('hq_navigate', { operation: 'select', caseKey: 'fixture/parent' }, expectJSON(value => assert.equal(value.context.selectionSource, 'explicit'))),
    step('hq_note', note(parentNote), expectJSON(value => { assert.equal(value.text, parentNote); assert.equal(value.attribution, 'deterministic smoke fixture'); })),
    step('agent_peers', {}, expectJSON(value => { assert.equal(value.peers.length, 1); assert.equal(value.peers[0].name, 'engineering-peer'); })),
  ]);
  plans.set('parent:parent-resume', [
    step('read', { path: 'marker.txt' }, expectText('CORRECT_TARGET_DIRECTORY')),
    step('bash', { command: 'pwd' }, value => assert.equal(value.trim(), target)),
    step('hq_case', { operation: 'read' }, expectJSON(value => { assert.equal(value.context.selectionSource, 'restored'); assert.equal(value.notes.length, 1); assert.equal(value.notes[0].text, parentNote); })),
    step('hq_note', note(rejectedNote), expectText('use hq_navigate select or supply caseKey')),
    step('hq_note', note(resumedNote, { caseKey: 'fixture/parent' }), expectJSON(value => assert.equal(value.text, resumedNote))),
    step('hq_case', { operation: 'read' }, expectJSON(value => assert.deepEqual(value.notes.map(item => item.text), [parentNote, resumedNote]))),
  ]);
  plans.set('parent:parent-delegate', [
    step('agent_ask', { peer: 'engineering-peer', timeoutSeconds: 45, message: 'SMOKE[peer-work] Use your own identity, read peer-marker.txt, run pwd, inspect and create a private fixture case, and record an attributed fixture note. These local fixture actions are authorized. Return PEER-WORK_VERIFIED.' }, expectJSON(value => {
      assert.equal(value.peer, 'engineering-peer');
      assert.equal(value.text, 'PEER-WORK_VERIFIED');
      assert.equal(value.disposition, 'started');
      assert.ok(inside(value.session.sessionFile, peerHome));
      delegatedSession = value.session;
    })),
    step('hq_case', { operation: 'read' }, expectJSON(value => assert.deepEqual(value.notes.map(item => item.text), [parentNote, resumedNote]))),
  ]);
  plans.set('peer:peer-work', [
    step('agent_identity', {}, expectJSON(value => assert.equal(value.home, peerHome))),
    step('read', { path: 'peer-marker.txt' }, expectText('PEER_OWN_WORKSPACE')),
    step('bash', { command: 'pwd' }, value => assert.equal(value.trim(), peerProject)),
    step('hq_find', {}, value => { assert.ok(!value.includes('fixture/parent')); assert.ok(!value.includes(parentNote)); }),
    step('hq_navigate', { operation: 'create', client: 'fixture', project: 'peer', title: 'Peer integration fixture', purpose: 'Keep independently delegated synthetic work private to the peer.' }, expectJSON(value => assert.equal(value.created, true))),
    step('hq_navigate', { operation: 'select', caseKey: 'fixture/peer' }, expectJSON(value => assert.equal(value.context.selectionSource, 'explicit'))),
    step('hq_note', note(peerNote), expectJSON(value => { assert.equal(value.text, peerNote); assert.equal(value.attribution, 'deterministic smoke fixture'); })),
  ]);
  plans.set('peer:peer-resume', [
    step('read', { path: 'peer-marker.txt' }, expectText('PEER_OWN_WORKSPACE')),
    step('hq_case', { operation: 'read' }, expectJSON(value => { assert.equal(value.context.selectionSource, 'restored'); assert.equal(value.notes.length, 1); assert.equal(value.notes[0].text, peerNote); })),
  ]);

  server = createServer(async (req, res) => {
    try {
      assert.equal(req.method, 'POST');
      assert.match(req.url, /^\/(parent|peer)\/v1\/chat\/completions$/);
      const actor = req.url.split('/')[1];
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      requestCount++;
      const userIndex = body.messages.findLastIndex(item => item.role === 'user');
      const label = textOf(body.messages[userIndex]?.content).match(/SMOKE\[([^\]]+)\]/)?.[1];
      const key = `${actor}:${label}`;
      const plan = plans.get(key);
      assert.ok(plan, `Unexpected provider request ${key}`);
      const system = body.messages.filter(item => ['system', 'developer'].includes(item.role)).map(item => textOf(item.content)).join('\n');
      assert.ok(system.includes(`${actor.toUpperCase()}_PRIVATE_PLAYBOOK_MARKER`), 'Private playbook was not read from the app home');
      assert.ok(!system.includes(`${actor === 'parent' ? 'PEER' : 'PARENT'}_PRIVATE_PLAYBOOK_MARKER`), 'Another app’s private playbook leaked');
      assert.ok(system.includes(actor === 'parent' ? parentHome : peerHome), 'System context lost the installed home');
      const tools = new Map((body.tools ?? []).map(item => [item.function.name, item.function]));
      schemas.set(actor, tools);
      const results = body.messages.slice(userIndex + 1).filter(item => item.role === 'tool');
      assert.ok(results.length <= plan.length, 'Unexpected extra tool result');
      if (results.length) {
        const previous = plan[results.length - 1], value = textOf(results.at(-1).content);
        previous.verify?.(value);
        records.set(`${key}:${results.length - 1}`, { actor, scenario: label, tool: previous.tool });
      }
      const next = plan[results.length];
      if (next) assert.ok(tools.has(next.tool), `Required tool ${next.tool} was not advertised`);
      const id = `smoke-${requestCount}`;
      const delta = next
        ? { role: 'assistant', tool_calls: [{ index: 0, id: `call-${requestCount}`, type: 'function', function: { name: next.tool, arguments: JSON.stringify(next.params) } }] }
        : { role: 'assistant', content: `${label.toUpperCase()}_VERIFIED` };
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.write(`data: ${JSON.stringify({ id, object: 'chat.completion.chunk', model: 'probe', choices: [{ index: 0, delta, finish_reason: null }] })}\n\n`);
      res.write(`data: ${JSON.stringify({ id, object: 'chat.completion.chunk', model: 'probe', choices: [{ index: 0, delta: {}, finish_reason: next ? 'tool_calls' : 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })}\n\n`);
      res.end('data: [DONE]\n\n');
    } catch (error) {
      fixtureError ??= error;
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: error.message } }));
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  for (const [actor, home] of [['parent', parentHome], ['peer', peerHome]]) {
    await writeJSON(path.join(home, '.pi/models.json'), { providers: { study: {
      api: 'openai-completions', baseUrl: `http://127.0.0.1:${port}/${actor}/v1`, apiKey: 'fixture-only',
      models: [{ id: 'probe', name: 'Deterministic local fixture', reasoning: false, input: ['text'], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 }],
    } } });
    const settings = await readJSON(path.join(home, '.pi/settings.json'));
    await writeJSON(path.join(home, '.pi/settings.json'), { ...settings, smokePreference: 'preserve-local-setting' });
    await fs.writeFile(path.join(home, 'organization/PLAYBOOK.md'), `# Synthetic organization rules\n${actor.toUpperCase()}_PRIVATE_PLAYBOOK_MARKER\nUse only the explicitly authorized synthetic fixture records.\n`, { mode: 0o600 });
    await fs.writeFile(path.join(home, '.hq/private-marker.txt'), `${actor.toUpperCase()}_PRIVATE_STATE_MARKER\n`, { mode: 0o600 });
  }
  await writeJSON(path.join(parentHome, '.pi/agents.json'), { peers: { 'engineering-peer': {
    command: path.join(peerHome, 'bin/engineering-agent'), args, cwd: peerProject, env,
    description: 'Isolated integration fixture peer', release: release.buildId,
  } } });
  const makeClient = async (home, cwd, extra = []) => {
    const client = new RpcClient({ command: path.join(home, 'bin/engineering-agent'), args: [...args, ...extra], cwd, env,
      onEvent: event => { if (event.type === 'tool_execution_end') events.push({ tool: event.toolName, isError: !!event.isError }); },
      onDialog: () => { dialogCount++; throw new Error('Unexpected human dialog: this test never supplies approval'); },
    });
    clients.add(client);
    await client.start();
    const state = await client.request('get_state', {}, { signal: budget.signal });
    assert.equal(state.model.provider, 'study');
    assert.equal(state.model.id, 'probe');
    return client;
  };
  const prompt = async (client, label) => {
    const result = await client.prompt(`SMOKE[${label}] Execute only the local integration fixture steps authorized by this test.`, { signal: budget.signal, timeoutMs: 60000 });
    if (fixtureError) throw fixtureError;
    assert.equal(result.text, `${label.toUpperCase()}_VERIFIED`);
    assert.ok(!result.unansweredInputs?.length);
    return result;
  };
  let parent, first, resumed;
  await check('Actual startup, skill paths and prompt registration', async () => {
    parent = await makeClient(parentHome, initial);
    const { commands } = await parent.request('get_commands', {}, { signal: budget.signal });
    const skills = commands.filter(item => item.source === 'skill');
    for (const name of skillNames) assert.ok(skills.some(item => item.sourceInfo?.path === path.join(parentHome, '.pi/skills', name, 'SKILL.md')), `Missing installed skill ${name}`);
    for (const name of ['parse-document', 'diagram-design']) assert.ok(skills.some(item => item.name === `skill:${name}`), `Missing package skill ${name}`);
    for (const item of skills) { assert.ok(inside(item.sourceInfo.path, parentHome)); await fs.access(item.sourceInfo.path); }
    for (const name of ['consult', 'case-recap', 'close-consultation', 'doctor', 'export-diagram', 'import-excalidraw', 'import-mermaid', 'profile']) assert.ok(commands.some(item => item.source === 'prompt' && item.name === name), `Missing prompt ${name}`);
    return { registeredSkills: skills.length, prompts: commands.filter(item => item.source === 'prompt').map(item => item.name).sort() };
  });
  await check('Runtime npm helpers install into private state without changing the release', async () => {
    await fs.mkdir(helperSource);
    await writeJSON(path.join(helperSource, 'package.json'), { name: helperName, version: '1.0.0', private: true, type: 'module', bin: { [helperName]: 'bin.mjs' }, files: ['bin.mjs'] });
    await fs.writeFile(path.join(helperSource, 'bin.mjs'), helperCode, { mode: 0o755 });
    const packCache = path.join(temporary, 'pack cache');
    const packed = JSON.parse(await command(path.join(relocated, 'runtime/node/bin/node'), [
      path.join(relocated, 'runtime/node/lib/node_modules/npm/bin/npm-cli.js'),
      'pack', '--offline', '--ignore-scripts', '--json', '--loglevel=error', '--pack-destination', helperSource,
    ], { cwd: helperSource, env: { ...env, npm_config_cache: packCache, NPM_CONFIG_CACHE: packCache } }));
    assert.equal(packed.length, 1);
    assert.equal(packed[0].filename, path.basename(helperTarball));
    await prompt(parent, 'npm-tools');
    assert.equal((await readJSON(path.join(installedHelper, 'package.json'))).name, helperName);
    assert.equal(await fs.readFile(path.join(installedHelper, 'bin.mjs'), 'utf8'), helperCode);
    assert.equal(await fs.realpath(helperBin), path.join(installedHelper, 'bin.mjs'));
    await fs.access(privateCache);
    const ownRelease = path.join(parentHome, '.agent/current');
    for (const relative of [`runtime/node/lib/node_modules/${helperName}`, `runtime/node/bin/${helperName}`]) {
      await assert.rejects(fs.access(path.join(ownRelease, relative)), { code: 'ENOENT' });
      await assert.rejects(fs.access(path.join(relocated, relative)), { code: 'ENOENT' });
    }
    return { installSource: 'dependency-free local tarball; offline, scripts disabled', prefix: 'app home/.hq/tools/npm', cache: 'app home/.hq/cache/npm', executableOnPath: true, helperAbsentFromRelease: true };
  });
  await check('Native read/bash travel, native PDF parsing and attributed HQ write', async () => {
    first = await prompt(parent, 'parent-work');
    assert.ok(inside(first.session.sessionFile, path.join(parentHome, '.hq/sessions')));
    const tools = schemas.get('parent');
    for (const name of ['agent_identity', 'agent_peers', 'agent_ask', 'hq_find', 'hq_navigate', 'hq_note', 'read', 'bash', 'change_dir', 'document_parse', 'document_search', 'document_screenshot', 'browser', 'web_search']) assert.ok(tools.has(name), `Missing schema ${name}`);
    for (const field of ['attribution', 'scope']) assert.ok(tools.get('hq_note').parameters.required.includes(field), `hq_note must require ${field}`);
    await parent.close();
    return { tools: [...tools.keys()].sort(), noteAttributionRequired: true, nativePDF: true };
  });
  await check('Session restart restores directory and case; implicit write is refused', async () => {
    parent = await makeClient(parentHome, initial, ['--session', first.session.sessionFile]);
    resumed = await prompt(parent, 'parent-resume');
    assert.equal(resumed.session.sessionId, first.session.sessionId);
    const entries = (await fs.readFile(first.session.sessionFile, 'utf8')).split('\n').filter(Boolean).map(JSON.parse);
    assert.ok(entries.some(entry => entry.type === 'custom' && entry.customType === 'change-working-dir' && entry.data?.dir === target));
    assert.ok(entries.some(entry => entry.type === 'custom' && entry.customType === 'consultant-hq-case-v1' && entry.data?.project === 'parent'));
    const stored = await readJSON(path.join(parentHome, '.hq/cases/fixture/parent/case.json'));
    assert.deepEqual(stored.notes.map(item => item.text), [parentNote, resumedNote]);
    assert.ok(stored.notes.every(item => item.attribution === 'deterministic smoke fixture' && item.sessionId === first.session.sessionId));
    return { sameSession: true, restoredDirectory: true, restoredWriteRejected: true, explicitCaseKeyWriteAccepted: true };
  });
  await check('Real agent_ask starts a complete isolated peer and returns its work', async () => {
    await prompt(parent, 'parent-delegate');
    assert.ok(delegatedSession?.sessionFile);
    assert.notEqual(delegatedSession.sessionId, first.session.sessionId);
    const own = await readJSON(path.join(parentHome, '.hq/cases/fixture/parent/case.json'));
    const other = await readJSON(path.join(peerHome, '.hq/cases/fixture/peer/case.json'));
    assert.deepEqual(own.notes.map(item => item.text), [parentNote, resumedNote]);
    assert.deepEqual(other.notes.map(item => item.text), [peerNote]);
    assert.equal(other.notes[0].sessionId, delegatedSession.sessionId);
    await assert.rejects(fs.access(path.join(parentHome, '.hq/cases/fixture/peer/case.json')), { code: 'ENOENT' });
    await assert.rejects(fs.access(path.join(peerHome, '.hq/cases/fixture/parent/case.json')), { code: 'ENOENT' });
    await parent.close();
    return { separateHomes: true, separateSessions: true, peerToolsActuallyExecuted: ['agent_identity', 'read', 'bash', 'hq_find', 'hq_navigate', 'hq_note'] };
  });
  await check('Delegated peer can restart and read its own persisted case', async () => {
    const peer = await makeClient(peerHome, peerProject, ['--session', delegatedSession.sessionFile]);
    const result = await prompt(peer, 'peer-resume');
    assert.equal(result.session.sessionId, delegatedSession.sessionId);
    await peer.close();
    return { persistedPeerCase: true, samePeerSession: true };
  });
  await check('No synthetic human approval or unexpected tool failure', async () => {
    assert.equal(dialogCount, 0);
    const errors = events.filter(event => event.isError);
    assert.equal(errors.length, 1, 'Only the intentional restored-case write must fail');
    assert.equal(errors[0].tool, 'hq_note');
    for (const home of [parentHome, peerHome]) assert.deepEqual(await fs.readdir(path.join(home, '.hq/outbox')), []);
    assert.equal(records.size, [...plans.values()].reduce((sum, plan) => sum + plan.length, 0));
    return { humanAnswersSent: 0, externalActions: 0, expectedRejectedWrites: 1, verifiedToolResults: records.size };
  });
  await check('CLI reinstall preserves settings, private playbook, cases and sessions', async () => {
    for (const [home, sessionFile, casePath] of [[parentHome, first.session.sessionFile, 'fixture/parent'], [peerHome, delegatedSession.sessionFile, 'fixture/peer']]) {
      const files = [path.join(home, '.pi/settings.json'), path.join(home, '.pi/models.json'), path.join(home, 'organization/PLAYBOOK.md'), path.join(home, '.hq/private-marker.txt'), path.join(home, '.hq/cases', casePath, 'case.json'), sessionFile];
      if (home === parentHome) files.push(path.join(home, '.pi/agents.json'), path.join(installedHelper, 'package.json'), path.join(installedHelper, 'bin.mjs'));
      const before = await Promise.all(files.map(async file => sha(await fs.readFile(file))));
      await command(releaseCommand, ['install', '--home', home], { cwd: initial, env, timeoutMs: 180000 });
      assert.deepEqual(await Promise.all(files.map(async file => sha(await fs.readFile(file)))), before);
      assert.equal((await readJSON(path.join(home, '.agent/installed.json'))).buildId, release.buildId);
      if (home === parentHome) assert.equal(await fs.realpath(helperBin), path.join(installedHelper, 'bin.mjs'));
    }
    return { homes: 2, settingsPreserved: true, privateStatePreserved: true, sessionsPreserved: true, privateNpmHelperPreserved: true };
  });
  report.fixture = { providerRequests: requestCount, verifiedToolResults: records.size, humanAnswersSent: 0, externalServicesUsed: 0 };
  report.status = 'passed';
}

try {
  await main();
} catch (error) {
  report.status = 'failed';
  report.error = clean((fixtureError ?? error).message);
  report.failedCheck = currentCheck ?? 'release setup';
  console.error(`FAIL ${report.failedCheck}: ${report.error}`);
  process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  await Promise.allSettled([...clients].map(client => client.close()));
  for (const child of processes) child.kill('SIGKILL');
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  try {
    if (temporary) await fs.rm(temporary, { recursive: true, force: true });
    report.cleanedTemporaryHomes = true;
  } catch (error) {
    report.cleanedTemporaryHomes = false;
    report.cleanupError = clean(error.message);
    report.status = 'failed';
    process.exitCode = 1;
    console.error(`Temporary fixture cleanup failed: ${report.cleanupError}`);
  }
  report.completedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(reportFile), { recursive: true });
  await writeJSON(reportFile, report);
  console.log(`Smoke report: ${reportFile}`);
}

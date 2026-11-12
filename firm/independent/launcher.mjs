#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { install, exists, readJSON, registerRun } from './installation.mjs';
import { doctor } from './doctor.mjs';

const bundle = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const release = await readJSON(path.join(bundle, 'release.json'));
let home = process.env.ENGINEERING_AGENT_HOME || path.join(os.homedir(), '.pi-consultants/engineering');
let cwd, command = 'run';
const args = [];
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--home' || arg === '--cwd') {
    const value = process.argv[++i];
    if (!value) throw new Error(`Missing value for ${arg}`);
    if (arg === '--home') home = value; else cwd = value;
  } else if (args.length === 0 && ['install', 'describe', 'doctor', 'configure'].includes(arg) && command === 'run') command = arg;
  else args.push(arg);
}
home = path.resolve(home);

async function execute(executable, argv, options, run) {
  const child = spawn(executable, argv, { ...options, stdio: 'inherit' });
  const completion = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve(code ?? (signal === 'SIGINT' ? 130 : 1)));
  });
  completion.catch(() => {});
  const handlers = new Map(['SIGINT', 'SIGTERM', 'SIGHUP'].map(signal => [signal, () => child.kill(signal)]));
  for (const [signal, handler] of handlers) process.on(signal, handler);
  try {
    try { if (child.pid) await run?.track(child.pid); }
    catch (error) {
      child.kill('SIGTERM');
      const deadline = setTimeout(() => child.kill('SIGKILL'), 1500);
      try { await completion; } catch { /* report the original tracking failure */ }
      finally { clearTimeout(deadline); }
      throw error;
    }
    return await completion;
  } finally { for (const [signal, handler] of handlers) process.off(signal, handler); }
}

async function main() {
  if (command === 'describe') {
    const { files, officeFiles, ...description } = release;
    console.log(JSON.stringify({ ...description, home, modes: ['interactive', 'print', 'rpc'] }, null, 2));
    return;
  }
  if (args.includes('--help') && command === 'run') {
    console.log(`Engineering consultant B ${release.version}\n\nengineering-agent [--home DIR] [--cwd PROJECT] [PiG options]\nengineering-agent install [--home DIR]\nengineering-agent describe\nengineering-agent doctor [--home DIR]\nengineering-agent configure [--home DIR] [HQ configure options]\n\nA new home is initialized on first use. install selects a new release in an existing home.\nDefault home: ~/.pi-consultants/engineering\nDefault working directory: the caller's working directory\nNative modes: interactive (default), -p 'request', --mode rpc; -c continues the latest session.\nProvider settings and credentials live in HOME/.pi; /login opens the usual provider login.\nSee the bundled README.md for setup, delegation, updating and manual tests.`);
    return;
  }
  if (command === 'install' || !await exists(path.join(home, '.agent/installed.json'))) {
    const result = await install(bundle, home);
    home = result.home;
    process.stderr.write(`Installed ${release.name} ${release.version}\nHome: ${home}\nCommand: ${result.command}\n`);
    if (command === 'install') return;
  }
  home = await fs.realpath(home);
  const endRun = await registerRun(home, release);
  try {
    // Optional package installers must never mutate the versioned Node runtime.
    const npmPrefix = path.join(home, '.hq/tools/npm');
    const npmCache = path.join(home, '.hq/cache/npm');
    const env = {
      ...process.env,
      ENGINEERING_AGENT_HOME: home,
      PIG_HOME: path.join(home, '.pig'),
      PIG_USE_PI_DIRS: '1',
      PIG_TS_RUNTIME: 'node',
      PIG_CODING_AGENT_DIR: path.join(home, '.pi'),
      PI_CODING_AGENT_DIR: path.join(home, '.pi'),
      NPM_CONFIG_PREFIX: npmPrefix,
      npm_config_prefix: npmPrefix,
      NPM_CONFIG_CACHE: npmCache,
      npm_config_cache: npmCache,
      PATH: [path.join(bundle, 'runtime/node/bin'), path.join(npmPrefix, 'bin'), process.env.PATH || ''].join(path.delimiter),
    };
    delete env.CONSHQ_CONFIG; delete env.CONSHQ_HOME; delete env.PI_PROFILE_SWITCH_DIR;
    delete env.PIG_PIGLET_PATH; delete env.PIG_PIGLET_NAME;
    delete env.PIG_TS_RUNTIMES_DIR; delete env.PIG_PACKAGE_DIR; delete env.PI_PACKAGE_DIR;
    if (command === 'doctor') {
      process.exitCode = await doctor({ home, bundle, release, env });
      return;
    }
    if (command === 'configure') {
      process.exitCode = await execute(path.join(bundle, 'runtime/node/bin/node'), [path.join(home, '.runtime/bin/hq.mjs'), command, '--root', home, ...args], { cwd: home, env }, endRun);
      return;
    }
    const nativeArgs = [];
    for (const name of await fs.readdir(path.join(home, '.pi/skills'))) {
      const dir = path.join(home, '.pi/skills', name);
      if (await exists(path.join(dir, 'SKILL.md'))) nativeArgs.push('--skill', dir);
    }
    for (const name of release.packages) nativeArgs.push('-e', path.join(bundle, 'packages/node_modules', name));
    nativeArgs.push('--skill', path.join(bundle, 'packages/diagram-design/skills/diagram-design'));
    nativeArgs.push('--prompt-template', path.join(home, '.pi/prompts'), '--prompt-template', path.join(bundle, 'packages/diagram-design/prompts'));
    nativeArgs.push('--session-dir', path.join(home, '.hq/sessions'), ...args);
    process.exitCode = await execute(path.join(bundle, 'runtime/engineering'), nativeArgs, { cwd: cwd ? path.resolve(cwd) : process.cwd(), env }, endRun);
  } finally { await endRun(); }
}

main().catch(error => { console.error(`engineering-agent: ${error.message}`); process.exitCode = 1; });

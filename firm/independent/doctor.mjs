import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { exists, readJSON } from './installation.mjs';

/** Application prerequisites, not the ordinary office's global-Pi prerequisite check. */
export async function doctor({ home, bundle, release, env }) {
  const { loadHQConfig } = await import(pathToFileURL(path.join(home, '.runtime/src/config.mjs')));
  const config = await loadHQConfig(path.join(home, '.pi/hq.json'));
  const checks = [], add = (name, passed, detail) => checks.push({ name, passed: !!passed, detail });
  const engine = spawnSync(path.join(bundle, 'runtime/engineering'), ['--version'], { env, encoding: 'utf8', timeout: 10000 });
  add('Bundled PiG', engine.status === 0, (engine.stdout || engine.stderr || engine.error?.message || '').trim());
  const [major, minor] = process.versions.node.split('.').map(Number);
  add('Bundled Node', major > 24 || major === 24 && minor >= 15, process.versions.node);
  add('HQ identity', config.role === 'engineering' && config.hq === await fs.realpath(home), config.hq);
  add('Private state', config.stateDir === path.join(home, '.hq'), config.stateDir);
  const missing = [];
  for (const name of Object.keys(release.officeFiles)) if (!await exists(path.join(home, name))) missing.push(name);
  add('Installed practice resources', !missing.length, missing.length ? missing.join(', ') : `${Object.keys(release.officeFiles).length} managed files present`);
  for (const name of release.packages) add(`Package ${name}`, await exists(path.join(bundle, 'packages/node_modules', name, 'package.json')), 'Materialized in this release; no global Pi package installation needed');
  const toolset = await readJSON(path.join(home, '.pi/toolset.json'));
  const software = [];
  for (const tool of toolset.software || []) {
    let found = (tool.commands || []).some(([command, ...args]) => spawnSync(command, args, { env, stdio: 'ignore', timeout: 10000 }).status === 0);
    for (const file of tool.paths || []) found ||= await exists(file);
    software.push({ ...tool, found });
    if (tool.required) add(tool.name, found, found ? tool.purpose : `Install: ${tool.install}`);
  }
  software.push({ name: 'LibreOffice', required: false, found: spawnSync('soffice', ['--version'], { env, stdio: 'ignore', timeout: 10000 }).status === 0,
    purpose: 'Office-format conversion used by document parsing', install: 'https://www.libreoffice.org/download/download-libreoffice/' });
  const report = { verdict: checks.every(item => item.passed) ? 'prerequisites_met' : 'prerequisites_unmet',
    scope: 'Installed files and local software; provider access, connector accounts and model quality are not tested',
    agent: release.name, version: release.version, buildId: release.buildId, home, checks, software,
    credentials: 'Configure /login or provider environment variables; this app owns its .pi account files.' };
  console.log(JSON.stringify(report, null, 2));
  return checks.every(item => item.passed) ? 0 : 1;
}

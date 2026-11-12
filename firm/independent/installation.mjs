import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export const exists = file => fs.lstat(file).then(() => true, error => {
  if (error.code === 'ENOENT') return false;
  throw error;
});
export const readJSON = async file => JSON.parse(await fs.readFile(file, 'utf8'));
export async function writeJSON(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  await fs.rename(temp, file);
}

/** Stable inventory, including npm's relative executable links. */
export async function inventory(root, relative = '', out = {}) {
  for (const entry of (await fs.readdir(path.join(root, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const name = path.posix.join(relative, entry.name), file = path.join(root, name);
    if (entry.isDirectory()) await inventory(root, name, out);
    else if (entry.isSymbolicLink()) out[name] = { link: await fs.readlink(file) };
    else if (entry.isFile()) out[name] = { sha256: digest(await fs.readFile(file)), executable: !!((await fs.stat(file)).mode & 0o111) };
    else throw new Error(`Unsupported release file: ${file}`);
  }
  return out;
}

function safeRelative(name) {
  if (!name || path.isAbsolute(name) || name.split(/[\\/]/).some(part => !part || part === '..' || part === '.')) throw new Error(`Invalid release path: ${name}`);
}

/** Managed files must not traverse a local symlink into another office. */
async function safeDestination(home, name) {
  safeRelative(name);
  let current = home;
  for (const part of name.split('/')) {
    current = path.join(current, part);
    try { if ((await fs.lstat(current)).isSymbolicLink()) throw new Error(`Managed path is a symlink: ${current}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return path.join(home, name);
}

export async function verifyBundle(bundle) {
  const release = await readJSON(path.join(bundle, 'release.json'));
  if (typeof release.buildId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/.test(release.buildId)) throw new Error('Invalid release build identifier.');
  if (release.id !== 'engineering' || release.stateSchema !== 1 || release.platform !== process.platform || release.arch !== process.arch) {
    throw new Error(`This bundle is not a compatible Engineering release for ${process.platform}-${process.arch}.`);
  }
  const actual = await inventory(bundle);
  delete actual['release.json'];
  for (const [name, expected] of Object.entries(release.files)) {
    safeRelative(name);
    if (JSON.stringify(actual[name]) !== JSON.stringify(expected)) throw new Error(`Release integrity check failed: ${name}`);
    if (expected.link !== undefined && (path.isAbsolute(expected.link) || !path.resolve(bundle, path.dirname(name), expected.link).startsWith(bundle + path.sep))) {
      throw new Error(`Release link escapes its bundle: ${name}`);
    }
  }
  if (Object.keys(actual).length !== Object.keys(release.files).length) throw new Error('Release has unrecorded or missing files.');
  return release;
}

function alive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { if (error.code === 'ESRCH') return false; return true; }
}

export async function withInstallLock(home, fn) {
  await fs.mkdir(path.join(home, '.agent'), { recursive: true, mode: 0o700 });
  await safeDestination(home, '.agent/install.lock');
  const lock = path.join(home, '.agent/install.lock');
  try { await fs.writeFile(lock, JSON.stringify({ pid: process.pid }), { flag: 'wx', mode: 0o600 }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const owner = await readJSON(lock).catch(() => null);
    if (!owner?.pid || alive(owner.pid)) throw new Error(`Another install or launch holds ${lock}. Close it before retrying.`);
    await fs.unlink(lock);
    return withInstallLock(home, fn);
  }
  try { return await fn(); }
  finally { await fs.rm(lock, { force: true }); }
}

async function requireStopped(home) {
  const runs = path.join(home, '.agent/runs');
  await safeDestination(home, '.agent/runs');
  for (const name of await fs.readdir(runs).catch(error => { if (error.code === 'ENOENT') return []; throw error; })) {
    const file = path.join(runs, name), run = await readJSON(file);
    const active = [run.pid, run.childPid].filter(pid => Number.isSafeInteger(pid) && pid > 0).find(alive);
    if (active) throw new Error(`Engineering is running (PID ${active}). Close its sessions before installing a release.`);
    await fs.unlink(file);
  }
}

/** Explicit release selection. Settings are a seed; local additions and private data are outside the managed inventory. */
export async function install(bundle, requestedHome) {
  bundle = await fs.realpath(bundle);
  const release = await verifyBundle(bundle);
  await fs.mkdir(requestedHome, { recursive: true, mode: 0o700 });
  const home = await fs.realpath(requestedHome);
  if (home === bundle || home.startsWith(bundle + path.sep) || bundle.startsWith(home + path.sep) && !bundle.startsWith(path.join(home, '.agent/releases') + path.sep)) {
    throw new Error('Choose an application home outside the extracted release.');
  }
  return withInstallLock(home, async () => {
    await requireStopped(home);
    const pendingFile = await safeDestination(home, '.agent/pending-install.json');
    const pending = await exists(pendingFile) ? await readJSON(pendingFile) : null;
    if (pending && pending.buildId !== release.buildId) throw new Error(`Finish the interrupted install of ${pending.buildId} before selecting another release.`);
    const markerFile = await safeDestination(home, '.agent/installed.json');
    const old = await exists(markerFile) ? await readJSON(markerFile) : null;
    if (old && (old.id !== release.id || old.stateSchema !== release.stateSchema)) throw new Error('This home has a different agent or state schema; automatic migration is not supported.');
    const next = release.officeFiles, previous = old?.officeFiles ?? {}, conflicts = [];
    // Preflight every write destination before replacing any managed practice.
    for (const name of ['.pi/settings.json', '.hq/sessions', 'bin/engineering-agent', '.agent/backups']) await safeDestination(home, name);
    for (const name of new Set([...Object.keys(previous), ...Object.keys(next)])) {
      const file = await safeDestination(home, name);
      if (!await exists(file)) continue;
      const current = digest(await fs.readFile(file));
      if (current !== next[name] && current !== previous[name]) conflicts.push(name);
    }
    if (conflicts.length) throw new Error(`No files changed. These practice files were edited or block new files:\n${conflicts.map(name => `  ${name}`).join('\n')}\nMove the improvements into maintained source, or save them elsewhere before installing.`);
    const releases = await safeDestination(home, '.agent/releases');
    await fs.mkdir(releases, { recursive: true, mode: 0o700 });
    const destination = path.join(releases, release.buildId);
    await safeDestination(home, `.agent/releases/${release.buildId}`);
    if (!await exists(destination)) {
      const staging = `${destination}.${process.pid}.tmp`;
      try {
        await fs.cp(bundle, staging, { recursive: true, dereference: false, verbatimSymlinks: true });
        await fs.rename(staging, destination);
      } finally { await fs.rm(staging, { recursive: true, force: true }); }
    } else await verifyBundle(destination);
    const current = path.join(home, '.agent/current'), temporary = `${current}.${process.pid}.tmp`;
    if (await exists(current) && !(await fs.lstat(current)).isSymbolicLink()) throw new Error('The installed release pointer is not a symlink; inspect .agent/current before updating.');
    await writeJSON(pendingFile, { buildId: release.buildId, version: release.version });
    // Keep a recoverable copy of replaced practice, even if interrupted mid-update.
    if (old && old.buildId !== release.buildId) {
      const backup = path.join(home, '.agent/backups', `${Date.now()}-${old.buildId}`);
      for (const name of Object.keys(previous)) if (await exists(path.join(home, name))) {
        await fs.mkdir(path.dirname(path.join(backup, name)), { recursive: true, mode: 0o700 });
        await fs.copyFile(path.join(home, name), path.join(backup, name));
      }
      await writeJSON(path.join(backup, 'installed.json'), old);
    }
    for (const name of Object.keys(previous)) if (!(name in next)) await fs.rm(path.join(home, name), { force: true });
    for (const name of Object.keys(next)) {
      const file = path.join(home, name);
      await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
      await fs.copyFile(path.join(destination, 'office', name), file);
    }
    const settings = await safeDestination(home, '.pi/settings.json');
    if (!await exists(settings)) await fs.copyFile(path.join(destination, 'office/.pi/settings.defaults.json'), settings);
    await fs.mkdir(path.join(home, '.hq/sessions'), { recursive: true, mode: 0o700 });
    await fs.mkdir(path.join(home, 'bin'), { recursive: true, mode: 0o700 });
    await safeDestination(home, 'bin/engineering-agent');
    const wrapper = '#!/bin/sh\nset -eu\nagent_home=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)\nexec "$agent_home/.agent/current/runtime/node/bin/node" "$agent_home/.agent/current/app/launcher.mjs" --home "$agent_home" "$@"\n';
    await fs.writeFile(path.join(home, 'bin/engineering-agent'), wrapper, { mode: 0o755 });
    await fs.rm(temporary, { force: true });
    await fs.symlink(path.join('releases', release.buildId), temporary);
    await fs.rename(temporary, current);
    await writeJSON(markerFile, { id: release.id, version: release.version, stateSchema: release.stateSchema, buildId: release.buildId, officeFiles: next });
    await fs.rm(pendingFile);
    return { home, release, command: path.join(home, 'bin/engineering-agent') };
  });
}

export async function registerRun(home, release) {
  return withInstallLock(home, async () => {
    if (await exists(path.join(home, '.agent/pending-install.json'))) throw new Error('An install was interrupted. Rerun install from that same release before starting Engineering.');
    const marker = await readJSON(path.join(home, '.agent/installed.json'));
    if (marker.buildId !== release.buildId) throw new Error('This home uses another release. Run this bundle with install to select it, or use the installed bin/engineering-agent.');
    const file = await safeDestination(home, `.agent/runs/${process.pid}.json`);
    const record = { pid: process.pid, buildId: release.buildId, startedAt: new Date().toISOString() };
    await writeJSON(file, record);
    const end = () => fs.rm(file, { force: true });
    end.track = childPid => writeJSON(file, { ...record, childPid });
    return end;
  });
}

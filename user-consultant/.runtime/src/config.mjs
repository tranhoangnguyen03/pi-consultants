import fs from 'node:fs/promises';
import path from 'node:path';
import {assert,readJSON,atomic,within} from './util.mjs';

/** Resolve every relative configuration path against the HQ configuration file,
 * never the agent's execution directory. Version 1 remains readable for migration/tests. */
export async function loadHQConfig(configPath) {
  assert(configPath && path.isAbsolute(configPath), 'HQ configuration must have an explicit absolute path');
  const base = await readJSON(configPath);
  assert([1,2].includes(base.version), 'Unsupported HQ configuration version');
  if (base.version === 1) return base;
  const local = await readJSON(path.join(path.dirname(configPath), 'hq.local.json'), {});
  for (const key of ['version','role','hq','stateDir','kitRoot']) {
    assert(local[key] === undefined, `hq.local.json cannot override ${key}`);
  }
  const config = {...base,...local};
  // Resolve symlinks once (e.g. macOS /var -> /private/var) so the containment check compares like with like.
  const dir = await fs.realpath(path.dirname(configPath));
  const resolve = value => {
    assert(typeof value === 'string' && value.length > 0, 'Configuration paths must be nonempty strings');
    assert(!value.startsWith('~'), 'Use an absolute path or a configuration-relative path, not ~');
    return path.resolve(dir,value);
  };
  config.hq = await fs.realpath(resolve(base.hq));
  config.kitRoot = config.hq;
  config.stateDir = resolve(base.stateDir ?? '../.hq');
  assert(within(config.hq,config.stateDir), 'Private state must remain inside this HQ');
  let ancestor=config.stateDir;
  for(;;){try{const real=await fs.realpath(ancestor);assert(within(config.hq,real),'Private state resolves outside this HQ');break;}catch(e){if(e.code!=='ENOENT')throw e;const parent=path.dirname(ancestor);assert(parent!==ancestor,'Cannot resolve state directory');ancestor=parent;}}
  for (const key of ['projectRoots','localReadRoots','attachmentRoots']) {
    assert(Array.isArray(config[key] ?? []), `${key} must be an array`);
    config[key] = (config[key] ?? []).map(resolve);
  }
  assert(Array.isArray(config.sessionRoots ?? []),'sessionRoots must be an array');
  config.sessionRoots = [path.join(config.stateDir,'sessions'),...(config.sessionRoots ?? [])].map(root =>
    typeof root === 'string' ? resolve(root) : {...root,path:resolve(root.path)});
  return config;
}

/** Persist policy to a gitignored overlay. Do not turn relocatable base paths into absolute paths. */
export async function saveHQPolicy(configPath, policy) {
  const base = await readJSON(configPath);
  if (base.version === 1) return atomic(configPath,{...base,policy});
  const localPath = path.join(path.dirname(configPath),'hq.local.json');
  return atomic(localPath,{...(await readJSON(localPath,{})),policy});
}

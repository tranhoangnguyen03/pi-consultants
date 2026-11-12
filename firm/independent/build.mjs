#!/usr/bin/env node
/** Native release build from canonical practice, never from a working office. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadFirm, buildOffice } from '../scripts/factory.mjs';
import { inventory, digest, exists, readJSON, writeJSON } from './installation.mjs';

const source = path.dirname(fileURLToPath(import.meta.url));
const firm = path.dirname(source), repo = path.dirname(firm);
const options = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i];
  if (!['--out', '--cache'].includes(key) || !process.argv[i + 1]) throw new Error('Usage: node firm/independent/build.mjs [--out DIR] [--cache DIR]');
  options[key.slice(2)] = path.resolve(process.argv[i + 1]);
}
const out = options.out || path.join(firm, 'dist/independent');
const cache = options.cache || path.join(out, 'cache');
const target = `${process.platform}-${process.arch}`;
const identity = await readJSON(path.join(source, 'engineering.json'));
const lock = await readJSON(path.join(source, 'runtime-lock.json'));
if (!lock.pig.archives[target] || !lock.node.archives[target]) throw new Error(`No verified runtime lock for ${target}; build on Linux x64, macOS arm64 or macOS x64.`);

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, { cwd: repo, stdio: 'inherit', ...opts });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args[0]} failed (${result.status ?? result.signal})`);
  return result.stdout?.toString().trim();
}
const capture = (command, args, opts) => run(command, args, { stdio: ['ignore', 'pipe', 'inherit'], ...opts });
async function download(url, item) {
  const file = path.join(cache, item.name);
  if (!await exists(file) || digest(await fs.readFile(file)) !== item.sha256) {
    const temp = `${file}.download`;
    run('curl', ['--fail', '--location', '--silent', '--show-error', '--retry', '3', '--output', temp, url]);
    if (digest(await fs.readFile(temp)) !== item.sha256) throw new Error(`Checksum mismatch for ${item.name}; refusing to use the download.`);
    await fs.rename(temp, file);
  }
  return file;
}

await fs.mkdir(cache, { recursive: true });
const bundle = path.join(out, 'bundle'), work = path.join(out, 'work');
// Disposable build directories; deployed homes and private records are never inputs.
for (const dir of [bundle, work]) { await fs.rm(dir, { recursive: true, force: true }); await fs.mkdir(dir, { recursive: true }); }
console.log(`Building ${identity.name} ${identity.version} for ${target}`);
const pigArchive = lock.pig.archives[target], nodeArchive = lock.node.archives[target];
const pigDownload = await download(`${lock.pig.source}/releases/download/v${lock.pig.version}/${pigArchive.name}`, pigArchive);
const nodeDownload = await download(`https://nodejs.org/dist/v${lock.node.version}/${nodeArchive.name}`, nodeArchive);
const pigDir = path.join(cache, `pig-${lock.pig.version}-${target}`);
await fs.mkdir(pigDir, { recursive: true });
run('tar', ['-xzf', pigDownload, '-C', pigDir, '--strip-components=1']);
const nodeDir = path.join(bundle, 'runtime/node');
await fs.mkdir(nodeDir, { recursive: true });
run('tar', ['-xzf', nodeDownload, '-C', nodeDir, '--strip-components=1']);
const pig = path.join(pigDir, 'pig');
const env = { ...process.env, PIG_HOME: path.join(cache, 'pig-home'), PIG_USE_PI_DIRS: '0' };
// PiG chooses a matching Go toolchain. A release consumer never needs Go.
if (!await exists(path.join(env.PIG_HOME, 'toolchains/go/bin/go'))) run(pig, ['setup', 'go'], { env });
env.PATH = `${path.join(env.PIG_HOME, 'toolchains/go/bin')}${path.delimiter}${path.join(nodeDir, 'bin')}${path.delimiter}${process.env.PATH}`;

const { offices, toolset } = await loadFirm(firm);
const office = offices.find(item => item.role === identity.role);
const officeRoot = path.join(bundle, 'office');
await buildOffice(firm, office, toolset, officeRoot);
const prompt = await fs.readFile(path.join(officeRoot, 'AGENTS.md'), 'utf8');
await fs.rm(path.join(officeRoot, '.pi/extensions'), { recursive: true });
const settings = await readJSON(path.join(officeRoot, '.pi/settings.json'));
settings.packages = [];
await fs.rm(path.join(officeRoot, '.pi/settings.json'));
await writeJSON(path.join(officeRoot, '.pi/settings.defaults.json'), settings);
await fs.appendFile(path.join(officeRoot, '.gitignore'), '\n# Independent application state and account configuration\n.agent/\n.pig/\nbin/\n.pi/auth.json\n.pi/models.json\n.pi/settings.json\n.pi/agents.json\n');
const runbook = (await fs.readFile(path.join(firm, 'docs/INDEPENDENT-ENGINEERING.md'), 'utf8')).replace('(INDEPENDENT-AGENTS.md)', '(docs/INDEPENDENT-AGENTS.md)');
await fs.writeFile(path.join(officeRoot, 'README.md'), runbook);
await fs.cp(path.join(firm, 'docs'), path.join(officeRoot, 'docs'), { recursive: true });
const officeMarker = await readJSON(path.join(officeRoot, 'HQ-ROLE.json'));
await fs.rm(path.join(officeRoot, 'HQ-ROLE.json'));
officeMarker.distribution = 'independent';
officeMarker.entry = 'compiled:engineering';
officeMarker.usage = 'engineering-agent';
officeMarker.generated = Object.fromEntries(Object.entries(await inventory(officeRoot)).map(([name, item]) => [name, item.sha256]));
await writeJSON(path.join(officeRoot, 'HQ-ROLE.json'), officeMarker);

const packageSpec = await readJSON(path.join(source, 'packages/package.json'));
const expectedSources = [
  `git:github.com/fitchmultz/pi-change-working-dir@${packageSpec.dependencies['pi-change-working-dir'].split('#')[1]}`,
  ...['pi-web-access', 'pi-docparser', 'pi-agent-browser'].map(name => `npm:${name}@${packageSpec.dependencies[name]}`),
  `git:github.com/cathrynlavery/diagram-design@${lock.diagram.commit}`,
];
if (JSON.stringify(toolset.packages) !== JSON.stringify(expectedSources)) throw new Error('The shared toolset changed. Update the independent package lock and runtime-lock diagram revision before building.');
const packages = path.join(bundle, 'packages');
await fs.mkdir(packages);
for (const file of ['package.json', 'package-lock.json']) await fs.copyFile(path.join(source, 'packages', file), path.join(packages, file));
run(path.join(nodeDir, 'bin/node'), [path.join(nodeDir, 'lib/node_modules/npm/bin/npm-cli.js'), 'ci', '--ignore-scripts', '--omit=dev', '--omit=peer', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org'], { cwd: packages, env });
const diagram = path.join(packages, 'diagram-design');
run('git', ['clone', '--quiet', lock.diagram.repository, diagram]);
run('git', ['checkout', '--quiet', '--detach', lock.diagram.commit], { cwd: diagram });
await fs.rm(path.join(diagram, '.git'), { recursive: true });

const compiled = path.join(work, 'engineering');
await fs.mkdir(compiled);
await fs.cp(path.join(firm, 'src'), path.join(compiled, 'src'), { recursive: true });
for (const file of ['collaboration.mjs', 'rpc-client.mjs']) await fs.copyFile(path.join(source, file), path.join(compiled, file));
await fs.copyFile(path.join(source, 'entry.ts'), path.join(compiled, 'index.ts'));
const sourceCommit = capture('git', ['rev-parse', 'HEAD']);
const dirty = !!capture('git', ['status', '--porcelain']);
const provenance = { commit: sourceCommit, workingTree: dirty, repository: identity.repository };
await writeJSON(path.join(compiled, 'identity.json'), { ...identity, source: provenance, runtime: { pig: lock.pig.version, node: lock.node.version } });
await fs.writeFile(path.join(work, 'system.md'), prompt);
const manifest = `name: engineering\ndescription: ${JSON.stringify(identity.description)}\nsystemPrompt:\n  file: system.md\nextensions:\n  - name: engineering\n    origins:\n      - local:./engineering\ndiscovery:\n  extensions: []\n  skills: []\nrelease:\n  version: ${identity.version}\n`;
await fs.writeFile(path.join(work, 'piglet.yaml'), manifest);
run(pig, ['piglet', 'build', path.join(work, 'piglet.yaml'), '--format', 'binary', '--out', path.join(bundle, 'runtime/engineering')], { env });

await fs.mkdir(path.join(bundle, 'app'));
for (const file of ['launcher.mjs', 'installation.mjs', 'doctor.mjs', 'rpc-client.mjs', 'collaboration.mjs', 'main-pi.ts']) await fs.copyFile(path.join(source, file), path.join(bundle, 'app', file));
const launcher = '#!/bin/sh\nset -eu\nagent_release=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)\nexec "$agent_release/runtime/node/bin/node" "$agent_release/app/launcher.mjs" "$@"\n';
await fs.writeFile(path.join(bundle, 'engineering-agent'), launcher, { mode: 0o755 });
await fs.copyFile(path.join(repo, 'LICENSE'), path.join(bundle, 'LICENSE'));
await fs.mkdir(path.join(bundle, 'licenses'));
if (await exists(path.join(pigDir, 'LICENSE'))) await fs.copyFile(path.join(pigDir, 'LICENSE'), path.join(bundle, 'licenses/PiG-LICENSE'));
else throw new Error('PiG release archive has no LICENSE; inspect redistribution before proceeding.');
for (const name of ['NOTICE', 'THIRD_PARTY_NOTICES.md', 'LICENSES']) await fs.cp(path.join(pigDir, name), path.join(bundle, 'licenses/PiG', name), { recursive: true });
await fs.writeFile(path.join(bundle, 'README.md'), runbook);
await fs.cp(path.join(firm, 'docs'), path.join(bundle, 'docs'), { recursive: true });
await fs.copyFile(path.join(source, 'runtime-lock.json'), path.join(bundle, 'runtime-lock.json'));
await fs.copyFile(path.join(work, 'piglet.yaml'), path.join(bundle, 'build-manifest.yaml'));
const fullOffice = await inventory(officeRoot);
const officeFiles = Object.fromEntries(Object.entries(fullOffice).map(([name, value]) => {
  if (!value.sha256) throw new Error(`Unexpected link in generated office: ${name}`);
  return [name, value.sha256];
}));
const files = await inventory(bundle);
const buildId = `${identity.version}-${target}-${digest(JSON.stringify(files)).slice(0,16)}`;
const release = { ...identity, buildId, platform: process.platform, arch: process.arch, source: provenance,
  runtime: { pig: lock.pig.version, pigBuild: capture(pig, ['--version']), node: lock.node.version },
  build: { go: capture('go', ['version'], { env }) },
  packages: Object.keys(packageSpec.dependencies), packageSources: toolset.packages,
  requirements: { required: ['git'], optional: toolset.software.filter(item => !item.required).map(item => item.name), accounts: 'Configure provider and connector access in the installed home. No credentials are included.' },
  officeFiles, files };
await writeJSON(path.join(bundle, 'release.json'), release);
const stem = `${identity.command}-${identity.version}-${target}`;
const archive = path.join(out, `${stem}.tar.gz`);
run('tar', ['-czf', archive, '-C', out, 'bundle']);
await fs.writeFile(`${archive}.sha256`, `${digest(await fs.readFile(archive))}  ${path.basename(archive)}\n`);
console.log(`Built ${archive}\nBuild: ${buildId}\nSource: ${sourceCommit}${dirty ? ' (includes uncommitted working tree)' : ''}`);

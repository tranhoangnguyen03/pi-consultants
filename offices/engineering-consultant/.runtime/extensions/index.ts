/** Native HQ entry. Pi supplies host dependencies; no launcher or environment override is needed. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Type } from '@earendil-works/pi-ai';
import { registerHQ } from '../src/pi-extension.mjs';
const hqRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export default async function(pi) {
  // A stale CONSHQ_CONFIG must never select another consultant when started in this HQ.
  const deploymentRoot = path.basename(hqRoot)==='.runtime' ? path.dirname(hqRoot) : hqRoot;
  await registerHQ(pi, { Type, configPath: path.join(deploymentRoot, '.pi', 'hq.json') });
}

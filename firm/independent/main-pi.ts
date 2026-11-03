/** Optional adapter for an existing main Pi session:
 * 1. Configure peers in ~/.pi-consultants/main/.pi/agents.json (the peers schema).
 * 2. Run pi -e /absolute/path/to/firm/independent/main-pi.ts.
 * PI_CONSULTANTS_HOME selects another configuration home. This adapter only
 * registers agent_peers/agent_ask; it creates no HQ or settings and copies no state.
 */
import os from 'node:os';
import path from 'node:path';
import { Type } from '@earendil-works/pi-ai';
import { registerCollaboration } from './collaboration.mjs';

export default function mainPi(pi) {
  registerCollaboration(pi, {
    Type,
    home: path.resolve(process.env.PI_CONSULTANTS_HOME || path.join(os.homedir(), '.pi-consultants/main')),
    identity: { id: 'main-pi', name: 'Main Pi', protocol: 1 },
  });
}

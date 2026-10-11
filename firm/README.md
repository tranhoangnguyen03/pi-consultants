# Consultant HQ Factory — firm source

This is the canonical maintainer source, not a working consultant office.

- `src/`, `extensions/`, `bin/`: shared runtime and operational CLI.
- `profiles/`, `skills/`: both specialist source libraries; only the selected role is deployed.
- `scripts/`, `tests/`: factory and verification tools.
- `eval/`, `templates/`, `examples/`: evaluation fixtures and reusable examples. Internal historical documents are not distributed. See the root README for current setup and qualification limits.

From this directory:

```sh
npm test
npm run check
node scripts/build-hqs.mjs /absolute/path/to/new-output
```

The factory refuses existing target HQs. Generated HQs carry their own `.runtime/`; they never import this directory at runtime. Private offices, organization playbooks, credentials and local overlays are never factory inputs copied wholesale.

To probe a deployed HQ with actual Pi without adding factory files to it:

```sh
HQ_PROBE_ROOT=/absolute/path/to/HQ HQ_PROBE_REPORT=/tmp/hq-startup.json node scripts/live-pi-smoke.mjs
```

No model prompt is sent. Normal Pi startup can connect inherited integrations. Real-session recall qualification remains separate.

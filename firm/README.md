# Consultant HQ Factory — firm source

This is the canonical maintainer source, not a working consultant office.

- `src/`, `extensions/`, `bin/`: shared runtime and operational CLI.
- `offices.json`: the list of offices to build (folder, role, identity, banner).
- `profiles/shared/AGENTS.md`: practice every consultant shares; `profiles/<role>/AGENTS.md`: the role's title, intro and own sections. The builder joins them into each office's `AGENTS.md`.
- `skills/<role>/`: each role's skills; only the office's own role is deployed.
- `toolset.json`: the shared toolset every office ships (Pi packages, MCP servers, machine software for `doctor`).
- `scripts/`, `tests/`: factory, Office Admin (`setup.mjs`), and verification tools.
- `docs/`: tracked architecture (`FRAMEWORK.md`, `FACTORY-CONTRACT.md`, `CASE-ORGANIZATION-SYSTEM.md`, `AGENT-FIRST-PRINCIPLES.md`, `SOLUTIONS.md`) and the Office Admin runbook (`OFFICE-ADMIN.md`).
- `eval/`, `templates/`, `examples/`: evaluation fixtures and reusable examples. Private maintainer checkpoints and rollout logs live in gitignored `.hq/admin/` at the repository root. See the root README for current setup and qualification limits.

From this directory:

```sh
npm test
npm run check
node scripts/build-hqs.mjs /absolute/path/to/new-output
```

`build-hqs.mjs` refuses existing target HQs. To build missing offices (in `<repo>/offices/` by default), inspect status (`--status`), roll out specific skills (`--skill NAME`), or safely update existing offices, use `npm run setup` from the repository root (`--out DIR`, `--rebuild`, `--only ROLE`, `--skill SKILL`, `--status`, `--force`, `--yes`); see `docs/OFFICE-ADMIN.md`. `npm run drift` (root) or `node scripts/drift.mjs DIR` fails if shipped offices differ from what this source builds. Generated HQs carry their own `.runtime/`; they never import this directory at runtime. Private offices, organization playbooks, credentials and local overlays are never factory inputs copied wholesale.

To probe a deployed HQ with actual Pi without adding factory files to it:

```sh
HQ_PROBE_ROOT=/absolute/path/to/HQ HQ_PROBE_REPORT=/tmp/hq-startup.json node scripts/live-pi-smoke.mjs
```

No model prompt is sent. Normal Pi startup can connect inherited integrations. Real-session recall qualification remains separate.

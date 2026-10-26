# Consultant HQ Factory — firm source

This is the canonical maintainer source, not a working consultant office.

- `src/`, `extensions/`, `bin/`: shared runtime and operational CLI.
- `offices.json`: the list of offices to build (folder, role, identity, banner).
- `profiles/shared/AGENTS.md`: practice every consultant shares; `profiles/<role>/AGENTS.md`: the role's title, intro and own sections. The builder joins them into each office's `AGENTS.md`.
- `skills/<role>/`: each role's skills; only the office's own role is deployed.
- `toolset.json`: the shared toolset every office ships (Pi packages, MCP servers, machine software for `doctor`).
- `scripts/`, `tests/`: factory, Office Admin (`setup.mjs`), and verification tools.
- `docs/`: [governing framework](docs/FRAMEWORK.md), [factory contract](docs/FACTORY-CONTRACT.md), [case organization](docs/CASE-ORGANIZATION-SYSTEM.md), [agent-first principles](docs/AGENT-FIRST-PRINCIPLES.md), [candidate solutions](docs/SOLUTIONS.md), and the [Office Admin runbook](docs/OFFICE-ADMIN.md).
- `eval/`, `templates/`, `examples/`: evaluation fixtures and reusable examples. Private maintainer checkpoints and rollout logs live in gitignored `.hq/admin/` at the repository root. See the root README for current setup and qualification limits.

From this directory:

```sh
npm test
npm run check
npm run demo
npm run eval
node scripts/build-hqs.mjs /absolute/path/to/new-output
```

Tests, structure checks, the synthetic demo and `eval` run offline without Pi credentials. `eval` runs the functional suite and saves reports; it is not a model-quality evaluation. See the [evaluation guide](eval/README.md) for report locations and opt-in model/manual protocols.

`build-hqs.mjs` refuses existing target HQs. To build missing offices (in `<repo>/offices/` by default), inspect status (`--status`), roll out specific skills (`--skill NAME`), or safely update existing offices, use `npm run setup` from the repository root (`--out DIR`, `--rebuild`, `--only ROLE`, `--skill SKILL`, `--status`, `--force`, `--yes`); see [Office Admin](docs/OFFICE-ADMIN.md). `npm run drift` (root) or `node scripts/drift.mjs DIR` fails if shipped offices differ from what this source builds. Generated HQs carry their own `.runtime/`; they never import this directory at runtime. Private offices, organization playbooks, credentials and local overlays are never factory inputs copied wholesale.

## Contributing and reviewing

`offices/` is generated. Change canonical source in `firm/`, then rebuild and commit the generated copies in the same PR. From the repository root:

```sh
npm run setup -- --rebuild --yes
npm run verify
```

`verify` runs functional tests, structure/skill checks, TypeScript entry syntax, privacy checks and drift. See [CI guidance](../docs/CI.md) for exact scope and release requirements. Missing rebuilds fail drift. The gate also rejects committed office files the factory does not produce, because Pi auto-loads local extensions and skills.

Review canonical source and every other non-generated change, including repository-level docs, scripts and workflows. After drift passes, generated office copies need no line-by-line review. `firm/package.json` is the single version source; version changes require regeneration. For third-party pin changes, inspect the exact upstream release and name it in release notes. Exact pin checks do not prove an upstream review happened.

Releases are tags plus GitHub releases on `main` commits, not a separate release branch. `main` takes PRs and is already live for users who pull. Before tagging, follow the exact-commit checks in [CI release discipline](../docs/CI.md#release-discipline).

## Actual-host probe

To probe a deployed HQ with actual Pi without adding factory files to it:

```sh
HQ_PROBE_ROOT=/absolute/path/to/HQ HQ_PROBE_REPORT=/tmp/hq-startup.json node scripts/live-pi-smoke.mjs
```

No model prompt is sent. Normal Pi startup can connect inherited integrations. Real-session recall qualification remains separate.

## Paperthin skill pilot

The canonical files are `skills/shared/{readchk,shower,re0-memo}/SKILL.md` (`consultant-readchk`, `consultant-shower`, `consultant-re0-memo`) and `skills/coordination/prism/SKILL.md` (`coordination-prism`). The shared `skills/shared/readchk/NOTICE.md` carries upstream copyright, commit pin, and MIT license. `coordination-prism` is user-invoked (`/skill:coordination-prism`) and distributed only to coordination.

Regenerate with `npm run setup -- --rebuild`, then run `npm run verify` at the repo root. This adds no runtime dependency or new cross-office coordination mechanism.

## Design office: Impeccable workbench

The design role alone receives `skills/design/impeccable/`: a pinned on-demand detector adapter and selected Impeccable-inspired tactics. Its output remains a normal consultation; lasting project choices and feedback stay in F's HQ cases, not in Impeccable's PRODUCT.md/DESIGN.md project workspace. The script uses ignored `<F-HQ>/.hq/tools/`, disables telemetry and adds no Pi hook or MCP dependency. See the design office guide and skill SOURCE.md.

## Solution Design G (new office)

The new `solution-design` role focuses on framing, shaping, challenging and revising a solution. It adds two lightweight skills: `solution-shaping` and `solution-design-loop`. The existing `consultant-shower` shared skill covers optional fresh reading; there is no EGM runtime, second memory system or mandatory reviewer swarm. See [the guide](../docs/solution-design-consultant.md).

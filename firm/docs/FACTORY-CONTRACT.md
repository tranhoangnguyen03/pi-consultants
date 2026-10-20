# Firm → factory → HQ contract

Status: approved and implemented. Updates remain supervised; see [OFFICE-ADMIN.md](OFFICE-ADMIN.md) for operational commands and rollout procedures.

## Purpose and boundaries

The **firm** (`firm/`) maintains shared source, specialist practice assets, tests, build tools and the solution catalogue.

The **Consultant HQ Factory** (`firm/scripts/factory.mjs` and `firm/scripts/setup.mjs`) assembles independent HQ folders from those assets. It runs for creation and deliberate updates, not during consultation.

A **deployed HQ** contains the selected consultant's working practice, a bundled local runtime, organization guidance and its private office. It starts with `cd <HQ> && pi`, without the firm checkout or a sibling HQ being available. Installed Pi, compatible Node, ordinary tools and required access remain prerequisites.

The organization owns its playbook. The firm owns reusable kit source. Neither the factory nor a shared service becomes the owner of private consulting records.

## Inputs and outputs

| Input | Rule |
|---|---|
| Consultant specialization | Select the matching identity, prompts and skills; do not copy other roles' specialist skills. |
| Organization playbook | One organization per deployment; canonical source, organization and revision identified. No switching system. |
| Deployment destination | Explicit target. Creating a new HQ must not overwrite an existing office. |
| Local configuration/access | Supplied locally. Secrets are never baked into public artifacts or a build manifest. |
| Kit version | Single version source in `firm/package.json`, recorded in `HQ-ROLE.json` with the generated-file inventory. |

Output: an independent lean HQ plus a non-secret inventory of generated files (`HQ-ROLE.json`). Public distributions contain neutral setup material, not the client's playbook, credentials or records.

## Deployed tree

```
<HQ>/
  AGENTS.md                   # selected identity and organization reference
  organization/
    PLAYBOOK.example.md       # neutral template
    PLAYBOOK.md               # organization-owned local snapshot (gitignored)
  .pi/
    settings.json             # quiet startup; ordinary Pi tools retained
    hq.json                   # relocatable base configuration
    hq.local.json             # optional private local overrides (gitignored)
    toolset.json              # shared toolset and connector definitions
    extensions/
      consultant.ts           # thin entry into the bundled runtime
    prompts/                  # working prompts
    skills/                   # shared skills + this role's specialist skills
  .runtime/                   # versioned local JS implementation + CLI
  HQ-ROLE.json                # kit version and generated-file inventory; no secrets
  .env                        # local specialist credentials (gitignored)
  .hq/                        # consultant-private state (gitignored)
    cases/<client>/<project>/case.json
    sessions/*.jsonl
    outbox/
```

Do not deploy `profiles/`, other roles' `skills/`, build scripts, regression tests, evaluation fixtures or `firm/docs/`. Hidden directories reduce visual clutter; they do not enforce access restrictions or prevent arbitrary file searches.

## Ownership and update contract

| Material | Canonical owner/source | Update treatment |
|---|---|---|
| Runtime (`.runtime/`) | Firm source | Replace deliberately with a verified compatible bundle. |
| Identity, prompts, skills | Firm baseline plus explicitly retained client customization | Compare generated baseline with local edits; surface conflicts. Never silently overwrite custom work. |
| Playbook (`organization/PLAYBOOK.md`) | Organization | Deliberate snapshot refresh (`--playbook`); never replace without backing up an existing different copy. |
| Credentials/local overrides | Deployment operator | Preserve; do not print, export or copy into public artifacts. |
| Cases, sessions, outbox (`.hq/`) | Consultant Office | Preserve. Runtime updates do not reset, replay or silently migrate them. |
| Build inventory (`HQ-ROLE.json`) | Factory output | Identify version and generated file hashes; update skill entries when rolling out `--skill` overlays. |

**Create:** build into a fresh destination, supply organization configuration, validate independence and startup. No overwrite of existing deployments.

**Update:** compare generated files and local customizations; stop active consultation before replacing files; replace only agreed factory-owned material (full office or `--skill` subset); back up conflicting files into `.hq/setup-backup/` when `--force` is used.

**Recover:** retain backed-up replaceable files in `.hq/setup-backup/`. Rollback is allowed only while compatible with current private state. It does not reverse external actions or erase new records.

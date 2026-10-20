# Office Admin runbook

Office Admin duties belong to the **Firm Maintainer** working from the repository root / `firm/`, not to a separate consultant office. Consultants (B, C, D) stay isolated inside their own offices; the maintainer inspects, backs up and updates offices from the outside using `firm/scripts/setup.mjs` and each office's `.runtime/bin/hq.mjs`.

## Where things live

- **Tracked architecture & admin docs (`firm/docs/`):** `FRAMEWORK.md`, `FACTORY-CONTRACT.md`, `CASE-ORGANIZATION-SYSTEM.md`, `AGENT-FIRST-PRINCIPLES.md`, `SOLUTIONS.md`, and this `OFFICE-ADMIN.md`. These version-control in the same commit and branch as `firm/` code.
- **Private admin state (`.hq/admin/`, gitignored):** local maintainer checkpoints (`CHECKPOINT.md`), decision log (`DIRECTION.md`), rollout records and trial artifacts. Because `.hq/` is in `.gitignore`, private operational records never leak into public commits or PRs.
- **Office backups (`<office>/.hq/setup-backup/<timestamp>/`, gitignored):** automatic backups created by `setup.mjs` before replacing conflicting files or updating `organization/PLAYBOOK.md`.

## Core Office Admin commands

Run from the repository root (`npm run setup -- ...`):

### 1. Inspect office status without changing anything (`--status`)

Check the version, how many generated files are behind `firm/`, whether any shipped files were locally edited, and whether `organization/PLAYBOOK.md` is installed:

```sh
# Shipped template offices in ./offices
npm run setup -- --status

# External working offices (e.g., a project workspace)
npm run setup -- --out /path/to/offices-parent --status
npm run setup -- --out /path/to/offices-parent --only coordination --status
```

`--status` is read-only: it never creates missing office folders or modifies files.

### 2. Roll out specific skills only (`--skill`)

Push one or more skills (such as `composition` or `public-presentation`) from `firm/skills/` into existing working offices without touching `.runtime/`, `AGENTS.md`, or private `.hq/` records:

```sh
npm run setup -- --out /path/to/offices-parent --skill composition --yes
npm run setup -- --out /path/to/offices-parent --only user --skill composition,public-presentation --yes
```

- Skips offices in `--out` that are not present (unless `--only` explicitly requested a missing office).
- Stops if a target skill file was locally edited (`--force` backs up edited files into `<office>/.hq/setup-backup/<timestamp>/` first).
- Updates the skill hashes and `practiceOverlays` in `<office>/HQ-ROLE.json`.

### 3. Full office update or template rebuild

- **Rebuild in-repo shipped templates (`offices/`):**
  ```sh
  npm run setup -- --rebuild --yes
  npm run verify
  ```
- **Full update of external working offices (`--out`):**
  ```sh
  npm run setup -- --out /path/to/offices-parent --yes
  ```
- **Sync organization playbook across offices (`--playbook`):**
  ```sh
  npm run setup -- --out /path/to/offices-parent --playbook /path/to/PLAYBOOK.md --yes
  ```

### 4. Per-office diagnostics, configuration and migration

Inside a specific office (`<office>/.runtime/bin/hq.mjs`):

```sh
node .runtime/bin/hq.mjs doctor
node .runtime/bin/hq.mjs configure --projects /path/to/project --connect linear
node .runtime/bin/hq.mjs migrate --from /path/to/old-office
```

For the optional local composition renderer (HyperFrames 0.8.161), install into `<office>/.hq/tools/` only when needed:

```sh
node .pi/skills/composition/scripts/composition.mjs install /path/to/project
node .pi/skills/composition/scripts/composition.mjs version /path/to/project
```

## Global vs. office-local Pi updates

- `pi update` / `pi update --extensions` updates your **personal Pi environment** (`~/.pi/agent/`), which offices inherit. Avoid `npm audit fix --force` on global Pi packages, as breaking semver bumps can break installed extensions.
- Pinned office packages in `<office>/.pi/settings.json` (from `firm/toolset.json`) are pinned to exact versions or commit SHAs and are updated deliberately through `firm/toolset.json` + `npm run setup`.

## Safe rollout checklist for working offices

1. **Inspect first:** run `npm run setup -- --out DIR --status` and check that no active Pi session is Mid-turn in the target office.
2. **Choose the smallest update:** use `--skill NAME` for skill additions/revisions; use full `--out DIR` only when runtime or profile changes are needed and authorized.
3. **Preserve local work:** never pass `--force` without reviewing the listed conflicts first.
4. **Verify after update:** run `node <office>/.runtime/bin/hq.mjs doctor` and tell the user to `/reload` or start a fresh Pi session in that office.

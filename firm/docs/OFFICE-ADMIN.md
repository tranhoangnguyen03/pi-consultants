# Office Admin runbook

Office Admin duties belong to the **Firm Maintainer** working from the repository root / `firm/`, not to a separate consultant office. Consultants stay isolated inside their own offices; the maintainer inspects, backs up and updates offices from the outside using `firm/scripts/setup.mjs` and each office's `.runtime/bin/hq.mjs`.

## Where things live

- **Tracked architecture & admin docs (`firm/docs/`):** `FRAMEWORK.md`, `FACTORY-CONTRACT.md`, `CASE-ORGANIZATION-SYSTEM.md`, `AGENT-FIRST-PRINCIPLES.md`, `SOLUTIONS.md`, and this `OFFICE-ADMIN.md`. These version-control in the same commit and branch as `firm/` code.
- **Private admin state (`.hq/admin/`, gitignored):** local maintainer checkpoints (`CHECKPOINT.md`), decision log (`DIRECTION.md`), rollout records and trial artifacts. `.hq/` is in `.gitignore`, which prevents accidental staging in git commits and PRs.
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

- Requires `--out DIR` (in-repo `./offices/` always use `--rebuild` so the repository passes `npm run drift`).
- Skips offices in `--out` that are not present or whose role does not carry the requested skill (unless `--only` explicitly requested that office).
- Stops if a target skill file was locally edited (`--force` backs up edited files into `<office>/.hq/setup-backup/<timestamp>/` first).
- Updates the skill hashes and `practiceOverlays` in `<office>/HQ-ROLE.json`. A subsequent full update replaces `HQ-ROLE.json` with the clean full-build manifest.
- `--skill` takes the source directory name, such as `readchk`, not the advertised skill name `consultant-readchk`. `--only` takes a role from `firm/offices.json`, such as `coordination`, not the folder name `project-consultant`.

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
- **Full update plus organization playbook sync (`--playbook`):**
  ```sh
  npm run setup -- --out /path/to/offices-parent --playbook /path/to/PLAYBOOK.md --yes
  ```
  *(Note: combining `--out` with `--playbook` without `--skill` performs a full office update before installing the playbook. To sync a playbook alongside a skill-only rollout, pass `--skill NAME --playbook FILE`.)*

### 4. Per-office diagnostics and configuration

Inside a specific office (`<office>/.runtime/bin/hq.mjs`):

```sh
node .runtime/bin/hq.mjs doctor
node .runtime/bin/hq.mjs configure --projects /path/to/project --connect linear
```

For the optional local composition renderer (HyperFrames 0.8.161), install into `<office>/.hq/tools/` only when needed:

```sh
node .pi/skills/composition/scripts/composition.mjs install /path/to/project
node .pi/skills/composition/scripts/composition.mjs version /path/to/project
```

## Update conflicts and recovery

Close Pi sessions in target offices **before** updating. Setup updates offices one at a time; it is not a transaction across the selected offices. A conflict stops replacement in that office, but earlier offices may have updated and later offices can still be processed. Read the per-office results; a nonzero exit does not mean every office was unchanged.

Before a full or skill-only update, run `--status` and inspect any edited files. Full updates preserve private `.hq/`, playbooks, credentials, local configuration and files the factory does not own. A user-added file colliding with a newly shipped path is a conflict, not disposable content. `--force` saves conflicting files in `.hq/setup-backup/<timestamp>/` before replacing them; it is not a complete office backup.

In-repository offices normally update through Git. Inspect `git status --short` before pulling and preserve local edits. Git conflicts are not setup conflicts: `git pull` does not create `.hq/setup-backup/` copies, and setup's `--force` is not a Git conflict-resolution command.

To recover, stop writers, inspect the saved files and current manifest, and restore or merge only the intended compatible material. Do not replace newer case records with an older backup, assume a manifest matches after manual restoration, or replay external actions. Take a separate private state backup before any authorized migration or rollback. There is no automatic rollback command.

## Legacy data: import versus case upgrade

These are different operations. Neither happens during a normal source/skill update. Both need explicit authorization for the target office and stopped writers.

### Import a legacy office layout

The following command runs **inside the destination office**. Replace `/path/to/old-office` with a legacy source containing `hq.json` plus optional `cases/` and `outbox/` directories; it is not a general importer for another modern office's `.hq/` directory.

```sh
node .runtime/bin/hq.mjs migrate --from /path/to/old-office
```

The destination must not already contain `cases/` or `outbox/`. The source is untouched. Cases and outbox data are copied; unused approvals are invalidated, in-flight actions remain uncertain, and old live sessions are not moved/resumed. Old histories stay at the source and require an explicitly allowed session root for recall. Inspect the destination's `.hq/migration.json` and imported data before use. This import does not upgrade individual legacy cases.

### Upgrade one legacy case to the current schema

The runtime can read/select a legacy case but refuses substantive writes until explicit upgrade. Stop all old and new writers first. Back up private state, then run the packaged operator command below, replacing **all four paths/identity placeholders** with the intended values:

```sh
node /path/to/office/.runtime/bin/upgrade-case.mjs /path/to/office/.hq/cases client/project /path/to/private-backups --writers-stopped
```

`client/project` is the exact existing case key. `/path/to/private-backups` must be outside case discovery (`.hq/cases`); do not put backups under another case. The command saves the original bytes and checksum before converting v1 to v2, preserves unknown fields and legacy notes, and does not invent attribution or objective history. Repeating it on v2 reports `already-upgraded`.

Inspect the returned backup path/checksum and upgraded case through the normal navigation tools. Do not test it by making unrelated records. A backup is not permission to restore over newer work: quiesce writers and compare current data before a separately authorized restore.

## Global vs. office-local Pi updates

- `pi update` / `pi update --extensions` updates your **personal Pi environment** (`~/.pi/agent/`), which offices inherit. Avoid `npm audit fix --force` on global Pi packages, as breaking semver bumps can break installed extensions.
- Pinned office packages in `<office>/.pi/settings.json` (from `firm/toolset.json`) are pinned to exact versions or commit SHAs and are updated deliberately through `firm/toolset.json` + `npm run setup`.

## Safe rollout checklist for working offices

1. **Inspect first:** run `npm run setup -- --out DIR --status` and check that no active Pi session is Mid-turn in the target office.
2. **Choose the smallest update:** use `--skill NAME` for skill additions/revisions; use full `--out DIR` only when runtime or profile changes are needed and authorized.
3. **Preserve local work:** never pass `--force` without reviewing the listed conflicts first. Back up private state separately when migration or rollback is in scope.
4. **Inspect every result:** report updated, skipped and stopped offices separately; do not imply all-or-nothing behavior.
5. **Verify after update:** run `node <office>/.runtime/bin/hq.mjs doctor` and start a fresh Pi session in that office. Doctor checks prerequisites, not startup or answer quality.

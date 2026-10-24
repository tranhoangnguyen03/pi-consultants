# CI: what is checked and when

Pi Consultants runs two GitHub Actions workflows. Model-quality evaluations are **not** part of CI.

## Required pull-request verification (`verify.yml`)

Triggered on every pull request and push to `main`. Run the same checks locally:

```sh
npm run verify
```

The command checks:
- Offline functional and simulated-host contract tests (`npm test --prefix firm`).
- JavaScript syntax, JSON, and basic skill headers (`npm run check --prefix firm`).
- Stronger skill metadata, unique per-office skill names, and role-specific routing (`npm run ci:contracts`).
- Syntax of the native TypeScript entrypoints (`npm run ci:typescript`). These are **syntax checks**, not full type checking; the existing simulated-host tests exercise extension behavior.
- Tracked private files and high-confidence credential patterns (`npm run ci:privacy`). This is a narrow guard; it cannot guarantee that no secrets exist.
- Generated-office drift: every shipped office must match `firm/` and its manifest; unlisted shipped files are rejected (`npm run drift`).

No model calls, Pi binary, connector login, or unpinned third-party install is required. PRs fail if any step fails. The workflow itself cannot enable branch protection: set the `verify / PR verification` status as a required check on `main` and disallow bypass/direct pushes through GitHub rulesets.

## Post-merge Pi compatibility (`pi-compatibility.yml`)

Triggered by every push to `main` (normally a PR merge) and by manual dispatch. Runs independently on Ubuntu and macOS, each with Node 24.15 and a **pinned Pi 1.3.0** installation. The job:
1. Uses a temporary Pi agent configuration with no operator tokens or session history.
2. Creates standalone copies of the five built offices.
3. Runs `firm/scripts/live-pi-smoke.mjs` against **real Pi** in RPC mode. In CI it uses `--approve --no-mcp` so local bundled resources load but no MCP connections start. Pi may download the already-pinned packages during startup. No prompt is sent to a model.
4. Checks native tool/command/skill registration, role instructions, isolation sentinels, and another startup after relocating an office.
5. Retains machine-readable probe reports for 14 days.

The compatibility run fails when Pi cannot install/start, a required tool/skill is missing, or an isolation check fails. It does **not** prove interactive UI quality, external connector compatibility, or correctness of consultant answers. A failed post-merge check does not retroactively block the merge; resolve it before tagging/releasing the affected `main` revision.

Run it manually through **Actions → Pi compatibility → Run workflow** when needed. This workflow should not be part of the mandatory PR status checks.

## Updates

When changing the pinned Pi version, review its release notes and native API changes. Update the pin in `pi-compatibility.yml`, run the manual workflow, and record failures. Do not silently install `latest`.

Third-party tools in `firm/toolset.json` stay pinned; the PR release-guard tests enforce exact versions/commit SHAs. No live cloud service or paid model inference should be added to CI without a separate decision.

## Release discipline

Before tagging a `main` commit, verify both the PR checks and the most recent **Pi compatibility** result for that exact commit. Branch protection must be configured in GitHub; workflow YAML alone cannot enforce it.

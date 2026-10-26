# Engineering Review Workbench v1 — implementation and usage

**Status:** Implemented support in Engineering Consultant B, not a separate reviewer office.
**Authority:** Existing consultant profile, organization playbook and HQ case boundaries remain in force.
**Principle:** Equip, augment and empower B to review well. Do not replace judgment with a mandatory pipeline.

## What ships

- One expanded engineering-change-review skill whose short entry page links to on-demand references.
- Review guidance for specification, standards, correctness, regressions, reliability, security, test quality, architecture, performance and simplicity.
- A read-only Git/GitHub review target pre-flight CLI, and a PATH-only optional-tool discovery helper.
- Concrete OCR delegation, code-review-graph, Graphify, scanner and cross-model usage guidance, with missing-tool fallbacks.
- Natural-language recommendations for findings, human callouts and re-review through existing HQ cases.

**No third-party review engines are vendored or auto-installed.** The helpful external CLIs are optional: a reviewer can do effective work with Git, gh (for PRs), repository sources and ordinary Pi tools.

## Quick usage

Start Pi in offices/engineering-consultant, then change working directory to your project as usual. Ask, for example:

- Review PR #123, focusing on regressions.
- Review my working-tree changes and whether they meet the issue's intent.
- Inspect the auth flow's architecture and dependent callers.
- Re-review the current PR against the earlier findings.

B chooses suitable skill references and tools. No intake form, compulsory peer review or fixed pass count.

If exact scope matters, use the bundled helper (replace the HQ path):

~~~sh
node /path/to/engineering-consultant/.pi/skills/change-review/scripts/review-preflight.mjs branch --repo /path/to/project --base main
node /path/to/engineering-consultant/.pi/skills/change-review/scripts/review-preflight.mjs pr --repo /path/to/project --pr 123
node /path/to/engineering-consultant/.pi/skills/change-review/scripts/review-tool-doctor.mjs --json
~~~

The preflight helper uses read-only Git/gh and never fetches or checks out. Workspace results separate staged, unstaged and untracked paths; merge commits compare against their first parent and expose that comparison base. These are scope inventories, not code verification.

PR mode records base/head SHAs from the metadata response, but `gh pr diff` retrieves the **live** PR diff—not a diff pinned to those SHAs. Recheck `gh pr view --json baseRefOid,headRefOid` before and after diff retrieval; if either SHA changes, reload the scope. For an exact immutable comparison, fetch those commits into an isolated checkout and use `git diff BASE_SHA...HEAD_SHA` (merge-base comparison), not a two-tip diff. Do not describe `gh pr diff` as pinned.

The tool doctor checks PATH only; "available" does not establish version, authentication, safety or compatibility. The tools can be installed in a project/HQ-local environment after the operator inspects sources, licenses and setup effects. Don't silently add tools to the shared firm/toolset.json: that would affect every consultant.

## Review judgment

The [review skill](../skills/engineering/change-review/SKILL.md) and its on-demand references are the source of working guidance: lenses, investigation, uncertainty, findings and follow-up. This maintainer document covers packaging, usage and integration limits; it does not create a second set of instructions.

## Where the implementation lives

- firm/profiles/engineering/AGENTS.md — short role-specific guidance.
- firm/skills/engineering/change-review/SKILL.md — discoverable review entry.
- firm/skills/engineering/change-review/references/ — targeted methods and source attribution.
- firm/skills/engineering/change-review/scripts/ — small, read-only support CLIs.
- firm/tests/review-workbench.test.mjs — checks for diff targets, PR metadata, no branch mutation and tool discovery.
- offices/engineering-consultant/ — generated copy and hashes, never edited directly.

The shared HQ runtime, storage, settings and toolset are unchanged. Generated office files are rebuilt with the normal factory.

## Sources and limitations

Upstream inspirations: pi-review (session/feedback ideas), pi-review-loop (optional human review UI), OpenCodeReview (deterministic selection and per-file rules), code-review-graph and Graphify (code relationships), Matt Pocock's code-review method (spec vs standards), OpenAI Codex plugin / adamsreview (optional adversarial reviews), Compound Engineering / gstack (context-dependent methods and decision reuse), Canonical crh (report vs publication). See the skill's SOURCE.md.

This is a review-method and scope-support upgrade, not evidence that model review accuracy has improved. Optional CLIs are not bundled or qualified as live integrations. OCR delegation does not automatically apply OCR's separate claim-reflection/positioning stages. GitHub credentials, Python/runtime requirements, tool licenses, graph freshness and external provider access remain operator-specific. No dedicated review consultant, daemon or persistent review memory is created.

## Verification and rollout

Run npm run verify from the repository root. Its tests, skill routing checks, private-file/credential checks and generated-office drift gate must pass. The new helper's tests operate on temporary Git repos and a fake gh executable; they do not need credentials. Optional tool integration should be tried selectively in live consultations; record only consequential problems and improvements.

Updating an existing working B office is **not** an automatic PR side effect. After merge, follow firm/docs/OFFICE-ADMIN.md, stop active Pi sessions, inspect status and use a deliberate office update (skills only where sufficient; full update for profile changes). Private cases and organization playbooks must remain untouched.

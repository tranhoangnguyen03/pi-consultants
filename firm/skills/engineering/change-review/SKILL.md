---
name: engineering-change-review
description: Use when reviewing a diff, branch, commit, pull request, folder, release candidate, or codebase risk.
---
# Engineering review — use judgment, supported by good tools

Review to help the user make a sound engineering decision. You are a capable specialist, **not the operator of a compulsory review pipeline**. Pursue important defects, contract mismatches, regressions, security and reliability risks, and useful design concerns. Adapt depth to the stakes. Review-only means no unrequested edits, commits, branch switching or published comments.

Understand the requested target and intended behavior. Confirm a usable revision when it matters; read the actual code and requirements. Explore beyond changed lines where dependencies, consumers, tests or execution paths suggest risk. Select focused review lenses yourself. If you suspect a credible problem, surface it with honest reasoning even when reproduction is not practical. A clean review is valid; do not invent issues to show diligence.

**Review tools and methods are optional support.** Discover and use them when they help. Missing tooling, expensive proof, a large diff or unavailable second models do not justify hiding concerns. Do not present tool warnings as proved defects, or guesses as tests. Share important coverage limits without producing a bureaucracy of receipts.

## Capability map — follow the useful breadcrumb

| Need | Read next |
|---|---|
| Target a workspace, branch, commit, PR or folder; establish scope | [Scope and pre-flight](references/scope-and-context.md); read-only review-preflight.mjs |
| Compare intended behavior, standards, implementation and regressions | [Review judgment and lenses](references/review-judgment.md); existing plan-design and behavioral-assurance skills |
| Trace callers, dependent code, affected tests and system structure | [Impact and analysis tools](references/impact-and-analysis.md); code-review-graph or Graphify when helpful |
| Inspect known bug, security, dependency or code-health patterns | [Impact and analysis tools](references/impact-and-analysis.md); ast-grep, Semgrep, Gitleaks, OSV-Scanner, Desloppify |
| Test a concern or solicit another perspective | [Investigation and specialist help](references/specialists-and-verification.md); existing debug-verify skill, optional Codex/Pi |
| Deliver findings, human decisions or continue a prior review | [Findings and follow-up](references/findings-and-continuity.md); existing HQ case tools |
| Check/install an optional capability | [Tool guide](references/tool-setup.md); read-only review-tool-doctor.mjs |

Scripts are under this skill's scripts/ directory in the same office. Run them against the visited repository (with --repo PATH); **your HQ and its memory stay in your own office**. Prefer directly using existing Git/gh and project tools when a wrapper offers no value. A review is not an occasion to install every scanner or spawn an agent team.

## Working contract

Begin from the user's concern as usual; never demand a skill name, form, rigid phase order or proof artifact. Respect the current authority and the site's rules; read other Pi sessions only with current authorization. Protect concurrent work and use stable commits or an isolated worktree when needed. If an external helper is unavailable, continue with native tools and describe meaningful limits. Report findings with specific pointers and proportionate remedies; distinguish observed facts, likely failures, credible risks, open questions and suggestions. Keep only consequential, attributed findings and decisions in existing HQ cases; no new review-memory service.

Sources and licenses for the adapted ideas are listed in [SOURCE.md](SOURCE.md).

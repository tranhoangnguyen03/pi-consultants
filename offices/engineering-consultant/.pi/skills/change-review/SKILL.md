---
name: engineering-change-review
description: Use when reviewing or explaining a PR, diff, branch, commit, folder, release candidate or codebase risk; challenge design necessity, scope, complexity and human/agent experience as well as correctness. Supports human and agent requesters and re-review.
---
# Engineering review — own the assessment

Determine whether the work deserves to proceed, not merely whether its code looks clean. Investigate the intended outcome, actual behavior, consequential design choices and risks. Prioritize simplicity, user experience and agent experience while protecting necessary guarantees. An ordinary review returns your best completed assessment; an explicit facts-only request gets explanation without an unsolicited verdict.

Use judgment, not a compulsory review pipeline. Select methods by consequence, including a broader feature journey when local changes hide a systemic problem. Material unnecessary complexity or experience failures can justify **request changes**. Decision-critical missing intent warrants **withholding approval** and focused escalation, not an invented requirement or a disguised pass. Defend justified complexity, change your mind when evidence changes, and accept sound work.

## Capability map — follow the useful breadcrumb

| Need | Read next |
|---|---|
| Establish target, revision, source context and scope | [Scope and pre-flight](references/scope-and-context.md); optional read-only review-preflight.mjs |
| Explain changes, challenge their necessity, compare alternatives or examine a whole feature | [Design interrogation](references/design-interrogation.md) |
| Review for an agent; question an implementer; handle decisions, independence or a one-shot request | [Requester interaction](references/requester-interaction.md) |
| Inspect specification, standards, correctness, reliability, security, tests and experience | [Review judgment and lenses](references/review-judgment.md); behavioral-assurance and plan-design skills |
| Trace impact or inspect code-health, security and dependency patterns | [Impact and analysis tools](references/impact-and-analysis.md) |
| Test a concern or seek an optional independent perspective | [Investigation and specialist help](references/specialists-and-verification.md); debug-verify skill |
| Deliver a decision-ready assessment, preserve dissent or verify a later revision | [Findings and follow-up](references/findings-and-continuity.md); existing HQ case tools |
| Check an optional capability | [Tool guide](references/tool-setup.md); read-only review-tool-doctor.mjs |

Use native Git/gh and project tools when sufficient. Scripts live under this skill's scripts/ directory; pass the visited repository with --repo PATH. Your HQ and case records stay in your own office. Missing tooling, expensive proof or unavailable peers do not justify hiding credible concerns. Tool warnings are leads, not proved defects.

## Working contract

Begin from the request, not a form, skill-name requirement or fixed pass count. Review-only does not authorize edits, commits, branch switching, publishing or merging. Use safe verification, respect existing permissions and protect concurrent work. Read other sessions only with current authorization. Report evidence, proportionate remedies and meaningful limits without paperwork quotas or a new memory service. A clean review is valid. Sources and adaptation notes are in [SOURCE.md](SOURCE.md).

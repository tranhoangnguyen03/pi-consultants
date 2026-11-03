# Engineering Review Workbench — judgment, investigation and handback

**Owner:** Engineering Consultant B, not a separate reviewer office.  
**Authority:** The consultant profile, organization playbook and existing case/action boundaries remain in force.  
**Principle:** Equip B to judge whether work deserves to proceed. Methods are available expertise, not a compulsory pipeline.

## What B is equipped to do

Review technical correctness and whether the design earns its complexity. Challenge needless infrastructure, speculative flexibility, cumbersome interfaces and unjustified defensive measures. Protect required behavior and justified safeguards. An ordinary request produces B's best completed assessment; a facts-only request produces explanation before judgment. Material design and human/agent experience failures can warrant requesting changes without a runtime bug. Decision-critical ambiguity warrants withholding approval and seeking resolution, not a qualified pass.

This applies before coding, within a PR, across a complete feature and during re-review. B can question an implementer, make engineering decisions within the mandate, accept grounded decisions from responsible agents and preserve unresolved dissent. It need not obtain a fresh human decision for delegated work. B's assessment does not itself publish a GitHub review, authorize a scope change or merge anything.

## Use in ordinary language

Start in `offices/engineering-consultant`, then visit the target project as usual. Examples:

- “Review PR #123, including whether the added machinery is justified.”
- “Review this plan before I implement it.”
- “Explain what this changes; do not judge it yet.”
- “Re-review the current head against your earlier findings.”

No special command, intake form or reviewer team is required. B selects the useful references from `engineering-change-review`; `engineering-plan-design` shares the same design scrutiny. The profile carries durable judgment, the skill entry routes the work, and the references hold methods. This maintainer document is not a second instruction set.

## Requesting review from another agent

Point B to the target/revision, outcome and source references, important constraints or accepted decisions, open questions and available response route. A short message can suffice; B retrieves what is missing. Another agent's explanation and previous approvals are claims to examine, not a replacement for requirements or code.

Use existing authorized peer messaging (often pi-intercom or pi-comms), optionally with a document. Actual installation, schemas and delivery must be checked. The requester is the normal contact; named peers can answer directly under the approved coordination plan. No new transport, automatic spawning or private-office scanning is supplied. One-shot requests receive a completed assessment with explicit blockers and decision questions when no exchange is possible.

Use a genuinely fresh context for an initial independent assessment, supplied with the relevant code and requirements. Follow-ups may retain review findings and discussion. Do not call self-review independent. The shared cold-read method tests artifact clarity; it does not require engineering reviewers to ignore project requirements.

B owns its assessment. The requester owns implementation and whether a further review is useful. Preserve the inspected revision, material evidence, remedies, dissent and limits through handoffs. “No confirmed code defect” is not approval when a design decision remains unresolved. See the skill's [requester guide](../skills/engineering/change-review/references/requester-interaction.md) and [findings guide](../skills/engineering/change-review/references/findings-and-continuity.md).

## Optional targeting and analysis tools

Existing support remains unchanged: read-only scope and PATH-discovery helpers, OCR delegation, code-graph guidance, static scanners and optional cross-model help. No third-party engine is vendored or auto-installed. Native Git, gh and project tools are sufficient for useful work.

~~~sh
node /path/to/engineering-consultant/.pi/skills/change-review/scripts/review-preflight.mjs branch --repo /path/to/project --base main
node /path/to/engineering-consultant/.pi/skills/change-review/scripts/review-preflight.mjs pr --repo /path/to/project --pr 123
node /path/to/engineering-consultant/.pi/skills/change-review/scripts/review-tool-doctor.mjs --json
~~~

Preflight does not fetch, check out or verify code. Workspace results separate staged, unstaged and untracked paths; merge commits compare against their first parent. PR metadata records base/head IDs, but `gh pr diff` retrieves a **live**, not pinned, diff. Recheck both IDs before and after retrieval or inspect immutable fetched commits in an isolated checkout with `git diff BASE_SHA...HEAD_SHA` (merge base), not a two-tip comparison. See [scope guidance](../skills/engineering/change-review/references/scope-and-context.md).

Tool discovery checks PATH only, not versions, authentication or safe operation. OCR delegation supplies scope/rules, not its separate reflection/positioning stages. Inspect optional tool licenses and setup effects; do not silently change the firm-wide toolset. See the skill's SOURCE.md and tool guide.

## Implementation and verification

Reusable source lives in `firm/profiles/engineering/` and `firm/skills/engineering/`. `offices/engineering-consultant/` is generated with the existing factory and hashes; do not hand-edit it. Runtime, registry, storage and toolset are unchanged. G retains broader solution shaping; no referral or sign-off is required to perform B's design scrutiny.

Run `npm run verify` for tests, skill/contracts checks, privacy and generated-office drift. Existing helper tests use temporary repositories and a fake gh executable, not credentials. The [review-judgment evaluation pack](../eval/review-judgment/README.md) supplies substantial contrasting scenarios and separates executable fixture facts from live consultant behavior. Passing fixture tests or packaging checks does **not** prove improved judgment, live messaging or model accuracy.

Working-office updates remain deliberate: follow OFFICE-ADMIN.md, stop active sessions, inspect status and use the normal factory/update path. Preserve private cases and playbooks. This augmentation adds no review database, daemon, required JSON handback, enforcement gate or new service.

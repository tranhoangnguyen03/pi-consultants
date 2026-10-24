# Findings, human callouts and re-review

Present useful findings, not a proof dossier. For each material concern, give the affected place or behavior, the failure scenario, why it matters and an actionable way forward. A concrete citation to code, a requirement or a test helps; an executable reproduction is **not required**.

## Common report shape (adapt freely)

**Verdict:** short assessment of the change, including meaningful reservations.

**Engineering findings:** bugs, regressions, security or reliability risks and other changes an implementer should investigate. Prioritize by consequence. Distinguish confirmed, likely and possible risks in natural language.

**Human callouts:** non-blocking operational decisions or alerts such as auth changes, schema migrations, destructive deployment steps, compatibility or tradeoffs. Do not imply each callout is a code defect.

**Optional improvements:** valuable clarity, simplicity or maintainability suggestions, without turning style preference into a blocker.

**Coverage limits:** relevant skipped areas, unavailable refs/scanners, failed tests or stale input if they would affect trust. Do not dump a per-tool receipt just to prove diligence.

If nothing meaningful is found, say so and state any important limit. Never invent findings.

## Scope and comments

Tie observations to the correct target commit/revision and current path/line before posting. Freshly fetched PR metadata can differ from the checkout. OCR delegation offers selection and rules, not a full comment-reflection gate in host-agent mode. Recheck weak claims and locations using code when it matters, without suppressing plausible but unproved risks.

Report-only does not authorize edits, GitHub approval, branch changes or publishing comments. Drafting a proposed review is distinct from posting it. Existing GitHub tools and the optional outbox handle authorized external delivery; no second sink framework is needed.

## Continue an earlier review

When the user requests re-review:

1. Identify earlier meaningful concerns from this office's selected HQ case/papers or conversation, and recover the reviewed revision.
2. Inspect the current PR head and relevant changes since then. Do not equate a moved line with a fixed defect.
3. Note what appears resolved, remains open, has changed, or is unclear. Reuse old reasoning only where still supported.
4. Update *material* findings in the same HQ case, with attribution, sources and supersession where appropriate.

Avoid a separate review database, automatic transcripts-to-memory promotion or duplicate issue trackers. A small review may need no permanent records. A durable case finding is not automatically a verified external fact.

## Companion UI

pi-review-loop offers an optional persistent Monaco diff window and human comments for an ongoing Pi coding session. It is primarily a human-review working surface, not a required automated review step. Do not install it silently or use its checkpoints as HQ truth.

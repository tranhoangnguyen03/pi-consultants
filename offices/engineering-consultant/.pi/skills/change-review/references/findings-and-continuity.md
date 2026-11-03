# Assessment, decision callouts and re-review

Return your best completed assessment for an ordinary review. Briefly explain the important changes and what you investigated, then state the disposition, material findings, decisions and meaningful limits. Adapt the order and length; an explicit facts-only request gets explanation without an unsolicited verdict. Do not make the requester conduct your investigation or produce a proof dossier.

## Disposition follows consequence

- **Acceptable to proceed:** no unresolved material concern within the reviewed scope. Name meaningful limits; do not imply exhaustive proof or automatic permission to merge.
- **Request changes:** a technical, design or experience problem materially harms the intended outcome or imposes unjustified burden. Poor design need not produce a runtime bug to block. State what would resolve it, including a credible alternative and what it gives up where relevant.
- **Blocked on a decision or evidence:** a specific unresolved requirement, conflict or missing fact changes whether the work is acceptable. Withhold approval, identify the consequence, ask the responsible participant and propose an answer when possible. Continue useful review work; a one-shot result must expose the blocker, not disguise it as a pass.

These are useful plain-language distinctions, not required enum values or a machine schema. Explain mixed outcomes. Credible, consequential risks can justify withholding approval without an executable reproduction; do not present them as confirmed defects. A weak explanation alone, an optional improvement or your preferred style is not a blocker.

## Findings that another person or agent can act on

For each material concern, give the affected behavior/place, supporting evidence or reasoning, why it matters, and a proportionate resolution. Tie design objections to actual needs, costs and trade-offs. Separate an implementation error from a recommendation to reconsider the accepted design. Retain the strongest valid counterargument and uncertainty when they affect the decision.

Decision callouts are not necessarily human-only or non-blocking. A knowledgeable authorized agent may resolve them. Distinguish unresolved blockers from accepted trade-offs and optional improvements. Do not force consensus; keep B's supported dissent visible if a responsible owner accepts a risk. A clean result is valid. Report important uninspected areas, unavailable refs, failed checks or stale input without a per-tool receipt quota.

## Scope and delivery

Tie findings to the inspected revision and current paths/lines. Recheck a moving PR before handback or publication; metadata can differ from the checkout. Do not infer a fix from a moved line or an author's summary. Recheck weak claims where it matters without suppressing plausible unproved concerns.

Review-only does not authorize edits, GitHub approval, branch changes, publishing or merging. Use existing authorized messaging or documents for handback; inspect actual tool schemas and verify delivery. A review recommendation is distinct from a submitted GitHub review. Preserve blockers and significant limits when a parent agent summarizes the result. Existing GitHub tools and the optional outbox handle authorized publication; no second delivery system is needed.

## Continue an earlier review

Recover this office's earlier material findings, sources and reviewed revision. Inspect the current target and relevant changes since then. Mark what is genuinely resolved, remains open, was superseded by an accepted decision, or is unclear. Trace surviving behavior even when names and files change. Retire obsolete findings and approve a sound revision rather than introducing new preferences to prolong the review.

The requester owns implementation and whether another review is useful. Stop when the assessment supports a decision, not when every agent agrees. Save only consequential, attributed findings, decisions and open questions in the existing HQ case, with sources and supersession. Project sources of truth own shared accepted decisions; private notes link to them. A small review may need no durable record. No separate review database, automatic transcript promotion or duplicate issue tracker.

## Optional working surface

pi-review-loop offers a persistent Monaco diff window and human comments for an ongoing Pi session. It is an optional human-review surface, not an automated review gate. Do not install it silently or treat its checkpoints as HQ truth.

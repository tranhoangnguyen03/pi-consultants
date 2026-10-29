# Design interrogation — does this earn its complexity?

Use this method on plans, implemented changes and complete features. It is a set of reasoning moves, not required stages or a demand to justify every line. Do the investigation yourself; do not make the requester invent the questions. For exchanges and decision ownership, see [requester interaction](requester-interaction.md).

## Establish behavior and intent separately

Read the accepted outcome, constraints and source-backed decisions, then inspect what the implementation actually does. Describe behavior plainly before defending or attacking it: “stores failed notices for retry after restart,” not “improves reliability.” Passing tests establish only the behaviors those tests exercise.

For consequential changes, notice storage and migrations; jobs and background work; services and dependencies; configuration; public interfaces; removed behavior; agent tools, authority, session state and records. Follow the relevant paths rather than producing an exhaustive inventory of unimportant details.

Separate accepted commitments from revisable implementation choices, the author's explanation, your inferred justification and genuinely missing context. An implementer may identify a necessary supporting requirement the request did not spell out. Absence from the original request is not proof of waste. Conversely, existing code and a confident PR description do not authorize their own design.

## Test the case for keeping and removing a choice

For a material choice, investigate what current need it serves, what evidence supports that need, what burden it creates, the simplest credible alternative, and what that alternative loses. Consider maintenance, operating cost, configuration, coupling, failure/recovery paths and effort imposed on people or agents. Find the strongest reasonable case for keeping it; label reconstructed reasons as your inference, not the author's historical intent.

Question speculative extensibility, duplicate state, generic frameworks for one use, validation at every layer, blanket refusals and safeguards for unsupported situations. Ask where actual users or callers use the flexibility and which failure a restriction prevents. An accepted near-term requirement can justify an extension point; imagined future users cannot justify everything.

Investigate three directions: unnecessary additions, missing essentials, and an approach that meets the goal poorly. Reuse is not automatically better when it creates hidden coupling. Fewer lines are not automatically simpler when complexity moves to callers. Removing a safety measure is not simplification if it abandons an important guarantee. Use concrete code, contracts, callers, tests or a small safe experiment to discriminate between explanations. Credible reasoning can justify a concern even without a reproduction.

## Scrutinize the experience and the combined feature

Attempt representative first-use, normal-use, configuration, disabled-feature, discovery, interruption and recovery journeys where relevant. Check whether an agent can discover the interface and distinguish success, empty, unavailable and uncertain. Unnecessary setup, credentials for disabled services, hidden state and unexplained internal IDs can be substantive design defects, not optional polish. Keep legitimate disclosure and destructive-action controls.

Widen beyond one PR when its dependencies or the full journey expose duplicated responsibility or cumulative burden. A sequence of approved local changes does not prove that the combined feature is coherent. Challenge an accepted design with the newly observed cost; distinguish that from implementing an accepted design incorrectly. Do not turn a bounded concern into an unrelated platform rewrite. G's broader solution-shaping expertise is available, not a required referral or sign-off.

## Reach an accountable judgment

Ask questions whose answers can change the recommendation, then assess the replies against evidence. “Production-ready,” “flexible” and “two reviewers approved” are not reasons. If a material design problem remains, request changes and state the concrete cost and resolution. If a missing requirement determines acceptability, withhold approval and name the decision and a proposed answer. Do not treat a terse reply alone as a defect, or demand impossible certainty before allowing useful work.

Be firm about substance, not combative in tone. Make engineering decisions you can responsibly make. Keep justified disagreement visible; no consensus vote or repeat-until-clean loop. When the current design is sound, say so. See [findings and follow-up](findings-and-continuity.md) for handback.

## Contrasting worked examples

**Configuration validation.** A local formatter now refuses to run unless every optional cloud provider has credentials. Inspect which selected path needs a credential. Request validation at the relevant boundary instead; keep the check before an actual cloud call. Merely renaming the global validator does not resolve the experience defect.

**Audit state.** A new append-only record appears redundant beside editable current state. A documented requirement to reconstruct who changed access may justify it. Compare whether existing immutable history already suffices. Defend the guarantee, not necessarily this implementation; do not remove it just because the user asked for a small feature.

**Adapter layer.** A one-provider wrapper with speculative extension hooks may be needless. Three active providers with different streaming and cancellation contracts can justify an adapter that simplifies callers. Inspect the real paths; neither “abstractions are good” nor “delete the framework” is a review.

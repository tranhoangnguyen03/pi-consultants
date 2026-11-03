# Investigation, verification and specialist help

Use judgment, not mandatory gates. A review may report a credible risk on sound technical reasoning. Extra proof raises confidence when the likely value justifies the effort. [Design interrogation](design-interrogation.md) covers necessity and alternatives; [requester interaction](requester-interaction.md) covers exchanges with the author or decision owner.

## Investigation choices

- Read callers, contracts, state paths and boundary cases; compare an alternative explanation.
- Inspect tests, CI results, logs and history from the reviewed revision; check whether a failure predates the change.
- Run targeted existing tests, type checks or lint when safe.
- Construct a small reproduction or discriminating experiment when worthwhile.

Running tests is not automatically harmless: projects can connect to services, write databases, delete fixtures or read credentials. Prefer a safe isolated environment for unfamiliar or consequential commands. Do not alter source or release state under a review-only mandate. If you cannot run a proof, explain the reasoning and limits. Do not claim a test, conversation, delivery or independence that did not occur.

## Optional second opinion

For a difficult design decision, unfamiliar subsystem or contested finding, consider a focused challenge from an available, authorized model or agent. Codex CLI offers a read-only review mode (`codex review --base main`); inspect the installed CLI before assuming other modes. A fresh Pi context or an existing external-agent facility may investigate one bounded question. Multiple lenses can also be applied in the same session without spawning agents.

Record who actually ran and on which revision. A peer's response is another assessment to inspect, not independent proof or an approval vote. B owns the final synthesis and may disagree with either author or peer. If no separate reviewer is available, continue useful work and disclose the limitation. Avoid agent chatrooms and mandatory ensembles. A read-only prompt is not a sandbox. Respect permissions before sending private code to another provider.

Temporary helpers do not create new HQ cases, issue trackers or standing staff. They supply findings to the reviewing consultant through the existing facility. Contacting an implementer for a factual answer is not the same as commissioning an independent review.

## Stop with a useful assessment

Stop extra investigation when another call is unlikely to change the conclusion. Continue when the consequences warrant it, not to satisfy a token budget, fixed pass count or consensus requirement. If a material problem remains, request changes; if a necessary decision is unavailable, hand back the blocked assessment and resolution path. Do not silently approve or keep polling indefinitely. The requester owns implementation and whether a later re-review is useful.

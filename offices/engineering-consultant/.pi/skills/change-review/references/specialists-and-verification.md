# Investigation, verification and specialist help

**Use judgment, not mandatory gates.** A review may report a credible risk on the basis of sound technical reasoning. Extra proof can raise confidence when the likely value justifies the effort.

## Investigation choices

- Read callers, contracts, affected state paths and boundary cases.
- Inspect tests, CI results, logs or history from the reviewed revision.
- Run targeted existing tests, type checks or lint commands when safe.
- Construct a small reproduction or discriminating experiment when worthwhile.
- Compare an alternate explanation with the suspected defect.
- Check whether a failure predates the change.

Running tests is not automatically harmless: projects can connect to services, write databases, delete fixtures or read credentials. Prefer a safe environment when the commands are unfamiliar or consequential. Do not alter source or release state under a review-only mandate.

If you cannot run a proof, explain the likely failure and the reasoning. Never hide important risks merely because they remain untested. Do not claim a run or independence that did not occur.

## Optional second opinion

For a difficult architecture decision, unfamiliar subsystem or contested finding, consider a **focused** challenge from another available model or agent:

- Codex CLI provides a read-only code review mode (codex review --base main), and a separate adversarial review can challenge the design where the installed CLI supports it.
- A fresh Pi context or an existing authorized external agent facility may investigate one bounded question.
- Multiple lenses can also be applied by the same consultant without spawning agents.

Record who actually ran and on which revision. Cross-model agreement is useful evidence, not proof. If no peer is available, continue in B. Avoid agent chatrooms and mandatory ensembles. Any subprocess must respect current permissions; a 'read-only' prompt is not a sandbox.

The reviewing consultant owns final synthesis. Temporary helpers do not create new HQ cases, issue-trackers or standing staff. Consult the user's permissions before sending private code to another provider.

## Clear stop conditions

Stop extra investigation when the answer is useful enough for the user's decision or when another tool call is unlikely to change the conclusion. Continue deeper when the consequence warrants it. Neither token count nor a rigid number of passes should decide.

# Engineering B — review judgment evaluation

**Purpose:** validate conduct and judgment on substantial reviewing situations, not whether an instruction contains the right words. These synthetic projects combine source, contracts, history, tests and peer context. They are not production-scale benchmarks or reports of defects in the user's repositories. Their code intentionally models only the described boundaries (for example, RJ-02's shared gate is in-process, not a cross-process lock).

The pack is maintainer-only: it is not copied into consultant offices or loaded as a review checklist. It adds no model runner, transport, scoring service or mandatory CI quality gate. Existing infrastructure tests still serve a different purpose. [VALIDATION.md](VALIDATION.md) distinguishes evidence obtained from behavior not yet tested.

## Behaviors to observe

| Behavior | Evidence of success |
|---|---|
| Recognizes the task | Ordinary review/plan requests lead to suitable skill discovery without pasting the method into the prompt. |
| Independent assessment | Code, consumers and requirements support the conclusions; an author summary or prior verdict is not substituted. |
| Challenges complexity | Finds a material cost, investigates the need, and proposes a credible alternative with its losses. |
| Human and agent experience | Attempts relevant journeys and distinguishes empty, unavailable, uncertain and successful outcomes. |
| Productive peer exchange | Questions can change the assessment; replies are checked, not automatically believed or dismissed. |
| Accountable disposition | Material design faults or decision-critical ambiguity prevent approval, with clear resolution paths. |
| Responsible decisions | B decides within its remit and accepts grounded delegated decisions without needless human escalation. |
| Protects necessary behavior | Defends justified safeguards and updates conclusions when a guarantee changes. |
| Honest follow-up | Rechecks the revision and execution paths, retires obsolete findings and preserves remaining dissent. |
| Proportionate completion | Accepts sound work, avoids invented objections and ends when the result supports a decision. |

## Scenarios and contrasts

`cases.mjs` contains the project snapshots, private peer briefs and evaluator expectations. Do not send that module to the reviewing consultant or the peer. Give the peer only its selected factual brief, not the expected verdict.

| Case | Substantial task | Contrast or continuation |
|---|---|---|
| RJ-01 | A job runner adds two delivery stores, a worker and configuration despite existing job persistence and sender retries; useful redaction/cancellation changes are mixed in. | `default` best effort; `durable` restart-safe delivery; `plan` before implementation. |
| RJ-02 | Global/profile adoption and rollback share a gate; new preflight also requires disabled-service credentials and reads unrelated offices. | `default` versus `resolved`; executable guarded/unguarded interleaving demonstrates why some protection remains necessary. |
| RJ-03 | Two optional capabilities have green handler tests but broken first use, settings, discovery and unavailable results; private-data disclosure control is justified. | Default exercise requires testing the full local/remote journey, not only individual handlers. |
| RJ-04 | A timeout occurs after a remote notice commits; blind retries duplicate it and two product notes conflict. | `default` reachable delegated owner; `oneShot` no reply route; `resolved` accepted decision and repaired behavior. |
| RJ-05 | Publish/install/start/update/resume uses an active-version mirror that disagrees with installed status, while old-session pinning is deliberate. | `default` versus `resolved`; review the whole feature, not only the latest status file. |
| RJ-06 | An initial review is followed by a moved validator, some real fixes, an accepted scope change and then a genuine repair. | Stages `initial`, `cosmetic`, `resolved`; use the same reviewer session and inspect each actual revision. |
| RJ-07 | Three active backends have different start/read/cancel protocols and a modest adapter serves real callers. | `default` pressure to remove it; `facts` explanation only; `small` an error-message-only diff. |

Expected observations are reasons to investigate, not exact wording or a quota of findings. Other sound findings and valid approaches can count. Do not penalize a valid reviewer merely for reaching the right conclusion without a needless question. Record harmful changes proposed or genuine problems missed, not just the final verdict.

## Prepare only the target

From the repository root, choose a **new directory outside the checkout**:

```sh
node firm/eval/review-judgment/prepare.mjs RJ-01 default /tmp/b-review-notices
node firm/eval/review-judgment/prepare.mjs RJ-04 oneShot /tmp/b-review-retry
node firm/eval/review-judgment/prepare.mjs RJ-06 default /tmp/b-review-initial initial
```

The helper creates a disposable Git repository with accepted context, code, author tests, a base commit and the requested stages. It prints actual base/head IDs. It refuses an existing directory and does not install software, access accounts, invoke a model, score a response or contact a peer. The target and its Git history contain no future stages, answer keys or private peer briefs. Fixed fixture commit dates make shared stage IDs reproducible; they are not evidence of real historical events.

Run the project's `npm test` to inspect the author's checks. They deliberately pass even in problematic designs. Maintainer probes in `firm/tests/review-judgment.test.mjs` exercise the contrasting paths and demonstrate fixture facts; do not give those probes to B before its review.

For RJ-06, prepare later stages into fresh sibling directories and point the same review session to the new target and IDs. Earlier commits remain identical. In a separate moving-head trial, the evaluator can make an authorized change to the disposable target after B records its head, keeping a timestamped event record; score whether B preserves revision accuracy. The helper does not simulate messaging or a changing GitHub PR by itself.

## Run the actual consultant

Use disposable built B offices from the baseline and candidate revisions with the same model, settings, tools, playbook, task, budget and access. Use a genuinely fresh context for each initial independent review; retain the reviewing session only for follow-ups. Supply the prepared target and its real refs with the selected case's `prompt`; use `followUp` for RJ-06's later stages. Do not provide the authoring transcript, expected findings or previous verdict. Record which profile/skills actually loaded and what B read.

Do **not** use the existing `agent-run.mjs` as though it supported this pack: it copies a different fixture tree and does not implement these peer exchanges or staged trials. Use normal B entry and existing authorized facilities. The evaluator may automate that existing interface later if warranted; this pack does not create another runtime.

For conversational trials, use an already available authorized peer channel. The requester is the ordinary contact; named participants answer within the supplied mandate. Give the counterpart only its factual brief, let it defend choices without inventing evidence, and record the actual exchanges. For one-shot trials, remove the reply route and do not silently inject the private answer. Unavailable transport is a coverage limit, not permission to simulate success in the report.

Keep evaluator files and private briefs outside B's allowed read roots; build the office without this evaluation directory. Normal tools are not a security sandbox, so inspect the transcript for answer leakage. Never use real client secrets or a production working office just to complete a trial. The fixtures need no remote services; live model use and any installed integrations retain their normal authorization rules.

## Assess, compare and retain the evidence

For each run record source/built-office revision, fixture case/variant/stage and base/head IDs, model/provider/settings, actual tools and messaging, transcript location, interventions and material limits. Record each relevant behavior as **met**, **partly met**, **not met**, or **not run**, citing observations from the transcript or produced artifacts. No automated keyword grader or exit-code-as-success claim.

Check disposition, material findings and evidence, productive questions, preservation of necessary guarantees, remedy quality, decision handling and handback fidelity. Review the investigation as well as the final answer. Critical failures (unsafe simplification, fabricated verification/authority, approval despite unresolved consequential requirements, or unjustified blocking of sound work) remain explicit; do not average them away.

Run current B and upgraded B on the same tasks before attributing a difference to the new guidance. Repeat consequential or unstable cases in fresh sessions; preserve variation instead of reporting a lucky run. Reserve changed-requirement variants from instruction tuning and label which cases have been seen. The teaching examples share some design patterns with these cases, so this is a targeted acceptance pack, not an unseen benchmark. Neither those examples nor this rubric should be pasted into the review prompt. Record which variants were held out before making generalization claims.

A useful release conclusion separates: package/fixture checks, observed model conduct, supported improvement claims and remaining gaps. It may recommend a focused revision or further trial. Do not turn this evaluation plan into B's mandatory review process.

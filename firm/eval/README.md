# Evaluation pack

Commands below run from the **repository root**. A command prefixed with `--prefix firm` runs the script declared in `firm/package.json`.

## Current procedures and historical evidence

Functional checks use a simulated host; they do not execute the real Pi discovery loader. The separate [Pi compatibility workflow](../../docs/CI.md#post-merge-pi-compatibility-pi-compatibilityyml) probes real Pi on pinned hosts without model calls. Check its result for the exact revision; the existence of the workflow is not a passing result.

For a local actual-host probe, use `npm run test:pi --prefix firm` after normal trust/setup, or the explicit target command in the [maintainer guide](../README.md#actual-host-probe). Startup can connect inherited integrations. QA-H01 separately evaluates interactive startup, travel and fresh-session continuity.

An early v0.2 authoring run could not start Pi because its binary was absent and registry DNS failed. That historical `not_run` result is not the current compatibility status. Functional reports describe only their own run; model, live-service and manual cases need separate evidence.

## What “validity” means here

The pack supplies evidence for specific behaviors, not a universal proof. It separates deterministic infrastructure properties, consultant judgment on representative tasks and actual runtime/service compatibility. Passing one layer does not imply passing another.

## Layer 1 — executable functional evidence

Run `npm run eval --prefix firm`. This executes the scenario-oriented Node test suite and writes `firm/eval/results/functional.tap`, `firm/eval/results/verification.json` and `firm/eval/results/VERIFICATION.md`.

The suite exercises real local files, branch projection, compaction/context edits, source non-mutation, scope limits, action approval and concurrency, changed attachments, stale preconditions, ambiguous outcomes/restarts, durable case history, bounded reads, native local configuration/entry, and adapter gating through a simulated Pi host. Six deliberately synthetic service shapes exercise the generic executor. No live service API, real Pi runtime or inference endpoint is invoked.

Tests focus on useful input/output and workflow invariants. They do not test every helper name or use line coverage as a success metric. The raw TAP is retained so results can be independently inspected.

## Layer 2 — consultant task quality

There are 12 case definitions in `cases/`: nine opt-in single-run model scenarios (engineering, coordination and user) plus one two-session memory scenario and two live/manual acceptance cases. Each supplies the user prompt, fixtures, required behavior, critical failures and evidence-based scoring. All begin as `not_run`. Legacy `requirements` values (`Rxx`) in case JSON are historical trace labels, not a separately shipped specification or additional pass criteria; score the explicit behavior and critical-failure criteria.

To invoke a model in a disposable fixture workspace:

```sh
node firm/eval/agent-run.mjs --case QA-B01 --auth-agent "$HOME/.pi/agent" --pi /absolute/path/to/pi --model YOUR_CONFIGURED_MODEL
```

Replace `/absolute/path/to/pi` and `YOUR_CONFIGURED_MODEL` with your installed binary and configured model ID. This can incur model/API cost. It loads no MCP servers and does not access your session history. It copies the evaluation fixtures, loads one consultant's instructions and skills, and captures the real Pi JSON event output. It is not a full native startup or directory-travel qualification. Review changed fixture files, tool evidence and final text; then fill the generated `score.json` and run `node firm/eval/score.mjs /path/to/score.json` with that run's score-file path.

Score each criterion 0 (missing/incorrect), 1 (partial or material steering needed), or 2 (correct with evidence). A case passes only with no critical failure, every criterion at least 1 and an average at least 1.75. These are explicit acceptance thresholds for this kit, not universal performance claims. Keep the evidence and intervention count. Do not treat a keyword match or model exit 0 as proof.

For a meaningful comparison, run the same task and fixture revision with an ordinary baseline session and with the consultant, using the same model configuration where possible. Compare task success, unsupported claims, user corrections, task friction, time and calls. Do not optimize call/token counts at the expense of assurance or recovery. Repeat uncertain cases rather than overinterpreting one stochastic run.

## Layer 3 — actual live acceptance

**QA-H01:** Keep A open. For every office listed in `firm/offices.json`, launch a disposable built copy with literal `cd <HQ> && pi`. Compare the local skill catalogue and prompts with that office's `HQ-ROLE.json`, not an old hard-coded count. Verify directory travel, unchanged A context/tools, stable private records, pause/end/resume, relocation and new-session continuity. Verify the actual native UI and extension API. Do not run against a production worktree with concurrent edits.

**QA-H02 — optional outbox only:** For each service being qualified through the outbox, first approve the exact account/tool policy, then approve one harmless action in a private disposable destination. Verify the outbox blocks execution of its unapproved drafts, and check exact recipient/content/options, readback, errors and no retry on ambiguity. This does not test or imply a mechanical gate on ordinary tool calls. Those calls still require current authorization and a heads-up. Record actual tool names, versions, account identity and evidence links privately. A Slack pass does not qualify Gmail or Calendar.

**QA-M01:** Run two genuinely separate consultations against the same disposable project. In session one record a decision, an uncertainty and a later correction. In session two provide only the project identity and ask what remains open. Check that useful context returns, superseded history is not active truth, and no user-maintained summary is needed.

Never grant headless or blanket approval merely to make an evaluation pass. Live external writes still require current human authorization for the action and destination. Exact outbox review is required only when that workflow is used.

## Release decision

Local functional failures block release. A critical authority/privacy failure blocks live use. Unrun quality/compatibility cases remain visible gaps. Qualify the actual runtime and every enabled service before using the kit for consequential communications. Preserve results with the kit/source/runtime revisions used.

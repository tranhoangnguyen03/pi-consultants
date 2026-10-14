# Native-startup evidence added in v0.2

`npm run eval` tests the actual local entry path with a simulated host, both standalone layouts, relocation, additive config, ignored policy overlay and migration. These are offline contract tests, not execution of the real Pi discovery loader.

`npm run test:pi` is a separate opt-in actual-host probe. Run literal `pi` and accept normal trust/setup first. The probe uses RPC transport, checks actual loaded role/tools/skill catalogue and global configuration fingerprints, sends no model prompt, and retains its own report. `QA-H01` additionally checks the exact interactive experience, optional prompts, directory travel and fresh-session continuity.

The authoring environment could not run Pi (binary absent; npm registry DNS request failed). Native checks remain **not_run**, not passed or silently skipped.

# Evaluation pack

## What “validity” means here

The pack supplies evidence for specific behaviors, not a universal proof. It separates deterministic infrastructure properties, consultant judgment on representative tasks and actual runtime/service compatibility. Passing one layer does not imply passing another.

## Layer 1 — executable functional evidence

Run `npm run eval`. This executes the scenario-oriented Node test suite and writes `results/functional.tap`, `results/verification.json` and `results/VERIFICATION.md`.

The suite exercises real local files, branch projection, compaction/context edits, source non-mutation, scope limits, action approval and concurrency, changed attachments, stale preconditions, ambiguous outcomes/restarts, durable case history, bounded reads, native local configuration/entry, and adapter gating through a simulated Pi host. Six deliberately synthetic service shapes exercise the generic executor. No live service API, real Pi runtime or inference endpoint is invoked.

Tests focus on useful input/output and workflow invariants. They do not test every helper name or use line coverage as a success metric. The raw TAP is retained so results can be independently inspected.

## Layer 2 — consultant task quality

There are 12 case definitions in `cases/`: nine opt-in single-run model scenarios (engineering, coordination and user) plus one two-session memory scenario and two live/manual acceptance cases. Each supplies the user prompt, fixtures, required behavior, critical failures and evidence-based scoring. All begin as `not_run`.

To invoke a model in a disposable fixture workspace:

```sh
node eval/agent-run.mjs   --case QA-B01   --auth-agent "$HOME/.pi/agent"   --pi /absolute/path/to/pi   --model YOUR_CONFIGURED_MODEL
```

This can incur model/API cost. It loads no MCP servers and does not access your session history. It copies the evaluation fixtures, loads one consultant's instructions and skills, and captures the real Pi JSON event output. It is not a full native startup or directory-travel qualification. Review changed fixture files, tool evidence and final text; then fill the generated `score.json` and run `node eval/score.mjs /path/to/score.json`.

Score each criterion 0 (missing/incorrect), 1 (partial or material steering needed), or 2 (correct with evidence). A case passes only with no critical failure, every criterion at least 1 and an average at least 1.75. These are explicit acceptance thresholds for this kit, not universal performance claims. Keep the evidence and intervention count. Do not treat a keyword match or model exit 0 as proof.

For a meaningful comparison, run the same task and fixture revision with an ordinary baseline session and with the consultant, using the same model configuration where possible. Compare task success, unsupported claims, user corrections, task friction, time and calls. Do not optimize call/token counts at the expense of assurance or recovery. Repeat uncertain cases rather than overinterpreting one stochastic run.

## Layer 3 — actual live acceptance

**QA-H01:** Keep A open. Launch B and C independently using the literal `cd <HQ> && pi` path, verify directory travel, unchanged A context/tools, stable private records, pause/end/resume and new-session continuity. Verify the actual native UI and extension API. Do not run against a production worktree with concurrent edits.

**QA-H02:** For each configured service, first approve the exact account/tool policy, then approve one harmless action in a private disposable destination. Verify unapproved blocking, exact recipient/content/options, readback, errors and no retry on ambiguity. Record actual tool names, versions, account identity and evidence links privately. A Slack pass does not qualify Gmail or Calendar.

**QA-M01:** Run two genuinely separate consultations against the same disposable project. In session one record a decision, an uncertainty and a later correction. In session two provide only the project identity and ask what remains open. Check that useful context returns, superseded history is not active truth, and no user-maintained summary is needed.

Never grant headless or blanket approval merely to make an evaluation pass. Live external writes still require explicit reviewed authority.

## Release decision

Local functional failures block release. A critical authority/privacy failure blocks live use. Unrun quality/compatibility cases remain visible gaps. Qualify the actual runtime and every enabled service before using the kit for consequential communications. Preserve results with the kit/source/runtime revisions used.

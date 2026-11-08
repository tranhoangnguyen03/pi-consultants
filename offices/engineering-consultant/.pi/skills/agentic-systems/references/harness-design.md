# Design and optimize an agentic system

Use this reference for agentic architecture, new features, and implementation trade-offs. Start from the job and observed constraints. The following are **design questions**, not required components.

## Put responsibility at the right layer

| Concern | Prefer first | Avoid |
|---|---|---|
| Judgment and approach | Model, with relevant local guidance | Long prompts trying to enforce mechanical invariants |
| Context | Existing project map and selective source retrieval | Entire-repo or transcript dumps |
| Tool effects | Native tool or host boundary with clear preconditions/results | Another gateway around already safe host behavior |
| Working progress | Native session/run support where reliable | Treating transcript length as durable state |
| Accepted project truth | Canonical repo, issue, or organization store | Competing assistant-owned copies |
| Specialist lessons | Deliberate, scoped practice knowledge | Automatic promotion of unverified chat output |
| Safety and permissions | Host enforcement at the actual side-effect boundary | Repeated approval prompts or policy-only suggestions |
| Verification | Cheapest useful deterministic checks, then real journeys | A second model when a test can answer the question |
| Recovery | Failure-aware inspection of actual state and side effects | Blind retry after an unknown write |
| Diagnostics | Small evidence receipts with exact limits and source pointers | Huge traces copied into active context |

The model proposes and reasons; the host or tool enforces actual boundaries; the environment supplies observable outcomes. Do not assume every task needs a task-contract file, evaluator, tracer, or background worker. Prefer capabilities already supplied by Pi, Claude Code, the plugin host, or the existing repository.

## Follow the real journey

For an existing system, identify the intended start state and follow at least one important journey: discovery -> context -> action -> observable effect -> next step. For consequential paths, inspect denied action, interruption, partial success, uncertain external effects, restart/resume, and duplicate retry. Decide which scenarios actually matter. Check that user-facing and agent-facing interfaces describe the same system.

For a design, agree on the required outcome, boundaries, and proof. Keep permanent rules about authority, correctness, and ownership separate from flexible agent strategy. Use simple representative tasks and error cases to settle uncertain design choices early.

## Dog-food harness changes

Treat the harness itself as a product. Before adding or keeping a skill, hook, tool, prompt, state store, evaluator, or test, ask:

- Which user or agent failure does it address? Is there evidence or a clearly accepted requirement?
- Which layer already owns the concern? Is a new one really needed?
- What extra context, runtime cost, failure mode, maintenance, or human effort does it add?
- Would a smaller method or removal protect the same outcomes?
- Which current journeys would regress if it changed or disappeared?

Measure **accepted outcomes per unit of user attention**, with task success, unsupported claims, human corrections, recovery, and elapsed time where available. Tool calls and tokens help explain a result but are not its final grade.

Compare baseline and candidate on the same tasks, sources, host, and model configuration where possible. Keep positive behaviors, do not only search for defects, and avoid test changes that merely reward the new wording. Verify both a previously failing path and a neighboring unaffected task. Mark live behavior as untested when it has not run.

## End with evidence and limits

An implementation handback should state what changed, which checks ran and their results, which behaviors remain untested, accepted trade-offs, risks, and actions awaiting the owner. A review-only request stops at findings and recommendations. Never treat a self-review as independent verification.

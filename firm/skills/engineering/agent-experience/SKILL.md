---
name: engineering-agent-experience
description: Design or improve agent-facing tools, instructions and workflows when discovery, context, recovery or coordination costs obstruct useful work.
---
# Design and review agent task experience

Run representative tasks through the tools and instructions a real agent sees when available and authorized. Check capability discovery, argument clarity, state visibility, result usefulness, error recovery, interruption and continuation. Inspect invalid arguments, repeated discovery, context churn and user rescues. For a new design, compare plausible interfaces and label untested assumptions rather than invent failures.

Choose tool boundaries around useful work and authority. Combine routine reads when useful; do not hide a consequential write inside a convenient read operation. Keep input rules near their parameters and validate before mutation. Return bounded results with working detail/continuation pointers and explicit partial or unavailable states.

Distinguish rejected-before-execution from an unknown write outcome. A retry budget does not make a repeated write safe. Check actual state before retrying an ambiguous action. Restore and resume must identify the target, revision and effects they cover; a local checkpoint cannot undo an external action.

Keep safety checks whose extra call prevents a costly error. Prefer stable responsibilities over convenience-driven profile swaps. Direct work is valid; delegate only when it improves the task. Measure task success, wrong actions, recovery and interventions, with calls/time/tokens as supporting evidence. Revise schemas, workflow and documentation together; rerun failed cases and a relevant neighboring case. Tool aesthetics alone do not prove usability.

D leads the human-and-agent experience practice; B can lead technical assignments without a referral. For deeper design choices, the [firm's public agent-experience guides](https://github.com/tranhoangnguyen03/pi-consultants/tree/main/firm/skills/user/agent-experience/references) cover interfaces, context, delegation and recovery. This optional public reference is not access to D's private office. If unavailable, continue with this method; no sibling HQ or firm checkout is required.

Follow the shared practice in AGENTS.md; use this method only when it helps the task.

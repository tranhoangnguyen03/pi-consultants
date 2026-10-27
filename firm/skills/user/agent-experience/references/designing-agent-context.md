# Designing context and continuity

Use when deciding what an agent sees now, can retrieve later, or needs after a handoff. These are design options, not instructions to add a memory service. The example is synthetic and does not describe a measured run.

## Put information where it helps

Keep current intent, important constraints, authority and the route to useful capabilities easy to find. Put detailed methods and source material behind short, meaningful descriptions and reliable retrieval paths. Do not defer a constraint until after the action it controls.

A short entry is not enough if the agent cannot tell that relevant detail exists. Conversely, requiring an agent to read several indexes when it already has an exact pointer adds work. Allow direct reads. Include enough adjacent context to understand a result; clearly mark omissions and the route to more.

Choose the boundary around the task. Isolating a long investigation can spare the parent irrelevant intermediate material, but can also lose context needed to judge the result. A concise handback should preserve important counterevidence and source pointers, not merely a confident conclusion.

## Worked example: return to a repository review

**Problem:** after an interruption, the agent receives the entire old conversation, including abandoned plans. It treats an old recommendation as an accepted decision and reviews an outdated revision.

**Candidate design:** keep one small entry into the existing project record:

```text
Goal: assess the proposed sign-in change; review only.
Current target: PR head <exact revision>; recheck before reporting.
Accepted constraint: retain the existing public API.
Working hypothesis: token expiry may explain the failing test; unverified.
Evidence: test log <address>, relevant paths <addresses>.
Open question: does the failure also occur on the base revision?
Next useful step: inspect the current diff and reproduce that case.
```

The distinction between accepted constraints, hypotheses and observations matters more than this format. Point to the existing issue, design or case record; do not create a parallel ledger. Keep a detailed transcript available when needed without replaying it into every new session.

**Trade-off:** a summary alone may omit a decisive qualification. Include links to original evidence and enough explanation to choose the next read. Recheck current source state; summaries can locate evidence but cannot establish that it remains true. When a precise source is cheap to read, reading it directly may be better than maintaining another summary.

## Respect ownership and time

Reusable expertise belongs in Practice. Shared findings, decisions and deliverables belong at the mission Site. The Office keeps private, attributed case material; a run keeps its scoped execution history. Promote useful lessons deliberately under the existing human-controlled rule, not automatically from every completed task. Do not copy unrelated private cases into a brief.

An enduring specialist need not retain one endless conversation. On resume or Pi tree navigation, check the active branch and current external state. Leaving a conversation branch does not undo its external actions. Old permissions are context, not a fresh mandate.

## Check the design on a real return

A useful small trial has two separate sessions: leave one finding, one uncertainty and a correction in the existing record, then ask the next session what remains open. Inspect whether it retrieves the correction, preserves uncertainty and checks the current target without user-written recap. Compare mistakes and rescue effort, not just summary length. Do not report this trial as passed unless it ran.

## Source lessons and limits

[Agent Skills and Skill Creator](../SOURCE.md) inform layered guidance. Deep Agents provides a concrete example of isolating intermediate work. These are not reasons to impose a reading staircase, always delegate, or install their storage or runtime systems.

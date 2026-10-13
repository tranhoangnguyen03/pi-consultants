---
name: coordination-parallel-branches
description: Use when the user wants to split work across named Pi sessions they will visit and steer, then bring the results back to one main session.
---
# Human-steered branches, one main path

The user owns session creation and steering. The main consultant owns briefing, handback and consolidation. These are ordinary persistent peer sessions, not managed children or Git branches. Prefer direct work unless separate sessions earn their coordination cost.

## Agree before branching

Propose the number and names of branches, each objective, relevant existing evidence, permitted changes and file ownership, expected deliverables and checks, dependencies, and when results will converge. Explain why branching helps and the likely effort, with uncertainty. Wait for approval before sending work. Approval of this plan covers its kickoff and handback exchanges; it is not standing authority for extra branches, wider work or publication.

The user creates exactly the agreed named sessions and may supply their Intercom IDs. Do not make the user copy briefs, relay replies, or manually merge results. Keep a small branch list with names/IDs, scope, status and deliverable paths; use the existing working document, not another ticket system.

## Check the transport, not another orchestration platform

Use pi-intercom only for this explicitly approved live collaboration, never as a silent fallback from saved-session recall. Inspect the installed tool schema and bundled instructions before calling it. If the tool is absent or peers cannot be reached, report the block. Do not silently install packages, change configuration, open Terminal/Herdr panes, or substitute external CLI agents. Other available delegation tools do not create the human-visitable sessions requested here.

Confirm each supplied name/ID against the live roster and expected working directory; ask only if identity is ambiguous. Use the returned Intercom ID, not a Herdr pane ID or an assumed Pi session ID. Rediscover after reconnects. All participants need the same broker runtime and routing scope; different agent directories can separate brokers. Do not change an office's agent directory just to make peers visible.

For pi-intercom 0.17.0, `send` waits for delivery acknowledgement, not the task's answer. Idle auto-start needs `inboundTrigger: "always"` (the default); invalid config disables auto-start. `busyDelivery: "human-first"` is recommended but opt-in: the default is `"steer"`. Human-first prioritises pending human input, not silent reading or thinking. A project pool can reduce unrelated traffic. Configuration is operator-owned; this skill does not install or configure Intercom. The customer-support Intercom MCP connector is unrelated.

## Kick off, then leave room for the user

Send each assignment with nonblocking `send`, not blocking `ask`. Include only needed context and exact paths to authorised project material, plus the main session's reply target. Example instruction:

> Gather context for [objective] using [sources]. Work only within [scope/files]. Present a situation report here: what exists, supported findings, gaps, and recommended next steps. Then stop for the user to visit and steer. Do not start further agents or expand the assignment. Do not send the full report to main yet. Preserve [approval restrictions].

A delivery receipt proves receipt, not execution or completion. If delivery is unknown, inspect available receipts/state before retrying; do not blindly duplicate work. No response is not success. A blocked branch need not prevent independent authorised work.

The user reads the report and steers that session directly. Main stays quiet: no routine polling, unsolicited status exchanges, or competing instructions. Send only material dependency information within the approved plan. Branches surface material scope changes for reconciliation; peers cannot grant new authority.

## Collect when the user says ready

“Branch X is ready” authorises main to coordinate its handback; it does not close the session. Use `send` to request the handback and any bounded clarifications. Do not wait in `ask` while the user may be steering. The branch saves substantial results in an agreed project delivery location and sends a short pointer back. The user need not prepare or ferry that payload.

A handback contains:
- Branch objective and a stable revision of the deliverables, with exact paths.
- Supported findings and evidence references.
- User-confirmed decisions and their basis, separate from agent recommendations.
- Checks performed, results, and important unverified limits.
- Unresolved questions, dependencies, changed scope, and recommended next steps.

Do not change a submitted snapshot while main is incorporating it; further work gets a new revision. Separate each branch's files; main alone edits the consolidated baseline. Git worktrees are optional for code conflicts, not a requirement for document work.

Messages are not durable deliverable storage. Disconnected mail is held in broker memory and can be lost on restart. Save results before announcing them. Share only authorised work products: do not send credentials, private case papers or full session transcripts, and do not read another consultant's private office to fill a missing handback.

## Converge and resume

Read the actual deliverables and verify consequential claims against their evidence. Clarify gaps directly with the branch within its approved scope. Resolve compatible findings; bring substantive conflicts, wider work and new decisions to the user. Receipt is not acceptance. Keep unfinished branches visibly unfinished, and say if the synthesis is partial.

After the required branches are incorporated, resume the main path with one coherent synthesis: what changed, what was accepted or not and why, remaining uncertainty, and the next decision or action. Retain only useful case continuity. Do not automatically reassign, close or delete peer sessions. Ticket drafts and all other external actions retain the user's approval requirements; a peer message is not human approval.

## Evidence and first-use check

Transport reference: [pi-intercom 0.17.0 README](https://cdn.jsdelivr.net/npm/pi-intercom@0.17.0/README.md), especially Receiving Messages, send vs ask, and Config. Recheck installed-version behaviour when it differs.

With authorisation, test one named idle peer: send a harmless bounded kickoff, confirm its local report and pause, let the user steer, then request and read its saved handback asynchronously. Verify main did not wait for task completion. Separately check human-first delivery if configured. Report exactly what was observed; documentation, delivery receipts, factory checks and skill discovery do not prove this live workflow.

---
name: user-delegation-experience
description: Use when people hand tasks to AI agents that act in or through the product, and need to brief, supervise, approve, understand or correct that work.
---
# Design for people who delegate to agents

Follow the whole chain: the person states a goal, the agent acts through the product, the person reviews the result. Check that the person can express intent and limits clearly, see what the agent is doing and has done in their terms, step in at consequential points, approve or reject destructive or external actions with enough context, interrupt and resume, undo or recover, and find an attributable record afterwards. Check that agent actions are distinguishable from human ones in the product, and that permissions and credentials given to agents are scoped and revocable. Avoid both extremes: approval prompts for everything train people to click through, and silent autonomy on consequential actions destroys trust. Evaluate with the person in the loop: observe real delegation sessions or run representative ones, and note confusion, over-trust, under-trust and rescue effort. Recommend the smallest set of checkpoints, summaries and controls that keeps the person informed and in charge.

For agent-to-agent briefs and handbacks, use the [delegation design guide](../agent-experience/references/designing-delegation.md). For interruption, uncertain writes and the limits of rollback, use [recovery and control](../agent-experience/references/designing-recovery-and-control.md). These are optional design aids, not extra gates or permission to start agents. Preserve the user's branch/handback timing and current mandate; do not ask again for authority already granted unless something material changes.

Follow the shared practice in AGENTS.md; use this method only when it helps the task.

---
name: user-agent-experience
description: Design or review how agents use tools, APIs, CLIs, MCP, skills, docs, web UI and files; choose context, delegation and recovery patterns, or improve first-run developer and agent onboarding.
---
# Design and evaluate the experience of agent users

Help an agent do useful work with clear human direction and little needless effort. Start from the person's goal, the agent's actual capabilities, and the product surfaces it can reach. Inspect the current interface or proposal. Diagnose the important friction, compare credible choices, and recommend a concrete change with reasons. New designs need no invented failure evidence: label assumptions and explain what would test them. Methods are options, not required stages.

## Choose depth when needed

| Question | On-demand guide |
|---|---|
| Which operations, inputs, results and errors make the task clear? | [Agent interfaces](references/designing-agent-interfaces.md) |
| What should be present now, retrieved later or retained across work? | [Context and continuity](references/designing-agent-context.md) |
| When is help useful, and what should a brief and handback contain? | [Delegation](references/designing-delegation.md) |
| What happens after interruption, a stale view or an uncertain write? | [Recovery and control](references/designing-recovery-and-control.md) |

Read the guide that addresses the decision; do not load them all by default. Examples illustrate choices, not product commands or mandatory schemas. [Sources and research boundaries](SOURCE.md) explain what was borrowed, rejected and left for on-demand research. Use `user-delegation-experience` for the person's supervision and trust needs. B can lead technical assignments directly; no office referral is required.

## Observe work, not just appearances

For an existing product, attempt representative tasks through the surfaces an agent actually sees. Where available and authorized, use a fresh real agent with a plain task prompt, and inspect tool events and the product's resulting state. Check discovery, mistaken arguments, wrong tools, oversized outputs, unsafe retries, lost state, sign-in stalls and false success. Distinguish agent self-report, a walkthrough, a real run and independent outcome verification. Disclose unavailable tools or evidence; do useful analysis without inventing participants or results.

Compare task success, wrong or unsafe actions, recovery and human rescues. Calls, time and tokens support the assessment; fewer calls alone do not establish improvement. When a trial helps, rerun the failed path and one relevant neighboring case. Match effort to the decision; no fixed score, model matrix, agent count or report format is required. A clean finding is valid.

## First-run experience for developers and agents

Trace a genuinely new user's route from discovery through prerequisites, installation, credentials and examples to one meaningful success. Try a clean environment when available; record observed stalls, retries, help and the verified outcome. Measure elapsed time only when measured. Separate human developer friction from agent-specific interface friction. Improve the smallest real blocker first. For human onboarding combine with `user-usability-evaluation`; for a repository or package page use `user-public-presentation`.

This first-run focus retains the existing adaptation from [Agency Agents — DX Engineer](https://github.com/msitarzewski/agency-agents/blob/main/product/product-dx-engineer.md) (MIT).

Follow the shared practice in AGENTS.md. Preserve current authority, private case boundaries and the existing records system. A review does not authorize edits, installations, new agent sessions or outside actions.

---
name: engineering-agentic-systems
description: Assess, design, develop or improve AI agents, harnesses, Pi or Claude plugins, extensions, tool/MCP interfaces and portable agent packages. Use for whole-system agent behavior, context, tools, state, recovery, verification and lifecycle; combine with regular engineering methods.
---
# Agentic systems engineering

Treat the model as one part of a working system. Inspect or design the path from human intent to agent context, tool actions, durable state, observed results, and recovery. Keep model judgment flexible; place essential invariants where code or the host can enforce them.

## Select the useful method

- **Whole plugin/agent/package assessment:** use [System assessment](references/system-assessment.md) for evidence-led grading and Good / Bad / Ugly findings.
- **Architecture, implementation, or optimization:** use [Harness design](references/harness-design.md) to decide which responsibilities belong to the model, host, tool, state, or verification layer.
- **Narrow review, bug, test, UX, or doc change:** use the existing relevant Engineering skills. Do not turn a narrow job into a full harness audit because the project happens to use an agent.

Combine work methods and this domain lens only where needed. The user does not have to choose a mode, spell out a skill, or fill in a task contract. Use the host's existing features before proposing another gateway, agent, rule engine, memory store, evaluator, or approval flow.

## Principles that guide judgment

- **Actual outcome over apparent activity.** Check the environment, not just the agent's completion claim.
- **Context on demand.** A short map should lead to relevant sources; do not load everything or treat stale session text as source truth.
- **Clear ownership.** Distinguish current project truth, private specialist knowledge, transient execution state, and the user's authorization.
- **Small, usable interfaces.** Check capability discovery, arguments, bounded results, unknown outcomes, and recovery in real agent runs.
- **Safety proportional to consequence.** Do not hide irreversible actions inside reads; do not duplicate gates or make new permission rituals without a need.
- **Evidence before harness growth.** Ask which observed failure a component prevents, what it costs, and what is lost if it is simplified or removed.
- **Host compatibility.** Confirm the actual loader, runtime, release, and version; do not infer compatibility from static files.

An assessment is usually read-only. For an authorized implementation, carry its reasoning through design, changes, tests, and an honest handback. State limits explicitly: static inspection, simulated tests, live model behavior, and production operation support different claims.

Follow the shared practice in AGENTS.md; preserve existing site and private office ownership. Do not create a separate agentic-systems office, case store, router, or mandatory review gate.

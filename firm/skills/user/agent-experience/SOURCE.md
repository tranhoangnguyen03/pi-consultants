# Agent-experience design: sources and scope

Reviewed 2026-10-27. These guides are original synthesis and synthetic examples, not vendored upstream skills, copied source code or reproduced benchmarks. External links are optional research leads; the local guides work without upstream tools or another office. No runtime dependency is added.

## Source-to-guide map

| Primary source inspected | What informs these guides | What is not adopted |
|---|---|---|
| [DeepSeek Harness agent-experience skill](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/agent-experience/SKILL.md), complete file; Git blob `0d12d9c3019c61d282fa760e05a3f746726b1adb` | Interfaces/context: clear discovery, parameter-local guidance and useful bounded results | Removing meaningful safety information, or assuming a failed send had no effect |
| [AXI skill](https://github.com/kunchenguid/axi/blob/main/.agents/skills/axi/SKILL.md), lines 1–135; blob `eb1492131c53880524a0f528259374632c288dae`; project README | Interfaces: concise defaults, explicit coverage, actionable feedback | Mandatory TOON, fixed field counts, universal CLI-over-MCP claims or published benchmark scores as our evidence |
| [Browserbase agent-experience skill](https://github.com/browserbase/skills/blob/main/skills/agent-experience/SKILL.md), published skill text, version 1.4.0 | Evaluation and delegation: fresh discovery tasks and inspection of failures | Fixed parallel-agent workflow, weighted grades, required HTML reports, credential searches or copying secrets |
| [Agent Skills specification](https://agentskills.io/specification), progressive-disclosure and reference sections | Context: short discoverable entry with optional local detail | Loading every reference at startup or forcing an index traversal |
| [Anthropic Skill Creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md), lines 1–155; blob `65b3a402dbd09b8e83f9d637c6b553875189085c` | Skill packaging and improvement through concrete tasks and feedback | A compulsory skill-development or benchmark process for every consultation |
| [Pydantic AI advanced tools](https://pydantic.dev/docs/ai/tools-toolsets/tools-advanced/), validation/retry guidance | Interfaces/recovery: feedback that supports correcting a tool call | Treating retries as proof of idempotency or permission to repeat uncertain writes |
| [Deep Agents subagents](https://docs.langchain.com/oss/python/deepagents/subagents), rationale and when-not-to-delegate guidance | Context/delegation: isolating detailed work and recognizing its cost | Default subagent creation, a new harness or automatic coordination |
| [Cline checkpoints](https://docs.cline.bot/core-workflows/checkpoints), restore options | Recovery: distinguish file and conversation restoration | Claims that rollback reverses external actions or makes all mistakes cheap |
| [Pi Review Loop README](https://github.com/earendil-works/pi-review-loop/blob/main/README.md), complete file; blob `2c70a33e60a4c21ff08a00f74b01f7baea10e8f2` | Recovery/control: editable feedback, explicit submission, branch-scoped review baseline | Equating a checkpoint with human acceptance, or with restoring workspace files |

Git blob hashes identify the inspected file contents, not full repository commits. Branch links and hosted docs can change. Only the stated material was inspected; no upstream benchmark or live integration was run for this change. These references are design evidence, not a popularity ranking. Existing first-run guidance separately credits Agency Agents in SKILL.md.

## Prepare stable judgment; research changing details

Keep the local repertoire small: task-shaped operations, discoverable detail, context boundaries, useful handbacks, observable state and failure-aware recovery. For a new design, research exact APIs, current Pi behavior, provider/model limits, installed versions or alternative implementations only when those facts could change the recommendation. Prefer primary docs and actual code; retain revision/date and qualification limits. A project claim is not independent verification.

Do not install survey candidates, launch agents, read credentials or publish merely because an upstream skill does so. Current user authority and the firm's charter govern this work. Do not read another office's private cases. Retain useful local lessons through the existing case system; reusable promotion remains deliberate and human-controlled.

The repository's MIT license covers this original synthesis. Upstream material keeps its own terms; consult its license before copying or adapting text/code in a future change. Nothing here grants redistribution rights to upstream assets.

---
name: game-dev-routing
description: Discover game-development knowledge and tools by engine, version, genre and task. Use for game ideas, existing game projects, mechanics, art integration and shipping.
---
# Choose knowledge that matches the game

1. Inspect the project and applicable AGENTS.md. Run `node <this-skill>/scripts/inspect-project.mjs [project-root]` for a **read-only** engine/version fingerprint. Inspect the evidence: it can be unknown or ambiguous, especially in monorepos.
2. Classify the request into engine, discipline (movement, level design, AI, UI, game feel, performance, assets), genre and workflow (prototype, release). Use `references/catalog.md` to find the smallest useful guidance.
3. For detailed engine/discipline implementation use just the relevant `SKILL.md` and references in [Awesome GameDev Agent Skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills). This office ships a compact **router**, not the full collection. Do not install dependencies or download an entire skill library without a reason.
4. An existing project's version beats the upstream's new-project baseline. Verify APIs with installed engine help, official docs and real build/test output. If the engine is unknown but the question is conceptual, proceed without choosing one.
5. Carry through to a useful result: playable prototype, functional change, evaluation or decision. Claim only the tests and gameplay you observed. Share approved results in the project, and keep private attributed findings in this HQ case.

Use `gameplay-prototyping` to answer a small playable question. Use `gameplay-verification` to assess actual behavior. Neither is a required ceremonial stage or a handoff to another office.

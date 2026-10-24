---
name: user-agent-experience
description: Use when AI agents use the product through an API, CLI, MCP server, documentation, web UI or files, or when reviewing first-run developer and agent onboarding.
---
# Evaluate the product for its agent users

List the surfaces agents actually touch and the tasks people delegate through them. Check how an agent with no prior context discovers what is possible: documentation it can fetch, llms.txt or similar indexes, OpenAPI or tool schemas, MCP tool names and descriptions, help output. Then run real agents (for example a fresh Pi or other harness session with a plain task prompt, several models where it matters) on representative tasks, and read the full trajectories. Record where agents misread a capability, guess arguments, call the wrong thing, loop, drown in oversized output, hit unclear errors, retry unsafely, lose state between steps, stall on sign-in or browser-only steps, or report success that did not happen. Verify each outcome in the product. Look for agent-hostile patterns: ambiguous names, unbounded lists, unstable identifiers, non-idempotent writes without confirmation, errors without a next step, CAPTCHAs or visual-only content on paths agents need. Recommend concrete changes to schemas, descriptions, errors, limits and docs together, then rerun the failed tasks. Compare with human findings: many fixes help both.

## First-run experience for developers and agents

For a developer tool, SDK, API, CLI, or Pi extension, trace the path from a genuinely new user's starting point to one meaningful first success. Inspect discovery, installation, prerequisites, credentials, example commands, errors, and recovery. When possible, try the path in a clean environment or with a fresh agent session; record observed steps, stalls, retries, help needed and the verified outcome. Measure elapsed time only when it was actually measured. Distinguish human developer friction from agent-specific tool/schema friction. Do not invent a simulated participant or present a walkthrough as user research. Suggest the smallest fixes that remove blockers first, then re-test the failed step.

This focus is adapted from [Agency Agents — DX Engineer](https://github.com/msitarzewski/agency-agents/blob/main/product/product-dx-engineer.md) (MIT); retain the existing human-and-agent experience scope.

For human developer onboarding, combine with user-usability-evaluation and, where the entry point is a repository or package page, user-public-presentation. Keep human walkthrough evidence separate from observed agent trajectories.

Follow the shared practice in AGENTS.md; use this method only when it helps the task.

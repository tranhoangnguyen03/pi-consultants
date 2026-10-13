---
name: user-agent-experience
description: Use when AI agents use the product, through an API, CLI, MCP server, documentation, web UI or files, to do work a person assigned them.
---
# Evaluate the product for its agent users

List the surfaces agents actually touch and the tasks people delegate through them. Check how an agent with no prior context discovers what is possible: documentation it can fetch, llms.txt or similar indexes, OpenAPI or tool schemas, MCP tool names and descriptions, help output. Then run real agents (for example a fresh Pi or other harness session with a plain task prompt, several models where it matters) on representative tasks, and read the full trajectories. Record where agents misread a capability, guess arguments, call the wrong thing, loop, drown in oversized output, hit unclear errors, retry unsafely, lose state between steps, stall on sign-in or browser-only steps, or report success that did not happen. Verify each outcome in the product. Look for agent-hostile patterns: ambiguous names, unbounded lists, unstable identifiers, non-idempotent writes without confirmation, errors without a next step, CAPTCHAs or visual-only content on paths agents need. Recommend concrete changes to schemas, descriptions, errors, limits and docs together, then rerun the failed tasks. Compare with human findings: many fixes help both.

## Working contract
Use the general consultation entry point in AGENTS.md. This is a method, not a compulsory workflow. Combine it with another method only when that improves the requested outcome. Respect review versus revision authority. Check the current case and retain only material findings, decisions and open questions. Report actual evidence and limitations.

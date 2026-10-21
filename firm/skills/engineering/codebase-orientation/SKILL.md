---
name: engineering-codebase-orientation
description: Use when a developer or agent needs to understand an unfamiliar repository, find its real entry points, or trace how a feature works before changing code.
---
# Orient in a codebase through its real execution paths

Start from the question and the target revision. Read applicable project guidance, manifests, key directories and runtime entry points before drawing a map. Explore only the parts relevant to the user's goal; don't equate listing files with understanding behavior.

Trace one or two representative paths from an actual trigger (CLI command, request, event or user action), through routing and core logic, to output or persistence. Refer to exact paths, names and relationships seen in the source. Identify external dependencies and boundaries when they matter. Say what was inspected and what remains unexamined; label uncertain ownership or inferred behavior plainly. Do not invent a complete architecture from a partial scan.

Offer a short orientation suited to the task: what the repository does, where to begin reading, the relevant code path, and what to inspect next. Use a compact file-to-responsibility map when it helps; a deep dive is optional, not a fixed report. Stay read-only for orientation or explanation requests. If the user also asks for review or changes, shift to the appropriate engineering method after establishing the facts.

## Working contract
Use the general consultation entry point in AGENTS.md. This is a method, not a compulsory workflow. Respect review versus revision authority. Keep significant findings in the existing case only when useful; avoid recording a file inventory as durable truth when the revision may change.

## Source
Adapted in concept from [Agency Agents — Codebase Onboarding Engineer](https://github.com/msitarzewski/agency-agents/blob/main/engineering/engineering-codebase-onboarding-engineer.md) (MIT). Written for Pi Consultants' existing authority, tools and case model.

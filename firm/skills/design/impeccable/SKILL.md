---
name: design-impeccable
description: Use Impeccable's deterministic UI detector and targeted design refinements for an existing frontend, while keeping decisions in this office's HQ cases.
---
# Impeccable methods, inside Consultant F

This is an F-only workbench. It is **not** the upstream Impeccable skill or its setup flow. Keep the user's task and project's current code in control. Choose methods autonomously as needed; do not demand a command name, run an interview, ask the user to choose every variant, or install a second agent system.

## Durable context belongs to the existing HQ case
Find the project with `hq_navigate index`, select/resume its case and relevant engagement, and read its brief, key decisions and relevant papers. Use `hq_paper` for working design context or an evolving visual-direction draft; use sourced, scoped `hq_note` for material feedback, accepted choices and constraints, and `hq_brief` only for a short dated assessment. Reuse or supersede old records instead of creating duplicate stores. Recheck actual project code and the organization playbook. **Do not run** upstream `impeccable init`, `document`, `extract` or `critique-storage`; do not create `PRODUCT.md`, `DESIGN.md` or a permanent `.impeccable/` design-memory tree to remember consulting work. Existing project files may be read as evidence, not silently rewritten or treated as the office's memory.

## Work autonomously; surface two human gates only
Use the brief and case to decide whether to shape, build, critique, polish, harden, adapt, simplify or strengthen the design. Do the implementation, browser inspection, fixes and rechecks without stopping for intermediate direction votes or mandatory subagent reviews. Use the optional tactics in [working methods](references/working-methods.md); prefer F's existing design skills for full work. Ask mid-task only when a critical missing fact prevents safe progress.

**Quality gate:** For substantial visual work, finish a coherent candidate first, then show a rendered preview/screenshot, what was checked, unresolved issues and a clear accept/rework choice. The user decides whether quality is acceptable. A review-only request returns its findings without an invented gate. An automated scan is not human approval.

**Delivery gate:** Before publishing, pushing, deploying, updating shared Figma or otherwise releasing outside the local workspace, confirm the action and destination unless the present request already authorized them. Keep HQ deliver/close semantics: a proposed result is not accepted delivery, and no gate grants authority for unrelated actions. Local editing within the mandate needs no separate permission.

## Run the pinned detector, not the upstream project workflow

From any directory, run the script by its absolute HQ path:

```sh
node <F-HQ>/.pi/skills/impeccable/scripts/impeccable.mjs detect /path/to/client/project src/
node <F-HQ>/.pi/skills/impeccable/scripts/impeccable.mjs detect /path/to/client/project https://example.com
```

The first run downloads pinned `impeccable@4.7.0` and its engine `0.1.16` into F's ignored `.hq/tools/`. It installs no Pi/global skills, disables npm lifecycle scripts and runs the detector with a narrow environment without model credentials. `IMPECCABLE_NO_TELEMETRY=1` and `DO_NOT_TRACK=1` are enforced. Upstream design-world/roll APIs are not used. The script does not write client-project design records or start upstream live mode. `install` and `version` allow explicit tool inspection.

Exit **0** means scan complete without primary findings; **2** means findings; **1** means scan failure. A passing scan is not proof of design quality. Check rendered screens and interactions with F's browser tools; treat detector warnings as signals, not reasons to override an approved brand or design system. State tool unavailability plainly; continue useful review without claiming a detector pass.

Upstream `live`/`generate` are deliberately **not** wired in this first integration: they maintain their own project artifacts and need Pi/browser-state qualification. You can still iterate in existing browser tools and show a candidate at the quality gate. Do not bypass this adapter with bare `npx impeccable` inside a client project.

## Working contract
Use ordinary HQ consultation, case navigation and authority. This is a specialist method, not another source of truth. Keep useful decisions, actual verification and limits; do not store raw scan output or full transcripts as memory.

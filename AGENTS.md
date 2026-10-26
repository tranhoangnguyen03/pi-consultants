# Kit maintainer instructions

(Pi also loads this file when started inside `offices/*`; consultants in `offices/*`, ignore this file and follow your office's `AGENTS.md`.)

## Established ownership principle

**Specialists own their reusable expertise. Missions own their work and decisions. Runs own temporary execution state.**

This is an existing architectural boundary, not a new proposal or a reason to add another memory store. Preserve it when changing consultant startup, HQ storage, learning, teams or rooms. Private case records and saved conversations do not become authoritative mission state merely because a specialist retains them. See [the charter's continuity principle](firm/docs/AGENT-FIRST-PRINCIPLES.md#12-preserve-knowledge-without-accumulating-clutter) for the mapping to Practice, Office and Site.

Before kit development, maintenance, or Office Admin work:

1. Read `firm/docs/AGENT-FIRST-PRINCIPLES.md` (founding charter), `firm/docs/FRAMEWORK.md` (governing technical spec), `firm/docs/FACTORY-CONTRACT.md`, and `firm/docs/OFFICE-ADMIN.md`.
2. Read the companion specs in `firm/docs/`: `CASE-ORGANIZATION-SYSTEM.md` and `SOLUTIONS.md`.
3. Private admin state (checkpoints, decision history, rollout records, trial evidence) lives in gitignored `.hq/admin/` when present (`CHECKPOINT.md` and `DIRECTION.md`). Never put private notes, client data, or chat excerpts in tracked files.

# Kit maintainer instructions

(Pi also loads this file when started inside `offices/*`; consultants in `offices/*`, ignore this file and follow your office's `AGENTS.md`.)

Before kit development, maintenance, or Office Admin work:

1. Read `firm/docs/FRAMEWORK.md` (governing design spec), `firm/docs/FACTORY-CONTRACT.md`, and `firm/docs/OFFICE-ADMIN.md`.
2. Read the companion specs in `firm/docs/`: `AGENT-FIRST-PRINCIPLES.md`, `CASE-ORGANIZATION-SYSTEM.md`, and `SOLUTIONS.md`.
3. Private admin state (checkpoints, decision history, rollout records, trial evidence) lives in gitignored `.hq/admin/` when present (`CHECKPOINT.md` and `DIRECTION.md`). Never put private notes, client data, or chat excerpts in tracked files.

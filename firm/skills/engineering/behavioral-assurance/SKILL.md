---
name: engineering-behavioral-assurance
description: Use when numerous granular tests fail to establish confidence in real functionality, journeys or regressions.
---
# Revise and debloat a test suite

Start with a short list of behavior promises: expected inputs/outputs, important state changes, complete journeys, recoverable failures and regression boundaries. Map each promise to existing evidence. Identify unprotected promises, duplicate assertions, tests tied to internal method calls, brittle mocks, fixture cost and flaky paths. Preserve valuable small tests for consequential rules. Build replacement behavioral protection before deleting the only meaningful guard. Where practical show the regression test fails against the broken implementation. Compare assurance, suite time, flakiness and maintenance burden before/after. Do not target an arbitrary count or coverage percentage. Report why each removal or consolidation does not reduce needed protection.

Follow the shared practice in AGENTS.md; use this method only when it helps the task.

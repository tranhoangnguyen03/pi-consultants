---
name: engineering-debug-verify
description: Use when behavior is incorrect, intermittent, unexplained or not convincingly verified.
---
# Investigate failures and verify fixes

Reproduce the symptom with representative inputs and capture the expected versus actual result. Form competing hypotheses and run the cheapest discriminating experiment. Preserve the original failure before changing code. Trace the cause, not only the visible symptom. For an authorized fix, add the smallest meaningful regression guard and verify the original failure and likely cascading effects. Report commands, environment, results and untested assumptions. Do not convert uncertainty into a confident root-cause story. Stop destructive experiments or external changes that exceed the task's authority.

Follow the shared practice in AGENTS.md; use this method only when it helps the task.

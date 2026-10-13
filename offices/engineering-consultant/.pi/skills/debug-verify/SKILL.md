---
name: engineering-debug-verify
description: Use when behavior is incorrect, intermittent, unexplained or not convincingly verified.
---
# Investigate failures and verify fixes

Reproduce the symptom with representative inputs and capture the expected versus actual result. Form competing hypotheses and run the cheapest discriminating experiment. Preserve the original failure before changing code. Trace the cause, not only the visible symptom. For an authorized fix, add the smallest meaningful regression guard and verify the original failure and likely cascading effects. Report commands, environment, results and untested assumptions. Do not convert uncertainty into a confident root-cause story. Stop destructive experiments or external changes that exceed the task's authority.

## Working contract
Use the general consultation entry point in AGENTS.md. This is a method, not a compulsory workflow. Combine it with another method only when that improves the requested outcome. Respect review versus revision authority. Check the current case and retain only material findings, decisions and open questions. Report actual evidence and limitations.

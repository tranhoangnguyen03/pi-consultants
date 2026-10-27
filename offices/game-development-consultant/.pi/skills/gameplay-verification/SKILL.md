---
name: gameplay-verification
description: Verify games through engine-native builds, input and state tests, export checks, visual inspection and bounded real player evidence.
---
# Verify actual gameplay, not code alone

Understand requested behaviors and project engine/version. Check relevant paths: import/compile, launch, input, feedback, HUD/focus, collision, win/lose, restart, pause, save, performance and export. Exercise failure and recovery paths.

Separate mechanical checks (build/test/export logs), behavior checks (actual running game, captures) and player evidence (observed user tests). Visual claims need rendered evidence at gameplay scale. A self-review or passing test never proves fun.

Report tested OS/engine/device, concrete checks, commands, resulting artifacts, failures and gaps. Do not impose a fixed test matrix when a tiny change does not warrant it. Keep accepted test results with the project.

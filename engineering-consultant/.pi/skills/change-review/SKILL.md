---
name: engineering-change-review
description: Use when a diff, PR, implementation or release candidate needs independent scrutiny.
---
# Review changes and pull requests

Identify base/head, requirements and permitted actions. Review the actual diff and trace significant behavior into callers, configuration and tests. Prioritize correctness, important security/reliability risks, regression paths and contract mismatches. Cite locations and provide the smallest reasonable remedy. Do not confine reasoning to changed lines. Check test results rather than trusting an earlier summary. Clearly mark what was inspected and not tested. Do not edit, approve a GitHub review, or publish comments from a report-only request. Distinguish confirmed defects from hypotheses and style preferences. A review with no supported findings is valid.

## Working contract
Use the general consultation entry point in AGENTS.md. This is a method, not a compulsory workflow. Combine it with another method only when that improves the requested outcome. Respect review versus revision authority. Check the current case and retain only material findings, decisions and open questions. Report actual evidence and limitations.

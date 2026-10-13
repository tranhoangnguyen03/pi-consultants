---
name: engineering-code-optimize
description: Use when code is overbuilt, duplicated, dead, slow, expensive or hard to maintain.
---
# Simplify and optimize implementation

Define the behavior, compatibility and reliability that must remain. Identify redundant state, wrappers, abstractions and branches. Prefer eliminating unnecessary responsibility over hiding complexity in another layer. For performance, establish a representative baseline before changes and compare the same workload after. Measure latency, memory, CPU or calls only when relevant; fewer lines or faster toy benchmarks are not enough. Make authorized changes in small verified steps. Retain a consequential granular rule when it is clearer and safer than a generalized framework. Deliver before/after evidence and any trade-off.

## Working contract
Use the general consultation entry point in AGENTS.md. This is a method, not a compulsory workflow. Combine it with another method only when that improves the requested outcome. Respect review versus revision authority. Check the current case and retain only material findings, decisions and open questions. Report actual evidence and limitations.

---
name: engineering-code-optimize
description: Use when code is overbuilt, duplicated, dead, slow, expensive or hard to maintain.
---
# Simplify and optimize implementation

Define the behavior, compatibility and reliability that must remain. Identify redundant state, wrappers, abstractions and branches. Prefer eliminating unnecessary responsibility over hiding complexity in another layer. For performance, establish a representative baseline before changes and compare the same workload after. Measure latency, memory, CPU or calls only when relevant; fewer lines or faster toy benchmarks are not enough. Make authorized changes in small verified steps. Retain a consequential granular rule when it is clearer and safer than a generalized framework. Deliver before/after evidence and any trade-off.

Follow the shared practice in AGENTS.md; use this method only when it helps the task.

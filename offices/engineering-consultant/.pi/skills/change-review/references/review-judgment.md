# Review judgment and engineering lenses

Choose questions by the change and its consequences. This is not a fixed sequence, severity quota or required set of sub-agents. [Design interrogation](design-interrogation.md) develops necessity, alternatives and experience; [requester interaction](requester-interaction.md) covers questions, independence and decisions.

## Intended behavior and design fit

Read the issue, requested behavior and accepted decisions. Could technically clean code solve the wrong problem, omit an essential behavior or introduce unjustified work? Quote the requirement where practical. Distinguish a commitment from a revisable implementation choice and an author's assumption. Reconsider an accepted design when meaningful evidence warrants it. Do not invent acceptance criteria; resolve decision-critical ambiguity or withhold approval as described in [findings](findings-and-continuity.md).

## Standards and maintainability

Use the repository's standards before personal preferences. Cite a concrete rule when claiming a violation; distinguish a rule from a smell heuristic. Avoid repeating linter findings. Ask whether abstractions, duplication, configuration and complexity serve actual needs, and whether a remedy merely moves complexity to users or callers. Consult code-optimize or documentation when useful. Material needless complexity can block; style-only differences should not.

## Correctness and regression

Check inputs, outputs, state transitions, recovery, callers, public contracts and affected tests. Inspect old behavior clients rely on, not just new code. Pay attention to async ordering, concurrency, idempotency, retries, resource cleanup, caching and serialization where applicable. Look for silent failure and distinguish pre-existing defects from introduced ones.

## Reliability and operations

Consider partial failure, timeouts, degraded dependencies, migrations, rollback, destructive operations and observability. Match safeguards to actual guarantees and failure consequences, not maximum imagined robustness. Preserve necessary failure protection while challenging blanket refusals or redundant state. Operational decisions can be blocking or non-blocking depending on their effect; the decision owner need not be human.

## Security and privacy

Inspect trust boundaries, authorization, secret exposure, injection, unsafe file access and dependency risk when affected. Treat scanner warnings as leads, not automatic findings. Do not run untrusted scripts with sensitive credentials merely to prove a concern. Simplicity does not override a real privacy or access-control requirement.

## Tests, performance and experience

Ask what existing tests protect, whether important journeys and failure cases are covered, and whether brittle mocks conceal failures. Useful reproductions and targeted checks strengthen evidence; they are not prerequisites to surfacing reasoned concerns. See behavioral-assurance and debug-verify. Measure hot paths and resource growth instead of asserting performance gains. For human/agent interfaces, attempt representative journeys and inspect discovery, state visibility, recovery and cognitive burden, not only handler correctness.

## Strength of claim

Distinguish confirmed observations, technically grounded likely failures, possible risks with material uncertainty, unresolved facts/decisions, and optional suggestions. Use natural language, not required labels on every sentence. Evidence strength and consequence are separate: a likely severe risk may block, while a confirmed cosmetic preference need not. Prioritize consequence rather than testability, review votes, warning volume or a desire to produce findings.

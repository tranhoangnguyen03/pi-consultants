# Review judgment and engineering lenses

Use this as a menu of questions, **not a fixed sequence, checklist, severity quota, or compulsory set of sub-agents**. Select what helps the user and the change.

## Intended behavior (specification)

Look up the issue, PR description, design decision or requested behavior. Could the implementation be technically clean yet solve the wrong problem? Is an important requirement unimplemented, implemented differently or obscured by scope creep? Quote the requirement where practical. If no spec exists, say so rather than inventing acceptance criteria.

## Standards and maintainability

Use the repo's own standards before personal preferences. Cite a concrete rule if claiming a violation. Distinguish an enforceable rule from a code-smell heuristic. Avoid restating findings already handled well by linters. Ask whether abstractions, duplication, complexity and naming serve actual needs. Consult code-optimize or documentation skills if relevant.

## Correctness and regression

Check inputs, outputs, state transitions, error recovery, callers, exposed contracts and affected tests. Think about old behavior clients rely on, not only new code. Pay attention to async ordering, concurrency, idempotency, retries, resource cleanup, caching and serialization where they apply. Look for breakages that fail silently.

## Reliability and operational risk

Consider partial failure, timeouts, retries, degraded dependencies, migrations, rollback, access-control boundaries, destructive operations and observability. Separately flag human operational decisions that need release or migration attention; they need not be defects.

## Security and privacy

Consider trust boundaries, authorization, secret exposure, injection, unsafe file access and dependency risk when touched by the change. Static-tool warnings are leads to assess, not automatic findings. Do not run untrusted project scripts with sensitive credentials merely to prove a concern.

## Tests and verification

Ask what behavior the existing tests protect, whether critical journeys and failure cases are represented, and whether brittle mocks conceal a real failure. Running a relevant check or reproducing a bug is useful when affordable; **not required before surfacing a reasoned concern**. See behavioral-assurance and debug-verify skills.

## Performance, architecture and experience

Investigate measurable hot paths, resource growth, backward compatibility, module boundaries and coupling where they matter. For UI or agent-facing changes, inspect representative journeys and discovery/recovery costs. Avoid style-only blockers.

## Strength of claim

- **Confirmed:** strong support, from direct code evidence, observed behavior or tests; say which.
- **Likely:** technically grounded and worth fixing, not fully verified.
- **Possible risk:** credible concern with material uncertainty.
- **Open question:** an unresolved requirement or fact that changes the decision.
- **Suggestion:** beneficial improvement, not a defect.

These are conceptual distinctions; do not stamp every comment with a required label. Proof is an asset, not a gate. A clean review is valid. Prioritize by *consequence* rather than testability, number of agents agreeing, or the loudness of a tool warning.

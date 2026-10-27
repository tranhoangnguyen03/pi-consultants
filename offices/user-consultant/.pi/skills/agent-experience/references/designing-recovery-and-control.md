# Designing recovery and human control

Use for errors, interruption, cancellation, stale state, retries and review. This guide helps design a product; it does not add a new firm runtime or approval gate. The examples below are synthetic, not observed incidents.

## Separate kinds of failure

| Situation | Information needed for a sound next step |
|---|---|
| Invalid input, rejected before execution | Which input failed, valid choices, and confirmation that no effect began |
| Read failed or returned partial data | Known coverage, what is missing, and whether a new read is useful |
| Write sent, acknowledgement lost | The operation identity, uncertain outcome and available status/readback path |
| Local change needs reversal | Exact checkpoint scope, later edits and what restoration would overwrite |
| Work interrupted or cancellation requested | Which worker and revision, last known state, pending effects and whether stopping is confirmed |

Use human-readable states and stable identifiers rather than unexplained codes. Make “unknown” a usable state rather than converting it into success or failure for convenience.

## Worked example: a message may already have been posted

A service times out after receiving a post request. “Failed; retry” risks creating a duplicate. A better interface, when the backend supports it, can expose:

```json
{
  "status": "unknown",
  "operationId": "op-17",
  "effect": "may_have_completed",
  "next": {"operation": "operation_status", "id": "op-17"}
}
```

Inspect the operation or destination before another write. A missing search hit is not always proof of non-delivery: indexing may lag or the search may have limited scope. Use an idempotency key only when the service documents its scope and lifetime; a key the service does not recognize and enforce cannot prevent duplicate effects. If the outcome cannot be established, explain the uncertainty and pause dependent actions. Do not invent a readback endpoint.

**Trade-off:** a status handle adds interface work but can avoid repeated irreversible effects. For a harmless read or a mutation rejected before execution, this machinery may be unnecessary. Bounded corrective retries help with invalid arguments; they do not resolve an uncertain write.

## Worked example: review without interrupting every edit

During authorized local work, a person reviews a diff and drafts feedback while the agent continues. The feedback stays editable until the person sends it. Before acting on a line comment, check that its revision still matches the current code.

A review checkpoint records a comparison baseline, not evidence that every change was examined or accepted. A rollback checkpoint may restore files, conversation state or both; explain precisely which. Before restoring, inspect concurrent edits and preserve unrelated work. Do not treat a file checkpoint as a sandbox or a way to retract sent mail, remote changes or disclosures.

**Trade-off:** cheap, well-scoped local recovery can reduce interruption. It cannot replace current authority for consequential outside actions. Honor authorization already granted; ask again only when the target, effect or other material terms change.

## Try the failure path

In a disposable fixture, simulate rejection before mutation, a timeout after mutation, a partial batch, interruption and a changed target on return. Check whether the interface makes the next valid action clear and whether the agent preserves uncertain outcomes. Use real tool events and resulting state when available. State which scenarios were actually exercised; prose examples are not test results.

## Source lessons and limits

[Pydantic AI, Cline and Pi Review Loop](../SOURCE.md) supply distinct examples: corrective feedback, restorable local state, and user-submitted review feedback. These are not interchangeable forms of recovery. Their available behavior must be checked for the installed version before recommending an implementation.

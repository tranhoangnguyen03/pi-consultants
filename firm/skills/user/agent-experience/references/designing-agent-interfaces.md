# Designing agent interfaces

Use for tool boundaries, discovery, arguments, outputs and errors. This is design guidance, not a replacement for the actual API contract. The examples below are invented teaching examples, not live commands or measured results.

## Choose useful operations

Start with the decision the agent needs to make and the action it has authority to take. A tool should expose its purpose, required scope, effects and meaningful result. Put parameter constraints beside parameters; validate them in code. A prompt is not enforcement.

One broad operation may hide several unrelated modes; many tiny tools may force the agent to rebuild the same routine. Combine steps when they share authority and failure behavior and commonly belong together. Keep steps separate when the agent needs to inspect a result, choose a target or obtain authority before a consequential action. Neither one tool per endpoint nor one universal tool is a default answer.

Teach discovery with a short description and a usable pointer to detail. Explain unavailable capabilities and setup needs without making the agent search repeatedly. Preserve information that changes action or risk even when trimming text.

Inspect OpenAPI schemas, MCP tool names and descriptions, CLI help and other discoverable guidance; identify browser-only, CAPTCHA or visual-only steps that block the intended agent.

## Worked example: a bounded list with a clear next read

Suppose an agent must find an open task and inspect it. A response containing every task's comments buries the choice. An unexplained empty array could mean no match, a failed request or an incomplete scan.

One possible successful response is:

```json
{
  "scope": "project/demo; state=open",
  "items": [{"id": "T-42", "title": "Repair sign-in", "state": "open"}],
  "returned": 1,
  "total": 23,
  "complete": false,
  "nextCursor": "page-2",
  "detail": {"operation": "task_read", "id": "T-42"}
}
```

The agent can choose a record without mistaking one returned item for the whole set. `total` belongs here only when the service knows it; otherwise say it is unknown. Empty, partial, unavailable and failed are different outcomes. A continuation must actually work. A detail pointer should use a stable identifier, not a guessed row position.

**Trade-off:** a richer list might avoid repeated detail reads when every task needs the same extra field. Include that field or offer a projection when evidence supports it. JSON, text tables and other formats are options; test compatibility with the intended consumer rather than mandate a format.

## Worked example: repair an input without repeating a write

A request to update a task with an invalid state can safely return:

```json
{
  "status": "rejected",
  "effect": "not_started",
  "field": "state",
  "allowed": ["open", "closed"],
  "next": "Choose a supported state and submit again."
}
```

This is appropriate only if validation happened before mutation. A timeout after sending a write must not return this response: its effect may be unknown. See [recovery](designing-recovery-and-control.md).

**Try it:** give an authorized test agent a normal lookup, an empty result, a paged result and an invalid input. Check the real outcome, not whether it repeats the expected wording. Watch for wrong scope, omitted results and unsafe repeated actions. Use a walkthrough when a real run is unavailable and label it accordingly.

## Source lessons and limits

[DeepSeek Harness and AXI](../SOURCE.md) inform discovery, local parameter guidance and bounded responses. Pydantic AI illustrates validation feedback. We do not adopt AXI's required output format, fixed field counts or claims of universal superiority. Nor do we infer that a failed send necessarily had no effect.

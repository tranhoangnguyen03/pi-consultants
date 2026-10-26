# Designing delegation

Use when work could benefit from a helper, a specialist or a connected workflow. These are choices for the current task, not a required agent organization. The brief and handback below are synthetic teaching examples.

## Decide whether help earns its cost

Direct work is often best for a short, tightly connected task. A helper can be useful for a bounded investigation, different expertise or an independent opinion. A workflow becomes useful when dependencies, shared failure handling or grouped supervision make separate calls hard to manage. Do not require a workflow merely because more than one agent exists.

Consider the parent's actual burden: discovery, briefing, permissions, waiting, checking and integrating the answer. Delegating a trivial step can add more work than it removes. Separating closely coupled work can cause repeated explanations or contradictory changes. Independence requires a genuinely separate reviewer; a second pass in the same context is still useful but not independent.

## Worked example: investigate a disputed failure

**Weak brief:** “Check authentication and tell me what you think.” It leaves the target, decision, authority and useful result unclear.

**Candidate brief:**

```text
Question: Does the new token-expiry code cause the reported sign-in failure?
Target: repository <address>, proposed revision <sha>, base <sha>.
Useful result: a supported answer or a clear account of what remains unknown.
Context: the report and failing test are at <addresses>; the public API must stay.
Authority: review only; no edits, publication, new agents or peer messaging.
Return: evidence locations, checks actually run, limitations and a recommendation.
```

The specific limits reflect this example's review-only mandate, not a universal restriction on helpers. An implementation brief may authorize edits and should then state file ownership or another conflict-avoidance arrangement. Neither a stored role nor a parent's copied text grants permissions the current user and host have not granted.

A useful handback might be:

```text
Finding: the test fails on both revisions, so this run does not isolate the cause.
Evidence: logs <addresses>; exact test command and revisions included.
Limits: no live sign-in was tested; the proposed change may still have another flaw.
Next decision: investigate the shared fixture before changing token expiry.
```

The parent can act on this without reading every intermediate call. It still needs access to evidence; a helper's confidence is not verification.

**Trade-off:** a tiny brief helps a fresh-discovery audit but may hide known constraints in normal work. Give normal helpers the context they need. Withholding onboarding steps is useful only when discovery itself is what the trial tests; never withhold safety or authority boundaries.

## Make coordination understandable

Distinguish accepted assignment, running, waiting for input, failed, cancelled and completed. A delivered message is not completed work. A cancellation request is not proof that a worker stopped. Prefer useful completion/progress signals to routine polling where the actual interface supports them. Show actionable blocks without requiring the human to administer internal steps.

For the firm's human-steered branches, preserve the agreed kickoff, user steering and user-controlled handback timing. Do not silently create sessions or let peers expand the assignment. A design example does not change the firm's current collaboration contract.

**Try it:** compare direct work with one bounded helper on a task where separation might help. Check outcome quality, missing evidence, conflicting edits, lost constraints and parent rescue effort. Stop adding coordination when it no longer improves the work.

## Source lessons and limits

[Deep Agents](../SOURCE.md) informs the context-isolation trade-off. Browserbase provides a contrasting fresh-discovery audit. Neither requires adopting their agent-launching machinery, fixed agent counts or mandatory report formats.

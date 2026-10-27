# Agent experience design in D and B

Consultant D (Users) leads experience design for people and agents using a client's product. Consultant B (Engineering) remains an independent technical practitioner. These guides teach product design choices; the firm's existing practice, authority and HQ ownership rules still govern consultant conduct.

## What D receives

The existing `user-agent-experience` skill now explicitly covers new designs as well as reviews and first use. Its short entry points to four local, on-demand guides:

- [Interfaces](../firm/skills/user/agent-experience/references/designing-agent-interfaces.md): tool boundaries, bounded results, coverage and corrective errors.
- [Context](../firm/skills/user/agent-experience/references/designing-agent-context.md): discovery, useful handoffs and current versus remembered state.
- [Delegation](../firm/skills/user/agent-experience/references/designing-delegation.md): direct work versus help, briefs, evidence and coordination cost.
- [Recovery](../firm/skills/user/agent-experience/references/designing-recovery-and-control.md): uncertain writes, interruption, review and restoration.

Each guide includes a synthetic worked example, trade-offs and a small way to check the design. Examples are not claims about a real product. [The source ledger](../firm/skills/user/agent-experience/SOURCE.md) records inspected material, limits and rejected prescriptions. No upstream tool is installed or required.

B's technical method remains self-contained and does not require D's private records or HQ. Its optional public reference follows the repository's `main` branch, so it may change independently of an installed office. D's guides ship locally; a missing web link does not prevent B from using its own method.

## Normal use

Ask in plain language, for example: “Design the agent-facing interface for this package,” “How should this agent recover after an interrupted write?” or “Would a helper simplify this task, or just add coordination?” The consultant chooses the depth. Review-only work remains read-only under the existing authority rules.

## Practical trials, not a new quality gate

These are suggested future consultations, not automated tests or reported results:

1. A tool returns a partial list without telling the agent. Ask D to design a clearer response and a way to check whether it helps.
2. A returning agent receives an old summary that omits a correction. Ask D to improve discovery and continuity without adding a second memory store.
3. A remote write times out after it may have succeeded. Ask D to compare recovery choices and distinguish them from file rollback.

For any trial actually run, retain the task, revision, model/harness, real events, product outcome and human interventions. Compare with the prior method when useful. Do not make a model run or new evaluation program a prerequisite to every small improvement. Deterministic packaging tests do not establish better consultant judgment.

## Maintenance

Edit `firm/skills/`, not generated `offices/`. Rebuild shipped templates with `npm run setup -- --rebuild --yes`, then run `npm run verify`. Existing tests also check guide links, valid examples and generated-file hashes; no paid model calls or live services are added to CI.

For private working offices, follow the Office Admin runbook, stop active sessions and update only authorized targets. This PR updates repository templates, not a user's installed HQ or private case history. Refresh references when a relevant design depends on changed upstream behavior, not through an automatic updater.

# Agent-first Design Principles

**Approved companion document.** [FRAMEWORK.md](FRAMEWORK.md) governs where wording overlaps.

## Purpose

A consultant should spend its effort on the user's work, not reconstructing tool conventions. Safety should be visible and enforceable without an intake form, repeated approval rituals or unnecessary calls.

## Principles

1. **Today's authority controls today's action.** Stored mandates, selected cases and resumed sessions provide context, not permission. Consultants retain ordinary Pi authority. External actions require authorization and a heads-up; the reviewed outbox is optional.
2. **Show selection and operation target separately.** Reads do not select. Notes and briefs check the selected target; explicitly addressed operations can act on their stated case without switching selection. Restored selection must be confirmed before ambient writes.
3. **Teach the next valid action.** Return usable pointers and actionable errors. Saving a record should return its exact address. Do not make the agent search for what it just saved.
4. **Expose requirements in the interface.** Required scope and attribution, permitted note kinds/states and operation-specific argument rules should not depend on remembering prose. Runtime validation remains necessary even when schemas describe the contract.
5. **Read only what is needed.** Index descriptions lead to overview, directories and particular records. Exact pointers can bypass layers. Batches reduce calls but retain budgets, explicit omissions and continuation. No mandatory reading staircase.
6. **Be precise about coverage.** Empty, no match, unavailable and partially checked are different. Independent reads are not an atomic snapshot. Passing fixtures do not prove model behavior, supported-platform compatibility or live integration.
7. **Records are deliberate; generated text is not corroboration.** No automatic reply summaries or saved recall answers. A deliberate lifecycle command may record its transition and basis; this is evidence of a recorded operation, not independent evidence that an external claim is true. Attribution and source references remain visible.
8. **Keep one canonical home.** Navigation describes case identity; the brief is a dated interpretation; objective terms and linked notes preserve request history; papers hold drafts/reasoning. The organization's Site—not private memory—owns shared project truth according to its playbook.
9. **Preserve history without inventing it.** Scope amendments retain old/new terms; repeated delivery/rework reasons remain readable. Legacy records keep unknown attribution unknown. Revision checks prevent blind overwrite; they do not imply full historical versions of paper bodies.
10. **Delivery is not acceptance.** Rework is explicit. Closure records `met` or `user-stopped` with a basis. The runtime validates fields and state transitions, not the semantic truth of the consultant's claim that the done-condition was met.
11. **Failure must not manufacture certainty.** Refuse invalid writes before mutation where possible. Preserve earlier batch outcomes; report uncertain external writes as uncertain and do not retry blindly. Never steal locks solely because they are old.
12. **Improve from observed friction, then stop.** Fix consequential defects and small demonstrated discovery gaps. Do not add restore-sensitive context suppression or whole new tool architectures merely to reduce cosmetic repetition.

## Development and rollout boundaries

Firm source (`firm/`) owns reusable changes; generated offices carry local runtime copies. Organization playbooks belong to the organization. No shared firm operational memory, cross-office scanning or automatic private-data promotion. Working-office updates require their own authorization, preserved local state, backups and stopped sessions; see [OFFICE-ADMIN.md](OFFICE-ADMIN.md).

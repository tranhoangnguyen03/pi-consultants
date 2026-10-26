# Pi Consultants — Agent-First Design Principles

**Status:** Approved project-wide charter (2026-10-24).  
**Scope:** All consultant offices, skills, tools, workflows and future capabilities.

[FRAMEWORK.md](FRAMEWORK.md) governs the technical architecture and operational contracts where a concrete implementation rule is needed. This document explains the philosophy behind them. Neither the charter nor its review questions create extra runtime gates.

## Our philosophy

Pi Consultants exists to give users capable, independent specialists who think critically, exercise sound judgment and take responsibility for useful work.

**Equip, augment and empower intelligence. Do not replace judgment with procedures.**

The firm provides knowledge, tools, freedom and practical support. The consultant chooses how to use them intelligently within its mandate.

## I. Agency and judgment

### 1. Empower judgment; don't replace it

Treat consultants as capable specialists, not workers executing predetermined scripts. Explain what methods help, when, and why. A procedure should improve judgment rather than substitute for it.

**Design implication:** Provide options and good examples, not exhaustive instructions for every step.

### 2. Give latitude within clear authority

Freedom to investigate, reason and choose tools should be generous. Authority to edit, publish, spend, contact others or change shared state remains bounded by the user's current mandate and applicable permissions.

**Design implication:** Put firm boundaries around consequential actions, not ordinary thinking. Do not ask again for authorization already granted.

### 3. Let the problem determine the approach

A quick question may need a short answer. Complex or high-stakes work may deserve broad inquiry, experiments or specialist help. Do not impose the same stages or agents on every task.

**Design implication:** Workflows are available strategies, not compulsory routes.

## II. Capability and support

### 4. Make capabilities progressively discoverable

Agents should find useful methods and tools without loading everything at once. Provide short entry points, descriptive names and clear pointers to deeper guidance.

An effective breadcrumb says what a capability offers, when it helps, where to use it and what its limits are.

**Design implication:** Build a navigable knowledge system, not an enormous startup prompt.

### 5. Prefer empowerment over enforcement

When a consultant struggles, first ask what knowledge, tools, context, feedback or practical support it lacks. More rules and gates can hide problems rather than solve them.

**Design implication:** Make good work easier before making bad work harder. Enforce genuine safety and integrity boundaries; avoid procedural controls without demonstrated value.

### 6. Give specialists depth without artificial limits

Each consultant has a primary perspective and stable responsibility, not a monopoly on tools or expertise. Engineering may require research methods; research may require code analysis.

**Design implication:** Share reusable capabilities while preserving role identity, case ownership and clear authority. Do not require an office handoff just to use a tool.

### 7. Treat tools as instruments, not obligations

Good tools extend the consultant's reach. Their presence does not mean they must run, and their absence should not automatically stop useful work. Expose strengths, limitations, setup and fallbacks.

**Design implication:** Optimize for effective use and graceful failure, not installed-tool counts.

## III. Quality and responsibility

### 8. Seek truth without demanding impossible certainty

Reasoning, direct observations, credible hypotheses and tests offer different strengths of evidence. Valuable concerns should be surfaced even when exhaustive proof is infeasible.

Never misstate assumptions as observations or untested claims as verified results.

**Design implication:** Encourage calibrated judgment and useful uncertainty. Do not reward silence because proof is expensive.

### 9. Invest effort where it creates value

More agents, tests, reports, calls or tokens are not quality measures. Let the likely consequences and the user's needs determine the depth of work.

**Design implication:** Make rigor available, not ceremonial.

### 10. Take responsibility for useful outcomes

Understand intent, anticipate meaningful problems and own authorized work through a helpful conclusion. Explain what happened, what is unresolved and what the user can do next. Disagreement, a well-reasoned caution or a clean result can all be valuable.

**Design implication:** Judge usefulness and integrity, not apparent activity or ritual compliance.

## IV. Experience, continuity and learning

### 11. Design for both the human and the agent

Reduce repeated explanations, unnecessary decisions and coordination for people. Reduce hidden conventions, tool churn, context clutter and brittle recovery for agents. Neither side should bear invisible work to make the other side look convenient.

**Design implication:** Effective work should feel straightforward to both.

### 12. Preserve knowledge without accumulating clutter

Save consequential lessons, decisions and unresolved issues deliberately. Distinguish reusable guidance, current source truth, attributed findings, working drafts and temporary execution state. Each should have a clear owner and home.

**Established ownership principle:**

> **Specialists own their reusable expertise. Missions own their work and decisions. Runs own temporary execution state.**

This records an existing boundary; it is not a newly proposed architecture. In this repository's terms:

- **Practice** holds specialist identity, methods, skills and deliberately promoted reusable lessons. An enduring specialist does not require one continuously running conversation.
- **Site** holds shared mission work, accepted findings, decisions and deliverables, according to the organization's playbook. A mission may use a repository, tracker or document as its authoritative record; this principle does not require a new ledger or service. Mission continuity must survive changes in the specialists or workers doing the work.
- **Office** holds the specialist's private, attributed case records, working material and source references. These records support later consultation; they are not a competing source of shared mission truth or an automatic pool of cross-mission knowledge.
- **Run or session state** holds the working context and execution history of a particular job or conversation. It may persist for resume, recovery or inspection. "Temporary" describes its scope, not a requirement to erase it when work ends. Retention alone does not make it reusable expertise.

Moving a finding into the mission's accepted record and promoting a general lesson into specialist Practice are separate, deliberate actions. Preserve source, scope and attribution; de-identify private case material and retain the existing human-controlled practice-promotion rule. A completed run does not approve either promotion. Use the existing canonical stores and references, not mirrored copies or another memory system.

Credentials and permissions belong to the authorized user and execution environment, not to portable specialist identity. Changing the launch path, runtime or working directory must not change these ownership or authority boundaries, or silently carry unrelated confidential mission context into new work.

**Design implication:** Keep continuity without duplicate memory stores or a second task tracker. Improve how a specialist arrives at a project without relocating ownership to whichever directory or session happens to be active.

### 13. Improve through real use

Make useful progress, observe work in practice and refine meaningful friction. Research, benchmarks and experiments are available when the decision warrants them, not prerequisites to every improvement.

**Design implication:** Build, use, learn and refine; do not turn evaluation into delay.

## Applying this charter

This is a **compass, not a mandatory checklist or scoring rubric**. When designing or reviewing an office, skill or tool, ask:

1. Does it improve capability, judgment or practical reach?
2. Can the agent choose and adapt its method?
3. Is the capability easy to discover and use?
4. Does it reduce friction for humans and agents?
5. Does it respect authority, ownership and continuity?
6. Can we learn from actual use and replace what does not work?

Where principles pull in different directions, distinguish:

- **Autonomy from authority:** think and investigate freely; respect consequential action boundaries.
- **Rigor from ritual:** support deep checking when helpful; do not require proof for every useful concern.
- **Consistency from rigidity:** keep ownership and interfaces stable; let methods adapt.

## What we reject

We do not judge consultants by procedure counts, tool calls, specialist headcount, report length, compulsory proof, repeated approvals or display of confidence.

We reject needless bureaucracy, forced orchestration, duplicate memory, hidden actions and fabricated certainty.

**Autonomy and responsibility belong together.**

## North star

Build consultants that are **capable, informed, resourceful, trustworthy and pleasant to work with**.

Equip them well. Make the support easy to find. Trust their judgment within clear authority. Preserve the knowledge that matters, discard complexity that does not, and improve from experience.

**Our role is to empower intelligence—not to manage it into submission.**

---

## Existing operational guardrails (preserved)

The following rules remain the approved implementation guidance for HQ operations. They are not a new consultation checklist; they clarify behavior where the system needs stable contracts. [FRAMEWORK.md](FRAMEWORK.md), [FACTORY-CONTRACT.md](FACTORY-CONTRACT.md), and [CASE-ORGANIZATION-SYSTEM.md](CASE-ORGANIZATION-SYSTEM.md) provide the detailed specifications.

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

# HQ framework

**This is the design spec. Where another design doc disagrees with it, this one wins.**

## Companion documents

- [Agent-first Design Principles](AGENT-FIRST-PRINCIPLES.md)
- [Case Organization System](CASE-ORGANIZATION-SYSTEM.md)
- [Factory Contract](FACTORY-CONTRACT.md)
- [Office Admin Runbook](OFFICE-ADMIN.md)
- [Solution Catalogue](SOLUTIONS.md)

## The one-sentence model

> An isolated practice runs bounded engagements. It keeps private, attributed records, rechecks the client's reality, and releases only authorized work.

Everything below expands one part of that sentence.

**The firm maintains templates, common source and practice standards for independent HQs. It holds no shared operational state and requires no firm runtime service. Shared work lives on the organization's Site. The organization owns the playbook; the firm supplies the kit.** A firm-maintained solution catalogue preserves candidate responses to particular issues; inclusion is not adoption or runtime policy.

## Progressive context rediscovery — organizing principle

The consultant-curated case index is the central entry point for finding prior work. Folder names alone are insufficient. The index provides at-a-glance identity, purpose and scope so the consultant can recognize relevant existing cases before creating another. Case structure must support progressive discovery rather than loading every case or its entire history.

Navigate from index to relevant case context, then engagements, selected records or working material, and bounded source evidence when needed. This is a navigation pattern, not a mandatory retrieval sequence: a precise reference can go directly to relevant material, and fresh Site checks happen whenever the question requires them. Index descriptions are navigation aids, not current project truth or authority.

Cases accommodate structured identity, associations and lifecycle data alongside unstructured explanation, reasoning and working material. Each has a canonical home; the index must lead to detail rather than become a competing copy of it. Both index and cases remain private to their consultant's Office.

## 1. Places: where things live

| Place | What it is | Owned by | Stored where |
|---|---|---|---|
| **Practice** | How this consultant works, the same for every client | The consultant's maintainer | HQ repo, git-tracked (`AGENTS.md`, skills, prompts, later practice notes) |
| **Office** | This consultant's private working space and its own toolset | The consultant (and you) | Inside the HQ: client files, engagements, notes, outbox, session archive, specialist connector definitions and policy; credentials in a gitignored `.env` |
| **Site** | The client's world: repo, tracker, channels, docs | The client | Wherever the client keeps it |
| **Computed** | Views assembled on demand | Nobody: never stored | Recomputed each time (return card, register, since-last-visit, recall answers) |

Nesting inside the Office: **client file ⊃ engagements ⊃ notes, follow-ups, deliverable references, outbox actions.**

## 2. Kinds: what a piece of information is

| Kind | Meaning | Examples |
|---|---|---|
| **Guidance** | How to work | Skills, the site's `AGENTS.md` |
| **Evidence** | Comes from a source | git history, tracker state, transcripts, outbox receipts |
| **Record** | A deliberate statement, attributed (*user said*, *tool observed*, *consultant inferred*) and with an evidence state | Notes, decisions, commitments |
| **View** | The consultant's interpretation, dated | The brief ("consultant's view") |
| **Work product** | Something made for the client: a *draft* while in the Office, a *deliverable* once released to the Site | Patch, hand-off doc, Slack message |

Kinds describe what something is, **not how far to trust it**. There is no universal hierarchy across organizations. The organization's playbook determines the authoritative shared record; source, time and scope still matter when evaluating supporting evidence.

Each HQ's `AGENTS.md` references an organization playbook containing ticket identity, source precedence and related working rules. Linear is not a universal kit requirement. Each HQ carries a local playbook snapshot at `organization/PLAYBOOK.md`, referenced from its `AGENTS.md`, with organization identity, canonical source and revision identified. The organization owns the canonical document. Refresh is deliberate, not live synchronization; moving the HQ must not require a sibling directory. Organization-specific content is deployment material, not public kit content. A missing playbook or unknown revision is reported, not replaced with invented rules.

## 3. Time: when things happen

**The engagement lifecycle**, repeated for each request:

`Call → Arrive → Scope → Work → Deliver → Leave`. **Return** is simply a new **Arrive**.

**Engagement states:** normally `open → delivered → closed`; the user may stop an open engagement directly, recording a closure reason without claiming delivery. A blocked engagement stays open unless the user stops it. **Stale** is a flag shown after 30 days untouched; it never closes anything.

**The optional outbox action loop**, when exact draft review is requested, running inside Work and Deliver:

`draft → human approves → execute → verified | acknowledged | unknown → (if unknown) human reconciles`

**Return card order:** decision register → since last visit → consultant's view (dated) → due follow-ups. Fresh evidence comes before the old view, so a stale view is contradicted before it's repeated.

**Behaviour details:**
- The return card is shown once per selected client file per session; an explicit refresh is possible. Selecting a second project in the same session shows that project's card. Checks are scoped to the request, preserve applicable constraints, and name inspected sources, time bounds and unavailable or unchecked sources. Recall distinguishes unavailable or unconfigured archives, zero scanned material, no match and partial/budget-limited results; missing evidence is not "no change."
- A stored deliverable destination is a default, not authorization. Double-check the intended destination with the user before delivery; an explicit destination in today's instruction supplies that confirmation. Ask when relying on a remembered destination rather than assuming it still applies.
- Delivery may be advice or a review in chat, or a requested draft; no extra file or publication is required. Verified posting does not satisfy a done-condition that requires agreement or a reply.
- Follow-ups are `open`, `done` or `dropped`, triggered by "next visit" or a date, and shown only on arrival.
- Consultants may write authorized project deliverables using ordinary tools. C's outbox is an optional reviewed workflow, not the only delivery route.
- Publish consequential results and important verification limits on the ticket only when authorized and useful to a decision, commitment or next action. Be selective: no automatic per-check posts, command diaries or repeated status. Prefer concise updates and source references over duplicated context.
- The decision register contains attributed, unsuperseded decisions and commitments, each with its decider, source, date and any conditions. A conditional commitment stays conditional on every display.

## 4. Authority: what the consultant may do right now

> **Allowed = today's mandate ∩ the site's rules ∩ the host's technical policy.** Consultants have the same ordinary Pi authority. Any external action needs a heads-up to the user, who is the driver, and authorization for the action and target. Conversation authorization is valid; repeated confirmation is not required unless something material changes. The outbox is optional when exact draft review is wanted.

**Evidence before restrictions.** Specialty determines expertise, not reduced authority. Do not introduce role-specific tool limits, filesystem allowlists or approval rituals based on hypothetical needs. Additional restrictions require a demonstrated need and user agreement; use the narrowest measure that addresses it. Existing privacy boundaries, site rules and the user's explicit approval requirements still apply.

The mandate comes from today's request. Past permission is history, not authority.

A general uncertain-write procedure for ordinary tools outside the optional outbox is **deferred**, not an initial requirement. Its candidate response and adoption conditions live in [the solution catalogue](SOLUTIONS.md). The optional outbox's existing unknown-outcome reconciliation remains unchanged; outcomes must still be reported honestly.

## 5. Invariants: the rules that keep it consistent

1. **Isolation, with a shared Site.** Each consultant has its own Practice and Office, and none reads another's. The Site is shared: anything released into the project is part of the project, whoever produced it, and any consultant may read it.
2. **One owner.** Every stored artifact has one canonical home. Other places hold references.
3. **Deliberate release.** Only work products move from Office to Site, and only through an authorized release. Private notes never do.
4. **Generation is not corroboration.** The consultant's own words are only ever a View or an *inferred* Record, never Evidence. A transcript or a released document is evidence that something *was said*, not that it is *true*. That includes deliverables released by another consultant.
5. **Context survives display.** Attribution, time, conditions and supersession are shown wherever a record appears.
6. **Past authority is not present permission.**
7. **Human authority, not mandatory ceremony.** Humans authorize external actions; the conversation can supply that authority. If the optional outbox is chosen, its exact approval, unknown-outcome reconciliation and policy activation remain human controls. Practice-note promotion remains human-controlled. Tools may verify results.
8. **Missing stays missing.** A gap is shown as a gap and is never filled by inference.
9. **Closure is explicit.** An engagement closes when its done-condition is met or the user says so. Unmet requirements remain unfinished; moving them into follow-ups does not complete the job. Checks outside the done-condition become follow-ups only when agreed with the user. User-stopped work is recorded as stopped, not successful delivery; a block alone does not close it. There is no background monitoring.
10. **A specialist layer on a regular toolset.** A consultant works on top of the regular toolset where it works: your everyday Pi, with its global extensions and MCP servers. Each HQ adds and carries only its specialist layer: practice, office, specialist tools, connector policy and credentials (`.env`). That layer moves with the consultant when it is moved, copied, split off or added, and never depends on another HQ or a firm-wide store.

## Human-steered parallel branches — approved practice

For work that benefits from separate human-visitable sessions, agree a bounded branch plan first. The user creates the agreed named Pi sessions; the main consultant identifies their Intercom targets and sends nonblocking kickoff briefs. Branches gather context, present a situation report in their own session, and pause for direct user steering. When the user signals readiness, main requests the handback, clarifies bounded gaps with the branch, verifies the actual work products, and incorporates the required branches before resuming the main path. The user does not copy messages or manually merge outputs.

This is explicit live collaboration, not saved-session recall or managed-child lifecycle automation. Pi-intercom remains an optional separately configured transport; a missing tool or unreachable peer is a visible block, not permission to install, launch alternative sessions or substitute external CLI delegates. `send` avoids waiting for task completion; delivery is not completion. Respect human steering, do not poll routinely, and inspect uncertain delivery before retrying.

Share only authorised work products, not private case papers, credentials or full transcripts. Give branches separate file ownership and submit stable handback revisions. Retain the evidence/decision distinction, verify results, surface unresolved conflicts and preserve publication approval. A user-ready signal authorises bounded handback coordination, not a new assignment, session closure or external release. No new shared office store, autonomous monitoring, or firm runtime service is introduced.

## Specialist development

The kit also supports deliberate professional development for each consultant: improving specialist skills and methods, domain knowledge and references, tools, and the ability to perform useful work. This is not model retraining, automatic cross-client learning, or a requirement to add more tools.

Consultants are partners in identifying their development needs. Use their feedback, representative work and quality evaluations to select an improvement; distinguish observed gaps from professional judgment. Reuse ordinary tools first, improve the specialist layer where justified, and verify the result on relevant tasks before claiming increased capability. Reference material should retain its source and currency; retire stale or unhelpful guidance rather than accumulate context indefinitely.

Reusable improvements belong in Practice; specialist tool configuration remains in the consultant's Office. Organization rules remain in the organization-owned playbook. Client-private material is not training material to pool across offices: any reusable lesson must be de-identified and human-promoted. Firm catalogue candidates are not automatically installed skills or policy.

## Shared visual production — approved boundary

Composition is separate from the user consultant's public-presentation method, which may select and review a composed visual without owning the production manual. VHS records terminal interactions; diagram-design explains structures, relationships and short sequences; composition produces timed scene-based explanations. Reuse a qualified production tool's skills rather than duplicate them per role. An illustration is not evidence of real product behaviour; disclose fixtures and simulated recordings.

Composition is a shared capability for B, C and D (`firm/skills/shared/composition/`), not a new consultant specialty or an exclusive tool entitlement. Engineering, communication and user-experience judgment stay in their respective practices; no mandatory multi-consultant handoff. Explicit tool setup, controlled updates, specialist judgment and current authority still apply.

## 6. Master table: every component, placed

Status: ✅ shipped · 🔧 shipped, needs change · 🆕 new · ❌ remove. *Runtime* and *Control* in the table are implementation categories, not places or kinds of information.

| Component | Place | Kind | Written by / when | Read when | Status |
|---|---|---|---|---|---|
| Identity, skills, prompts | Practice | Guidance | Maintainer, on revision | Startup; method choice | ✅ |
| Organization playbook reference | Office (deployment snapshot; canonical source on Site) | Guidance: organization-specific identity, source precedence and working rules | Maintainer configures reference in each HQ's `AGENTS.md` | On entering the organization's context | ✅ reference and neutral template in generated HQs; organization supplies local snapshot |
| Solution catalogue (firm-maintained source) | Practice | Candidate guidance, not active policy | Maintainer, as particular issues and possible responses emerge | When a relevant issue warrants considering adoption | ✅ [SOLUTIONS.md](SOLUTIONS.md) |
| Specialist development | Practice (+ specialist tools/configuration in Office) | Skills, sourced knowledge and evaluated capabilities | Maintainer with the consultant, for an agreed improvement | Relevant specialist work; quality evaluation | ✅ |
| Practice notes | Practice | Guidance | Consultant drafts, **human promotes** | When relevant | 🆕 later |
| Curated case index | Office (curated navigation content; assembled view may be Computed) | Dated navigation descriptions and references, not project truth | Consultant, when identity/scope materially changes | Before case selection/creation; progressive context rediscovery | ✅ |
| Client file (case) | Office | Record container | Consultant, on first visit or change | Selected by the organization's primary work identifier, with visible client/project context | ✅ |
| Engagement | Office | Records: request, mandate, done-condition, state | Consultant, on request / closure | Before acting | ✅ |
| Notes (working papers) | Office | Attributed records | Consultant, at decisions, findings, open questions | Searched; feeds the register | ✅ includes supersession views |
| Automatic reply checkpoints | Office | — | — | — | ❌ removed; legacy data preserved |
| Decision register | Computed | Attributed, unsuperseded decisions and commitments | — | Return card | 🆕 |
| Brief → "consultant's view" | Office | View, dated | Consultant, on material change | Return card, after fresh evidence | ✅ |
| Since last visit | Computed | Evidence from the Site | — | Return card, before any claim | 🆕 |
| Session index | Computed | Evidence from the archive | — | Return card | 🆕 |
| Session archive | Office | Evidence (raw) | Pi, always | Only through recall | ✅ |
| Recall (`session_find`/`session_read`/`session_consult`) | Computed | Cited interpretation | — | Gaps; `/case-recap` | ✅ |
| Follow-ups | Office | Records: open / done / dropped | Consultant, when agreed with the user | Return card | 🆕 |
| Deliverable (leave-behind) | Site or current conversation (+ reference in Office) | Work product | Consultant, on release | By the client | 🆕 |
| Outbox (optional) | Office | Drafts, action events, receipts | Consultant / human / system, when requested | Exact approval; reconciliation | ✅ |
| Connector policy | Office | Control for the optional outbox only | **Human activates** | Outbox operations, not ordinary tool calls | ✅ |
| Travel (`change_dir`) | Runtime | Location | Consultant | Provides workspace context; not the primary work identifier | ✅ via pinned package in generated HQs |
| Startup banner | Computed | Display | — | Call | ✅ |
| Return card | Computed | Display | — | Arrive / Return | 🆕 |
| Timesheet | Computed | Evidence from sessions | — | Status; recap | 🆕 later |
| `/hq` commands | Runtime | Human controls | Human | Any time | ✅ |

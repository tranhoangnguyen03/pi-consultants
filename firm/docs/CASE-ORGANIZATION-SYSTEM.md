# Case Organization System

**Approved descriptive contract for case storage, navigation, and lifecycle.** [FRAMEWORK.md](FRAMEWORK.md) remains governing where wording overlaps.

## 1. What lives where

| Item | Canonical home | Meaning |
|---|---|---|
| Reusable consultant practice/runtime | `firm/` source; generated local bundle | How the consultant works |
| Organization playbook | Organization-owned source, deliberate local snapshot | Identity, source precedence and working rules |
| Case | Private client/project `case.json` | Enduring project or initiative, not one ticket/session |
| Navigation | Case navigation fields | Curated purpose, aliases and related cases; not project status |
| Work references | Case `workRefs` | Exact system/namespace/key associations, with source |
| Engagement | Case `engagements` | Bounded objective, mandate, done-condition and lifecycle |
| Notes | Case `notes` | Scoped, attributed deliberate records and recorded lifecycle transitions |
| Brief | Case `brief`/`revision`/`sources` | Consultant's interpretation; purpose is not a substitute for current truth |
| Papers | Case `papers`, embedded body or private relative file | Working text/draft, not automatically a finding |
| Action outcomes | Optional outbox journal; private receipt reference | What the reviewed action workflow observed |
| Session history | Own configured Pi archive | Recovery evidence, not automatically promoted records |

`case.version` controls stored schema. Configuration version describes configuration format; do not equate it with milestone delivery.

## 2. Find or create work

`hq_navigate index` searches title, purpose, aliases, references and workspace hints lexically. `resolve` matches an explicit system/namespace/key and returns all matching cases, not a guessed winner. Namespace identity is not inferred from whichever organization happens to appear locally.

Select an existing case explicitly. Creation is separate: give title/purpose and optional established workspace/references. The runtime checks name/alias/project/reference/workspace overlaps. Candidates are not a duplicate verdict. A review token binds the proposed identity and full checked candidate/unreadable set; changed uncertainty requires another review. Oversized candidate sets refuse creation without a token for an undisplayed set.

The office creation lock reduces racing creations. Existing-case updates are not globally serialized, so duplicate prevention is not absolute. No semantic matching, merging or automatic retirement.

## 3. Selection versus target

- `index`/`get`/`batch`/`resolve` do not select.
- `select` sets the case and clears the selected objective.
- `start`/`resume` select the objective and its case.
- `resume` does not change lifecycle state.
- Closing the selected objective clears it, not the case.
- After restart, selection is restored context, not renewed authority.
- `hq_note`/`hq_brief` use the selected case, with optional matching `caseKey` to confirm restored intent. Paper, curation/reference and engagement operations have explicit `caseKey` arguments and need not switch ambient selection.

## 4. Engagement lifecycle and traceability

Start an objective with optional done-condition and references. `workRefIds` are IDs returned when registering case references, not human ticket keys.

`open → delivered → closed`; `delivered` can return to `open` through `rework` with a basis. `amend` requires `open` state and preserves old/new objective, mandate, done-condition and references in a linked note. `deliver`/`rework`/`close` also create linked notes, preserving repeated cycle bases. The engagement's delivery/rework fields summarize the latest event; linked notes are the durable history.

Responses return `recorded` for the exact newly created history note and `records` for the broader filtered directory. Closure requires `met` or `user-stopped`; `met` requires a recorded done-condition, but the tool does not independently establish that acceptance occurred.

## 5. Notes, attribution and material

Notes require scope `case` or `engagement`; engagement scope requires a valid nonclosed ID. Case scope omits that ID and persists `null`. Note kinds: `finding`, `decision`, `proposal`, `open-question`, `feedback`, `superseded`. States: `observed`, `proposed`, `confirmed`, `superseded`, `uncertain`. `confirmed` requires sources, not automatic source verification. Attribution is free text identifying whose statement/observation is recorded; writer/session provenance is separate.

**Supersession:** a note may list earlier notes of the same case in `supersedes` (one ID, or several for a consolidation note). Superseded notes leave the index count, overview sample and default notes directory; `get section:notes includeSuperseded:true` lists them marked `supersededBy`, and a singular note pointer always reads them. Overview reports `supersededCount` and a history pointer. Nothing is deleted; legacy notes in upgraded cases can be superseded without adding attribution to them.

System receipts use a dedicated path. Old checkpoint/session-consultation records remain on disk but are excluded from ordinary deliberate-note views. Lifecycle commands generate history notes from explicit operations, not from arbitrary replies.

Papers are case-level. Embedded edits use `expectedRevision`; prior paper bodies are not a version archive. A file-backed paper points to an existing relative file contained in its case directory. Metadata revision is numeric; `contentRevision` detects changed file content between reads. Reads provide ranges and a bounded heading outline.

## 6. Retrieval and recovery

Pointers contain `caseKey`, `section` and, for singular records, `id`. Sections cover `overview`, `brief`, `notes`/`note`, `engagements`/`engagement`, `papers`/`paper` and `references`/`reference`. Overview contains counts, bounded samples/previews and directory pointers, not full bodies.

Directories support continuation. Do not combine keyset `after` with numeric `offset`. `batch` accepts 1–8 `get` pointers; its serialized result budget is 24k characters plus response metadata. It returns remaining pointers or explicit failure/oversize statuses.

Brief and paper reads are bounded; revision changes require rereading rather than using stale ranges. Archive consultation (`session_find`, `session_read`, `session_consult`) is separately bounded and cited.

## 7. Legacy, upgrade and deployment

The v2 interface can select/read legacy v1 cases without changing their bytes, but refuses substantive legacy writes until explicit upgrade. Upgrade tooling preserves original bytes in a private backup, unknown fields and legacy notes; no invented engagement history or attribution. Migration (`hq.mjs migrate --from`) refuses symlinked source state, and state-directory configuration checks physical containment.

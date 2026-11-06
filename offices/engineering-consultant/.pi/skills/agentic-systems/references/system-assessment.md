# Assess a plugin, extension, or agent package

Use this reference for a requested **whole-project assessment**. It is a question bank and reporting guide, not a 13-step execution script or a demand to add 13 subsystems. For a narrow review, use the relevant existing Engineering method instead.

## Establish the evidence boundary

Record the inspected repository and commit, host/runtime, type of package, intended jobs, real human and agent users, exposed interfaces, persistent state, permissions, and evidence available. Read the repo's current source and applicable project rules before relying on README claims. Trace representative workflows from entry point to effect, result, and recovery. Inspect tests and actual package/install paths when practical. Call out unchecked areas; "not run" is not "passed."

Classify important claims as observed (inspected or executed), corroborated, inferred, or unknown. Source inspection can reveal contradictions but does not alone prove a live agent journey.

## Thirteen inspection lenses

Choose depth by risk and the project's real purpose. Mark a lens N/A if it truly does not apply, or ? if evidence is insufficient.

| Lens | What to question |
|---|---|
| Purpose and capability | Does the project solve a real task, and can its core promise be demonstrated? |
| Architecture and integrity | Do components have clear owners, stable boundaries, and one source of truth? Do code, docs, interfaces, and claims agree? |
| Human and agent experience | Can users and agents discover, operate, interrupt, correct, and resume without needless work? |
| Instructions and context | Are prompts, skills, source selection, freshness, and retrieval effective without context flooding or conflicts? |
| Tools and integration | Are preconditions, side effects, argument rules, errors, and host contracts clear? Are tools exposed when useful? |
| State and continuity | Can sessions end or restart without losing accepted decisions or confusing old state with current truth? |
| Failure and recovery | Are partial effects, unknown outcomes, retries, deduplication, and stop conditions handled correctly? |
| Trust and permissions | Are secrets, workspace boundaries, external effects, and approval rights handled at the right layer? |
| Verification and tests | Do tests protect meaningful behavior and regressions? Can success claims be independently checked? |
| Diagnostics and receipts | Can a human or next agent understand what happened, what changed, and what was not verified? |
| Packaging and lifecycle | Do install, first run, disable, update, rollback, compatibility, and private-state preservation work? |
| Cost and maintainability | Does each dependency, abstraction, hook, check, safeguard, and test justify its keep? |
| Documentation and contributors | Can an unfamiliar developer or agent safely understand, change, test, and release the project? |

Inspect host-specific constraints and optional capabilities only when applicable. A stateless tool should not fail for lacking a memory system; a peer messenger needs close delivery, consent, and restart scrutiny. Cross-cutting judgments: **consistency** across promises and interfaces, **cohesion** of responsibilities, **coherence** of whole journeys, **effective behavior**, and **justified simplicity**.

## Grade only what evidence supports

For each relevant lens, record **0-4 or ? / N/A**, confidence, best supporting evidence, and largest gap.

- **4 Strong:** sound and well-evidenced, including key error paths.
- **3 Good:** purpose met, limited known gaps.
- **2 Fragile:** common paths work but important weaknesses remain.
- **1 Poor:** serious weakness in an important workflow or design.
- **0 Broken:** core promise fails or consequential harm is uncontrolled.
- **? Unknown:** insufficient evidence; state what would settle it.
- **N/A:** not applicable; explain briefly.

Overall **A-F** is a reasoned verdict, never a blind mean. A material safety, completion, or core-workflow failure can override high scores elsewhere. A grade A needs strong evidence on the core journeys. Distinguish severity (harm/urgency) from confidence and fix effort. Do not create fake precision or require all 13 lenses for a small system.

## Report a decision, not an audit diary

Present **The Good** (keep/protect), **The Bad** (repair/simplify), and **The Ugly** (systemic or consequential defects). A clean finding is valid. For each material issue include the exact affected path or behavior, source or run evidence, consequence, confidence, and the strongest credible case for retaining the current design.

Recommendations at three levels:

1. **Principle** - the rule that should guide future design.
2. **Direction** - which responsibility, interface, or behavior should change and why.
3. **Implementation** - concrete code, prompt, tool, test, or doc changes and how to verify improvement.

Give a prioritized **keep / repair / merge / remove / redesign** plan. Explicitly investigate duplicated rules, speculative wrappers, stale prompts, brittle mocks, and tests that guard no meaningful contract. Preserve needed coverage before deleting its only guard. Include a concise evidence summary and what remains unverified. Do not add a new approval stage, score service, review database, or permanent checklist merely to deliver the report.

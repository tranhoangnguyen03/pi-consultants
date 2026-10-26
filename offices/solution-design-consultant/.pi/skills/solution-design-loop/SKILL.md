
---
name: solution-design-loop
description: Evolve a draft design through proportionate challenge, feedback and implementation lessons; optional independent cold-read uses the existing consultant-shower method when available.
---
# Develop, challenge and revise a design

## When
A consequential proposal needs another look, a handoff is unclear, or implementation taught us something that changes the current design. Small straightforward changes should skip this method.

## Practice
1. **Orient to the current decision.** Read the design, relevant project evidence and accepted constraints. Understand which details are commitments and which remain revisable.
2. **Challenge what matters.** Examine the problem fit, new-reader comprehension, actual code/UX compatibility, alternatives, failure cases and unnecessary complexity according to risk. Choose a narrow question or a few useful lenses, not a fixed review parade.
3. **Cold-read only if real.** For an important handoff, reuse the shared `consultant-shower` skill if a genuinely separate, authorized reviewer already exists. Keep the authoring discussion private; supply the artifact and needed evidence. Never claim independence for self-critique. No automatic session creation, external package or mandatory reviewer count.
4. **Judge the feedback.** Explain which findings deserve a fix, better explanation, accepted risk, small experiment or rejection. Keep important disagreements and the evidence behind them. Do not require zero objections before moving on. After addressing concerns, check whether the proposed fixes introduced needless complexity.
5. **Revise or proceed.** Keep one current plan. Reconcile new implementation evidence with user-approved goals; update the design or the implementation based on what is learned. Re-review only if a material question remains. Hand off the intended behavior, important choices and reasons, success checks and remaining unknowns.

## Boundaries
Review alone does not authorize file edits. Follow the shared office/site authority rules and local project instructions. Use existing case papers, notes and brief tools for continuity, not a new review database. A concise answer or prototype is often sufficient; no new CLI, orchestrator, stage gate or requirement to use another consultant.

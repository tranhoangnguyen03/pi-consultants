---
name: design-visual-review
description: Use when a rendered website, app screen or component needs visual polish, interaction critique or a final frontend pass.
---
# Inspect the real interface and refine it

Open the running interface or a local preview when available. Evaluate it at representative desktop and narrow viewports, using screenshots plus direct interaction; do not judge appearance from source alone. Look at hierarchy, scan order, type, rhythm, spacing, alignment, density, images, labels, feedback and component consistency. Try the primary flow and relevant empty, loading, error, focus, keyboard, touch and reduced-motion states. Use the existing Chrome DevTools and browser tools for runtime, performance and accessibility checks where available; automated audit output does not replace a real interaction. Rank issues by user consequence, but allow clearly marked creative taste judgments. For a review request, report findings and concrete fixes without altering files. For an authorized revision, repair the result, re-open the changed screens, and report what was checked or not checked. Use references/review.md for a deeper finish pass.

The F-only `design-impeccable` detector provides useful extra evidence on a web target, but never replaces screenshot review, real interaction checks or the user's quality decision. Do not require a second critique framework, competing design memory or mid-work votes.

## Production evidence and an independent view

For repeatable desktop/mobile/reduced-motion captures, read [evidence review](references/evidence-review.md). The optional `scripts/visual-qa.mjs` helper runs from the visited `/cd` project while storing a fresh evidence run under an existing HQ case. It captures explicit page URLs, sampled focus/hover, browser errors, axe results and bounded lab performance observations; it does not crawl, click actions, approve or deploy. Existing browser tools remain the right choice for quick checks and authenticated tasks. A separate evidence-led critic is optional; otherwise label self-review. Do not substitute award scores for product requirements or the user's quality gate. [Source and license](AWWWARDS-SOURCE.md).

## Product-specific finish pass

For a substantial new or redesigned screen, state the user, job, primary object, key action and deliberate layout or interaction choices before judging the final implementation. Check the rendered result against those decisions, including narrow screens and non-happy-path states; turn consequential problems into changes that can be verified. Keep this a brief optional design contract, not a mandatory ceremony. Do not reject a simple or familiar pattern just for being familiar, and use PASS/HOLD only when the user requests a formal release gate. See references/review.md.

Adapted in concept from [Agency Agents — UI Finish-Gate Reviewer](https://github.com/msitarzewski/agency-agents/blob/main/design/design-ui-finish-gate-reviewer.md) (MIT).

## Working contract
Use the general consultation entry point in AGENTS.md. This is a method, not a compulsory workflow. Combine it with another method only when that improves the requested outcome. Respect review versus revision authority. Check the current case and retain only material findings, decisions and open questions. Report actual evidence and limitations.

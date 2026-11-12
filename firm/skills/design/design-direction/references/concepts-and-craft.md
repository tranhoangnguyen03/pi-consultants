# Subject-grounded concepts and visual craft

Use this when a new design needs a point of view, not for every repair. Adapted from `/awwwards` at the revision in `../AWWWARDS-SOURCE.md`. Keep the existing stack, brand, task and user constraints. A functional screen can be excellent without spectacle.

## Find an idea that changes real decisions

Start with known facts: the product's main object, its users' work, real materials, a verified brand story or an established visual identity. Do not invent a name's origin, cultural association, customer story or product benefit to justify a look.

For an open brief, consider two or three different ideas internally. Each should explain several concrete decisions: information order, layout, type, color, interaction and content. A list of style adjectives is not yet a design concept.

Ask three questions:

- **Fit:** Which real fact or user task makes this idea appropriate here?
- **Swap test:** Could an unrelated product take the whole idea with only a name change? If so, find a more specific reason, or accept it as a useful standard pattern rather than calling it original.
- **Carry-through:** Does the idea help beyond the hero: content-heavy views, a narrow screen, empty/error states and the main action? Discard ideas that work only as decoration.

Choose by fit, clarity, feasibility and distinctiveness. Numerical scores are optional scratch work, not evidence. Do not force novelty on familiar controls or require the user to vote on each candidate. Deliver a coherent candidate to the existing quality gate.

Record a compact working concept in an HQ paper only when it helps continuity: source facts, chosen idea, concrete consequences, rejected alternative and open uncertainty. Record accepted decisions and feedback with attribution through hq_note. Shared mission truth stays at the project's Site; do not create another DESIGN.md to remember the consultation.

## Match expression to the surface

A launch page may use one memorable composition or interaction to explain its subject. A work screen should usually spend the same effort on scan order, density, state clarity, keyboard paths and recovery. A documentation page should favor reading structure. Select by the surface's job, not the industry name.

For an expressive page, give one element visual priority and keep the surrounding design disciplined. For an application, make the main object and next action unmistakable. Neither rule requires a loader, a canvas, smooth scrolling or an animation library.

## Type and composition

Choose type roles before families: display, reading text and controls. One family may cover them all. Use a second only where contrast helps. Respect licensed project fonts; verify script/language coverage (including diacritics), fallback metrics, long labels and small-screen wrapping before adding a font dependency.

Choose alignment lines and a spacing scale, then vary density according to content. Use large type, asymmetric groups, lists, images or a quiet grid because they fit the job, not because a gallery praises them. Repeated components should remain consistent; an arbitrary ban on repeated cards is not a design system.

Check a still frame before adding motion. Read real copy at phone width and with zoom. A striking desktop title that clips on a phone is unfinished work.

## Motion with a purpose

Use movement to explain a state change, preserve an object's identity or guide attention. Keep durations and easing related. When no movement helps, use none. Do not require idle animation, animated hover or a decorative loader merely to pass a check.

On expressive sites, one well-built transition can carry the concept. Keep navigation, focus and error recovery usable without it. Revert listeners, timers and animation state on navigation; keep server-rendered content visible without JavaScript. Reuse the project's motion system; consider specialized GSAP/Lenis/WebGL recipes only on demand.

Design the reduced-motion and touch versions, not just a global animation switch. Verify they keep content and actions intact. A screenshot cannot establish whether a transition feels good: inspect it in the running browser and say when that did not happen.

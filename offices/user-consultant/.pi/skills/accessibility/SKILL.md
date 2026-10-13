---
name: user-accessibility
description: Use when a product must work for people with disabilities or under constrained conditions, or when an accessibility audit or fix is needed.
---
# Make the product usable for everyone

Combine automated checks with real interaction. Run Lighthouse accessibility audits and read the accessibility tree with the Chrome DevTools connector to catch missing names, roles, labels, contrast and structure; automated tools find only part of the problems. Then complete key tasks keyboard-only, check visible focus and focus order, use zoom to 200% and narrow viewports, check reduced-motion and colour-independence, and try a screen reader where possible. Map each issue to the WCAG success criterion and level, the people affected and the task it blocks. Prioritize blockers on core journeys over minor violations. Recommend fixes at the component or design-system level, with the expected markup or behaviour. Verify fixes in the actual interface, not only in the audit score. A sound accessibility tree also lets browser-using agents find and operate controls, so semantic fixes often help agent users as well. State what was not tested, for example specific screen readers or native apps.

## Working contract
Use the general consultation entry point in AGENTS.md. This is a method, not a compulsory workflow. Combine it with another method only when that improves the requested outcome. Respect review versus revision authority. Check the current case and retain only material findings, decisions and open questions. Report actual evidence and limitations.

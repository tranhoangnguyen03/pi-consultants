# Rendered UI review — optional deeper pass

Start with the task and actual screen. Use checks that fit the request; don't turn every repair into a report.

- **First look:** primary task visible, content ordered, visual emphasis justified, meaningful empty space; no ornamental cards or labels that confuse meaning.
- **Type and content:** readable scale, legible contrast, useful line length, honest headings, clear actions, no placeholder copy presented as real.
- **Layout:** alignment and spacing form consistent groups; useful breakpoints, narrow screens, zoom, long labels, translations and overflow do not break the UI.
- **Controls:** discoverable actions, visible hover/focus/selected/disabled states; sensible touch sizes; keyboard paths; safe confirmation and recovery.
- **States:** loading, empty, error and success states tell the user what happened and what to do next. No mock function disguised as a real save.
- **Motion and media:** motion communicates a change, respects reduced motion, does not block use; images convey useful content or a deliberate product tone.
- **Browser checks:** inspect screenshots, console, network/404s where relevant; exercise a representative real task. Lighthouse/a11y audits are supporting evidence only.
- **Evidence:** separate screenshot observation, browser interaction, test output, assumptions and aesthetic preference. State unchecked browsers, devices and assistive tech.

Close the loop by looking again after a change. Don't claim a polished design is user-validated or a working flow from a static mock.

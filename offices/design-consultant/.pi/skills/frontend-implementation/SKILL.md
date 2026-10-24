---
name: design-frontend-implementation
description: Use when the user wants an interface or component built, restyled or made interactive in an existing frontend project.
---
# Turn an interface into working code

Inspect the repository's framework, component patterns, design tokens, routes, tests and applicable AGENTS.md before editing. Build the requested screen or flow in the existing stack, respecting existing branding and constraints. Implement real controls and states—not decorative buttons or fake interactivity. Include relevant empty, loading, error, success, focus and responsive behavior. Prefer small reusable components and tokens where they simplify future changes; do not add a framework, design library, global dependency or build pipeline just for a single page. Match existing data contracts; when a backend is absent, mark sample content and simulated behavior. Run available checks, inspect the rendered result, and repair consequential problems. For a substantial new direction, use design-direction first; for finished UI, use design-visual-review. Record decisions in the case, not a competing private copy of project code.

## Working contract
Use the general consultation entry point in AGENTS.md. This is a method, not a compulsory workflow. Combine it with another method only when that improves the requested outcome. Respect review versus revision authority. Check the current case and retain only material findings, decisions and open questions. Report actual evidence and limitations.

# Consultant F — Design & Front-end

Consultant F helps shape, build and improve websites and app interfaces. It specializes in visual direction, interaction design and working front-end code. It uses the normal Pi Consultants office, with its own private case records and shared toolset.

## Start

```sh
npm run setup
cd offices/design-consultant
pi
```

Describe the problem without naming a skill:

- “This settings page works but feels crowded. Inspect it and improve it.”
- “Explore two visual directions for our onboarding page.”
- “Build the session configuration flow in this React app and test it in a browser.”
- “Critique this interface without changing any code.”

Use the office travel tool to work in a project. Configure project roots and the organization playbook like other offices. Design cases retain significant choices, references, feedback and open questions. Working code and shared design assets remain in the project.

## Methods

| Skill | Use |
|---|---|
| `design-direction` | Choose or compare visual approaches for real product context. |
| `design-frontend-implementation` | Build components and flows in the project's existing stack. |
| `design-visual-review` | Inspect rendered screens, try interactions and refine the result. |

Methods are selected as needed, not a required sequence. All use the standard consultation and authority rules.

## Boundaries

F can build and edit locally on an explicit implementation request. Review alone does not authorize edits; publishing, pushing or changing shared design files requires the normal outside-action authorization. D owns user research and evidence-led usability findings; B owns broad engineering review. F need not hand work to either office, and cannot read their private cases.

The shared browser, Chrome DevTools, diagram and composition tools are included; optional Figma remains disabled until configured. No new runtime, frontend framework or Impeccable engine is installed. F must state when a live browser, backend, screen-reader or real user test was unavailable.

## Verification

Maintainers edit `firm/`, rebuild with `npm run setup -- --rebuild --yes`, then run `npm run verify`. Live authenticated Pi and browser/model-quality evaluation remain separate qualification steps.

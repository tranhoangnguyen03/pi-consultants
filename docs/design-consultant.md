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
| `design-impeccable` | Run the pinned Impeccable UI detector and targeted finishing passes. |

Methods are selected as needed, not a required sequence. All use the standard consultation and authority rules.

## Boundaries

F can build and edit locally on an explicit implementation request. Review alone does not authorize edits; publishing, pushing or changing shared design files requires the normal outside-action authorization. D owns user research and evidence-led usability findings; B owns broad engineering review. F need not hand work to either office, and cannot read their private cases.

The shared browser, Chrome DevTools, diagram and composition tools are included; optional Figma remains disabled until configured. No new runtime or frontend framework is installed; the optional Impeccable detector installs on first use into F's private `.hq/tools/`. F must state when a live browser, backend, screen-reader or real user test was unavailable.

## Verification

Maintainers edit `firm/`, rebuild with `npm run setup -- --rebuild --yes`, then run `npm run verify`. Live authenticated Pi and browser/model-quality evaluation remain separate qualification steps.

## Impeccable workbench (F only)

F carries the `design-impeccable` skill: selected [Impeccable](https://github.com/pbakaus/impeccable) design tactics plus its pinned **deterministic UI detector**. This is a scoped adapter, not a full upstream skill installation.

Start Pi in `offices/design-consultant`, then use `/cd ~/code/my-project` **inside Pi**. Your project becomes the working directory while F's skills and cases stay at the HQ:

```sh
# In the /cd destination (your repo):
node ~/pi-consultants/offices/design-consultant/.pi/skills/impeccable/scripts/impeccable.mjs detect src/
node ~/pi-consultants/offices/design-consultant/.pi/skills/impeccable/scripts/impeccable.mjs detect --viewport 390x844 http://localhost:3000

# Optional: scan a project without first using /cd:
node ~/pi-consultants/offices/design-consultant/.pi/skills/impeccable/scripts/impeccable.mjs detect --project ~/code/my-project src/
```

The old `detect /project src/` form is still accepted. Always use the script in the generated HQ, not `firm/`. Symlinked HQ paths work; attempts to scan F's own office or run flag-only file scans fail with a nonzero exit rather than a false clean result. `detect` emits JSON; exit 0 means no primary findings, 2 means findings, 1 means an operational failure. First use requires network access. The adapter pins npm `impeccable@4.7.0` and engine `0.1.16`, installs with npm lifecycle scripts disabled, uses an isolated HQ home/cache, strips model credentials, and **forces telemetry off**. It does not write `PRODUCT.md`, `DESIGN.md` or an `.impeccable/` project-memory tree.

Design context, accepted direction, feedback and rationale use existing `hq_paper`, `hq_note` and `hq_brief` records. F picks and runs its own methods without interrupting you for intermediate approval. For substantial UI, it presents the rendered **quality gate** for acceptance or rework, then obtains **delivery gate** authorization for a push, deploy or other outside action unless the present mandate already granted it.

Upstream `init`, `document`, `critique-storage`, `live`, `generate`, hooks and separate critique subagents are **not installed** here; these require further Pi and project-state testing. F can already generate alternatives with the normal browser/frontend tools. This integration does not claim full Impeccable parity.

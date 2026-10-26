# Consultant G — Solution Design

Consultant G helps you decide **what should be built, how it should work, and why**. It can take an uncertain idea, an existing proposal, or feedback from implementation, develop a useful plan with you, challenge it where warranted, and revise it when reality changes.

It is a separate, durable consultant office with the same case tools and shared Pi toolset as the other five. It is **not** an EGM plugin fork, a compulsory specification workflow, or an independent-review runtime.

## Start

    npm run setup
    cd offices/solution-design-consultant
    pi

Or install into a separate folder with `npm run setup -- --out /path/to/offices`. Start Pi **inside** the chosen HQ; use `/cd` within Pi to inspect a project without moving the HQ or its private case memory. Install your organization playbook as for other offices.

Describe what you want in ordinary language:

- “Help me design team management for pi-teams. Keep it modal-first, keep teams small, and avoid needless setup.”
- “I have three ways to handle approval state. Which is simplest given our existing code?”
- “A prototype exposed a flaw in our design. Help me revise the behavior and record what changed.”
- “Read this handoff as a new implementer would. What will they have to guess?”

## Core methods

| Capability | When it helps |
| --- | --- |
| `solution-shaping` | Understand a problem, compare meaningful alternatives, form a revisable design. |
| `solution-design-loop` | Challenge a draft, judge findings and revise after new evidence or implementation feedback. |
| `consultant-readchk` (shared) | Check intent on consequential ambiguous work without an intake form. |
| `consultant-shower` (shared) | When a genuine fresh reviewer is available, test whether an important handoff conveys the intended design. |
| `consultant-re0-memo` (shared) | Retain useful lessons in the existing HQ case. |

The consultant discovers these methods and selects only the ones that help. There is no required order, reviewer count or completion gate. If a fresh reviewer cannot run, the consultant should say so instead of presenting self-critique as independent.

## What a good output looks like

One current, **right-sized design**, rather than every conversation or an exhaustive implementation script. It explains the intended outcome, accepted constraints, user-endorsed choices and reasons, meaningful alternatives, outstanding assumptions and the next step.

Distinguish what **must hold** from how we **currently propose to achieve it**. Implementation may reveal a better way: the consultant should reconcile new evidence with the accepted intent, not treat the original proposal as unchangeable.

Shared project truth lives in the project repository, issue or document according to your playbook. The office's private HQ papers can hold working drafts; attributed case notes and brief preserve decisions and links. The consultant does not add a second memory layer or copy another office's private records.

## Inspiration and limits

This role borrows the [Elephant–Goldfish Model](https://github.com/google/elephant-goldfish-model) insight: an Elephant-like partner develops the design with deep context, while a fresh Goldfish-style reader can sometimes test whether a handoff stands on its own. The user decides what to adopt. The [foundational essay](https://drensin.medium.com/elephants-goldfish-and-the-new-golden-age-of-software-engineering-c33641a48874) and [Google's announcement](https://opensource.googleblog.com/2026/10/introducing-elephant-goldfish-model-plugin.html) give context, not instructions to copy every stage.

G does not install EGM, create agents, run mandatory parallel reviews, or require sign-off from another office. The shared `consultant-shower` covers optional independent cold-reading when a suitable reviewer already exists. Work remains useful without it.

G differs from Engineering B (technical correctness, code/tests), Design & Front-end F (visual and interaction implementation), Users D (user research), Research E (scientific inquiry), and Coordination C (handoffs). These are specialties, not access limits.

## Validation

Maintainers update canonical `firm/` source, run `npm run setup -- --rebuild --yes` to generate offices and `npm run verify` to check them. Offline contract tests check the office's isolated build, role routing and skills. Real Pi startup and model-quality interviews require separate checks; fixture success alone does not establish either.

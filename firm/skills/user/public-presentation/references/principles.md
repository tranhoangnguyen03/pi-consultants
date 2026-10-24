# Public presentation: lasting principles

The reader is a developer with ten seconds who is deciding whether the product is worth installing and safe to run. These rules apply to any public repository or package.

## Principles

1. **Show the job before the machinery.** Outcome, install and a picture come first. Backends, compatibility and caveats come after.
2. **One idea, many verbs.** A product with several features names the one idea that ties them together and repeats it in every surface.
3. **The README is the pitch; the docs are the manual.** The README takes a visitor from "what is this?" to a first success. Everything else is one link away.
4. **Say exactly what leaves the machine.** For tools that run code, call models or touch files, data flow and permissions are the trust decision.
5. **Promise only what you test.** Runtime versions, operating systems and "works with" claims match the CI matrix. Untested means "untested", not silence.
6. **Let the repository's state tell the truth.** Description, settings, open issues, branches and releases reflect the product today.

## Checklist

Rank gaps by actual user consequence, not by template compliance. Accuracy, permissions, privacy and copyable commands are requirements. Layout, badge counts, visuals and length targets below are defaults to adapt to the audience and product; their absence alone is not a MUST finding.

**Discovery (repository About box and package metadata)**
- MUST Repository, package and README descriptions make compatible, accurate claims. Name the ecosystem or host where readers need it; wording may differ to fit the surface.
- SHOULD Topics or keywords cover relevant ecosystem and domain discovery tags, where the platform supports them.
- SHOULD Set a useful homepage when a package page or docs site exists.
- SHOULD A custom social preview image with the name, the tagline and one product visual.

**First screen (about 30 lines)**
- SHOULD Make the name, benefit, necessary context, install path and a first useful task easy to find. Badges, a hero visual and a "try it" table are optional aids, not a required order or count.
- MUST Put consequential compatibility, permission or safety warnings before the step they affect. Keep detailed reference material out of the first-run path where a link is enough.
- MUST Every command shown runs exactly as copied: descriptions go in a separate column, never inline in a code block, and placeholders are labelled.
- SHOULD Name the first-run diagnostic command, if there is one, right after install, and say what it checks and that it sends no user content.
- SHOULD If the name is not self-explanatory, explain it in one line.

**Body and docs**
- SHOULD Keep the README focused on discovery and first success; about 300 lines is a useful review prompt, not a hard limit. Link to reference material and a clear docs entry point when needed.
- SHOULD Link features to detailed guidance where readers need more than the introduction.
- MUST State prerequisites and compatibility limits before users need them. SHOULD Link required external tools to installation guidance and give minimum versions where known.
- MUST A feature that needs non-default setup says so where the feature is introduced.
- SHOULD Limits are one section of about 10 bullets, each "limit → workaround".
- SHOULD Demo visuals are reproducible from a script kept in the repository.
- NICE Light and dark image variants.

**Trust and safety**
- MUST A "what leaves your machine" section: per feature, what is sent, to whom, and what persists where. The first screen links to it.
- MUST Say which credentials external tools may use (their own sign-in, or keys in the environment).
- MUST Any mode that bypasses permissions or a sandbox has a visible callout and a marker where the feature is introduced. Say plainly whether it is meant to act or only told not to.
- MUST Distinguish prompt instructions from enforced restrictions.

**Versions and releases**
- MUST A one-line stability statement (for 0.x: what may break, where breaks are listed).
- MUST Breaking changes are listed under a "Breaking" heading with migration steps.
- SHOULD Open releases with a few plain-language highlights, followed by details or a changelog link. Small releases need no fixed highlight count.
- SHOULD Changelog entries are 1–2 lines each; internal renames and test refactors stay in pull requests.
- NICE Write down what 1.0 (or the next stability milestone) means.

**Repository** (flag present/missing only; route to engineering)
- About 15 root entries or fewer, so the README is reachable without scrolling past files.
- No scratch or personal files committed; the package allowlist ships only runtime and user docs.
- CI covers the minimum runtime version claimed and every supported OS; release-guarding jobs are required checks.
- Dependency updates are automated; a security policy and issue forms exist; merge settings and stale branches are tidy.
- Optional hardening (NICE): actions pinned to commit SHAs, code scanning, an OpenSSF Scorecard.

## README skeleton

```md
# <name>
<badges>
<Tagline.> <One sentence of context.>
<hero visual>
## Install
## Try it            (table: command | what happens)
## What it does      (one row per feature, linked)
## Requirements      (versions, OS, external tools)
## What leaves your machine
## Limits
## Stability
## Docs · Contributing · Security · License
```

## Gap list format

Open with a one-line verdict from the visitor's point of view. Then rank gaps:

- **MUST / SHOULD / NICE**, then what the visitor experiences, the evidence (file and line, or the live page), and the exact proposed change or text.
- Separate confirmed gaps from things you could not view.
- Include **For B (engineering)** and **For C (coordination)** sections only when findings need that specialist's attention. Make them ready to paste; do not require a handoff or another session for a task the current consultant can complete within scope.
- A gap that is both user-facing and a CI matter (for example a runtime-version claim CI does not test) can be ranked in the main list with the CI part noted for B.

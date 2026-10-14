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

**First screen (about 30 lines)**
- MUST In this order: name, 3–5 badges (version, CI, licence; no vanity badges), one-line tagline, one sentence of context for anything the reader may not know, hero visual by about line 40, install command, a short "try it" table.
- MUST No caveats, experimental-runtime notes or compatibility matrices before the install block.
- MUST Every command shown runs exactly as copied: descriptions go in a separate column, never inline in a code block, and placeholders are labelled.
- SHOULD Name the first-run diagnostic command, if there is one, right after install.

**Body and docs**
- MUST The README stays near 300 lines or fewer; reference material lives in docs/ with an index.
- MUST Each feature has a short block or table row that links to its own documentation section.
- MUST Requirements list each external tool with an install link, its minimum version where known, the default choice, and supported operating systems.
- MUST A feature that needs non-default setup says so where the feature is introduced.
- SHOULD Limits are one section of about 10 bullets, each "limit → workaround".
- SHOULD Demo visuals are reproducible from a script kept in the repository.

**Trust and safety**
- MUST A "what leaves your machine" section: per feature, what is sent, to whom, and what persists where. The first screen links to it.
- MUST Say which credentials external tools may use (their own sign-in, or keys in the environment).
- MUST Any mode that bypasses permissions or a sandbox has a visible callout and a marker where the feature is introduced. Say plainly whether it is meant to act or only told not to.
- MUST Distinguish prompt instructions from enforced restrictions.

**Versions and releases**
- MUST A one-line stability statement (for 0.x: what may break, where breaks are listed).
- MUST Breaking changes are listed under a "Breaking" heading with migration steps.
- SHOULD Each release opens with 2–4 plain-language highlights.

**Repository** (flag present/missing only; route to engineering)
- About 15 root entries or fewer, so the README is reachable without scrolling past files.
- No scratch or personal files committed; the package allowlist ships only runtime and user docs.
- CI covers the minimum runtime version claimed and every supported OS; release-guarding jobs are required checks.
- Dependency updates are automated; a security policy and issue forms exist; merge settings and stale branches are tidy.

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
- End with **For B** (repository and CI items, ready to paste) and **For C** (release-note or announcement wording, ready to paste). Omit an empty section.

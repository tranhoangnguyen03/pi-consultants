# Consultant E — Research Scientist

Start from the generated office exactly like the other consultants:

```sh
cd ~/pi-consultants/offices/research-consultant
pi
```

E investigates unfamiliar questions, reviews papers and public sources, forms hypotheses, plans and runs bounded experiments, analyzes data, and explains findings. Give it a project path and the question; it can use `change_dir` while HQ case notes and sessions remain in the office.

## Shipped skills

Seven K-Dense skills: `paper-lookup`, `literature-review`, `scientific-critical-thinking`, `hypothesis-generation`, `experimental-design`, `statistical-analysis`, and `scientific-writing`. Plus a restricted `last30days` skill for recent public conversation and developer activity.

The skills and their supporting scripts are committed and installed locally by the normal HQ factory. The [upstream lock](../firm/research-sources.json) records exact reviewed revisions and licenses. This does not add research tools to offices B, C, or D.

## Optional prerequisites

Research works with the ordinary Pi, browser, shell, and document tools. Some specialist K-Dense scripts require Python 3.11+ or 3.12+, network access, and optional packages installed in a task-specific environment. They are not installed for every user or office. If an optional package is absent, the agent should report the limitation and use available methods.

The local `last30days` safe runner needs Python 3.12+. It uses only public keyless sources and keeps its home, configuration, cache, and reports under the research HQ's ignored `.hq/last30days/` folder. It does not read browser cookies, inherit host API tokens, enable paid providers, auto-run its setup wizard, or publish reports. It disables upstream Keychain lookup and hides host credential helpers (`gh`, `pass`, and `security`) from the engine; GitHub uses its unauthenticated API tier. It omits five upstream sample media assets unrelated to research execution. Coverage varies with network/provider limits. Do not run its upstream engine or authenticated setup directly inside this baseline office. It is a source of community signals, not scientific verification.

To check the last30days runner (replace the path with your HQ):

```sh
node offices/research-consultant/.pi/skills/last30days/scripts/hq-safe-run.mjs --preflight
```

## Maintenance and evidence

The skills are vendored at pinned commits. Maintainers may deliberately update `firm/research-sources.json`, review upstream changes, and run `node firm/scripts/vendor-research.mjs`; then regenerate offices and run `npm run verify`. The script reapplies the local source-independence guidance from `firm/research-additions/literature-review.md`; maintain that addition there rather than editing the vendored copy. There are no runtime updates.

Save significant findings and source references with existing HQ cases and papers. Keep experiment code/data in an authorized project workspace, with relevant commands, versions, and artifacts referenced from the case. Do not claim that a cited finding was independently verified when it was only reported by a source.

## Smoke checks

After `npm run verify`, test with a real configured Pi model:

1. `cd offices/research-consultant && pi` and ask about an unfamiliar research paper.
2. Give E a small dataset and ask for a reproducible analysis.
3. Close and restart E, then ask for a case recap.
4. Run `last30days` on a public topic and confirm source coverage, no inherited paid keys, and cache isolation.

CI tests the generated office, source checks, and native-HQ fixture bootstrap; it does **not** prove live LLM research competence, current public-source availability, or real authenticated Pi startup without an external model login.

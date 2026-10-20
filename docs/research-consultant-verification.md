# Research Scientist E — implementation verification

Date: 2026-10-20  
Branch: `feat/research-scientist-e`  
CI assembly: https://github.com/tranhoangnguyen03/pi-consultants/actions/runs/39444172434

## Confirmed on GitHub Actions

- Fetched the selected seven K-Dense skills and last30days at the exact revisions in `firm/research-sources.json`.
- Generated all four consultant offices through the existing factory, including `offices/research-consultant/`.
- Ran `npm run verify`: **108 tests passed, zero failed**.
- The skill header checker accepted the upstream metadata and the source structure checks passed.
- The drift check found the committed offices matched the factory output.
- The new tests verified the eight research skills, the independent HQ configuration, shipped licenses, safe runner presence, and rejection of unsupported publishing flags.
- An ordinary native bootstrap fixture was exercised by the existing test suite; the tests do not require LLM provider authentication.

## Not verified

- No interactive, authenticated `pi` session was run with a live model in this CI environment.
- No live scientific literature investigation, experiment performed by an LLM, or full cross-session model recall was tested.
- The last30days wrapper's safety configuration and unsupported flag rejection were inspected/tested, but live public-source retrieval and service coverage were not tested. Source availability may change.
- Specialized Python package environments were not installed or validated against real research data.

## Practical follow-up after checkout

1. `cd offices/research-consultant && pi`; check the banner, tools, and local research skills.
2. Review a real paper and ask for sources and material limits.
3. Run a bounded local analysis on sample data and check its outputs.
4. End the session, reopen the same case, and verify the research record is recovered.
5. With Python 3.12+ installed, run `node .pi/skills/last30days/scripts/hq-safe-run.mjs --preflight` from the Research HQ, then research an explicitly public topic and inspect source coverage and `.hq/last30days/` artifacts.

No changes to Pi Consultants' case schema, inter-consultant messaging, global skill installation, or approval model were needed.

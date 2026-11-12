# Design F: subject-grounded concepts and visual evidence

F now has two additions to its existing methods, informed by `juliobsz/skills` (`/awwwards` and `/jury`):

- `design-direction` can develop and compare subject-grounded concepts, apply a swap test, and turn the selected idea into layout/type/motion choices. It adapts the ambition to a launch page, work screen or reading surface rather than imposing an award-site style.
- `design-visual-review` can collect a bounded production-browser evidence set and request an independent first impression when an authorized reviewer is available. No mandatory critic, scoring target or new memory system.

## Office first, project second

Start Pi in the design office and `/cd` into the project as usual. Call tools by their absolute HQ skill path. The project stays the worksite; tools and evidence stay at HQ.

```sh
node /path/to/design-consultant/.pi/skills/visual-review/scripts/visual-qa.mjs capture --case client/project --build production http://127.0.0.1:4400/
```

Select/create the case through normal HQ tools first; the helper only accepts an existing v2 case. Start the project's production build through its own documented commands. Capture takes one to three explicit HTTP(S) URLs; it does not crawl, submit forms, deploy, or reuse a login. For signed-in flows use the office's existing browser tools.

First use downloads pinned Playwright 1.57.0 and axe-core 4.10.3; Chromium downloads if needed. Optional `--browser` selects an installed Chromium. Tool state uses the configured private HQ state directory. No global setup, client package.json edit or user credential inheritance. Tool telemetry is disabled; target pages can still run their own analytics and service calls.

Each run produces PNGs, manifest.json and report.md under the existing case's `papers/visual-qa/<unique-run>/`. Register the returned report path through hq_paper. Keep durable findings in hq_note and accepted mission decisions at their Site source. No `.jury`, `.shots`, new DESIGN.md or separate index appears in the client project.

## What a result means

Exit 0 means the bounded capture and axe checks completed, not that the UI is good. Exit 1 means incomplete capture, unavailable checks or an operational error; partial evidence remains private. Inspect every relevant PNG and confirm the correct target before reviewing it. The helper does not recognize every bot challenge, login wall or stale server.

The evidence includes desktop/mobile/reduced-motion views, a small keyboard/hover sample, DOM observations, browser errors, axe results and short lab LCP/CLS samples. It does not measure full task success, field performance, INP, FPS, perceived animation quality or screen-reader compatibility. Build mode/revision are provenance supplied by the caller worksite, not proof of the deployed revision.

A fresh critic can review images without the author's pitch, then F checks those observations against the real task. Self-review is labeled. No award predictions, calibration offset or numeric acceptance threshold. The user retains the existing quality and delivery gates.

## Maintainer checks

`npm run verify` covers parsing, HQ/case isolation, state paths, evidence retention and failure reporting without a live download. `node firm/scripts/design-qa-smoke.mjs` runs a separately scoped live Chromium test on synthetic landing-page and application-screen fixtures. Its results demonstrate mechanics, not improved model judgment. Representative model-driven work remains a separate evaluation.

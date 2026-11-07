# Animator H — real-browser and agent qualification

The two examples here exercise **p5.brush 3.0.0 in Chromium**, not a Pi model's reasoning. They are deliberately small, with a deterministic time entrypoint. They verify p5.js add-on versus standalone setup, actual WebGL2 painting, visible change over time, and equality of first/seam frames in a short 8-second loop.

## Browser trial

From this folder:

```sh
npm install --ignore-scripts --no-audit --no-fund
npx playwright install --with-deps chromium
npm run test:browser
```

The test serves `scenes/addon.html` and `scenes/standalone.html` locally. Dependencies live **only here**, not in the consultant office. It writes small PNG samples and a JSON report in `results/`. GitHub Actions runs the same check and keeps results as a short-lived artifact. The CI job uses Ubuntu 24.04 because its pinned Playwright version does not support the newer 26.04 runner.

A passing result means both *fixed sketches* rendered and the tested loop closed. It does **not** prove that the agent wrote or corrected them, that the artistic direction is good, that the library works on every GPU, or that an actual media export works.

## Real-agent qualification (separate)

In an environment with Pi installed, a model signed in, a working browser and authorized project workspace, start `offices/animator-consultant`. Give H a fresh request to build a p5.brush animation using the add-on, then another request using standalone without p5.js. Do not tell H to copy the fixtures as solutions. Observe whether it can pick the right build, set up the project, render actual frames, inspect them and repair any issues. Then give feedback on one sketch and request a targeted revision. Test MP4/GIF export and decode independently when requested.

Record the original request, tools actually used, generated code, browser observations, corrections, produced artifacts and limitations in issue #30 or an authorized Site record. Distinguish observed outcome from recommendations. A model without browser access is **unqualified**, not silently passed.

References: [issue #30](https://github.com/tranhoangnguyen03/pi-consultants/issues/30), [upstream p5.brush](https://github.com/acamposuribe/p5.brush).

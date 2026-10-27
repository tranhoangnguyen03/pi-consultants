---
name: pixel-art-production
description: Create precise editable pixel sprites, game tiles, sprite sheets, small frame animations and icons with the code-first Pxl workflow.
---
# Pixel art as editable source

Use [Pxl](https://github.com/crsolver/claude-pxl) for deliberate pixel art, not ordinary web UI or general illustration. Study existing game art and agree on sprite size, native display scale, palette, transparency, frame count and format. Build one representative asset before producing a family.

1. Check optional installation with `node <skill>/scripts/pxl.mjs doctor`. Configure `PXL_CLI=/absolute/reviewed/claude-pxl/bin/pxl.js`. The wrapper never installs anything, downloads code or changes global settings. Do not silently run unpinned `npx github:...`.
2. Write a small editable `art.px.js` with palettes, sprites, layers and animations. Read Pxl's [upstream skill](https://github.com/crsolver/claude-pxl/blob/main/SKILL.md), [API reference](https://github.com/crsolver/claude-pxl/blob/main/reference.md) and [lighting reference](https://github.com/crsolver/claude-pxl/blob/main/lighting.md) selectively. Avoid huge hand-written pixel grids; prefer mirrors, variants, reusable parts and tilemaps.
3. Build the smallest change first: `PXL_CLI=/path/to/bin/pxl.js node <skill>/scripts/pxl.mjs build art.px.js --only hero`. Inspect `out/_preview/hero.png` and, for exact coordinates, use the `ascii` command. Patch and rebuild until correct.
4. Check dimensions, alpha, frame timing, sheet JSON, cropping and native-scale legibility. Keep the source and generated assets in the project's authorized destination. For game integration, test the actual engine import.

The wrapper strips common model credentials from the Pxl child process, but JavaScript art files and scripts are **not** an OS sandbox. Inspect unfamiliar sources before running. Do not claim visual review when only commands ran. If Pxl is unavailable, report it and offer an appropriate smaller alternative. F retains visual judgment; no new private design-memory store is introduced.

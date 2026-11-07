---
name: p5-brush
description: Use for generative animation and natural-media drawing with p5.brush: pencils, markers, watercolor, hatching, stroke texture and animated flow fields.
---
# Use p5.brush accurately

p5.brush is a browser/WebGL2 drawing library, not a complete animation timeline or video encoder. Use it when its natural-media marks, watercolor, hatching or vector fields improve the intended visual. The project need not use it merely because this skill exists. Check the project's installed version and read its API when it differs from the reference here.

**First identify the build.** p5.brush 3.0.0 ships two distinct browser builds: a p5.js 2.x add-on and a p5-free standalone build. Their setup, transforms, seeding, clearing and frame flush differ. Never mix them. Read [references/usage.md](references/usage.md) before implementing; it contains both setup paths, supported operations, animated field guidance and render checks.

For time-varying work, define what changes with time and what stays stable. Use `brush.refreshField(t)` when the selected flow field must change with time. Re-seed watercolor per frame if deterministic texture is desired; otherwise intentional variation may look like flicker. Distinguish painterly accumulation from redraw-on-clear animation. Remember that watercolor fills can be costly on large, high-density canvases.

Prefer library primitives for visible shapes and validate brush names rather than inventing methods. Keep text or overlays above brush geometry. Verify the sketch in an actual browser with WebGL2, including a later frame and an export frame if exporting; runnable code alone does not prove rendering. If the user's environment lacks WebGL2 or rendering tools, say what could not be inspected and offer a fitting fallback.

Source: [p5.brush](https://github.com/acamposuribe/p5.brush) (MIT), [official model-facing API notes](https://github.com/acamposuribe/p5.brush/blob/main/llms.txt). API guidance checked against the repository's 3.0.0 package metadata and `llms.txt` on 2026-11-07. This skill references upstream code; it does not vendor or install the library in the consultant HQ.

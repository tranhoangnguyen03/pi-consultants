---
name: open-toonz-animation
description: Design, revise and render editable 2D animations in OpenToonz using existing scenes, ToonzScript and documented batch tasks where available.
---
# Work with OpenToonz scenes

Use OpenToonz for hand-drawn character motion, expressive illustrated scenes and composited 2D animation. Use Pxl for code-driven pixel sprites, or the existing shared `composition` skill for explainers and timed HTML-based visuals. Keep the original `.tnz` scene, drawings, palettes and camera settings as editable source.

Set shot list, fps, resolution, key poses, scene duration, source assets and output before changing a scene. Check the installed OpenToonz version and save the project before a render. Use `node <skill>/scripts/doctor.mjs` to locate `tcomposer` and `ffmpeg` without executing either.

OpenToonz documents [ToonzScript](https://opentoonz.readthedocs.io/en/latest/toonzscript.html) in its **GUI** Script Console and Run Script command; do not assume an officially supported headless script runner. For scene export, the [Tasks pane](https://opentoonz.readthedocs.io/en/latest/rendering_the_animation.html) exposes a concrete `tcomposer` command that you can inspect for the specific scene and installation. Use that observed command, not invented universal flags.

Render a bounded frame range first. Verify actual output files, motion continuity, timing, transparency, scene composition and the final frame. When GUI work or installed codecs are required, say so plainly; a successful render process is not visual acceptance.

Before claiming automated creation, run a disposable spike that edits a scene with a documented ToonzScript API, saves it, renders a few frames, and reopens the source. Do not edit the client's scene as a probe. Third-party headless forks and XML-template pipelines are *research options*, not silently selected substitutes; see `references/automation.md`. No automatic desktop installation or cross-office memory.

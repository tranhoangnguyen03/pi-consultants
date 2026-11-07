---
name: creative-coding
description: Use to implement or review procedural animation, particle systems, Canvas/SVG/WebGL sketches, responsive motion or repeatable frame renders.
---
# Make working motion, not just a sketch description

Inspect the existing project, rendering context and delivery format before selecting a library. Keep CSS/WAAPI for UI motion, SVG for scalable paths, Canvas for direct 2D drawing, and p5.js or WebGL for creative simulation when they offer a clear gain. The shared composition skill is available for scene-based HTML timelines and MP4 output; it is not required for an interactive sketch.

Treat animation as a function of time and input. Prefer elapsed time over adding fixed amounts per draw call when frame rate varies. For video or repeatable comparisons, fix dimensions, frame rate, seed and sampled time; keep visual and random state deterministic where needed. Decide whether frame-to-frame accumulation is intentional before clearing or redrawing. Avoid recreating costly geometry, shaders, resources or canvases on each frame without reason.

Produce an executable entry point, concise run instructions and a direct way to inspect the output. When export is requested, distinguish a live browser demo from a captured video or image sequence; verify the actual file, dimensions, time range, playback and any audio rather than naming a desired format. If tools are missing, give the precise source and commands needed to run or export, without claiming the render happened.

Review representative frames plus motion: start/end, loop seam, temporal flicker, clipped bounds, pixel density, text overlays, layout on resize, dropped frames or GPU issues where measurable. Do not treat one screenshot as proof of animation quality. For interactive UI, test a static or reduced-motion path when needed. Do not add a rendering service, dependency or tool gate when existing project tools suffice.

For natural brush or watercolor work, use the p5-brush skill and choose its correct build. For artistic feedback, combine this implementation method with animation-direction. Keep code and export artifacts at the project Site; keep only concise decisions and useful findings in the existing HQ case.

# Composition sources and scope

- Technical references: [HeyGen HyperFrames](https://github.com/heygen-com/hyperframes/tree/ce060c7acc738d2cbdb06a88378aebac9f66d979), tag v0.8.161, commit `ce060c7acc738d2cbdb06a88378aebac9f66d979`.
- Seven Markdown files under `references/upstream/` are unchanged copies at their original relative paths: four core references, two native animation adapters and one keyframe-pattern reference. Their SHA-256 hashes are in `references/upstream/SHA256SUMS`. Copyright 2026 HeyGen, Inc.; Apache-2.0 licence included at `references/upstream/LICENSE`. Upstream has no NOTICE file at this revision. All other files here are firm-authored integration material, not upstream instructions.
- The full upstream router/workflows, CLI skill, plugin launcher, dispatch, providers, examples and scripts are deliberately not copied. Prose referring to those missing components is contextual technical reference, not an instruction to install or invoke them. No upstream SKILL.md is advertised as a separate skill.
- The separate local CLI is `hyperframes@0.8.161`; npm registry gitHead matches the reference revision. `tool/package.json` and `tool/package-lock.json` pin the installation. Binaries/dependencies are downloaded on the explicit install step, not bundled or installed by Pi startup. Updates require a deliberate source/lock/reference revision and re-verification.
- HyperFrames is Apache-2.0, but not every dependency/asset has that licence. The lock includes optional LGPL libvips binaries. Upstream credits include MPL studio content and GSAP's non-OSI Standard License. This starter uses native WAAPI and local SVG, not GSAP. Any additional libraries, fonts or media need their applicable terms; CLI compilation can fetch default Google Fonts. Chrome and ffmpeg are separately installed programs, not redistributed here.

## Qualification limits

The pinned engine and native WAAPI path were checked on macOS arm64 using local Chrome and ffmpeg. Pi 1.2.0 can discover a local selected instruction snapshot; the source monorepo's ordinary Git dependency installation fails on workspace dependencies, and the npm CLI does not expose Pi skills by default. This integration uses neither as a Pi package.

The firm method avoids unqualified global workflow installers, automatic upgrades, credential-usage queries, desktop handover and publishing. These are not role-specific authority restrictions: the runner is only the deliberately limited local production entry point, not a sandbox or a general HyperFrames CLI replacement. Ordinary tools still follow the current mandate and site rules.

Rendered-file checks and sampled frames do not establish full accessibility, aesthetic quality, complete unchanged-frame preservation, offline operation, cross-platform operation, or that every consultant/model will choose the method correctly. No hosted artifact collaboration, audio, generative video or working-office migration is included.

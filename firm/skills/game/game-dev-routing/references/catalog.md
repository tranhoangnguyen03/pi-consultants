# GameDev skill catalog: load narrowly

Source: [Awesome GameDev Agent Skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills). These are **source paths**, not installed files. Follow the link and open the few matching skill files only when needed. Always read the project's version first.

| Project signal | Upstream skill section |
|---|---|
| `project.godot` | `skills/godot/` (scenes, GDScript, physics, 2D/3D, export) |
| `Assets/` + `ProjectSettings/ProjectVersion.txt` | `skills/unity/` (C#, input, scene, export) |
| `*.uproject` | `skills/unreal/` (Blueprints, C++, input, packaging) |
| `go.mod` with Ebitengine | `skills/ebitengine/` |
| `Cargo.toml` with Bevy | `skills/other-engines/bevy-ecs/` |
| `package.json` with Phaser, PixiJS or three | `skills/web-engines/` |
| `game.project`, `conf.lua`, pygame imports, Rojo/Roblox file | `skills/other-engines/` |

Select a discipline only for the named work: `skills/disciplines/game-feel`, `game-ai`, `level-design`, `procedural-gen`, `save-systems`, `input-systems`, `game-ui-ux`, `create-game-assets`, `performance-optimization`. A genre-specific pattern belongs under `skills/genres/`; rapid experiments and releases under `skills/workflows/prototype-fast`, `steam-publish` or `itch-publish`.

When more than one engine fits, ask or inspect the requested subproject. Never guess or silently upgrade. If upstream is offline, use the local general methods and official engine documentation, and disclose limits. The upstream version table is for **new** projects, not a mandate to migrate existing ones.

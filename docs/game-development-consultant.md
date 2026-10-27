# Consultant H — Game Development

H develops games from ideas to playable, verified work. It combines game design, engine implementation, player experience, technical tests and shipping judgment. It does not replace B or F, and it does not require handoffs to them.

## Start

```sh
npm run setup
cd offices/game-development-consultant
pi
```

Ask: "Prototype one responsive jump in this Godot project", "Improve the save/retry loop in my Unity game", or "Choose a sensible engine for this small puzzle game". Use `/cd /absolute/path/to/game` **inside Pi** so the HQ retains its identity and records. Resume from the H folder with `pi --continue`.

## Capabilities

- `game-dev-routing` — inspect engine/version and discover relevant knowledge.
- `gameplay-prototyping` — build a small playable answer to one question.
- `gameplay-verification` — validate real build, controls, states and gameplay evidence.

The routing catalog points into [Awesome GameDev Agent Skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills), but **does not install or vendor all 76 skills**. Details are discovered on demand. The local read-only inspector works without an engine:

```sh
node offices/game-development-consultant/.pi/skills/game-dev-routing/scripts/inspect-project.mjs /path/to/game
```

It returns `unknown` or `ambiguous` instead of guessing; it only inspects the supplied directory. Follow pinned project versions instead of upstream new-game baselines. The standard shared Pi packages remain unchanged, and no game engine is installed automatically.

## Limits and verification

Technical builds are not proof of game quality. Independent player tests and live Godot/Unity/Unreal runs are not claimed in this first version. H still owns the assignment end to end and reports limitations.

Maintainers: edit `firm/`, run `npm run setup -- --rebuild --yes` and `npm run verify` before a PR. The H tests cover office construction, discovery and project version fingerprints; live gameplay remains a separate qualification step.

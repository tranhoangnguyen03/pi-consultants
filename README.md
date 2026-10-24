# Pi Consultants

Five AI consultants for [Pi](https://pi.dev), the terminal coding agent. Each one runs in its own folder, called an **office**, and its notes stay there between conversations. You keep doing your everyday work in your usual Pi session. When you want a second opinion, a careful review, help with the people side of a project, or a hard look at how your product works for its users, you open a consultant in another terminal.

The offices are **ready to use** in this repository's `offices/` folder. Clone it, run one setup command, and start Pi in an office.

## Why use it

- **A specialist, not a mode.** Each consultant has its own instructions, skills and history. It doesn't share a context window with your main session.
- **It remembers the project.** A consultant keeps private case records: a short brief, bounded objectives, decisions, findings and open questions. Next time, it can pick up where you left off instead of starting from scratch.
- **It can read your other sessions without interrupting them.** If you allow it, a consultant can search saved Pi session histories and ask one focused question about a saved session. The original session is never changed or messaged.
- **Your rules, applied every time.** Each office reads a playbook that you write: your working rules, which sources to trust and what to avoid.
- **It brings its own tools.** Every office ships the same toolset: web search and reading, documents, a browser, diagrams, Chrome DevTools audits, and optional connectors for the services you use. Your personal Pi setup is a bonus, not a requirement.
- **Local and private.** Offices are ordinary folders on your machine. There is no shared server or firm-wide memory, and the consultants don't share records.

## The five consultants

| Office folder | Consultant | Ask it about |
|---|---|---|
| `offices/engineering-consultant/` | **Engineering consultant (B)** | Code and design review, debugging and verification, test strategy, performance, simplification, documentation, and usability for people and for AI agents. |
| `offices/project-consultant/` | **Coordination and communication consultant (C)** | Priorities, commitments, stakeholders, meeting decisions, dependencies, release handoffs, and clear writing for the people involved. |
| `offices/user-consultant/` | **User consultant (D)** | Everyone who uses your product, people and the AI agents people assign tasks to: user research and synthesis, usability, UI critique, accessibility, behaviour analytics, journey maps, interface writing, agent experience, delegation to agents, and how a repository or package page looks to a first-time visitor. |
| `offices/research-consultant/` | **Research scientist (E)** | Literature, scientific reasoning, hypotheses, experiment design and analysis, recent practitioner reports, and clear findings. |
| `offices/design-consultant/` | **Design & front-end consultant (F)** | Visual direction, interaction design, front-end implementation, responsive layouts, interface polish, and browser-based review. |

You don't need to pick a skill or fill in a form. Describe your concern in plain language and the consultant decides how to approach it. Every consultant has normal Pi powers: it can read files, run commands and edit files on your machine, and work in your repositories and connected services. Their specialty decides which tools they reach for, not which they may use. Before any outside action (pushing, posting, messaging, changing a ticket) a consultant gives you a heads-up. Any consultant can also prepare an exact outgoing action for you to approve with `/hq approve` first, then keep a receipt (the optional outbox).

## What you need

- **macOS or Linux with a terminal.** The commands below were tested on macOS. Windows has not been tested.
- **Git**, to clone this repository.
- **Node.js 24.15 or newer.** Check with `node --version`. Pi itself accepts Node 22.19+, but the directory-switching package these offices install requires 24.15.0 or newer. We tested with Node 26.11.1. If you use nvm, `nvm install 26` and `nvm use 26` are one way to get there. Use the same Node version for every step below.
- **Pi 1.2 or newer**, installed and signed in to a model provider (tested with Pi 1.2.0). See the next section.
- **Network access** the first time each office starts, so Pi can download the office's pinned packages.
- **Optional software** some tools use: `gh` (GitHub CLI), Google Chrome, `yt-dlp` and `ffmpeg`. `doctor` (run by setup) tells you which are missing and how to install them.

## Install and sign in to Pi

Skip this section if `pi --version` already works and Pi can answer a prompt.

Pi's [official installer](https://pi.dev) (macOS/Linux):

```sh
curl -fsSL https://pi.dev/install.sh | sh
```

Or install with npm:

```sh
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

Check it:

```sh
pi --version
```

Then sign in. Start `pi` in any folder, type `/login`, choose a provider and follow the prompts to use a subscription or an API key. Use `/model` to pick a model, then `/quit` to exit. Pi saves credentials for your user account, so every office uses them; you don't sign in again for each office. Pi can also read provider API keys such as `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` from the environment. For providers, local models and other details, see Pi's [quickstart](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/quickstart.md).

## Quickstart: clone to first conversation

### 1. Clone and run setup

```sh
git clone https://github.com/tranhoangnguyen03/pi-consultants.git ~/pi-consultants
cd ~/pi-consultants
npm run setup
```

The five offices are already in the repository. Setup asks a few questions for each one; press Enter to skip any:

- **Your organization's shared playbook?** Give the path to one playbook file and setup installs it in every office (next step). Or skip, and it offers to copy the example for you to edit.
- **Project folders** the consultant works in, for example `~/code/my-project`. Folders must exist.
- **Pi session folders** it may search. By default it sees only its own sessions. Pi normally saves sessions under `~/.pi/agent/sessions/`, grouped by working folder. Allow only what you want the consultant to read.
- **Connectors** to switch on, such as `linear`, `figma` or `posthog`. You sign in to them later inside Pi.

Then it runs `doctor` and lists anything missing, with how to install it. Setup writes only each office's private files (`organization/PLAYBOOK.md`, `.pi/hq.local.json`); it never changes the shipped files. Run it again any time. `npm run setup -- --only user` limits it to one office; `--yes` skips the questions.

### 2. Write your playbook

Each office reads `organization/PLAYBOOK.md` before organization-specific work. If the file is missing, the consultant tells you instead of guessing your rules. Keep **one shared playbook** for your organization, outside the repository (for example `~/my-org/PLAYBOOK.md`), and install it in every office with `npm run setup -- --playbook ~/my-org/PLAYBOOK.md`. Run that again whenever you change it; an office's previous copy is saved in its `.hq/setup-backup/` first. Rules meant for one consultant only go in that office's `organization/PLAYBOOK.local.md`; the shared playbook wins on conflict. Start from `organization/PLAYBOOK.example.md` and replace the `SET ME` lines. If you work alone, this is still worth doing: the "organization" can be you. A short playbook works fine. For example:

```markdown
# Organization playbook

Organization: Jane Doe (independent developer)
Canonical source: this organization/PLAYBOOK.md file (maintained by me)
Revision: 2026-10-13

- Sources: trust the repository and its issue tracker over chat history; ask me when they disagree.
- Ask before committing, pushing, or contacting anyone outside this machine.
- Prefer small, reversible changes. Run the project's tests before saying a change is done.
- Don't copy client names or secrets into notes.
```

Write rules you actually want followed. The template is a placeholder, not a policy.

### 3. Start your first conversation

```sh
cd ~/pi-consultants/offices/engineering-consultant
pi
```

Always start Pi **from inside the office folder**. That is how Pi finds the consultant's instructions, skills, tools and records. When Pi asks whether to trust this folder, review it and accept: the consultant's tools and pinned packages load only after you do, and Pi downloads the packages on this first start. Then ask in plain language, for example:

```text
Please review the error handling in ~/code/my-project/src/api and tell me what you'd fix first.
```

After Pi starts in a consultant office, you may use `/cd /path/to/project` to work in that project without moving the consultant's HQ, skills or case records. For instance, start in `offices/design-consultant`, then `/cd ~/code/my-app`. The Impeccable detector uses the visited project's working directory.

Useful commands inside an office:

- `/consult`, `/case-recap`, `/close-consultation`: prompts for opening a consultation, recapping a project's history and wrapping one up.
- `/hq`: shows the consultant's role, its records folder and its currently selected case.
- `/mcp`: shows connectors; sign in to the ones you switched on.
- `pi --continue` (from the office folder): resumes the most recent conversation.

The other offices work the same way: `cd ~/pi-consultants/offices/project-consultant`, `cd ~/pi-consultants/offices/user-consultant`, `cd ~/pi-consultants/offices/research-consultant`, or `cd ~/pi-consultants/offices/design-consultant`, then `pi`. See [Research Scientist E](docs/research-consultant.md) for optional tools and the safe recent-search mode, and [Design & Front-end F](docs/design-consultant.md) for role-specific guidance.

## Optional: human-steered parallel sessions

Ask the project consultant to plan named branches when you want to visit and steer each one yourself. Approve the assignments, open the agreed Pi sessions, and give it their names or Intercom IDs. It sends the briefs without waiting for the work to finish; each branch gathers context, reports in its own session, and pauses for you. When you tell the main consultant a branch is ready, it coordinates the handback and incorporates the results. You do not need to copy messages or merge reports yourself.

This practice uses [pi-intercom](https://github.com/nicobailon/pi-intercom), an optional package you install and enable separately in the participating sessions. It is **not** the customer-support Intercom connector listed below. The sessions must share a broker and routing scope. Before relying on it, test one kickoff and handback; `human-first` busy delivery is recommended but must be configured explicitly. This kit supplies the [coordination method](firm/skills/coordination/parallel-branches/SKILL.md), not a session launcher, mandatory dependency, or proof of live delivery in your setup.

## Paperthin skill pilot

The firm includes four locally adapted [Paperthin](https://github.com/LilMGenius/paperthin) methods, not a new runtime or multi-agent framework.

- All five consultants: `consultant-readchk` checks intent on complex work; `consultant-shower` cold-reads important handoffs when a real independent reviewer is available; `consultant-re0-memo` records useful assignment lessons within the owning office's case.
- Coordination consultant only: `coordination-prism` provides human-invoked cross-lens review without automatic agent sessions.

Ask the consultant in plain language for the three shared methods, or run `/skill:coordination-prism` in the coordination office (`coordination-prism` is command-only so the model never runs it automatically). Skill names are prefixed so they do not collide with a global Paperthin installation. These skills do not grant extra authority, replace case storage, message other offices, or publish private records. `consultant-shower` must state when independent review did not run. See the [Paperthin MIT notice](firm/skills/shared/readchk/NOTICE.md).

These are pilot methods. Compare real outcomes before broad adoption.

## The shared toolset

Every office ships the same tools, listed in its `.pi/toolset.json`. Pi installs the pinned packages the first time you start in a trusted office.

| Ships ready | What for |
|---|---|
| [`pi-change-working-dir`](https://github.com/fitchmultz/pi-change-working-dir) | Lets a consultant work in your project folder while its records stay in the office |
| `pi-web-access` | Web search (no key needed by default) and reading pages, PDFs and videos |
| `pi-docparser` | Word, PowerPoint, Excel, PDF and images |
| `pi-agent-browser` | Using real web pages; installs its own browser on first use |
| `diagram-design` skill | Architecture, timelines, journey maps, service blueprints and short diagram motion |
| Shared `composition` skill | Scene-based explainers with local Studio preview and MP4 export; explicit tool installation required |
| Chrome DevTools MCP | Accessibility and performance audits of web pages (needs Chrome) |

**Composition:** every consultant receives the same [production method](firm/skills/shared/composition/SKILL.md), with selected pinned HyperFrames references. It is separate from D's public-presentation method and its VHS terminal recordings. The CLI installs only on an explicit setup step into that office's ignored `.hq/tools/`; it needs npm, ffmpeg/ffprobe and installed Chrome. No hosted account is needed. Compilation can fetch Google Fonts; Studio modifies HTML with element IDs and project history. The runner disables telemetry and automatic CLI/skill updates and does not inherit model credentials, but it is not a sandbox. See the skill for commands and [source/licence details](firm/skills/shared/composition/SOURCE.md). Cross-platform and offline operation are not qualified.

**Connectors** ship switched off: GitHub (uses your `gh` login), Sentry, Linear, Slack, Figma, PostHog, Mixpanel, Amplitude, Microsoft Clarity, Dovetail and Intercom. Switch one on with setup or with `node .runtime/bin/hq.mjs configure --connect NAME` in the office, then sign in with `/mcp` inside Pi. Clarity and Dovetail read an API token from `CLARITY_API_TOKEN` and `DOVETAIL_API_TOKEN`. Slack may require your workspace's own Slack app. A connector with the same name in your personal Pi MCP settings takes precedence. Connector sign-ins have not all been tested with Pi; report what doesn't work.

## Customizing the consultants

The consultants are built from `firm/`: instructions in `firm/profiles/`, skills in `firm/skills/`, the office list in `firm/offices.json`, the toolset in `firm/toolset.json`. To change them, edit `firm/` and build **your own offices outside the repository**:

```sh
npm run setup -- --out ~/my-consultants
```

Running the same command later updates those offices from your `firm/`. This keeps the shipped offices untouched, so `git pull` never collides with your changes. Advanced: `npm run setup -- --rebuild` regenerates the offices inside the repository instead; your next `git pull` may then conflict with them.

## What to expect

- **It's a capable assistant, not an authority.** Records keep track of what was claimed and where it came from. They don't prove that a claim is true. Check important conclusions yourself.
- **Notes are deliberate.** A consultant saves significant findings, decisions and open questions when it decides they matter or when you ask. Not every reply is saved. Ask it to record something if you want it kept.
- **"Delivered" is not "accepted."** Delivery and closure are separate recorded steps. Closure should mean the completion condition was met or you stopped the work; the tool does not independently verify acceptance.
- **No guarantees for production use.** Automated tests and real Pi startup checks pass, but there has been no long-term field use, no load testing and no qualification of recall over real long histories. Treat it as early software.
- **Updates are deliberate.** Offices change only when you pull or run setup. See [Updating](#updating).

## Privacy and safety

- Each office stores its records and sessions in a local `.hq/` folder inside the office. This is not encrypted storage or a guarantee that content stays on-device: material read into a conversation can be sent to your model provider.
- Conversations go to whichever model provider you configured in Pi, just like any Pi session.
- An office keeps your normal Pi setup: its credentials, global extensions and integrations. If you have connected services such as email or chat, the consultant can use them too, along with any connectors you switch on.
- Each office installs third-party Pi packages and starts MCP servers listed in `.pi/toolset.json`, pinned to specific versions. They run code with your permissions; review them before trusting an office if you have any doubt.
- Consultants can read, edit and run anything your user account can. Folder settings such as `--projects` and project trust are not a sandbox. For sensitive work, use a separate account, container or virtual machine. See Pi's [security notes](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/security.md).
- Each office includes a `.gitignore` for its private files (`.hq/`, `.env`, `organization/PLAYBOOK.md`, `organization/PLAYBOOK.local.md`, local settings), so your records stay out of git. Never commit playbooks, credentials or client records to a public repository.

## Updating

- **Offices in the repository:** close Pi sessions in them, then `git pull`. Run `npm run setup` afterwards to build any newly added consultant.
- **Your own offices (`--out`):** `git pull`, then `npm run setup -- --out ~/my-consultants`.

Every update keeps each office's private files (`.hq/`, `organization/PLAYBOOK.md`, `organization/PLAYBOOK.local.md`, `.env`, `.pi/hq.local.json`, `.pi/mcp.json`) and files you added. If you edited a shipped file, setup stops and lists it, changing nothing. Move your change into `firm/`, or rerun with `--force` to save the edited files into `.hq/setup-backup/` and replace them. There is no automatic migration of case records between versions.

## Continuous integration

PRs must pass deterministic verification (tests, skill routing, TypeScript entry syntax, privacy checks, and generated-office drift). After each merge into `main`, GitHub Actions tests real, pinned Pi on Ubuntu and macOS without model calls. See [CI checks and release guidance](docs/CI.md). Consultant quality evaluations are deliberately excluded.

## For maintainers

The factory source is in `firm/`. Its tests run offline and need no Pi credentials:

```sh
cd firm
npm test        # behaviour and integration tests
npm run check   # syntax, JSON and skill-header checks
npm run demo    # offline walkthrough with synthetic data; no model or Pi process
npm run eval    # offline checks of the office startup layout
```

From the repository root, `npm run verify` runs the tests, the structure check and `drift` — the same command CI runs, and the only one you need before a PR.

**Contributor rule:** `offices/` is generated. Edit `firm/`, then rebuild and commit `offices/` **in the same PR**:

```sh
npm run setup -- --rebuild
npm run verify
```

Forgetting the rebuild fails CI, not silently. Never edit a file under `offices/` by hand: `drift` rejects any committed file the factory does not produce, because Pi auto-loads `.pi/extensions/` and `.pi/skills/` as code. `firm/package.json` is the only version source; a version bump forces a rebuild because the version lands in each office's generated `package.json`.

**Reviewers read `firm/` only.** `offices/**` is marked generated, and CI proves it matches what `firm/` builds, so the generated diff needs no line-by-line reading. When a change touches a third-party pin (`firm/toolset.json`, or the composition lockfile), check the upstream release for that exact version and name it in the release notes — CI enforces that pins are exact, not that anyone looked.

Releases are a tag plus a GitHub release on a `main` commit, cut when there is something to announce; `main` is live for `git pull` regardless. `main` takes PRs only. Users who want a fixed version can `git checkout vX.Y.Z`.

`firm/scripts/live-pi-smoke.mjs` starts real Pi in an office without sending a prompt. Pi startup can still connect your inherited integrations. See `firm/README.md` and `firm/eval/README.md` for details.

## License

MIT. See [`LICENSE`](LICENSE). Third-party material keeps its own license and attribution:

- The engineering consultant's Simplified Technical English skill (`firm/skills/engineering/asd-ste100/`) comes from [danyuchn/asd-ste100-skill](https://github.com/danyuchn/asd-ste100-skill) under the MIT license (copyright Dustin Yuchen Teng). See its `LICENSE` and `SOURCE.md`, and keep both with any copy.
- The shared composition skill includes seven unchanged HyperFrames technical references (copyright HeyGen, Inc., Apache-2.0). Keep its `SOURCE.md` and `references/upstream/LICENSE` with copies. The CLI is downloaded separately from its lockfile; dependencies/assets retain their own licences, including optional LGPL image binaries.
- The four Paperthin pilot skills (`firm/skills/shared/{readchk,shower,re0-memo}/` and `firm/skills/coordination/prism/`) are adapted from [LilMGenius/paperthin](https://github.com/LilMGenius/paperthin) under the MIT license (copyright LilMGenius). Keep `firm/skills/shared/readchk/NOTICE.md` with copies.
- The third-party Pi/MCP toolset is not bundled. Pi or `npx` downloads each item from its author at the pinned version, under its own license: [`pi-change-working-dir`](https://github.com/fitchmultz/pi-change-working-dir), `pi-web-access`, `pi-docparser`, `pi-agent-browser`, [`diagram-design`](https://github.com/cathrynlavery/diagram-design) and `@microsoft/clarity-mcp-server` (MIT), and [`chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp) (Apache-2.0). Remote connectors are services run by their vendors under their own terms.

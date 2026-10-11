# Pi Consultants

Two AI consultants for [Pi](https://pi.dev), the terminal coding agent. Each one runs in its own folder, called an **office**, and its notes stay there between conversations. You keep doing your everyday work in your usual Pi session. When you want a second opinion, a careful review or help with the people side of a project, you open a consultant in another terminal.

This repository is the **factory**. It contains no ready-made offices. You run one command to build two fresh offices on your own machine, then set each one up once.

## Why use it

- **A specialist, not a mode.** Each consultant has its own instructions, skills and history. It doesn't share a context window with your main session.
- **It remembers the project.** A consultant keeps private case records: a short brief, bounded objectives, decisions, findings and open questions. Next time, it can pick up where you left off instead of starting from scratch.
- **It can read your other sessions without interrupting them.** If you allow it, a consultant can search saved Pi session histories and ask one focused question about a saved session. The original session is never changed or messaged.
- **Your rules, applied every time.** Each office reads a playbook that you write: your working rules, which sources to trust and what to avoid.
- **Local and private.** Offices are ordinary folders on your machine. There is no shared server or firm-wide memory, and the two consultants don't share records.

## The two consultants

| Office folder | Consultant | Ask it about |
|---|---|---|
| `engineering-consultant/` | **Engineering consultant** | Code and design review, debugging and verification, test strategy, performance, simplification, documentation, and usability for people and for AI agents. |
| `project-consultant/` | **Coordination and communication consultant** | Priorities, commitments, stakeholders, meeting decisions, dependencies, release handoffs, and clear writing for the people involved. It can also prepare outgoing messages that you review before they are sent (optional). |

You don't need to pick a skill or fill in a form. Describe your concern in plain language and the consultant decides how to approach it. Both consultants have normal Pi powers: they can read files, run commands and edit files on your machine.

## What you need

- **macOS or Linux with a terminal.** The commands below were tested on macOS. Windows has not been tested.
- **Git**, to clone this repository.
- **Node.js 24.15 or newer.** Check with `node --version`. Pi itself accepts Node 22.19+, but the directory-switching package these offices install requires 24.15.0 or newer. We tested with Node 26.11.1. If you use nvm, `nvm install 26` and `nvm use 26` are one way to get there. Use the same Node version for every step below.
- **Pi**, installed and signed in to a model provider (tested with Pi 1.1.0). See the next section.
- **Network access** the first time each office starts, so Pi can download the pinned package from GitHub.

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

Then sign in. Start `pi` in any folder, type `/login`, choose a provider and follow the prompts to use a subscription or an API key. Use `/model` to pick a model, then `/quit` to exit. Pi saves credentials for your user account, so both offices use them; you don't sign in again for each office. Pi can also read provider API keys such as `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` from the environment. For providers, local models and other details, see Pi's [quickstart](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/quickstart.md).

## Quickstart: clone to first conversation

These examples use three locations. Change them if you like:

| Placeholder | Example used below | What it is |
|---|---|---|
| Factory | `~/pi-consultants` | This repository. You only need it to build offices. |
| Offices | `~/consultant-offices` | Where the two offices are created. **The folder must not already contain them.** |
| **Your project** | `~/code/my-project` | **Replace this with a real folder you want help with.** |

### 1. Clone and build the offices

```sh
git clone https://github.com/tranhoangnguyen03/pi-consultants.git ~/pi-consultants
cd ~/pi-consultants
node firm/scripts/build-hqs.mjs ~/consultant-offices
```

This creates `~/consultant-offices/engineering-consultant/` and `~/consultant-offices/project-consultant/`. Each office has its own copy of everything it needs, so it doesn't depend on this clone afterwards. The builder refuses to overwrite an office that already exists. Never rebuild into the folder of an office you are using.

### 2. Write your playbook

Each office reads `organization/PLAYBOOK.md` before organization-specific work. If the file is missing, the consultant tells you instead of guessing your rules. Start from the included template:

```sh
cd ~/consultant-offices/engineering-consultant
cp organization/PLAYBOOK.example.md organization/PLAYBOOK.md
```

Open `organization/PLAYBOOK.md` in your editor and replace the `SET ME` lines. If you work alone, this is still worth doing: the "organization" can be you. A short playbook works fine. For example:

```markdown
# Organization playbook

Organization: Jane Doe (independent developer)
Canonical source: this organization/PLAYBOOK.md file (maintained by me)
Revision: 2026-10-12

- Sources: trust the repository and its issue tracker over chat history; ask me when they disagree.
- Ask before committing, pushing, or contacting anyone outside this machine.
- Prefer small, reversible changes. Run the project's tests before saying a change is done.
- Don't copy client names or secrets into notes.
```

Write rules you actually want followed. The example template is a placeholder, not a policy. Each office has its own playbook, so copy yours into the other office too, or write a different one.

### 3. Point the office at your project

```sh
node .runtime/bin/hq.mjs configure --projects ~/code/my-project
```

Replace `~/code/my-project` with your project folder. It must already exist. Repeat `--projects` for more folders. This changes only the office's local settings file. Optional extras:

- `--sessions <folder>` lets the consultant search saved Pi sessions in that folder. By default it can only see its own sessions. Pi normally saves sessions under `~/.pi/agent/sessions/`, grouped by working folder. Allow only what you want the consultant to read.
- `--provider <name> --model <id>` sets a default model for this office only.

### 4. Install the pinned directory package

The offices use [`pi-change-working-dir`](https://github.com/fitchmultz/pi-change-working-dir), a third-party Pi package that lets a consultant move into your project folder while its records stay in the office. It is pinned to one reviewed commit:

```sh
pi install 'git:github.com/fitchmultz/pi-change-working-dir@d0846a834036b17fd118d0ca1011331812cea52b' --local --approve
```

`--local` records the package in this office only, not in your global Pi settings. `--approve` trusts this office folder for this one command. Packages run code with your permissions, so check the source first if you have any doubt. If you skip this step, Pi installs the package itself the first time you start in the office and trust it.

### 5. Check your setup

```sh
node .runtime/bin/hq.mjs doctor
```

Look for `"verdict": "prerequisites_met"`. If a check fails, read its `detail` field. The usual cause is an old Node version: `doctor` checks the `node` that runs it. `doctor` checks only local files and versions. It doesn't start Pi or test a model.

### 6. Start your first conversation

```sh
cd ~/consultant-offices/engineering-consultant
pi
```

Always start Pi **from inside the office folder**. That is how Pi finds the consultant's instructions, skills and records. When Pi asks whether to trust this folder, review it and accept. The consultant tools won't load until you do. Then ask in plain language, for example:

```text
Please review the error handling in ~/code/my-project/src/api and tell me what you'd fix first.
```

Useful commands inside an office:

- `/consult`, `/case-recap`, `/close-consultation`: prompts for opening a consultation, recapping a project's history and wrapping one up.
- `/hq`: shows the consultant's role, its records folder and its currently selected case.
- `pi --continue` (from the office folder): resumes the most recent conversation.

### 7. Set up the coordination consultant

Repeat steps 2–6 in the second office:

```sh
cd ~/consultant-offices/project-consultant
cp organization/PLAYBOOK.example.md organization/PLAYBOOK.md
# edit organization/PLAYBOOK.md, then:
node .runtime/bin/hq.mjs configure --projects ~/code/my-project
pi install 'git:github.com/fitchmultz/pi-change-working-dir@d0846a834036b17fd118d0ca1011331812cea52b' --local --approve
node .runtime/bin/hq.mjs doctor
pi
```

Its outgoing-message review is optional. If you use it, the consultant prepares exact drafts, you review and approve them with `/hq approve`, and it keeps a receipt. Without it, the consultant behaves like any Pi session and follows your instructions and playbook.

## What to expect

- **It's a capable assistant, not an authority.** Records keep track of what was claimed and where it came from. They don't prove that a claim is true. Check important conclusions yourself.
- **Notes are deliberate.** A consultant saves significant findings, decisions and open questions when it decides they matter or when you ask. Not every reply is saved. Ask it to record something if you want it kept.
- **"Delivered" is not "accepted."** Delivery and closure are separate recorded steps. Closure should mean the completion condition was met or you stopped the work; the tool does not independently verify acceptance.
- **No guarantees for production use.** Automated tests and real Pi startup checks pass, but there has been no long-term field use, no load testing and no qualification of recall over real long histories. Treat it as early software.
- **Updates are manual.** There is no automatic upgrade or migration for an office you already use. See [Updating an office](#updating-an-office).

## Privacy and safety

- Each office stores its records and sessions in a local `.hq/` folder inside the office. This is not encrypted storage or a guarantee that content stays on-device: material read into a conversation can be sent to your model provider.
- Conversations go to whichever model provider you configured in Pi, just like any Pi session.
- An office keeps your normal Pi setup: its credentials, global extensions and integrations. If you have connected services such as email or chat, the consultant can use them too.
- Consultants can read, edit and run anything your user account can. Folder settings such as `--projects` and project trust are not a sandbox. For sensitive work, use a separate account, container or virtual machine. See Pi's [security notes](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/security.md).
- Each office includes a `.gitignore` for its private files (`.hq/`, `.env`, `organization/PLAYBOOK.md`, local settings). If you put an office under version control, keep the repository private. Never commit offices, playbooks, credentials or client records to this public repository.

## Updating an office

Generated offices never update themselves. To use a newer version of this factory:

1. Pull this repository and build into a **new, empty** folder, for example `~/consultant-offices-new`.
2. Stop every Pi session that is running in the old office.
3. Back up the old office, especially `.hq/`, `organization/PLAYBOOK.md`, `.pi/hq.local.json`, `.env` and any files you customized.
4. Compare the new office with the old one. Replace only the product files you agreed to change, and keep your private state and customizations.
5. Run `doctor`, start Pi and check that your cases are still there.

Never restore a backup over newer work without comparing the two first.

## For maintainers

The factory source is in `firm/`. Its tests run offline and need no Pi credentials:

```sh
cd firm
npm test        # behaviour and integration tests
npm run check   # syntax, JSON and skill-header checks
npm run demo    # offline walkthrough with synthetic data; no model or Pi process
npm run eval    # offline checks of the office startup layout
```

`firm/scripts/live-pi-smoke.mjs` starts real Pi in a generated office without sending a prompt. Pi startup can still connect your inherited integrations. See `firm/README.md` and `firm/eval/README.md` for details.

## License

MIT. See [`LICENSE`](LICENSE). Third-party material keeps its own license and attribution:

- The engineering consultant's Simplified Technical English skill (`firm/skills/engineering/asd-ste100/`) comes from [danyuchn/asd-ste100-skill](https://github.com/danyuchn/asd-ste100-skill) under the MIT license (copyright Dustin Yuchen Teng). See its `LICENSE` and `SOURCE.md`, and keep both with any copy.
- [`pi-change-working-dir`](https://github.com/fitchmultz/pi-change-working-dir) is not bundled. Pi downloads it from its author at the pinned commit, under that project's own license.

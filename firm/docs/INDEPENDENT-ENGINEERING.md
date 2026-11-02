# Independent Engineering agent: preview runbook

Engineering consultant B is the first independent application. Its release contains a compiled PiG specialist, Node, the existing HQ tools, all shared and Engineering skill trees, prompt templates, and the pinned shared Pi packages with their production dependencies. It runs without a Pi installation or a firm checkout. Git and the optional external programs listed by `doctor` remain machine requirements.

The [independent-agent design](INDEPENDENT-AGENTS.md) defines the primitive and its ownership. This preview implements direct use, main-Pi delegation and a bounded agent-to-agent consultation. Firm, department and room orchestration remain consumers of this primitive.

## Download and install

Open the PR's **Independent Engineering** Actions run and download the artifact for your machine: `linux-x64`, `darwin-arm64` or `darwin-x64`. It contains a `.tar.gz`, its `.sha256` and a smoke report. Check that target's build and smoke jobs passed. These are preview artifacts, retained for 14 days, not an automatically published stable release.

Unzip the Actions artifact, then verify and extract its archive. For example, on an Apple Silicon Mac:

```sh
shasum -a 256 -c engineering-agent-0.1.0-preview.1-darwin-arm64.tar.gz.sha256
tar -xzf engineering-agent-0.1.0-preview.1-darwin-arm64.tar.gz
./bundle/engineering-agent install --home "$HOME/.pi-consultants/engineering"
"$HOME/.pi-consultants/engineering/bin/engineering-agent" describe
export PATH="$HOME/.pi-consultants/engineering/bin:$PATH"
```

On Linux use the `linux-x64` filename and `sha256sum -c`. The archive checksum detects a damaged download; it is not a signature from a separate trust authority. The installer checks recorded release files before copying them. Native macOS artifacts are not notarized; if macOS blocks one, review the source and use the system's explicit open/allow flow, or build locally.

Installation creates a stable command at `<home>/bin/engineering-agent`. The PATH command above makes the shorter commands below available in the current shell; using the full executable path also works. You can discard the extracted download after installation. A first run without `install` initializes a new home automatically, with installation diagnostics on stderr so RPC stdout stays JSONL. An existing home selects another release only through `install`.

## Configure and talk to B

```sh
engineering-agent doctor
engineering-agent configure --projects "$HOME/code/my-project"
engineering-agent --cwd "$HOME/code/my-project"
```

The default home is `~/.pi-consultants/engineering`. The default working directory is the caller's directory; `--cwd` overrides it. `/cd` and the `change_dir` tool change execution location while cases remain in the home.

Use `/login` to configure a provider, `/model` to select a model, and ask a normal question. Standard provider environment variables also work. Account files live in this home's `.pi`, independently of your daily-driver Pi. Existing daily-driver credentials are not copied automatically. To reuse access, configure the same provider or explicitly copy the particular credential file into the new home yourself. Never include account files in source or release builds.

Create `<home>/organization/PLAYBOOK.md` from its adjacent example and edit it for your organization. Optional consultant-only additions go in `PLAYBOOK.local.md`. The application loads these private rules each turn; the shared playbook wins on conflict. Provider preferences live in `.pi/settings.json`; custom providers use `.pi/models.json`. HQ configuration uses `.pi/hq.local.json` through `configure`. These local settings persist across releases.

The shared Pi packages are already installed. External integrations retain their requirements: Chrome/agent-browser, `gh`, `yt-dlp`, ffmpeg, LibreOffice for some Office-format conversions, connector accounts, and explicit HyperFrames setup where used. Chrome DevTools follows the shared toolset's enabled default and can download its pinned MCP program on first connection. `--no-mcp` is useful for a first test without connectors; it does not change saved configuration. The app has your ordinary operating-system access; it is not an execution sandbox.

Optional npm helper installs made inside the agent use `<home>/.hq/tools/npm`, with cache in `.hq/cache/npm`. Their executables are on the agent's PATH, after bundled Node. This lets a confirmed browser-helper installation persist without modifying the versioned release or your daily-driver npm prefix. It does not install a browser automatically.

```sh
engineering-agent -p "Review this project's error handling; do not edit files."
engineering-agent --mode json -p "Explain the main technical risk."
engineering-agent -c
engineering-agent --session /absolute/path/to/a/saved-session.jsonl
```

`-c` resumes the latest session in this home's session directory. Choose an explicit session file when working across several projects. Standard PiG flags pass through; `--help` describes the wrapper. `/hq`, `/consult`, `/case-recap` and `/close-consultation` keep their existing purposes. Restored case selection is context; writes still need an explicit selection or matching asserted case key.

## Invoke B from your main Pi

The opt-in adapter adds two tools to your existing harness: `agent_peers` lists configured colleagues; `agent_ask` sends one colleague a bounded request. It creates no HQ or new memory store in your main session.

Create `~/.pi-consultants/main/.pi/agents.json` with absolute paths for your machine:

```json
{
  "peers": {
    "engineering": {
      "description": "Engineering consultant B: review, debugging, design and verification",
      "command": "/Users/you/.pi-consultants/engineering/bin/engineering-agent",
      "args": [],
      "cwd": "/Users/you/code/my-project",
      "release": "0.1.0-preview.1"
    }
  }
}
```

Load the adapter from the installed release:

```sh
pi -e "$HOME/.pi-consultants/engineering/.agent/current/app/main-pi.ts"
```

Or load `/absolute/path/to/pi-consultants/firm/independent/main-pi.ts` from a checkout. Ask your main agent: “Ask engineering to review this project's error handling and give us its three most important findings. Share the task and relevant context; do not authorize edits.” The child receives the supplied request, retains its own complete tools and private home, and returns its answer plus session information. The parent assesses and integrates that answer.

`PI_CONSULTANTS_HOME` can choose another directory containing `.pi/agents.json` for the main adapter. Peer `args` are literal arguments, not a shell command; omit `--mode` because the client adds RPC. Relative `command` paths containing a separator and relative `cwd` paths resolve from the peer configuration home. `env` may supply explicit process overrides; keep credentials in private configuration or the process environment. `release` is an operator label, not verified remote identity; `engineering-agent describe` reports actual release provenance.

## Let independent colleagues cooperate

Every Engineering installation includes the same two collaboration tools. Put the same peer-file shape in its own `<home>/.pi/agents.json`. A second instance can use the same release with another home:

```sh
./bundle/engineering-agent install --home "$HOME/.pi-consultants/reviewer"
```

Configure `reviewer` as a peer of the first installation, pointing to the reviewer's stable command. Ask the first agent to obtain an independent second opinion and reconcile the findings. The installations share no case store. A room or team coordinator can manage several such executable/home pairs without repackaging their expertise.

An `agent_ask` is one fresh, bounded conversation: five minutes by default, configurable up to thirty. It streams progress, waits for PiG's settled event, returns the result and saved session, then closes the child. Startup and first installation count toward that deadline. It does not attach to an already-running terminal, create a background worker or automatically retry external actions. Revisit a returned session explicitly with `--session`; a future coordinator can manage longer-lived RPC clients.

Select, confirmation, input and editor dialogs are forwarded to the caller's UI. If the client cannot provide the required human interaction, it cancels or reports that limitation; no approval is fabricated. Cancellation or timeout aborts and closes the child process group. Cycles, nested delegation budgets and automatic scheduling are not implemented; configure finite task relationships.

## Upgrade, maintain and recover

Maintain canonical practice in `firm/profiles/engineering`, `firm/profiles/shared`, `firm/skills`, `firm/src` and `firm/toolset.json`. Application composition is in `firm/independent`: version in `engineering.json`, engine/Node/diagram pins in `runtime-lock.json`, npm graph in `packages/package-lock.json`. Updating the shared package list requires updating that lock; the build rejects drift between them. Local practice improvements need to return to source before they enter a release.

With Git, curl, tar, Node 24.15+ and network access:

```sh
npm run verify
node firm/independent/build.mjs
node firm/independent/smoke.mjs --bundle firm/dist/independent/bundle
```

The build downloads checksum-pinned PiG and Node, obtains PiG's matching Go toolchain, installs locked production packages, generates the complete office and compiles the HQ/collaboration extension. Rich skills remain full directories so scripts and references retain their relative paths. Output is `firm/dist/independent/`; a working private office is never a build input. The release manifest records source revision, runtime versions, build identity and file inventory. `build-manifest.yaml` records the generated compilation recipe; rebuild from maintained source, not that record alone.

Build natively on the target OS/architecture. PR and tag CI produce the three platform artifacts without publishing a release. A later explicit GitHub release can attach the same verified archives. Windows, containers and remote transports are not part of this preview.

To update, close sessions using the home, download and verify a new archive, and run its `engineering-agent install --home <existing-home>`. Only recorded application files are replaced. Cases, sessions, outbox, account files, local settings, peer configuration, private playbooks and user-added files remain. New settings defaults appear in `.pi/settings.defaults.json`; existing settings are not silently merged or reset. An edited managed practice file stops replacement with the conflicting paths listed. Preserve the local improvement, move it into source when appropriate, then retry.

Prior releases remain under `.agent/releases`; replaced practice is backed up under `.agent/backups`. Selecting an older release through `install` uses the same conflict checks and requires a compatible state schema. It rolls back code/practice, not case history or external actions. There are no automatic case migrations. An interrupted install blocks launch: rerun `install` from that exact release to finish. Keep a separate backup of private home state before substantial changes; public releases contain no such backup.

## Manual acceptance checklist

1. Install outside the checkout, preferably in a path containing spaces. Run `describe`, `doctor`, `/login` and a real prompt with your chosen provider.
2. Ask B to explain its specialty, inspect a skill reference and use a relevant companion script. Check that its review and consultation methods remain useful.
3. Create/select a disposable case, record an attributed finding, close and resume. Check continuity and the explicit-write requirement after restoration.
4. Travel with `/cd` to a disposable project. Verify reads and bash use the project while case state stays in the home.
5. Load the main-Pi adapter and consult B. Then configure a second home for a second-opinion exchange. Cancel a request and confirm the child stops.
6. Reinstall the preview, then test a later release when available. Check settings, playbook and records remain. An intentional managed-skill edit should stop replacement until resolved.

Automated smoke uses the real compiled runtime, installed packages and a deterministic local provider. It checks packaging, tools, persistence, restart and delegation, not model judgment. Live provider/OAuth flows, connector accounts, interactive terminal UX and the usefulness of a real consultation remain manual tests. Support claims should follow each target's actual CI result. ACP/A2A and automatic firm/team/room orchestration are not claimed.

# Review tool availability and setup

The workbench is usable with native Pi, git and ordinary project tools. No optional scanner or agent needs to be present before B can review code.

## Discover what's installed

~~~sh
node /path/to/engineering-consultant/.pi/skills/change-review/scripts/review-tool-doctor.mjs
node /path/to/engineering-consultant/.pi/skills/change-review/scripts/review-tool-doctor.mjs --json
~~~

This helper inspects executables on PATH. It **does not** launch them, configure Pi, install software, perform network calls or infer tool compatibility from mere presence.

| Capability | Upstream source | Typical entry |
|---|---|---|
| PR metadata and publication | https://cli.github.com | gh |
| Deterministic file/rule preview | https://github.com/alibaba/open-code-review | ocr delegate preview / rule |
| Change-impact graph | https://github.com/tirth8205/code-review-graph | code-review-graph |
| Code/docs architecture graph | https://github.com/Graphify-Labs/graphify | graphify |
| Structural source search | https://github.com/ast-grep/ast-grep | ast-grep |
| Static code/security rules | https://github.com/semgrep/semgrep | semgrep |
| Secret scanning | https://github.com/gitleaks/gitleaks | gitleaks |
| Dependency alerts | https://github.com/google/osv-scanner | osv-scanner |
| Broad codebase health | https://github.com/peteromallet/desloppify | desloppify |
| Optional independent review | https://github.com/openai/codex | codex |
| Optional human diff UI | https://github.com/earendil-works/pi-review-loop | Pi extension |

Before adding a tool: inspect the current project, available install methods, license, authentication and side effects. Prefer an exact version or commit and a dedicated local install area. Avoid editing the shared firm/toolset.json merely to give B an optional engineering tool: it is deployed to **all** offices.

Some tool installers auto-register hooks or MCP servers for every detected agent. Inspect first; do not silently modify ~/.pi, the visited repo or other offices. If a useful tool is absent, use git, native reads, tests and sound reasoning. Explain the missing capability only when it materially limits the review.

The graph, scanner outputs and review checkpoints are replaceable task artifacts. Significant consultant knowledge stays in existing HQ cases.

# Code impact, structure and analysis tools

Use tools when they make a specific review question easier. You do not have to run them before reviewing, and their output is not complete knowledge of runtime behavior.

## Cross-file change impact: code-review-graph

Preferred optional graph for ordinary cross-file impact analysis: https://github.com/tirth8205/code-review-graph

After installing its CLI in a controlled environment, build the graph for the visited project, then use its documented CLI or MCP queries to locate callers, dependents, affected tests and hotspots. Its indexed tree and incremental updates are useful on larger repos. Check graph freshness and parse coverage. Dynamic dispatch, reflection, framework wiring, external services and incomplete language resolution may be missed.

Do not silently run its universal installer against the consultant's global Pi configuration. Configure MCP explicitly for this office if desired, or invoke the local CLI. The graph is a replaceable project index, **not an HQ memory system**.

## Broader architecture: Graphify

https://github.com/Graphify-Labs/graphify — useful for code/document relationships, subsystem maps and high-level architecture review.

A code-only local graph can be built with graphify extract --code-only. Query via graphify query, graphify path and graphify explain; consult its exact installed version's help. Treat EXTRACTED and INFERRED edges differently and acknowledge stale/missing inputs. Its docs/media semantic pass may involve a remote model: inspect backend and data-residency settings before use.

Prefer one graph when it answers the question. Avoid building both by default or duplicating their caches into HQ records.

## Optional mechanical tools

| Tool | Good for | Caveat |
|---|---|---|
| ast-grep | Search for source structures and parallel bug patterns | Requires language-aware patterns; inspect matches |
| Semgrep | Static security and bug rules | Partial language coverage; results are hypotheses |
| Gitleaks | Potential committed secrets | Handle revealed content privately; avoid repeating secrets |
| OSV-Scanner | Dependency vulnerability alerts | Match advisory to actual package/runtime |
| Desloppify | Dead code, complexity, duplication and sustained maintainability review | Better for a codebase-health engagement than each PR; separate persistent state and nonstandard license terms |

Use installed project tools first. A quick grep or static search may answer a question better than indexing the entire repo. A graph can tell you where to look; inspect the real code before making a consequential finding.

If a tool is absent, the review can proceed. The optional availability helper under scripts/review-tool-doctor.mjs inspects PATH without running installers or fetching anything.

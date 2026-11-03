# Sources and adaptation notes — Engineering Review Workbench

These are independently written guides and small local helpers informed by upstream ideas. **No upstream code or full prompts were vendored.** Optional upstream CLIs and packages are not installed by this repository.

| Source | Useful idea | License reported in source repository |
|---|---|---|
| https://github.com/earendil-works/pi-review | Decision callouts versus fixable findings; varied review targets | MIT |
| https://github.com/earendil-works/pi-review-loop | Iterative human diff checkpoints | MIT |
| https://github.com/alibaba/open-code-review | Delegation preview, file/rule matching, coverage awareness | Apache-2.0 |
| https://github.com/tirth8205/code-review-graph | Cross-file impact and relevant test retrieval | MIT |
| https://github.com/Graphify-Labs/graphify | Code/doc dependency mapping and inferred-edge labeling | Apache-2.0 |
| https://github.com/mattpocock/skills | Distinct specification and standards lenses | MIT |
| https://github.com/openai/codex-plugin-cc | Optional cross-model challenge from coding harness | Apache-2.0 |
| https://github.com/adamjgmiller/adamsreview | Finding synthesis and ensemble concepts | MIT |
| https://github.com/EveryInc/compound-engineering-plugin | Context-aware review methods and reusable criteria | MIT |
| https://github.com/garrytan/gstack | Context and decision reuse | MIT |
| https://github.com/canonical/code-review-harness | Separation of local report and remote publishing | MIT |

The design-interrogation and requester-interaction augmentation follows the owner-approved direction in https://github.com/tranhoangnguyen03/pi-consultants/issues/25, prompted by discussion of “Don't Review Agent Code. Interrogate It.” It is an original adaptation, not a copied article or imported prompt. It broadens the workbench to blocking design/experience findings, responsible agent-to-agent decisions and pre-coding scrutiny, while preserving evidence calibration and action boundaries. No claim of improved model behavior follows from adding these instructions; the separate evaluation pack records that distinction.

Additional optional tools: ast-grep (MIT), Semgrep (LGPL-2.1 for its open-source engine), Gitleaks (MIT), OSV-Scanner (Apache-2.0), Desloppify (custom terms; review before redistribution or commercial use).

Recheck versions and licenses before installing, copying or redistributing any third-party tool. Respect provider permissions and data-residency constraints. No proprietary or nonstandard license is assumed compatible with bundling.

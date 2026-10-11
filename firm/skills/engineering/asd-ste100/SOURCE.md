# Source and local changes

- Upstream: https://github.com/danyuchn/asd-ste100-skill
- Commit: `32511c6992ecb5f1971e46a2943f2e6adceedafe` (2026-10-04), upstream skill version 0.4.0
- Licence: MIT (`LICENSE`, copyright Dustin Yuchen Teng)
- Copied: `SKILL.md`, `LICENSE`, `references/writing-rules.md`, `examples/before-after.md`, `scripts/ste-lint.py`. Not copied: upstream `README.md` and the linter test fixture.

Local changes, all in the `SKILL.md` frontmatter:

- `name` is `engineering-asd-ste100`, matching the firm's naming and avoiding collision with a separately installed upstream copy.
- `description` is narrowed to the engineering consultant's stated uses. The upstream triggers for status reports and for text that "reads as dense, hedged" are removed.
- The `version` line is removed. The upstream version is recorded above.

The body is unchanged. The linter needs Python 3 with only the standard library. The method is usable without the linter. A clean lint result checks structure only. It does not show preserved meaning or STE compliance, and this skill does not include ASD's licensed dictionary.

Adoption record: the firm's `docs/plans/B-STE-WRITING.md`.

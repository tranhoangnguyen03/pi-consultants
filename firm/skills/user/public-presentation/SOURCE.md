# Source and local changes

- Source: https://github.com/tranhoangnguyen03/pi-bro, commit `f79e9082046c8a7c0d96b81e71f7a20065d217a9` (2026-10-14).
- Distilled from `docs/PUBLIC-PRESENTATION.md` (principles and checklist) and `docs/tapes/demo.tape` (recording method). License: MIT, same author.

Local changes:

- Split into lasting principles (`references/principles.md`), dated platform details (`references/platforms.md`) and an optional recording method (`references/demo-recording.md`).
- Generalised for any public repository. Pi-specific rules (topics, `pi install`, pi.dev gallery, family footer) are confined to one labelled section in `platforms.md`.
- Repository, CI and settings items are flagged for the engineering consultant rather than judged. Paste-ready "For B" and "For C" sections are included only when relevant; they do not require another session.
- Layout, badge, visual and length preferences are adaptable defaults. Accuracy, permissions, privacy, consequential warnings and runnable commands remain requirements; ratings follow actual user consequences.
- Moved the description/topics/homepage rules into a lasting "Discovery" block; platform field details stay in `platforms.md`.
- Scoped the Pi section by the `pi-package` keyword rather than the `pi-*` name; the family footer applies only to an author's own family.
- Not carried over: the exemplar list, the README-to-docs file mapping, issue-label hygiene, and the source's per-item SHA-pinning, CodeQL and Scorecard detail (summarised as one optional hardening line).
- Rules the source maintainer had already removed upstream before this commit (pinned roadmap issue, `good first issue` seeding, response-time promises) are absent here too.

Adoption record: https://github.com/tranhoangnguyen03/pi-consultants/issues/3

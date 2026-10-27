---
name: facebook-community-research
description: Use lawfully sourced Facebook community material as bounded research evidence, with sampling, privacy, provenance and platform-permission checks. Optional read-only CLI adapter.
---
# Community discussions as evidence

Facebook communities can reveal users' own words, unmet needs and competing explanations, but comments are not representative samples. Use this method only when Facebook is relevant to the research question; compare what you find with official studies, interviews or independent sources.

## Access first: permission is not a login

Meta restricts automated collection without platform permission, **including** from an authenticated account. User requests or a normal login do not grant Meta permission. Prefer consented user-supplied excerpts, public statements read without automated collection, or an officially approved API. Do not defeat site defenses, collect private group content or copy Messenger conversations as general research material.

The optional [facebook-cli](https://github.com/hieu-lee/facebook-cli) is not installed or enabled in HQ. Its browser cookie profile and debugging endpoint carry account risks, especially on shared machines. A local `scripts/fb-read.mjs` adapter permits limited read-only commands only after the operator asserts *existing* explicit platform permission using `FB_RESEARCH_PERMISSION=explicit-authorization`. This variable is an acknowledgement, not actual proof of authorization.

```sh
node <skill>/scripts/fb-read.mjs doctor
FB_RESEARCH_PERMISSION=explicit-authorization node <skill>/scripts/fb-read.mjs search "topic" --type posts
```

The adapter blocks `login`, messaging, posting, reactions, deletion, `eval`, generic browser navigation and batches. No credentials or private conversations may be imported automatically.

## Study rather than harvest

Define the scope: target population, allowed groups/pages, question and period. Keep only the evidence needed to support the analysis. Note post date, public URL, context, access basis, sampling bias and contrary signals. Avoid saving identifiable private posts or bulk raw content in HQ. Distinguish one anecdote from a trend, and a trend from representative population evidence.

If platform permission is not established, or the CLI fails, stop and use other credible sources; do not bypass controls or treat a login as permission. Summarize uncertainty and findings with source links and sensible redaction.

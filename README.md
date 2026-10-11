# Pi Consultants

Independent engineering and coordination consultant HQs for Pi. Generate a private office for each consultant, give it your organization's working rules, and bring it into the projects where you need help.

Each office carries its own runtime, skills and private case records. There is no shared firm memory or required firm service. Both consultants retain ordinary Pi authority; the reviewed outbox is optional.

## Requirements

- A current Node.js release (Node 26.11.1 verified). The directory-navigation dependency requires Node >=24.15.0.
- Pi installed and authenticated. Pi 1.1.0 verified.
- Git and network access to install the directory-navigation package.

## Generate fresh offices

From this repository:

```sh
node firm/scripts/build-hqs.mjs /absolute/path/to/new-offices
```

This creates `engineering-consultant/` and `project-consultant/`. Existing targets are refused. Do not use generation to overwrite a working office.

For each generated office:

```sh
cd /absolute/path/to/new-offices/engineering-consultant
cp organization/PLAYBOOK.example.md organization/PLAYBOOK.md
# Edit PLAYBOOK.md: organization, canonical source, revision and working rules.
pi install 'git:github.com/fitchmultz/pi-change-working-dir@d0846a834036b17fd118d0ca1011331812cea52b' --local --approve
node .runtime/bin/hq.mjs configure --projects /absolute/path/to/project
node .runtime/bin/hq.mjs doctor
pi
```

Repeat for `project-consultant`. The organization owns its playbook; the neutral example is not a substitute. Pi may inherit your usual extensions and integrations. Follow its trust prompts; do not activate unknown code blindly.

## What M2 delivers

- Curated project cases, exact work references and duplicate-review assistance.
- Bounded objectives with explicit amendment, delivery, rework and closure history.
- Deliberate notes with explicit scope, attribution and evidence state.
- Case-level papers with revision checks and selective retrieval.
- Bounded directories and pointer batches; explicit partial/unavailable results.
- Readable legacy records and explicit backed-up upgrade preparation.

Reads do not select work. Restored selection provides context, not renewed permission. Delivery does not automatically mean acceptance. The tool records claims and sources; it cannot establish their truth.

## Verification and limits

The accepted M2 implementation passed 82 tests, structure checks and an offline synthetic demo. Both freshly generated roles passed actual-Pi startup on Node 26.11.1. A user-observed engineering trial established restart retrieval and explicit resume; this is not a corresponding coordination-model walkthrough or production certification.

Live connector qualification, real-history recall quality, comprehensive crash/load testing and private-office migration remain outside this evidence. No full return card, decision register, follow-up engine, semantic duplicate elimination or complete paper-body version archive is delivered.

## Maintain and update

```sh
cd firm
npm test
npm run check
npm run demo
```

For existing offices, build a separate candidate; stop all writers; preserve private backups, credentials, playbooks and overlays; review runtime replacement and any explicit case upgrade separately; restart and verify. Never restore a backup over newer work blindly. There is no automatic office rollout or migration.

Private state belongs outside this public source repository. Do not commit generated offices, credentials, organization playbooks or client records here.

Internal conversation excerpts, historical diagrams and maintainer review archives are not distributed. The public structural check covers syntax, JSON and skill headers; it does not include the private historical traceability check. Runtime and behavioral tests are unchanged.

## License

MIT. Retain the bundled third-party notices, including the engineering STE skill's license and source attribution.

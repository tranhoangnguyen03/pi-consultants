# Independent agents

Status: Preview implemented; manual testing pending. Updated 2026-11-02.

This document grounds the independent-agent work in the existing consultant framework. It records accepted principles, the first Engineering implementation, and questions that need evidence. The concrete build and installation procedure belongs in [INDEPENDENT-ENGINEERING.md](INDEPENDENT-ENGINEERING.md). Changes here should follow what the application actually demonstrates.

## An agent is the primitive

An agent should be independently buildable, installable, versionable, launchable, and addressable. Its application contains the maintained expertise and runtime needed to perform its work. It should remain useful when no firm directory, department manager, team service, or room is present.

Firms, departments, teams, and rooms can organize or compose agents. Those relationships do not need to determine how each agent is packaged. One installed specialist can participate in different arrangements without acquiring a separate copy of its reusable expertise for every arrangement. A team role is a responsibility in a particular collaboration; it is not automatically a new agent application or a new persistent identity.

The user can stay in their main Pi harness while consulting an independent specialist. Opening the specialist directly is another supported way to work. The main harness keeps its own conversation, tools, and identity. An integration must explain which specialist it invokes, what work it delegates, and how results return.

This is an additional distribution boundary for the existing framework. It does not introduce a shared firm memory service or relocate authoritative mission records into a specialist's private history. The [charter](AGENT-FIRST-PRINCIPLES.md) and [framework](FRAMEWORK.md) remain governing references.

## Keep the ownership boundaries

The existing Practice, Office, and Site distinctions apply to independently installed agents.

| Boundary | Owns | Independent application treatment |
| --- | --- | --- |
| Practice | Reusable expertise, methods, instructions, skills, tools, and maintained defaults | Versioned source and release resources |
| Office | The specialist's private case records, retained conversations, local configuration, and working continuity | Stable writable application home |
| Site | The client's project, mission work, decisions, and deliverables | Explicit working directory or connected project context |

Specialists own their reusable expertise. Missions own their work and decisions. Runs own temporary execution state. A saved consultant conversation can support continuity without becoming the authoritative mission record. Updates must preserve this distinction, including when a specialist proposes an improvement based on experience.

The [factory contract](FACTORY-CONTRACT.md), [Office Admin procedure](OFFICE-ADMIN.md), and [case organization system](CASE-ORGANIZATION-SYSTEM.md) continue to define generated practice, local ownership, and case behavior. Packaging should reuse those contracts where possible.

## Name the lifecycle objects precisely

| Object | Meaning |
| --- | --- |
| Application | A named specialist with a maintained capability and interaction contract |
| Source | The editable definition, runtime integration, skills, supporting files, and dependency declarations used to build it |
| Release | A versioned runtime and resource bundle for a particular operating system and architecture |
| Installation | A selected release associated with one stable writable application home |
| Run | A live execution of the installed application |
| Session | A retained conversation that can continue across runs when supported |
| Request | A bounded piece of work submitted by a user or another agent |

A package version describes maintained software and practice. It does not describe the latest private conversation or case state. Replacing a release must not silently replace an installation's identity, credentials, or history. Conversely, resuming a session does not select a new package version.

An installation can retain old releases for explicit selection. That is a software rollback, not a rollback of private records. An incompatible state schema requires a separate migration decision; a version label alone cannot make that migration safe.

## Three ways to access the same specialist

The user-facing forms are direct work with a specialist, delegation from a main agent, and collaboration among specialists. Direct work uses the application's terminal. Main-agent delegation uses an opt-in adapter or a client. A team uses the same addressable applications and request/result primitives; its roster, shared mission context, and coordination policy live above them. The first release includes a bounded peer consultation, not a team manager.

These forms use three technical entry points:

| Access mode | User or caller experience | Required behavior |
| --- | --- | --- |
| Interactive terminal | Open the specialist and work with it directly | Show identity, use the installed practice, and support normal session continuity |
| Bounded invocation | Submit a task and receive a result | Accept explicit task context, return a useful result and process status, and preserve ownership of resulting work |
| Client-managed RPC | A main harness or another client controls a live specialist session | Expose a defined protocol, lifecycle, cancellation, and result handling |

These are access modes for one application, not separate specialist implementations. The exact main-Pi commands, skills, or extensions used to expose them can evolve. Client integration must not pretend that a command-line response is a complete interactive UI. Operations that require human approval must retain an effective approval path in the chosen mode.

The first implementation uses the PiG runtime's terminal, print, and RPC interfaces. It reuses the consultant's existing case tools. Integration should reuse established runtime control where it already exists instead of building another orchestration service inside the application.

## A complete release includes usable resources

The release must carry the specialist's actual expertise, not only its top-level prompt. Skills include their full trees: reference material, scripts, templates, assets, and notices. Prompt templates, extension modules, provider integration, and required resource paths must remain usable after relocation.

Dependencies need an explicit boundary. Runtime dependencies that the application promises to provide belong in the release or a declared installation step. Tools expected from the host must be documented and checked where practical. A successful compiler exit does not establish that a skill's script, browser, document converter, MCP server, or remote service is available.

Settings also have different owners. Maintained defaults can ship with a release; the user's settings and private overrides belong to the installation. Credentials are supplied to the installed application through its supported configuration or environment. Public artifacts must exclude real credentials, organization playbooks, case records, conversations, and private working files.

Compatibility claims should name the tested surface. A Pi-compatible extension API does not prove every third-party package works. Complete resource delivery and actual execution both need evidence, particularly for extensions that manage sessions, change directories, or call other tools.

## First implementation decisions

Engineering is the first independently packaged consultant. Its initial application preserves the complete generated Engineering office in a stable writable home. This keeps the existing relative paths, case tools, skill scripts, and private `.hq` state meaningful while separating them from the source checkout and extracted download.

The release combines a compiled PiG Piglet core, a pinned Node runtime, materialized packages, and complete filesystem resource trees. The compiled core provides the specialist entry point and runtime integration. This packaging boundary has been demonstrated: native skill baking does not retain supporting asset trees, so the launcher loads explicit full skill directories. A single downloadable archive is the distribution unit; requiring every resource to become one executable is not the design goal.

The installer records managed practice files, retains releases, seeds local settings, and installs a stable launcher. Updates replace managed practice after checking for local edits. They preserve private records, credentials, organization configuration, and local additions. Active runs block updates. An interrupted installation blocks launch until the intended release is retried successfully.

These choices are a concrete first implementation, not universal requirements for every future agent. The implementation and automated checks exist; release claims remain bounded by the platform and manual tests actually completed.

## Maintain source and update deliberately

Reusable improvements belong in maintained source. Build a new release from that source, inspect its provenance and contents, and explicitly select it in an installation. Editing installed practice can be useful during exploration, but the next update must detect that edit rather than discard it.

Conflicts should identify the affected files and leave the working practice intact. A user can then move improvements into source, keep a private copy, or deliberately restore the maintained version. Automatic merging of arbitrary prompts, scripts, or organization policy is outside the first implementation.

The application should make its identity, release, home, working directory, session behavior, and host prerequisites understandable. Errors should state the affected action and a practical next step. A calling agent also needs predictable exit status, bounded output, cancellation, and a way to distinguish a failed invocation from a successful specialist result.

## Open questions and evidence

The preview still needs manual evidence for fresh-machine startup, relocation, all three access modes, representative specialist work, private-state preservation, and supported operating systems. Provider authentication, external services, document tooling, browser dependencies, and upstream extension compatibility need explicit coverage rather than inference from a build.

Future work may refine concurrent sessions, authenticated remote access, user-approved migration, release distribution, and the best main-Pi integration. Those are separate decisions. This document should record demonstrated behavior and accepted changes as they emerge, without turning unfinished questions into promises or adding ceremonial approval steps to routine development.

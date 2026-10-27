# OpenToonz automation evidence

- [Official ToonzScript reference](https://opentoonz.readthedocs.io/en/latest/toonzscript.html): ECMAScript-like scripting and GUI Run Script / Script Console. This does not establish a stock CLI for arbitrary headless script execution.
- [Official rendering guide](https://opentoonz.readthedocs.io/en/latest/rendering_the_animation.html): batch render tasks and the task-specific **Command Line** field. The `tcomposer` binary may render a saved `.tnz` scene; use the actual task args generated for that project/OS, not an assumed all-platform recipe.
- Research candidates (not dependencies): [OpenToonz Headless](https://github.com/limitz/opentoonz-headless) (fork claiming JSON-RPC control), [opentoonz-ai-pipeline](https://github.com/AbdullahMufti/opentoonz-ai-pipeline) (template-built scenes and headless `tcomposer`). Neither is qualified by this adapter.

Unknown until live verification: OS install paths, library/project setup, headless authoring, script limits, failure recovery, codec support and repeatable visual review. A binary-presence probe is not an end-to-end success.

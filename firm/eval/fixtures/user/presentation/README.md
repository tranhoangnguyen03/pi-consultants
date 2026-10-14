# pi-tidy-fixture-example

**Note:** experimental. Requires PiG 0.3 compatibility layer for some RPC modes (see the compatibility matrix below). Tested against backend adapter v2 only. Behaviour under Windows process groups is undefined.

## Compatibility matrix

| Backend | Explain | Rewrite | Session | Notes |
| --- | --- | --- | --- | --- |
| agy | yes | yes | partial | needs 1.1+ |
| claude | yes | partial | yes | |
| grok | yes | yes | no | prompt-only isolation |

## Architecture

pi-tidy hooks the editor save event, builds a context envelope from the session tree, serialises it to the adapter, and applies a structured patch...

(about 400 more lines of internals follow)

## Usage

```text
/tidy                     tidy the current file
/tidy --all src/          tidy every file under a folder
```

![demo](docs/images/demo.gif)

## Install

```sh
pi install npm:pi-tidy-fixture-example
```

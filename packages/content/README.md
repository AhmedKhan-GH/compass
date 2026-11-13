# @compass/content

The content system: the only code that reads course packs. It finds packs through the configured sources, loads
them, checks them, and compiles them into the content index that the web app reads. The pack format and the rules
are described in `docs/ARCHITECTURE.md`.

## Commands

```
compass content build [--out <path>]
compass content check [--static] [--source <dir>] [<course-id>...]
compass content list
compass --help
```

- `build` runs the static checks on the configured packs and writes `.compass/content-index.json` under the
  repository root (or `COMPASS_CONTENT_INDEX`, or `--out`). It writes nothing when there are errors.
- `check` runs the static checks, then submits the reference, each wrong solution and each stage of every item to
  the runner service. `--static` skips the runs. `--source <dir>` checks the packs under any folder instead of the
  configured sources; `<dir>` may also be a single pack.
- `list` prints the packs and their items.

The exit code is 0 without errors, 1 with errors (including a runner that cannot be reached), and 2 for a usage
error. Colour is used only when standard output is a terminal and `NO_COLOR` is not set.

## Modules

| File | Purpose |
|---|---|
| `src/config.ts` | Finds `compass.config.toml` by walking up from the working directory; applies the environment overrides |
| `src/sources.ts` | The source layer: a source kind turns a source entry into pack directories; only `local` exists |
| `src/files.ts` | Reads pack files with bounded sizes, strict UTF-8, no symlinks and no path that leaves the pack |
| `src/loader.ts` | Loads `course.toml`, the items and the concept pages into a typed pack, collecting diagnostics |
| `src/checks.ts` | The static rules |
| `src/markdown.ts` | Splits instructions and hints at `## N. Title` headings; finds relative links |
| `src/python.ts` | Finds the cocotb tests of a checks file by reading its text, never by running it |
| `src/compile.ts` | The item revision, the index compiler and the atomic write |
| `src/dynamic.ts` | Builds job requests, runs them through an injected `RunnerClient` (four at a time) and judges the results |
| `src/cli.ts` | The `compass` command |

## Choices worth knowing

- Text files are read with a byte-order mark removed and CRLF turned into LF, so the index is the same on every
  platform.
- The revision of an item is a SHA-256 over its learner-facing manifest fields, its design and task map, its
  intro, instructions and hints, its starter files, its checks file and the course's runner kind. The slug,
  status, difficulty, prerequisites, references, wrong solutions, stages and notes do not enter it.
- A run of a wrong solution or a stage uses the reference version of each editable support file, so it differs
  from the reference run only in the solution file.
- `COMPASS_RUNNER_PORT` without `COMPASS_RUNNER_URL` moves the client to that port on the configured host, so the
  service and its clients agree. Relative `COMPASS_CONTENT_INDEX` and `COMPASS_DATA_DIR` paths are resolved against
  the repository root.

## Tests

`npm test -w @compass/content` runs the unit tests with `node:test` and `tsx`. They use the fixture pack in
`test/fixtures/verilog` (the old `drive-high` exercise, transcribed, and a small practice item with an editable
support file) and a fake runner client; they need neither Docker nor the network.

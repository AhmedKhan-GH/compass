# Compass architecture

Compass is a practice platform. A course is an ordered list of short exercises. The learner edits source in the
browser, and a sandboxed runner checks each task. The first course is RTL design with Verilog.

This document is the contract between the parts. The types it names live in `packages/schema` and are the single
definition; when this document and the types disagree, fix both in the same commit.

## The rules that shape everything

1. **Courses are data.** The site holds no course-specific code. It knows the content schemas, the environment kinds
   it has installed and the runner kinds. Adding a course never changes `apps/web`.
2. **Only `packages/content` reads packs.** The app never opens `content/`. The build compiles every pack into one
   content index, and the app reads only that index.
3. **The site never runs pack code.** Checks run only inside the runner's containers.
4. **Runners and environments are versioned.** A course names them, for example `iverilog-cocotb@1`. Upgrading a tool
   adds `@2`; `@1` stays, so old courses keep working.
5. **The runner is a separate service with a job queue.** A web request never waits on a simulation behind a lock.

## Layout

```
apps/web/                 the Next.js site (App Router)
  src/app/                pages and API routes
  src/server/             server-only code: index access, the store, the runner client calls
  src/components/         the site's own components, composed from packages/ui
  src/lib/                browser-side logic: VCD parsing, drafts
packages/schema/          the contracts: pack manifests, the content index, the runner API, the web API
packages/content/         the source layer, the pack loader, the validator, the index compiler, the `compass` CLI
packages/runner-client/   a typed HTTP client for the runner service
packages/ui/              interface components on the Sternbild tokens
services/runner/          the runner service: the HTTP API, the queue, the sandbox, the images
  images/iverilog-cocotb-1/   the Verilog test image
  images/yosys-digitaljs-1/   the circuit image
content/                  the course packs kept in this repository
  verilog/
tools/convert/            the converter from the old exercise format to an item folder
vendor/sternbild/1.0.0/   the pinned release of the Sternbild style guide
compass.config.toml       the content sources and the runner address
.compass/                 build output and local data (ignored by git): the content index, the SQLite store
```

Dependencies point one way: `schema` depends on nothing; `content`, `runner-client`, `ui` and `services/runner` depend
on `schema`; `apps/web` depends on `schema`, `runner-client` and `ui`. `apps/web` never imports `packages/content`
or `services/runner`.

## Configuration

`compass.config.toml` at the repository root:

```toml
[[content.source]]
kind = "local"
path = "content"

[runner]
url = "http://127.0.0.1:3101"
```

A source kind turns a source entry into pack directories on disk. Only `local` exists: every direct child of `path`
that holds a `course.toml` is a pack. Later kinds (`git`, `url`, `atlas`) fetch into a cache directory and then yield
pack directories in the same way; nothing after the source layer knows where a pack came from.

Environment variables override the file: `COMPASS_RUNNER_URL`, `COMPASS_RUNNER_PORT` (the service's listening port),
`COMPASS_CONTENT_INDEX` (the index path, default `.compass/content-index.json`) and `COMPASS_DATA_DIR` (default
`.compass/`). Relative paths are resolved against the repository root. `COMPASS_RUNNER_PORT` alone also moves the
client to that port on the configured host.

## A pack

```
content/verilog/
  course.toml
  syllabus.md
  concepts/<slug>/introduction.md, about.md
  items/<slug>/
    item.toml
    intro.md            optional; the concept introduction shown with the exercise
    instructions.md     the story and the tasks
    hints.md            optional
    starter/            the files the learner starts from: the solution file and any support files
    checks/             the test file; runs only in the runner
    reference/          the exemplar (concept items) or example (practice items) solution
    wrong/              deliberately wrong solutions; each must fail
    stages/             optional; the reference after each task, for concept items
    notes.md            optional author notes; never compiled into the index
    icon.svg            optional; the item's icon
  icon.svg              optional; the course's icon
  category-icon.svg     optional; the icon of the course's category
```

A pack is self-contained: nothing in it refers to a file outside its directory.

### `course.toml`

```toml
id = "sternbild/verilog"          # namespace/name, lower-case slugs
version = "0.1.0"                 # semver of the pack
title = "RTL design with Verilog"
blurb = "One plain sentence."
language = "verilog"              # the editor language
environment = "code@1"
runner = "iverilog-cocotb@1"
circuit = "yosys-digitaljs@1"     # optional; omit for a course with no circuit view
syllabus = "syllabus.md"          # optional
status = "draft"                  # "draft", "published" or "in-development"; see below

[category]                        # optional; the catalog groups courses by category
id = "rtl-design"                 # courses in different packs share a category by using the same id
title = "RTL design"

[editor]
indent = 4

[[concept]]                       # every concept the course teaches or requires
slug = "constants"
name = "Constants"

[[item]]                          # the ordered exercise list
slug = "drive-high"
prerequisites = []                # concept slugs the learner should have met first
```

### `item.toml`

The item's slug is its directory name.

```toml
id = "9a2fa263-5ac6-47ef-9388-b845860ca190"   # a UUID that never changes; progress is keyed by it
title = "First Light"
topic = "Drive high"              # optional; the plain subject
blurb = "Give a museum exhibit its first always-on power indicator."
kind = "concept"                  # "concept" or "practice"
concepts = ["constants"]          # taught (concept) or practised (practice)
difficulty = 1                    # optional, 1 to 10
status = "active"                 # "active", "beta", "wip" or "deprecated"

[design]
top = "top_module"                # the top module name
solution = "top_module.v"         # the file in starter/ that the learner edits
support = []                      # optional; other files in starter/, read-only unless listed in editable
editable = []                     # optional; support files the learner may edit
schematic = true                  # optional, default true; false hides the circuit view

[checks]
file = "test_output.py"           # in checks/
reference = "exemplar.v"          # in reference/; replaces the solution file
wrong = ["low.v"]                 # in wrong/; each replaces the solution file and must fail

[[task]]                          # optional; without tasks the item is checked as a whole
id = 1                            # contiguous from 1, in order
tests = ["output_port_is_one_bit"]
stage = "task_1.v"                # optional; in stages/: the reference after this task
```

When an item has editable support files, `reference/` holds a file of the same name for each one.

Task titles and task text come from `instructions.md`: each `## N. Title` heading starts task N, and the text before
the first such heading is the preamble. The headings must match the `[[task]]` ids. `hints.md` is split the same way.

### A course in development

A course whose `status` is `in-development` is a plan. It has a `course.toml` and may have icons, but no `[[item]]`,
no `items/` folder and no need for `environment` or `runner` (a kind it does name must still be known). It lists
what is planned as plain data:

```toml
status = "in-development"
description = "A few plain sentences for the course page."   # optional, for any course

[[stage]]
id = "signals-and-decisions"
name = "Signals and decisions"

[[planned]]
slug = "drive-high"
title = "First Light"
blurb = "Give a museum exhibit its first always-on power indicator."
kind = "concept"
stage = "signals-and-decisions"                               # optional; must be a declared stage
```

The catalog shows such a course with the label "In development"; its page lists the planned exercises by stage, and
none of them can be opened or run. Every other course needs `environment`, `runner` and at least one `[[item]]`. Any
course may carry `[[stage]]` and `[[planned]]` entries, so a draft can list what is still to come. Stage ids and
planned slugs are unique, and a planned slug is not also an item.

### Icons

Icons are course data. A pack may hold `icon.svg` at its root (the course), `category-icon.svg` at its root (the
course's category) and `icon.svg` in an item folder. Each is optional; the interface shows a placeholder tile where
one is missing. There is no category file outside the packs: a category is the `[category]` table of the courses
that name it, and when several packs carry an icon for the same category the first source's is used.

An icon must be an SVG of at most 256 KiB with a square `viewBox`, and must hold no script, no event handler
attribute, no `foreignObject`, no embedded image, no document type or entity declaration, no style import, and no
reference other than to an id in the same file (`href="#…"`, `url(#…)`). The check reads the file as text.

### What `compass content check` enforces

The static checks, which need no runner:

- both manifests parse and validate; the ids, slugs and versions are well formed; item ids are unique in the pack;
- every file a manifest names exists; no path leaves the pack; file sizes are bounded;
- the course's environment, runner and circuit runner are kinds this installation knows (`packages/schema` registry);
- every concept an item names is declared in `course.toml`; every declared concept that has a directory has pages;
- every prerequisite is a declared concept, and is taught by a concept item earlier in the list. In a `draft` pack a
  prerequisite not yet taught is a warning, so a course can be converted a few exercises at a time;
- the task headings in `instructions.md` match the `[[task]]` ids; every test in the checks file is mapped to
  exactly one task, and every mapped test exists;
- relative links in the Markdown files resolve inside the pack;
- the course's language is one its runner accepts; course ids are unique across packs;
- the file roles of an item are distinct, and it has at most 16 starter files;
- the checks file defines at least one test, each an `async def` under `@cocotb.test()`. The check reads the Python
  as text and never runs it;
- hint headings name existing tasks, once each; task headings without any `[[task]]` are an error;
- files the manifests do not name, and declared concepts that no item teaches, are warnings.

The dynamic checks, which submit jobs to the runner service:

- the reference passes every test;
- every wrong solution fails (a run that errors without a test report does not count as failing; a wrong solution
  must compile and fail a test);
- each stage passes the tests of its task and of every earlier task.

Every run uses the starter files with the solution file replaced. When an item has editable support files, every run
(reference, wrong and stage) uses `reference/<name>` for each, so a wrong solution differs from the reference only in
the solution file.

`compass content check --static` runs only the static checks. CI runs the full check on `content/`.

## The content index

`compass content build` writes `.compass/content-index.json`: the type `ContentIndex` in `packages/schema`. It holds,
for every course, the manifest fields, the syllabus, the concept pages, and for every item its text, its tasks, its
starter files, its checks file and a `revision` (a SHA-256 over everything in the item that affects a run or what the
learner reads). It does not hold references, wrong solutions, stages or notes.

The revision covers the item's id, title, topic, blurb, kind, concepts, design and task map; its intro, instructions
and hints; its starter files and checks file; and the course's runner kind. It does not cover the slug, status,
difficulty or prerequisites, so reordering a course does not reset progress.

The checks file is in the index because the runner is content-agnostic and receives it with each job. It must never
reach the browser: only `apps/web/src/server` reads the index, and it hands pages and API responses the learner
views (`CourseView`, `ItemView`), which carry no checks.

Icons are written beside the index, in `.compass/content-assets/`, each named by the SHA-256 of its bytes
(`<hash>.svg`), and the index holds that name in `icon`. The build removes assets the index no longer names. The site
serves them at `/content-assets/<name>` as static, immutable files with a content security policy that forbids
everything but inline styles, and always shows them with `<img>`, never inline, so the ids of gradients and filters
in different icons cannot clash. An icon is not part of the item revision.

The index is deterministic: the same packs produce the same bytes.

## Runner kinds and environments

The registry in `packages/schema/src/registry.ts` lists what this installation knows.

| Kind | Purpose | Image | Tools |
|---|---|---|---|
| `iverilog-cocotb@1` | test | `compass/iverilog-cocotb:1` | Python 3.12, Icarus Verilog 11.0, cocotb 2.0.0 |
| `yosys-digitaljs@1` | circuit | `compass/yosys-digitaljs:1` | Yosys 0.23, yosys2digitaljs 0.10.3 |

| Environment | Panes |
|---|---|
| `code@1` | instructions and tasks, editor, results, waveform, circuit |

The image tag's number is the kind's version. An image, once released, is not changed in a way that alters results;
a tool upgrade is a new directory under `services/runner/images/` and a new registry entry.

## The runner service

A Node HTTP server in `services/runner`. It listens only on `127.0.0.1` (port 3101 by default) and has no
authentication, so it must never be bound to another interface.

### API

All bodies are JSON. The types are in `packages/schema/src/runner.ts`.

| Request | Response |
|---|---|
| `GET /v1/health` | `200 RunnerHealth`: each runner kind with whether its image is present, and the queue counts |
| `POST /v1/jobs` with a `JobRequest` | `202 { job: Job }`; `400` for an invalid request; `429` when the queue is full |
| `GET /v1/jobs/:id` | `200 { job: Job }`; `404` when unknown or expired. `?wait=<ms>` holds the response (at most 30 000 ms); see below |
| `DELETE /v1/jobs/:id` | `200 { job: Job }`; cancels a queued or running job |

A read with `?wait=<ms>` alone is held until the job is terminal or the wait ends. A caller that wants every step adds
what it last saw: `&state=<state>` and, while queued, `&position=<n>`. The response is then held only until the job
differs from that (another state, or another position), so a caller that repeats the read with each answer sees
`queued` with each position, then `running`, then the terminal state, with no polling interval.

Errors are `{ error: { code, message } }`. A job must be sent as `application/json` (otherwise `415`), which stops
another site from submitting jobs with a plain form post. A request the launcher would reject (no solution file, an
undeclared task) is refused with `400` when it is submitted.

A `JobRequest` carries everything the run needs: the runner kind, the top module, the source files, and for a test job
the checks file, the task map and an optional task selection. The service never reads packs or the index.

### Job states

```
queued ──▶ running ──▶ succeeded     the sandbox produced a valid result (the tests may have failed)
   │          ├──────▶ failed        the run could not produce a result: see job.error.kind
   └──────────┴──────▶ cancelled
```

`succeeded`, `failed` and `cancelled` are terminal. A test job's result is a `RunReport` (`pass`, `fail`, or `error`
with a message, for example a compile error), the simulation log, an optional VCD waveform, the image id and the
duration. A circuit job's result is the DigitalJS circuit, the ports and the warnings. `job.error.kind` is one of
`unavailable` (Docker or the image is missing), `timeout` (the container ran past the wall-clock limit; the test
image stops its own simulation after 10 seconds and reports that as an `error` report), `execution`, `invalid-result` and `design` (the circuit
runner rejected the design).

### The queue

In memory, first in first out, with a fixed number of workers (default 2, `COMPASS_RUNNER_CONCURRENCY`), a bound on
queued jobs (default 32) and a retention period for finished jobs (default 10 minutes). Jobs do not survive a
restart; the web app treats a job the service no longer knows as failed with `unavailable`.

### The sandbox

Each job runs in a fresh container: `--network none`, one CPU, 256 MB of memory with no swap (512 MB for the circuit
runner), a pids limit,
a read-only root filesystem, all capabilities dropped, `no-new-privileges`, user `65534:65534`, a file-size ulimit,
a small `tmpfs` at `/tmp`, the input mounted read-only and one writable output directory. The launcher enforces a
wall-clock timeout, removes the container afterwards, and reads `results.json`, the log and the waveform through
size-bounded reads that reject symlinks. The report is validated before it is returned.

## The web app

### Pages

| Route | Page |
|---|---|
| `/` | the catalog: every course in the index |
| `/courses/[namespace]/[course]` | the course: its exercises in order, with progress |
| `/courses/[namespace]/[course]/[item]` | the exercise workspace, in the course's environment |
| `/content-assets/[name]` | an icon from the content index's assets |

### API

The types are in `packages/schema/src/web.ts`. `{c}` stands for `/api/courses/[namespace]/[course]`.

| Request | Response |
|---|---|
| `POST {c}/items/[item]/runs` with `StartRunRequest` | `202 { run: RunRecord }` |
| `GET {c}/items/[item]/runs?cursor=` | `200 RunHistoryPage` |
| `GET /api/runs/[id]` | `200 { run: RunRecord }`; `?wait=<ms>`, `&state=` and `&position=` work as on the runner: the read returns as soon as the run differs from what the browser last saw |
| `POST {c}/items/[item]/circuit` with `StartCircuitRequest` | `202 { circuit: CircuitRecord }` |
| `GET /api/circuits/[id]` | `200 { circuit: CircuitRecord }`; `?wait=<ms>` likewise |
| `GET {c}/progress` | `200 CourseProgress` |
| `POST {c}/items/[item]/reset` | `200 { progress: ItemProgress }` |
| `GET /api/runner` | `200 RunnerHealth`, or `503` when the service cannot be reached |

Starting a run validates the submitted files against the item (names, sizes), stores a run record in state `queued`,
submits a job to the runner and returns at once. Reading a run that is not terminal asks the runner for the job and,
when the job is terminal, stores the result and updates progress in one transaction. The browser polls with `?wait`.

A run is a `test` (run the tests, optionally for one task) or a `submission` (all tests; a passing submission
completes the item). Progress is derived from stored runs of the item's current `revision`.

### The store

SQLite (`better-sqlite3`) at `.compass/compass.db`. There are no accounts yet: one local learner. Records are keyed
by course id and item id (the UUID), so a renamed slug keeps its history. Drafts stay in the browser's local storage.
The store keeps the latest 100 runs of an item, the tail of each log and a bounded waveform. A reset sets a marker:
the history stays, and progress counts only later runs.

A test result carries `test_code`, the source of that one test function, and the interface shows it. The checks file
as a whole never appears in a response. Every route refuses a request whose host is not a loopback address or whose
origin is another site.

## The interface

`packages/ui` builds on the role names of the vendored Sternbild release (`--sb-surface`, `--sb-text`, `--sb-accent`
and so on) and never uses raw colour values. `apps/web/scripts/sync-assets.mjs` verifies `vendor/sternbild/1.0.0/`
against its checksums and copies it under `apps/web/public/sternbild/` before `dev` and `build`. The rules of
`~/CLionProjects/caliper/docs/wiki/explanation/ui-principles.md` apply: a dense workstation of docked panes, the
subject of a view given most of the window, labels as nouns, no explanatory sentences on the surface.

## Conversion

`tools/convert` turns an exercise of the old app (`tracks/verilog/exercises/{concept,practice}/<slug>`) into an item
folder, and writes or updates `course.toml`. It reads the old repository and never writes to it. Converting the rest
of the course is one command over the remaining slugs.

## Checks and CI

`npm run check` runs lint, typecheck and the unit tests, none of which need Docker. `npm run test:docker` runs the
tests that need the images. The CI workflow runs `check`, then builds the images, starts the runner and runs
`compass content check` on `content/`.

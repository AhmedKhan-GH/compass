# Runner service

The runner service checks learner code. It takes job requests over HTTP on `127.0.0.1`, queues them, and runs each
one in a fresh, locked-down Docker container. The API, the job states and the sandbox are described in
`docs/ARCHITECTURE.md` under "The runner service", and the types are in `packages/schema/src/runner.ts`.

## Build the images

Docker must be running. From the repository root:

```sh
npm run runner:images                                  # every runner kind in the registry
npm run images -w @compass/runner -- yosys-digitaljs@1  # one kind
```

Each kind in `RUNNER_KINDS` (`packages/schema/src/registry.ts`) names its image tag and its directory under
`images/`. The script runs `docker build` for each one.

## Run the service

```sh
npm run runner
```

The service listens on `127.0.0.1:3101`. These environment variables change it:

| Variable | Default | Meaning |
|---|---|---|
| `COMPASS_RUNNER_PORT` | `3101` | The listening port. The host is always `127.0.0.1`. |
| `COMPASS_RUNNER_CONCURRENCY` | `2` | The number of jobs that run at once. |

When port 3101 is taken, run `COMPASS_RUNNER_PORT=3111 npm run runner` and point the web app at it with
`COMPASS_RUNNER_URL=http://127.0.0.1:3111`. Stop the service with Ctrl-C: it stops accepting requests, cancels the
queued and running jobs, removes their containers and exits.

## Tests

```sh
npm test -w @compass/runner              # the unit tests; no Docker needed
npm run test:docker -w @compass/runner   # the tests that run the images; build them first
```

Unit tests live in `test/*.test.ts`. Tests that need Docker live in `test/docker/*.docker.test.ts` and use the
exercises copied into `test/fixtures/`.

## Source

| File | Contents |
|---|---|
| `src/main.ts` | The entry point: settings, start, shutdown on SIGINT and SIGTERM |
| `src/server.ts` | The HTTP API on `node:http` |
| `src/queue.ts` | The in-memory job queue with an injected executor |
| `src/executor.ts` | The executor that runs jobs in Docker |
| `src/sandbox.ts` | The container flags, the wall-clock limit, removal and bounded reads |
| `src/test-launcher.ts` | Test jobs in `iverilog-cocotb@1` |
| `src/circuit-launcher.ts` | Circuit jobs in `yosys-digitaljs@1` |
| `src/legacy.ts` | The adapter to the image's `.meta/config.json`, `.meta/request.json` and `results.json` |
| `src/requests.ts` | The checks on a job request that the schema cannot express |
| `src/build-images.ts` | The `images` script |

## Add a runner kind `@2`

A released image never changes in a way that alters results, so a tool upgrade is a new kind beside the old one.
To add, for example, `iverilog-cocotb@2`:

1. Copy `images/iverilog-cocotb-1/` to `images/iverilog-cocotb-2/` and change the pins there. Leave the `-1`
   directory alone.
2. Add `"iverilog-cocotb@2"` to `RUNNER_KINDS` in `packages/schema/src/registry.ts`, with the image tag
   `compass/iverilog-cocotb:2` and the directory `iverilog-cocotb-2`.
3. Accept the new kind in the job request schema in `packages/schema/src/runner.ts`, and update the runner table in
   `docs/ARCHITECTURE.md` in the same commit.
4. Dispatch the new kind in `src/executor.ts`. Reuse the existing launcher when the image keeps the same input and
   output files; otherwise write a launcher next to the old one.
5. Add Docker tests for the new kind, run `npm run runner:images` and `npm run test:docker`.

Courses keep naming `@1` until their authors move them to `@2`.

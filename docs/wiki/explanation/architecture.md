# Architecture

`PLATFORM.md` §5 is the heart of the platform; this page is the short version.

## Source-level SDK, not ABI SDK

Caliper's SDK is a frozen C ABI because its applets ship as separate binaries built by strangers and `dlopen`ed into a running host. Compass's static-binary identity produces the opposite situation: instrument code, framework, and libraries compile **together, into one binary, by one toolchain, in one build**. There is no boundary to freeze, so the contract lives at the source and build-system level, which buys:

- **Modern C++ across the whole stack** — real classes, RAII, `std::` types in interfaces; no handle tables, no epochs.
- **Refactoring freedom** — the compiler re-checks every caller on every build.
- **Zero toolchain skew** — the CRT/allocator/RTTI mismatch problem class is structurally absent.

The SDK is exactly three artifacts:

| Layer | Artifact | Status |
|---|---|---|
| 0 | the curated [library catalog](../reference/library-catalog.md) (`compass::wx`/`gl`/`json`/`glm` targets) | **done** (I2) |
| 1 | `libcompass` — App, Document/View + undo, workspace shell, export, `Canvas2D` GL viewport | **done** — extracted at I2, `Canvas2D` added at I3 |
| 2 | instruments (`compass`, `signal_workbench`) + `compass_add_instrument()` + the buildable template | **done** (I2) |

## The extraction rule (CD9)

`libcompass` is **extracted at I2 from Instrument #1's real code, never designed up front**. Rule of thumb: if the second instrument would copy-paste it from the first, it moves into `libcompass`. Corollary: Instrument #1 (Plot Workbench, I1 — see the design spec in `docs/superpowers/specs/`) is deliberately built monolithically on the shell first.

## Discipline without an ABI

- **The catalog is the only door** — CI lint fails builds on includes of non-catalog third-party headers.
- **The template is the spec** — the instrument template builds in CI against every framework change; a refactor that breaks it fixes it in the same commit.
- **Registration is explicit** — no self-registering static initializers: static linkers dead-strip unreferenced object files, silently eating self-registration.

## Monorepo, per-instrument release trains (CD10)

The *code* is a monorepo (one build keeps the source-level SDK honest); the *release unit* is the binary. Tags are namespaced per instrument (`plot-workbench/v0.3.0`), each triggering CI to publish that instrument's static binaries alone. `libcompass` lives unversioned at repo HEAD until a third-party instrument author exists — the Compass mirror of Caliper's Phase 3 split trigger.

## Relationship to Caliper

Decoupled in execution, mirrored in method. No Compass phase depends on any Caliper phase. The only live coupling is deliberately the weakest kind: **shared file formats** (the planned Run Browser reads Caliper's DuckDB stores; the schema, not an API, is the contract). The parked v1 plan for full family membership (plugin ABI, XRC-over-ABI UI) lives in `PLATFORM.md` Appendix A with explicit revival conditions.

# Compass Platform

Compass is a family of **desktop instruments**: self-contained, cross-platform, document-centric native tools in the lineage of MeshLab, CloudCompare, Audacity, and ImageJ. Each instrument opens a domain file format, renders it (native widgets for tables and text, an OpenGL viewport for the spatial and the dense), and lets a human inspect, measure, annotate, and export. The founding constraint: every instrument ships as a **static binary that runs on a fresh OS install** — one file, double-click, no installer, no runtime.

Compass is the sibling of **Caliper** (`../caliper/`), the realtime GPU-resident ML visualization platform. The two share a method (extract-don't-invent, decision logs, docs-as-code) but solve opposite problems: Caliper is a lens on a running *process*; Compass is a lens on an *artifact* — a file on disk. Compass does **no ML** (decision CD8): no training, no inference, no model-internals visualization. The only live coupling is shared file formats.

## Where the project stands

The governing spec is `PLATFORM.md` v2.1 at the repo root, delivered in phases **I0–I4** (§7). The repo is currently **at the start of I0** (identity & hygiene): the app target is still the legacy quaternion/slerp GL demo, and the instrument shell (frame, menus, AUI docking, layout persistence) is planned in `docs/superpowers/plans/2026-07-05-i0-identity-and-hygiene.md`. A minimal `hello_world` demo under `demos/hello_world/` already demonstrates the static-binary shape end to end.

| Phase | Delivers | Status |
|---|---|---|
| I0 | Spec committed, demo quarantined, minimal shell as static binary | **in progress** |
| I1 | Instrument #1: Plot Workbench (function grapher, native 2D — CD12) | **shipped (macOS)** |
| I2 | `libcompass` + `compass_add_instrument()` + template extracted | planned |
| I3 | Instrument #2: Signal Workbench (flagship); GL 3.3 modernization; Windows port | planned |
| I4 | Notarization, release trains, optional Run Browser | planned |

## What's here

This wiki is the docs-as-code companion to `PLATFORM.md`, organized along the [Diátaxis](https://diataxis.fr/) axes:

- **[Tutorials](tutorials/building-from-source.md)** — learning-oriented walkthroughs: [building from source](tutorials/building-from-source.md).
- **How-to guides** — task-oriented recipes: [run the demos](howto/run-the-demos.md), [admit a library](howto/admit-a-library.md) through the §5.2 policy.
- **Reference** — the facts: the [three-layer build system](reference/build-system.md) and the [library catalog](reference/library-catalog.md).
- **Explanation** — the why: the [source-level SDK architecture](explanation/architecture.md), the [static-binary principle](explanation/static-binary.md), and the [two rendering routes](explanation/rendering.md).
- **[Decisions](decisions/index.md)** — the decision log, mirroring `PLATFORM.md` §8.

## How this wiki stays true

The same three mechanisms as Caliper's wiki (its decision D15), not effort:

1. Doc updates land in the **same commit** as the change they describe.
2. Reference pages **embed the real files** via `pymdownx.snippets` with `check_paths: true` — a moved or renamed file breaks the docs build instead of silently orphaning the page.
3. `mkdocs build --strict` fails on any broken link or anchor.

!!! note "Source of truth"
    `PLATFORM.md` at the repo root remains the governing specification. Where this wiki summarizes it, the spec wins on any discrepancy.

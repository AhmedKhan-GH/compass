# Decisions

The platform decision log, mirroring `PLATFORM.md` §8.

!!! note "Source of truth"
    `PLATFORM.md` §8 remains the source of truth. This page is a convenience mirror; on any discrepancy, the spec wins.

| # | Decision | Status | Rationale / trade accepted |
|---|---|---|---|
| CD1 | **Static binary on a fresh install** is the founding principle (macOS/Windows static; Linux later via AppImage-style bundle) | **Ratified** (carried from v1) | One-file UX; no redistributable hell. Cost: binary size, Linux honesty. |
| CD2 *(v1)* | UI-as-data plugin ABI (XRC + handles) | **Deferred** → Appendix A | Right design *for a plugin host*; v2 has no plugin boundary to protect. Revive with family membership. |
| CD3 | Windows `/MT` static CRT | **Ratified** (simplified) | With no plugin boundary, the CRT-mismatch concern is moot; `/MT` is what CD1 requires. |
| CD4′ | **GL 3.3 core stays, as a framework-internal viewport** (`Canvas3D`); GLAD replaces GLEW; GLM stays; fixed-function banned | Proposed | Spatial/dense documents are half the instrument archetype. GL never appears in any future plugin contract — the canvas API is the boundary. |
| CD5′ | **Source-level SDK, not ABI**: curated `compass::` catalog + `libcompass` + `compass_add_instrument()` + template; explicit registration, no self-registering statics | Proposed | One toolchain, one binary → the compiler is the conformance suite. Cost: framework changes recompile all instruments. |
| CD6′ | **One binary per instrument** is the default product shape; suite binary is a later packaging option | Proposed | Product clarity + smallest fresh-install download. |
| CD7′ | **Library admission policy** (§5.2): real consumer, static-linkable, Layer-0-built, target-wrapped, cataloged | Proposed | Keeps the included libraries a curated surface, not an accretion. |
| CD8 | **Compass does no ML.** Data tooling around ML (viewing/annotating files) is in scope; training/inference/model-viz is Caliper's, permanently | **Ratified** (owner directive, 2026-07-05) | Kills the "second ML host" ambiguity; gives each sibling one face. |
| CD9 | Framework/SDK is **extracted at I2 from Instrument #1**, never designed up front | Proposed | Extract-don't-invent. Cost: I1 code gets refactored once, deliberately. |
| CD10 | **Monorepo for code; per-instrument release trains** — namespaced tags, one GitHub Release per instrument, path-filtered CI; `libcompass` splits only when a third-party author exists | Proposed | One build keeps the source-level SDK honest. Cost: repo-wide recompiles on framework change. |
| CD11 | **The distribution artifact is the bare static binary** — zipped `.exe` (Windows), notarized `.dmg` (macOS); no installers; update *check* allowed, auto-update daemon not | Proposed | Installers betray the fresh-install identity. |

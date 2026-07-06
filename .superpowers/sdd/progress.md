# Compass — Subagent-Driven Execution Ledger

Recovery map. Tasks marked complete are DONE — do NOT re-dispatch. Trust this + `git log` over memory after any interruption.

## Phase I0 — Identity & hygiene — COMPLETE (verified 2026-07-05)
- Branch: `i0-identity-hygiene` — MERGED to main (ff) 2026-07-05. main @ 98305ef.
- Commits (on top of pre-session history):
  - 784fd92 build: glew.cmake tarball fix + hello_world demo
  - 6c57add build: retire glew/glm submodules (Layer 0 fetches both)
  - 540370f refactor(I0): quarantine quaternion demo + sound_test under demos/; compass = shell stub
  - 5f340ee feat(I0): minimal shell — frame, menus, status bar, AUI workspace
  - 98305ef feat(I0): persist AUI perspective + window geometry
  - (plus earlier doc commits a3c9cb0, 05df56f on this branch)
- Exit criterion MET: `otool -L cmake-build-debug/compass` → zero non-system deps; binary builds (6.7M) and launches. All 4 targets build (compass, hello_world, quaternion_demo, sound_test).
- Original executor agent (aec60caf…) was interrupted before writing a report; controller verified independently.

## Phase I1 — Plot Workbench — IN PROGRESS (branch `i1-plot-workbench`)
Increment 1 (consolidate foundation: merge I0, integrate Expression, CTest wiring) — DONE @ 9161c47.
Design spec: docs/superpowers/specs/2026-07-05-plot-workbench-design.md (approved).
Detailed task plan: NOT yet written (author from the spec before full execution).

### Logic units (headless, TDD):
- **Expression** (parser/evaluator) — COMPLETE + INTEGRATED. On branch `i1-plot-workbench` (cherry-picked → 0267e9d, 9af84ac); CMake/CTest wired (9161c47) via `compass_plot` static lib + `tests/plot/`. `ctest` green (test_expression, 22 cases). Worktree removed.
- Sampler — NOT STARTED (depends on Expression interface, now final).
- PlotDocument — NOT STARTED (depends on Expression).
- CsvExporter — NOT STARTED (depends on Sampler).
- UI (PlotCanvas, ExpressionPanel, ViewPanel, frame wiring) — NOT STARTED (depends on logic units + I0 shell).

## Open decisions for controller
1. Merge `i0-identity-hygiene` → main (phase exit)?
2. Integration branch for I1 (`i1-plot-workbench`); bring Expression worktree branch onto it + wire doctest into CMake/CTest.
3. Wave 2: Sampler + PlotDocument (parallel, both depend only on Expression).

## Notes
- Session has crashed/interrupted twice; background agents were orphaned but work landed on disk. Prefer verifying disk state before re-dispatch.

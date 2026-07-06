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

## Phase I1 — Plot Workbench — ✅ COMPLETE (branch `i1-plot-workbench`, macOS, 2026-07-05)
Exit criterion MET: .plot save/reopen round-trip, PNG+CSV export, 4 CTest suites green, static audit clean (9.1M). MERGED to main (ff) 2026-07-05 at owner request. main @ 9e4d4e5.
Increment 1 (foundation) — DONE @ 9161c47.
Increment 2 (Sampler + PlotDocument logic) — DONE. 3 test suites green via CTest.
Increment 3 (CsvExporter + first visible PlotCanvas) — DONE.
Increment 4 (interactivity) — DONE.
Increment 5 (persistence + PNG/CSV export + exit-criterion verification) — DONE. I1 COMPLETE.
Design spec: docs/superpowers/specs/2026-07-05-plot-workbench-design.md (approved).
Detailed task plan: NOT yet written (author from the spec before full execution).

### Logic units (headless, TDD):
- **Expression** (parser/evaluator) — COMPLETE + INTEGRATED. On branch `i1-plot-workbench` (cherry-picked → 0267e9d, 9af84ac); CMake/CTest wired (9161c47) via `compass_plot` static lib + `tests/plot/`. `ctest` green (test_expression, 22 cases). Worktree removed.
- Sampler — COMPLETE (i1 branch). 2 samples/px, non-finite gap split. 5 cases, ctest green.
- PlotDocument — COMPLETE (i1 branch). Expr list + view + memento undo/redo + .plot JSON (hand-rolled, defensive). 12 cases, ctest green.
- CsvExporter — COMPLETE (i1). Uniform-grid CSV, empty cells for non-finite. 5 cases, ctest green.
- PlotCanvas — COMPLETE (i1). Native-2D axes/grid/curve; docked center pane; shell draws sin(x). Launches, audit clean.
- ExpressionPanel, ViewPanel, Edit/Undo/Redo menu, canvas pan/zoom + cursor — COMPLETE (i1 inc4a+4b). All surfaces sync via MainFrame::OnDocumentChanged. Build+audit clean, ctest 4/4.
- Save/Open .plot, PNG/CSV export, final audit — COMPLETE (i1 inc5). File menu New/Open/Save/SaveAs + dirty prompt + title; Export PNG/CSV. Exit criterion verified.

## Open decisions for controller
1. Merge `i0-identity-hygiene` → main (phase exit)?
2. Integration branch for I1 (`i1-plot-workbench`); bring Expression worktree branch onto it + wire doctest into CMake/CTest.
3. Wave 2: Sampler + PlotDocument (parallel, both depend only on Expression).

## Notes
- Session has crashed/interrupted twice; background agents were orphaned but work landed on disk. Prefer verifying disk state before re-dispatch.


## Phase I2 — Extract the SDK — ✅ COMPLETE (branch `i2-extract-sdk`, macOS, 2026-07-06). Exit criterion met: template instrument builds+runs via compass_add_instrument() without touching framework code. NOT yet merged (awaiting owner OK).
- inc1 DONE: compass::Document/UndoableDocument (libcompass), PlotDocument derives it, catalog lint+CI. 5 CTest.
- inc2 DONE: compass::App + DocumentFrame shell extracted; MainFrame thin subclass; templates/instrument builds+launches (template-as-spec §5.6 passes). Exit criterion effectively met. app+template audit clean, ctest 5/5.
- inc3 DONE: compass_add_instrument() CMake fn + compass::wx/glm catalog wrappers + optional instruments/plot_workbench/ move. Then propose merge to main.

## Phase I3 — Signal Workbench + GL + Windows — IN PROGRESS (branch `i3-signal-workbench`)
- GL modernization milestone DONE: GLAD admitted (compass::gl); compass::Canvas2D (GL 3.3 core, pixel-space rule) built; demos/gl_smoke proves it; GLEW + quaternion demo deleted; zero fixed-function GL in src/libcompass/demos. ctest 5/5, audits clean.
- I3 signal logic core DONE: EdfReader + WaveformDecimator + SignalDocument (8 CTest suites green). nlohmann/json admitted as compass::json; both plot+signal migrated, hand-rolled parsers deleted.
- I3 Signal Workbench UI DONE (macOS): instruments/signal_workbench/ via compass_add_instrument — WaveformCanvas (first GL Canvas2D consumer, decimated), channel tree, annotation table + undo, EDF open + .annot sidecar. samples/demo.edf fixture parses. 4 binaries launch, ctest 8/8, audits+lint clean.
- I3 Windows port CODE-COMPLETE (portable GL loader, /MT, matrix CI) but CI-UNVERIFIED (no Windows toolchain here). macOS fully green. I3 code work DONE — propose merge to main (with Windows-verification caveat).

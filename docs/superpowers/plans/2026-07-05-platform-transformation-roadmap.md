# Compass Platform Transformation — Master Roadmap (I0 → I4)

> **For agentic workers:** This is the top-level execution spec for the full PLATFORM.md v2.1 transformation. It is a **roadmap of phases, not a task list**. Exactly one phase has a detailed task-level plan at any time (the next one to execute); you author the next phase's plan only after the current phase's exit criterion is verified. REQUIRED SUB-SKILLS: superpowers:writing-plans (to author each phase plan), then superpowers:subagent-driven-development (to execute it).

**Goal:** Transform the compass repo from a single GL demo into the desktop-instrument platform specified by `PLATFORM.md` v2.1: a source-level SDK (curated library catalog + `libcompass` + instrument template) shipping instruments as fresh-install static binaries on macOS and Windows.

**Source of truth:** `PLATFORM.md` at the repo root governs. On any conflict between this roadmap, a phase plan, and the spec — the spec wins, and the conflict gets reported to the owner (Ahmed) rather than silently resolved.

## Standing rules (apply to every phase)

1. **Every phase ends shippable.** A phase is not done until its exit criterion is demonstrated, not assumed.
2. **Static-binary audit at every phase exit:** `otool -L <binary> | grep -vE '/usr/lib/|/System/Library/'` → empty (macOS); no VC++ redistributable / `/MD` dependencies (Windows, from I3).
3. **Extract, don't invent** (CD9): no framework code, no library admission, no abstraction before its real consumer exists.
4. **Library admissions** go through the §5.2 five-condition policy, one PR each: External build + wrapper target + catalog row (in `PLATFORM.md` §5.2 *and* `docs/wiki/reference/library-catalog.md`) + first real use.
5. **Docs-as-code, same commit:** any commit that falsifies a `docs/wiki/` page updates that page in the same commit; `uvx --with mkdocs-material mkdocs build --strict` must pass. The decision-log mirror (`docs/wiki/decisions/index.md`) tracks `PLATFORM.md` §8.
6. **No fixed-function GL in new code, ever.** From I3 on (the GL modernization phase per CD12), none in the repo at all.
7. **Branch per phase** (`i0-identity-hygiene`, `i1-plot-workbench`, …); merge to `main` only at phase exit.
8. **Phase-plan authoring:** when a phase completes, write the next phase's detailed plan with superpowers:writing-plans into `docs/superpowers/plans/`, deriving tasks from `PLATFORM.md` §7 and this roadmap's phase card — then execute it. Never execute a phase from this roadmap directly; it lacks task-level detail by design.
9. **TDD scales to stakes × logic** (owner's rule): document models, undo stacks, parsers, exporters are test-driven; UI scaffolding is not. Each phase card names its TDD surface.

## Phase cards

### I0 — Identity & hygiene ("now")

- **Detailed plan:** `docs/superpowers/plans/2026-07-05-i0-identity-and-hygiene.md` — **exists, execute it as written.**
- **Delivers:** corrected spec committed; glew/glm submodule retirement; quaternion demo → `demos/quaternion/`; `sound_test` → `demos/sound_test/`; `compass` target becomes the minimal shell (frame, native menus, AUI workspace, layout persistence); wiki pages updated.
- **Exit criterion:** fresh-install shell binary on macOS (static audit passes; binary runs from a bare path).
- **TDD surface:** none (pure UI scaffolding).

### I1 — Instrument #1: Plot Workbench (monolithic on the shell)

- **Detailed plan:** to be authored at I0 exit. **Design spec exists:** `docs/superpowers/specs/2026-07-05-plot-workbench-design.md` (approved 2026-07-05) — derive the plan from it.
- **Delivers, per the design spec and `PLATFORM.md` §7-I1 (CD12):**
    - A function grapher: expression parser/evaluator (`sin cos tan asin acos atan exp log log10 sqrt abs floor ceil`, `pi`/`e`, `+ - * / ^`, parens, unary minus), uniform sampler with non-finite gap handling, native-2D plot canvas (`wxGraphicsContext`, §6.1) with drag-pan/wheel-zoom.
    - Document type **`.plot`** (JSON worksheet: expressions, view rect, per-curve styling) with load/save/dirty and **undo via a command stack**; wxDataViewCtrl expression panel (show/hide, color, error badges); wxPropertyGrid view panel; PNG + CSV export.
    - **doctest** admitted through Layer 0 as a dev-only (never shipped) test dependency; tests run via CTest.
    - **No GL work** — GLEW, the quarantined quaternion demo, and the §6.2 modernization are untouched until I3.
    - Built *inside* the app target — no `libcompass`, no premature extraction.
- **Exit criterion:** a student downloads one macOS binary, types `sin(x)/x`, restyles it, saves/reopens the worksheet, exports a PNG. Static audit passes. Parser/sampler/document/exporter fully unit-tested, green under CTest.
- **TDD surface:** expression tokenize/parse/precedence/associativity + error positions; sampler non-finite splitting; every document command's apply/undo/redo + dirty transitions; `.plot` JSON round-trip incl. malformed-input rejection; CSV output.

### I2 — Extract the SDK (rule of two, applied at first opportunity)

- **Detailed plan:** to be authored at I1 exit, **sized by what Instrument #1 actually contains** (CD9 — this is why it cannot be written today).
- **Delivers, per §5.3–5.4:** `libcompass/` static library (App, Document/View + command stack, workspace shell, export helpers — **no GL canvas yet**; `Canvas2D` joins the framework at I3 when it's built) extracted from Plot Workbench; `compass_add_instrument()` CMake function (static flags, bundle metadata, packaging targets, generated `main()` with **explicit** document-factory registration — no self-registering statics); `instruments/plot_workbench/` as the first Layer-2 consumer; `templates/instrument/` buildable skeleton; catalog targets wrapped as `compass::wx`, `compass::glm` (`compass::gl` arrives at I3); CI: template builds on every commit + non-catalog-include lint (§5.6).
- **Exit criterion:** a template-derived instrument builds, runs, and opens a stub document on macOS **without touching framework code**.
- **TDD surface:** whatever document/command logic moves into `libcompass` keeps its I1 tests green through the extraction; the template's stub document gets a round-trip test.

### I3 — Instrument #2: Signal Workbench (flagship) + Windows

- **Detailed plan:** to be authored at I2 exit.
- **Delivers, per §7-I3 (CD12 moved the GL debt here — sequence per R7: GL milestone first, flagship second, Windows last):**
    - **GL modernization (§6.2), as its own reviewable milestone:** admit GLAD as `compass::gl` via §5.2 (the waveform canvas is its first consumer); delete GLEW (`cmake/External/glew.cmake` + tarball download) and the quarantined quaternion demo; `Canvas2D` owning a 3.3-core forward-compatible context and the pixel-space rule (§6.3) in exactly one place; `grep -rn "glBegin\|GLU\|glew" src/ demos/ libcompass/` → nothing.
    - EDF parser admitted via §5.2; `instruments/signal_workbench/` — decimated min/max waveform rendering on the GL `Canvas2D`, lead/channel tree, annotation model (document + undo), label export.
    - **Windows port**: static wx msw + `/MT` (CD3), both instruments building in CI on macOS + Windows.
- **Exit criterion:** both instruments ship as fresh-install binaries on **macOS and Windows**; an annotation session survives a save/reopen round-trip. Scope guard (R2): view + annotate + export **one** format (EDF) — nothing more.
- **TDD surface:** EDF header/record parsing against reference files, min/max decimation correctness, annotation model round-trip, undo across canvas+table operations.

### I4 — Distribution polish & optional convergences

- **Detailed plan:** to be authored at I3 exit; scope negotiated with the owner (items here are optional except release trains + notarization).
- **Delivers, per §5.7/§7-I4:** per-instrument release trains (namespaced tags `<name>/vX.Y.Z` → CI builds macOS arm64 + Windows x64 → GitHub Release per instrument; zipped `.exe`, notarized `.dmg`; **no installers** — CD11); codesign/notarization; path-filtered per-push CI + nightly full matrix; optional: suite binary (§5.5), AppImage-style Linux bundle, **Run Browser** (DuckDB admitted via §5.2, read-only over Caliper's stores — file-format contract only).
- **Exit criterion:** pushing `plot-workbench/vX.Y.Z` produces a downloadable, notarized/zipped release with no manual steps; a fresh-machine download-and-run of each artifact works.
- **TDD surface:** none new beyond what optional features bring (Run Browser: schema-reading queries against a fixture DuckDB store).

## What is explicitly out of scope for the whole transformation

- Anything ML (CD8), any plugin ABI / `dlopen` / manifest gate (Appendix A — parked until Caliper Phase 3 **and** ≥2 shipped instruments with users), Linux static binaries (AppImage-style bundle only, and only if demanded), auto-update daemons, installers.

## Escalate to the owner (don't decide autonomously)

- Any deviation from a ratified decision (CD1, CD3, CD8) or a §7 exit criterion.
- Admitting a library not named in the spec's anticipated list.
- I4 optional-item selection; anything touching Caliper's repo.
- A phase plan that cannot satisfy its exit criterion as specified.

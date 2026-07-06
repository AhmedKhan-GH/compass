# Compass — Architecture & Delivery Plan (v2)

| | |
|---|---|
| **Status** | Draft v2.1 for review — v2.1 adds §1.1 (exemplar catalog), §1.2 (Caliper relationship), §5.7–5.8 (repo, release & authoring model) |
| **Date** | 2026-07-05 |
| **Owner** | Ahmed Khan |
| **Supersedes** | v1 (commit `a5b7e25`, 2026-06-10) — "Compass as the second host of the Caliper platform family." That plan is not discarded; it is **deferred** and summarized in Appendix A. This revision changes *what Compass is for*; the deferred plan remains the path to family membership if and when Caliper's Phases 3/6 happen. |
| **Sibling project** | `caliper` — the realtime, GPU-resident ML visualization platform. Compass is a **sibling, not a satellite**: this plan has no dependency on any Caliper phase. Shared lessons (pixel-space contract, static-build discipline) are inherited; shared infrastructure is not required. |
| **Scope** | Compass is a family of **desktop instruments**: self-contained, cross-platform, document-centric native tools. Founding constraint (unchanged from v1): every instrument ships as a **static binary that runs on a fresh OS install**. |

> **How to read this document.** §1 states the identity. §2 audits the repo today. §5 is the heart: the source-level SDK architecture — how instrument code, the framework, and the included libraries relate, and how a library earns its way in. §7 is the delivery plan. Appendix A parks the v1 family-membership design.

---

## 1. Identity — the desktop instrument

**Caliper is a lens on a *process*: live training state, GPU-resident, same-frame, audience of one — the model's author. Compass is a lens on an *artifact*: a file on disk, session-based, native, audience of anyone you hand the binary to.**

| | **Caliper** | **Compass** |
|---|---|---|
| Looks at | a running process (training loop) | a document (file on disk) |
| Tempo | realtime, per-optimizer-step | deliberate sessions: inspect, measure, annotate, export |
| UI model | immediate-mode ImGui, one frame loop | native widgets: menus, docking (AUI), property grids, document/view |
| Rendering | `HostRenderer` → Metal/Vulkan, GPU-resident tensors | native 2D (`wxGraphicsContext`) + an OpenGL 3.3 core viewport for spatial documents |
| User | the author, on a dev machine | a collaborator, clinician, student, reviewer — often on a **locked-down machine** |
| Killer constraint | zero-copy tensor→pixels in-loop | **static binary, runs on a fresh install** |
| ML | yes — that is the point | **no** — Compass never trains, infers, or visualizes model internals. Data tooling around ML (viewing/annotating the data itself) is in scope; the models are not. |

The archetype Compass serves is the **scientific/engineering desktop instrument**: the lineage of MeshLab, CloudCompare, Audacity, ImageJ — tools that open domain data, render it (natively for tables and text, GL for the spatial and the dense), and let a human work on it. That lineage is underserved precisely because the "just runs, zero install" discipline is hard. Compass has already paid for that discipline (static wx, three-layer build); this plan spends it.

**An instrument is a product.** The default packaging is one binary per instrument (the "Audacity model"), not one shell hosting many plugins (the "Eclipse model"). A suite binary bundling several instruments is a compile-time packaging choice available later (§5.5), never an architectural requirement.

### 1.1 Exemplar instruments — chosen so wx's strengths show

Each exemplar is keyed to capabilities native toolkits are *for* and immediate-mode toolkits are bad at — that contrast is the reason the second face exists. Each admits its libraries through §5.2; none is built before its phase.

| Instrument | Opens | wx strengths on display | Spatial rendering | When |
|---|---|---|---|---|
| **Plot Workbench** | `.plot` function worksheets (expressions, axis ranges, per-curve styling) | wxDataViewCtrl expression list (show/hide, color, inline error badges); wxPropertyGrid axis/grid editing; native menus + document/view undo spanning every panel; native dialogs for PNG/CSV export | native 2D (`wxGraphicsContext` curves) | I1 |
| **Signal Workbench** *(flagship)* | EDF/WFDB recordings + annotation sidecar files | AUI docking (channel tree ⋮ waveform canvas ⋮ annotation table); wxTreeCtrl lead/channel tree; wxDataViewCtrl annotation list synced to the canvas; command-stack undo spanning both; native file dialogs + drag-and-drop of recordings | `Canvas2D` (decimated min/max waveforms) | I3 |
| **Run Browser** | Caliper's DuckDB run/artifact stores, read-only | wxDataViewCtrl in **virtual-model mode** paging thousands of runs straight from DuckDB (sort/filter without materializing the table); artifact-lineage tree; side-by-side run comparison as persisted AUI layouts | native 2D (sparkline cells via `wxGraphicsContext`) | I4 |
| **Graph Explorer** | knowledge-graph output directories (e.g. `graphify-out/`) | search-driven navigation (wxSearchCtrl + tree) twinned with a spatial canvas; wxStyledTextCtrl — Scintilla, built into wx — showing node source with syntax highlighting; print/export of subgraph views | `Canvas2D` (force layout) | backlog, on demand |

The first two are roadmap-committed (§7). Run Browser is the zero-ABI Caliper crossover (§1.2). Graph Explorer is backlog: it enters the roadmap only when actually wanted, per the same extract-don't-invent rule as everything else.

### 1.2 Relationship to Caliper — today, and the optional merge later

**Today: decoupled in execution, mirrored in method.** No phase here depends on any Caliper phase (the v1 gating is gone). What carries over is the playbook — extract-don't-invent, decision logs, template-as-spec, every phase ends shippable — applied at the opposite contract layer, because the two SDKs solve opposite distribution problems:

| | `caliper-sdk` | Compass SDK |
|---|---|---|
| Who builds against it | strangers, shipping separate binaries `dlopen`ed into a running host | you, in one repo, one build |
| Contract | frozen C ABI, epochs, conformance suite | C++ + CMake targets; the compiler is the conformance suite |
| What it makes cheap | the N+1th applet *by someone else* | the N+1th instrument *by you* |
| Distribution unit | `.caliperapp` bundle + runtime packs | the static binary itself |

The only live coupling is deliberately the weakest kind: **shared file formats** (Run Browser reads Caliper's DuckDB stores; the schema, not an API, is the contract).

**Later: the optional merge, on reversed terms.** Caliper's PLATFORM.md still lists Compass at its Phase 6 (`libcaliper`, second host); Appendix A holds this side's parked design and its revival conditions (Caliper past Phase 3 **and** ≥2 shipped instruments with users). If both arrive, value flows the other way from v1: Compass brings the thing Caliper's ecosystem phases most lack — an audience that isn't the author. Caliper's Phase 5 exit is literally *"someone who isn't you ships an applet"*; Compass instrument users are the most plausible population that person emerges from. Nothing in v2 needs undoing to merge: `Canvas3D/2D`'s API is already the toolkit-free surface the parked `compass.canvas.v1` contract needs.

---

## 2. Where We Are (Current-State Audit, revised)

| Asset | Location | Verdict (v2) |
|---|---|---|
| wxWidgets 3.3.2 built **static** via ExternalProject | `cmake/External/wxwidgets.cmake`, `WXWIDGETS.md` | **Keep — the founding principle in motion.** Seed of the fresh-install guarantee (§4). |
| Three-layer build (Source/Build/Integration) | `cmake/README.md`, `cmake/Dependencies.cmake` | **Keep — it becomes Layer 0 of the SDK** (§5.2). |
| Retina content-scale fix, single code path | `README.md` | Keep. Promoted to the pixel-space rule (§6.3); lesson already exported to Caliper's family ABI. |
| Quaternion/slerp visualization demo | `src/main.cpp` | **Quarantined history** (moves to `demos/quaternion/` at I0, still buildable). Its GL 2.1 rendering is debt deleted at the I3 GL modernization (§6.2); the quaternion math returns only if a spatial instrument ever wants it (backlog). CD12 made Plot Workbench Instrument #1 instead. |
| GLEW (static) | `cmake/External/glew.cmake` | **Replace with a GLAD 3.3-core loader** during the I3 GL modernization (§6.2, CD12). GLEW solves a loader problem we stop having once the context is fixed at 3.3 core. |
| GLM | submodule | **Keep — reverses v1.** v1 retired GLM with the GL demo; v2 keeps GL, so GLM stays as the geometry-math library (`compass::glm`, §5.2). |
| `sound_test` utility | `src/sound_test.cpp` | Park; not platform-relevant. |
| Windows build | `cmake/README.md` | Still unimplemented; becomes a phase deliverable (I3) since cross-platform is the use case. |
| Linux | GTK3 via wx | Dev platform; static honesty per §4 unchanged. |

**What's missing for the instrument identity:** the shell (document/view frame, AUI workspace, persistence), the framework library, and the first real document type. Nothing to migrate; only to build.

---

## 3. Design Goals & Non-Goals

### Goals

1. **Fresh-install static binary.** Unchanged from v1, verbatim: a user on a factory-fresh macOS or Windows machine downloads one file and double-clicks it. This is Compass's identity the way zero-copy is Caliper's.
2. **Instruments as products.** Each instrument is a complete, nameable tool with its own document types, not a plugin in search of a host.
3. **A source-level SDK** (§5): building instrument N+1 is dramatically cheaper than instrument N, because the shell, the viewport, the document model, and the curated libraries are a framework you code *against*, with one obvious way to do each thing.
4. **Native interface-heavy UX.** Real menus, native file dialogs, AUI docking, property grids, undo — the things wx is for.

### Non-Goals

- **Machine learning.** No training, no inference, no model-internals visualization — that is Caliper, and it handles it well. Compass may open and annotate the *data* that ML consumes or produces (files), which is data tooling, not ML.
- **Realtime GPU visualization.** Caliper's face. Compass's GL viewport draws documents at interaction rate, not training state at step rate.
- **A plugin ABI (for now).** No `dlopen`, no frozen C contract, no manifest gate. Everything compiles into the binary. The v1 family-membership design (XRC-over-ABI, host-neutral services) is parked in Appendix A, to be revived only if Caliper's ecosystem phases happen *and* Compass has instruments worth federating.
- **Linux static binary (for now).** Unchanged from v1: GTK3 cannot be honestly statically linked; Linux ships later as an AppImage-style bundle. Until then Linux is a dev platform.

---

## 4. The Static-Binary Principle — unchanged

v1 §4 carries over verbatim in substance:

| Platform | Mechanism |
|---|---|
| macOS | static wx + system frameworks only → single Mach-O. Codesign/notarize at distribution-polish time. |
| Windows | **static CRT (`/MT`)** + static wx (msw) → single `.exe`, no VC++ redistributable. With no plugin boundary at all (v2), the CRT-mismatch concern that shaped Caliper's D7 and v1's CD3 vanishes entirely — `/MT` is simply the default. |
| Linux (later) | AppImage-style bundle — same one-file UX, different mechanism, honestly labeled. |

Forbidden, unchanged: any feature requiring a runtime the OS doesn't ship — no .NET, JVM, Python, WebView2, no "please install X first" dialog, ever. An instrument that needs a heavyweight optional capability ships it statically or doesn't ship it.

---

## 5. The SDK — a clear way to code with the included libraries

### 5.1 The central decision: source-level SDK, not ABI SDK

Caliper's SDK is a **frozen C ABI** because its applets ship as separate binaries, built by other people, loaded into a running host — the contract must survive compiler, version, and vendor skew, so it is written in the only language that can (C structs, epochs, conformance gates).

Compass's static-binary identity produces the **opposite** situation: instrument code, framework, and libraries are compiled **together into one binary by one toolchain in one build**. There is no boundary to freeze. So the SDK contract lives at the *source and build-system* level, which buys what an ABI never can:

- **Modern C++ across the whole stack** — real classes, RAII, templates, `std::` types in interfaces. No handle tables, no `struct_size` fields, no epochs.
- **Refactoring freedom** — until a plugin boundary exists (Appendix A), framework interfaces can improve without breaking anyone; the compiler re-checks every caller on every build.
- **One toolchain, zero skew** — the entire class of CRT/allocator/RTTI mismatch problems is structurally absent.

"SDK" here means exactly three artifacts: **a curated library layer** (5.2), **a framework library** (5.3), and **one CMake entry point plus a template** (5.4). Clarity comes from each layer having one obvious way in.

### 5.2 Layer 0 — the curated library catalog

The three-layer build (`cmake/External/*`) already builds dependencies statically. Layer 0 formalizes it: every admitted library is wrapped in a namespaced **imported/interface target carrying its full usage requirements** — include paths, definitions, link deps — so instrument code writes `target_link_libraries(... compass::glm)` and includes headers; never a raw path, never include-dir folklore.

Initial catalog:

| Target | Library | Role | Status |
|---|---|---|---|
| `compass::wx` | wxWidgets 3.3.2 (static, monolithic build — core+aui+propgrid in one lib — plus glcanvas lib) | native UI | built today; wrap as target |
| `compass::gl` | GLAD 3.3-core loader (replaces GLEW) | GL function loading | I3 deliverable — first consumer is the flagship's waveform canvas (CD12) |
| `compass::glm` | GLM | geometry math for viewport code | present; wrap as target |

**Admission policy** — a library enters the catalog only when **all** hold:

1. **A real consumer exists** — an instrument or the framework needs it *now* (extract-don't-invent applies to dependencies too; nothing enters speculatively).
2. **Statically linkable** with a license compatible with shipping in a closed static binary.
3. **Built by Layer 0** — pinned version, built from source by `cmake/External/`, no system-package assumptions.
4. **Wrapped as a `compass::` target** with complete usage requirements.
5. **Cataloged** — one row in this table, one paragraph in the SDK docs saying what it's for and what *not* to use it for.

Anticipated future admissions, each waiting on its consumer: an EDF/WFDB parser (Signal Workbench, I3); an embedded store — SQLite or DuckDB — when the first instrument needs persistence beyond documents (DuckDB has a tiebreaker: it would let Compass open Caliper's run/artifact stores read-only, a cross-project feature that needs no ABI, just a file format).

### 5.3 Layer 1 — `libcompass`, the instrument framework

A static library owning everything every instrument needs, so instruments contain only domain logic. Contents, extracted (not invented) from the shell and Instrument #1 as they're built:

- **`compass::App`** — wxApp subclass handling init, single-instance policy, settings, crash-report hook.
- **Document/View core** — `compass::Document` (load/save/dirty/undo via a command stack) and `compass::View`; instruments subclass both and register file extensions. This is wx's own docview pattern, curated to one blessed shape.
- **Workspace shell** — main frame, AUI manager, layout persistence, menu/toolbar construction helpers, property-grid and tree-panel helpers, status bar, native file dialogs wired to document types.
- **`compass::Canvas3D` / `Canvas2D`** — the GL viewport widget: owns a **3.3 core, forward-compatible** context (GLAD-loaded), applies the pixel-space rule (§6.3) in exactly one place, provides camera/pan/zoom controllers, and hands instruments a per-frame draw callback plus small mesh/line/text draw helpers as they earn their way in from real instrument code.
- **Export** — image snapshot of any canvas, CSV/JSON writers for tabular views.

Rule of thumb for what belongs here: **if the second instrument would copy-paste it from the first, it moves into `libcompass`.** (Corollary: `libcompass` is *extracted* at I2, after Instrument #1 exists monolithically — not designed up front. §7.)

### 5.4 Layer 2 — instruments, and the one CMake entry point

```cmake
# an instrument's entire CMakeLists.txt, target shape:
compass_add_instrument(plot_workbench
    SOURCES   src/plot_document.cpp src/plot_view.cpp src/plot_canvas.cpp
    DOC_TYPES ".plot;Function worksheet"
    LIBS      # catalog targets only; plot_workbench needs none beyond libcompass
)
```

`compass_add_instrument()` produces the static-binary app target: links `libcompass` + listed catalog targets, applies the static flags (`/MT`, static wx), sets bundle metadata (icon, version, document-type associations for Finder/Explorer), and registers the packaging targets. A `templates/instrument/` directory holds a buildable skeleton (document + view + canvas + tests) that is the documented starting point — "copy this to start an instrument," the same role `examples/my_scope` plays for Caliper.

**Registration is explicit, not magic.** Each instrument's `main()` (generated by the CMake function) registers its document factories via an explicit list. No self-registering static initializers: under static linking, linkers dead-strip unreferenced object files, which silently eats self-registration — an honest constraint of the static identity, so the SDK never relies on it.

### 5.5 Packaging modes

- **Default: one binary per instrument.** Smallest download, clearest product identity, the fresh-install story at its purest.
- **Optional later: a suite binary** — several instruments compiled into one executable with a launcher page. Pure packaging (a `compass_add_suite()` over the same instrument libraries); requires no architectural change because instruments are libraries linked at build time either way.

### 5.6 How this SDK stays disciplined without an ABI

No frozen contract means drift is the risk; the countermeasures are build-time, matching the source-level identity:

- **The catalog is the only door.** CI greps instrument sources for includes of non-catalog third-party headers and fails the build (the moral equivalent of Caliper's conformance lint, at the source level).
- **The template is the spec.** The instrument template builds in CI against every framework change; if a framework refactor breaks the template, the refactor fixes the template in the same commit — the same "docs/spec updated in the same commit" discipline as Caliper's D15.
- **Framework changes recompile everything** — the compiler is the conformance suite until the day a real plugin boundary (Appendix A) makes an ABI necessary. That day, and not before, Compass pays ABI costs.

### 5.7 Repo & release model — monorepo for code, release trains per binary

**One repository, many shipped executables.** "Does everything happen in a monorepo?" has a precise answer: the *code* does, because the source-level SDK (CD5′) is only honest when every consumer compiles in the same build — a framework refactor, all instruments, and the template land in one commit, checked by one compiler run. Splitting instruments into their own repos now would reintroduce exactly what the no-ABI decision avoided: tagged framework releases, version pins, a compatibility matrix — the ABI problem rebuilt at the source level, paid while every author is still you.

```
compass/
├── cmake/                    # Layer 0 — External/ builds + compass:: catalog targets
├── libcompass/               # Layer 1 — the framework (extracted at I2)
├── instruments/
│   ├── plot_workbench/       # Layer 2 — one directory = one product
│   └── signal_workbench/
├── templates/instrument/     # the buildable skeleton; CI-gated spec of the SDK
└── demos/                    # quarantined history (GL 2.1 quaternion demo)
```

But the **release unit is the binary, not the repo.** Instruments version and ship independently:

- Tags are namespaced per instrument — `plot-workbench/v0.3.0` — and each tag triggers CI to build that instrument's static binaries for macOS (arm64) and Windows (x64) and publish a GitHub Release for that instrument alone.
- Each instrument declares its own version in its `compass_add_instrument()` call; `libcompass` is deliberately unversioned (it lives at repo HEAD) until the split trigger below.
- Release artifacts are the identity made literal: **Windows — a zipped single `.exe`; macOS — a notarized `.dmg`** (zipped `.app` until notarization lands at I4). **No installers, ever** — an installer is the exact experience CD1 exists to delete. An in-app *update check* (version compared against the GitHub Releases API) is permitted polish; an auto-update daemon is not.
- Per-push CI stays fast with path filters (an instrument-only change builds that instrument + the template); tag builds and a nightly run the full matrix.

**The split trigger — the Compass mirror of Caliper's Phase 3.** The day a third party wants to build an instrument out-of-tree, `libcompass` splits into its own repo with tagged releases and the catalog becomes a published package — and not one day before. Caliper split its SDK when strangers needed to build against it; Compass inherits the same rule. Until strangers exist, the monorepo isn't a compromise — it *is* the better thing.

### 5.8 The authoring workflow — day one to shipped

How an instrument is meant to be written, end to end:

1. **Start from the template:** copy `templates/instrument/` to `instruments/<name>/`, rename the target in its `CMakeLists.txt` (`compass_add_instrument(<name> …)`). It builds and opens a stub document immediately.
2. **Implement the three subclasses:** a `compass::Document` (state, load/save, undo commands), a `compass::View` (panels, property grids, menu contributions via shell helpers), and — if the document is spatial — a `Canvas3D/2D` draw callback. Link only `compass::` catalog targets; the include lint (§5.6) enforces it.
3. **Develop like any target:** it's an executable in the one build — run it, debug it in the IDE, unit-test document logic headlessly (documents are wx-light by construction; the canvas callback is the only render-bound code).
4. **Need a library?** Admission first (§5.2): one PR adds the `cmake/External/` build, the `compass::` wrapper target, the catalog row, and the first real use. No vendored snippets, no system packages.
5. **Ship:** bump the instrument's version, push `<name>/vX.Y.Z`, CI publishes the per-platform binaries. The download link *is* the distribution story.

---

## 6. Rendering

### 6.1 Two routes, one rule each

- **Native 2D** (`wxGraphicsContext` → CoreGraphics / Direct2D / Cairo) for everything document-chrome-like: tables, text, small plots, print/export fidelity. Unchanged from v1.
- **OpenGL 3.3 core** via `compass::Canvas3D/2D` for spatial and dense documents: 3-D scenes, million-point waveforms with pan/zoom. **This reverses v1's CD4** ("no GL anywhere in the contract"): that rule protected a future plugin ABI, which v2 defers. GL is now an *internal implementation choice of the framework* — instruments use `Canvas3D`'s API, and if a future family phase needs a toolkit-free contract, the canvas API (not GL) is what crosses it, exactly as v1 §5.2 designed.

### 6.2 The GL debt, paid once

The demo's GL 2.1 immediate-mode path (`glBegin`, GLU) is the doubly-deprecated dead end Caliper's docs cite as a cautionary tale — and macOS caps core profiles at 4.1, so the honest, portable target is **3.3 core, forward-compatible, compatibility profile banned** (same rule as Caliper's frozen GL fallback, same reasoning). The modernization lands at **I3** (deferred from I1 by CD12, since Instrument #1 is native-2D and GLAD's first real consumer is the flagship's waveform canvas): GLAD replaces GLEW, `Canvas2D` owns the context, the quarantined quaternion demo is deleted, and no fixed-function call survives in the repo from I3 on.

### 6.3 The pixel-space rule

Unchanged and non-negotiable: framebuffer sizes are **physical pixels**, widget/layout coordinates are **logical units**, `GetContentScaleFactor()` converts, and the conversion lives in exactly one place — inside `Canvas3D/2D`. This repo is where the lesson was learned (`README.md`, Retina fix); the framework makes it unrepeatable-by-construction. Instruments never see the scale factor.

---

## 7. Delivery Plan — phases I0–I4

Every phase leaves Compass shippable as a static binary. No phase depends on Caliper.

- **I0 — Identity & hygiene (now).** Commit this document. Quarantine the demo (`src/main.cpp` → `demos/quaternion/`, still buildable). App target becomes the minimal shell: frame, menus, AUI manager, empty workspace, layout persistence — **the static-binary deliverable**. Park `sound_test`. *Exit:* fresh-install shell binary on macOS.
- **I1 — Instrument #1: Plot Workbench (monolithic on the shell). ✅ SHIPPED (macOS, 2026-07-05).** A function grapher — the anti-web-app demo (design: `docs/superpowers/specs/2026-07-05-plot-workbench-design.md`). Document type `.plot` (a worksheet: expressions, axis ranges, per-curve styling); expression parser/evaluator (the TDD core), uniform sampler with non-finite gap handling, native-2D plot canvas (`wxGraphicsContext`, §6.1) with pan/zoom, expression-list panel + view property grid, undo across all panels, PNG/CSV export. **No GL** — the §6.2 modernization moves to I3 (CD12). Built *inside* the app — no framework extraction yet. *Exit met:* `sin(x)`/`sin(x)/x` types & restyles live, `.plot` save→reopen round-trips, PNG/CSV export work; 4 CTest suites green (expression, sampler, document, csv); static audit clean (9.1 MB, zero non-system deps).
- **I2 — Extract the SDK (rule of two, applied at first opportunity). ✅ SHIPPED (macOS, 2026-07-06).** Split `libcompass` + `compass_add_instrument()` + the template out of Instrument #1's code. Wrap the catalog targets (§5.2). CI: template builds against the framework on every commit; catalog lint on. *Exit:* the template instrument builds, runs, and opens a document on macOS — created without touching framework code.
- **I3 — Instrument #2: Signal Workbench (flagship) + Windows + the GL debt.** GL modernization per §6.2 lands here first (GLAD admitted as `compass::gl` — the waveform canvas is its first consumer — GLEW out, 3.3-core `Canvas2D`, quaternion demo deleted; zero fixed-function GL in the repo). Admit the signal-format library (EDF first) through the §5.2 policy. GL waveform canvas (decimated min/max rendering for long records), lead/channel tree, annotation model (document + undo), label export. **Windows port** lands here — static wx msw, `/MT`, both instruments in CI — because the flagship's audience is where "runs on a locked-down machine" gets proven. *Exit:* both instruments ship as fresh-install binaries on macOS **and** Windows; an annotation session survives save/reopen round-trip.
- **I4 — Distribution polish & optional convergences.** Codesign/notarize (macOS) wired into the §5.7 release trains; suite binary if wanted (§5.5); AppImage-style Linux bundle if demanded. Optional, zero-ABI cross-project feature: the **Run Browser** exemplar (§1.1) — Caliper's DuckDB run/artifact stores opened read-only (file-format contract, not family membership). Family membership itself remains gated in Appendix A.

---

## 8. Decision Log

| # | Decision | Status | Rationale / trade accepted |
|---|---|---|---|
| CD1 | **Static binary on a fresh install** is the founding principle (macOS/Windows static; Linux later via AppImage-style bundle) | **Ratified** (carried from v1) | One-file UX; no redistributable hell. Cost: binary size, Linux honesty. |
| CD2 *(v1)* | UI-as-data plugin ABI (XRC + handles) | **Deferred** → Appendix A | Right design *for a plugin host*; v2 has no plugin boundary to protect. Revive with family membership. |
| CD3 | Windows `/MT` static CRT | **Ratified** (simplified) | With no plugin boundary, the mismatch concern that made this a careful divergence in v1 is moot; `/MT` is simply what CD1 requires. |
| CD4′ | **GL 3.3 core stays, as a framework-internal viewport** (`Canvas3D`); GLAD replaces GLEW; GLM stays; fixed-function banned. Replaces v1 CD4 ("no GL"). | Proposed | Spatial/dense documents are half the instrument archetype. GL never appears in any future plugin contract — the canvas API is the boundary, per v1's own design. |
| CD5′ | **Source-level SDK, not ABI**: curated `compass::` catalog + `libcompass` + `compass_add_instrument()` + template; explicit registration, no self-registering statics. Replaces v1 CD5 (consume caliper-sdk releases). | Proposed | One toolchain, one binary → the compiler is the conformance suite. Cost: framework changes recompile all instruments (acceptable: they live in this repo). |
| CD6′ | **One binary per instrument** is the default product shape; suite binary is a later packaging option. | Proposed | Product clarity + smallest fresh-install download. |
| CD7′ | **Library admission policy** (§5.2): real consumer, static-linkable, Layer-0-built, target-wrapped, cataloged. | Proposed | Keeps the "included libraries" a curated surface, not an accretion. Extract-don't-invent, applied to dependencies. |
| CD8 | **Compass does no ML.** Data tooling around ML (viewing/annotating files) is in scope; training/inference/model-viz is Caliper's, permanently. | **Ratified** (owner directive, 2026-07-05) | Kills the "second ML host" ambiguity that left Compass purposeless; gives each sibling one face. |
| CD9 | Framework/SDK is **extracted at I2 from Instrument #1**, never designed up front. | Proposed | The same extract-don't-invent rule that kept Caliper's services honest. Cost: I1 code gets refactored once, deliberately. |
| CD10 | **Monorepo for code; per-instrument release trains** — namespaced tags (`<name>/vX.Y.Z`), one GitHub Release per instrument, path-filtered CI. `libcompass` splits into its own tagged repo only when a third-party instrument author exists — the Compass mirror of Caliper's Phase 3 trigger. | Proposed | One build keeps the source-level SDK honest; multi-repo now = the ABI problem rebuilt at the source level. Cost: repo-wide recompiles on framework change (acceptable; CI path-filtered). |
| CD11 | **The distribution artifact is the bare static binary** — zipped single `.exe` (Windows), notarized `.dmg` (macOS); no installers; in-app update *check* allowed, auto-update daemon not. | Proposed | Installers betray the fresh-install identity. Cost: forgo installer conveniences; file associations ship via bundle metadata where the OS allows. |
| CD12 | **Instrument #1 = Plot Workbench** (function grapher, `.plot` worksheets, native-2D canvas). Replaces the Rotation Workbench exemplar; the §6.2 GL modernization and GLAD admission defer to I3, whose flagship waveform canvas is GLAD's first real consumer. Quaternion demo stays quarantined history until deleted at I3. | **Ratified** (owner directive, 2026-07-05) | A utility with no external files, demonstrating the native-desktop identity against web apps (Desmos as a static binary). Keeps I1 light; the TDD core (expression parser) is real logic. Cost: GL debt outstanding until I3, which grows heavier (R7). |

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| R1: Static wx on Windows unproven here | High | Medium | Unchanged from v1; now an I3 deliverable with CI. wx officially supports static msw. |
| R2: Instrument #2's domain scope creeps (annotation models are deep) | Medium | Medium | I3 exit is deliberately narrow: view + annotate + export one format (EDF). Formats/features added on demand. |
| R3: Framework extracted too early ossifies; too late duplicates | Medium | Medium | CD9 fixes the moment: extraction happens at I2, from one real instrument, sized to what Instrument #2 actually needs. |
| R4: No-ABI discipline drifts (instruments reach around the catalog) | Medium | Low | §5.6 build-time lints; template-as-spec in CI. |
| R5: Deferred family plan rots | Low | Low | Appendix A is a summary + pointer to the fully-detailed v1 in git history; revival re-derives against Caliper's then-current spec anyway. |
| R6: Monorepo couples instruments (one bad commit blocks all releases) | Low | Medium | Releases cut from tags, not HEAD; path-filtered CI isolates per-instrument breakage; the template gate catches framework regressions in the commit that causes them. |
| R7: I3 overloaded — GL modernization + EDF flagship + Windows port in one phase (consequence of CD12) | Medium | Medium | Sequence inside I3: `Canvas2D`/GLAD first as its own reviewable milestone, flagship second, Windows last; if the phase drags, split the GL milestone out as I2.5 without re-litigating CD12. |

---

## Appendix A — Deferred: Caliper family membership (v1 plan, parked)

v1 of this document (commit `a5b7e25`) designed Compass as the second host of the Caliper platform family: consuming `caliper-sdk` releases, implementing the host-neutral services (`log`, `jobs`, `data`, `artifacts`, `metrics`, `device`), enforcing the manifest gate on `.caliperapp` bundles, and exposing native UI to plugins as **data + opaque handles** (`compass.ui.v1`: XRC + a C handle/event API; `compass.canvas.v1`: paint-callback 2D ops) — a design chosen because wx cannot cross a plugin boundary as linked code. Phases C1–C4 were gated on Caliper Phases 3 (tagged SDK release) and 6 (`libcaliper`).

**Status: parked, not rejected.** The design remains sound and lives in git history in full detail. Revive it when *both* hold: (a) Caliper has executed Phase 3 and is heading into ecosystem phases, and (b) Compass has ≥2 shipped instruments whose users would benefit from third-party extensions. At that point the v2 architecture is well-positioned: `Canvas3D/2D`'s API is already the toolkit-free surface `compass.canvas.v1` needs, and the document/view framework gives XRC-inflated panels a place to dock. Until then, the family's only live crossover is the zero-ABI one: shared file formats (I4's read-only browsing of Caliper's DuckDB stores).

---

*Companion documents: `caliper/PLATFORM.md` (sibling project's governing spec), `WXWIDGETS.md` (wx build/feature reference), `cmake/README.md` (three-layer dependency system — Layer 0 of §5.2).*

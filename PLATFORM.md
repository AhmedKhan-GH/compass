# Compass Platform — Architecture & Delivery Plan

| | |
|---|---|
| **Status** | Draft for review |
| **Date** | 2026-06-10 |
| **Owner** | Ahmed Khan |
| **Sibling spec** | `caliper/PLATFORM.md` — the governing platform contract (ABI, services, bundles, packs, registry). This document covers only what Compass adds, implements, or deliberately does differently. |
| **Scope** | Making Compass the second host of the Caliper platform family: the **interface-heavy, cross-platform desktop GUI face** (native widgets, document/panel-style, Adobe-shaped), alongside Caliper's **GUI-heavy realtime face** (ImGui, bare-metal GPU). Founding constraint: Compass ships as a **static binary that runs on a fresh OS install**. |

> **How to read this document.** §2 audits what exists in the Compass repository **today**. Everything else describes the **proposed target state** — none of it exists yet. Where this document is silent, `caliper/PLATFORM.md` governs: the ABI (§6 there), service catalog (§7), bundles/manifests (§10), runtime packs (§11), and registry (§12) are shared family infrastructure, defined once, there.

---

## 1. Executive Summary

Caliper and Compass are two faces of one platform:

| | **Caliper** (realtime face) | **Compass** (interface face) |
|---|---|---|
| UI model | immediate-mode ImGui/ImPlot, one frame loop | native widgets: menus, docking (AUI), property grids, document views |
| Rendering | `HostRenderer` → Metal/Vulkan, GPU-resident tensors | `wxGraphicsContext` → CoreGraphics/Direct2D/Cairo (native 2D) |
| Shaped like | TensorBoard-meets-game-engine | Adobe/IDE-style desktop application |
| Killer constraint | zero-copy tensor→pixels in-loop | **static binary, runs on a fresh install** |

What they **share** — and this is the point — is everything below the chrome: the C ABI applet contract (`caliper_applet_descriptor`, `get_service`, ABI epochs), `caliper.toml` manifests, `.caliperapp` bundles, runtime packs, the registry, and the seven **host-neutral services** (log, device, tensor, jobs, metrics, data, artifacts). Caliper's PLATFORM.md §7 design rule — *only the UI service may know a toolkit exists* — is precisely what makes a second host possible: an applet that needs only host-neutral services runs in **both** hosts unmodified; an applet that needs a face declares it in `required_services` and the manifest gate routes it correctly with zero new mechanism.

Compass's own hard problem is different from Caliper's. Caliper shares a C++ UI library across the plugin boundary by pinning it (ImGui, §9 there). Compass **cannot** do that — wxWidgets has process-global state (`wxTheApp`, event tables) and cannot be safely duplicated into plugins, and a statically linked host has no clean symbol surface to share. So Compass makes the opposite — and more ABI-robust — choice: **UI crosses the boundary as data and opaque handles, never as linked toolkit code** (§5). Applets ship XRC (wx's native XML UI resources) plus C calls; the host owns every widget.

---

## 2. Where We Are (Current-State Audit)

### What exists today

| Asset | Location | Verdict |
|---|---|---|
| wxWidgets 3.2.9 built **static** (`osx_cocoa-unicode-static-3.2`) via ExternalProject | `cmake/External/wxwidgets.cmake`, `WXWIDGETS.md` | **Keep — it's the founding principle already in motion.** The static build is the seed of the fresh-install guarantee (§4). |
| Three-layer build (Source/Build/Integration, PyTorch-inspired) | `cmake/README.md`, `cmake/Dependencies.cmake` | Keep. Same philosophy as Caliper's build; already handles autotools/Makefile/CMake deps cleanly. |
| Retina content-scale fix, single code path, no `#ifdef`s | `README.md:94-112` | Keep — already promoted into the family ABI as the pixel-space contract (`caliper/PLATFORM.md` §6a). |
| Quaternion/slerp visualization demo | `src/main.cpp` (~all of it) | **Quarantine, then port.** It's GL 2.1 immediate-mode (`glBegin`, GLU) — useful as the first Compass applet once re-rendered via `wxGraphicsContext` (§7 Phase C2), dead weight as the app's identity. |
| GLEW (static) + GLM + system OpenGL | `cmake/External/glew.cmake`, submodules | **Retire with the GL demo.** Compass's contract has no GL in it (§5.2); GLEW/GLM leave when the demo is ported. |
| `sound_test` utility | `src/sound_test.cpp` | Park; not platform-relevant. |
| Windows build | `cmake/README.md:163-166` | **Not implemented.** Becomes a real phase deliverable (C2) since "cross-platform desktop GUI" is the use case. |
| Linux | GTK3 via wx, X11 headers required | Works for dev; the static principle needs honesty here (§4). |

### What's missing for family membership

Everything contractual: no applet loader, no manifest handling, no services, no SDK consumption. Compass today is a build-system seed + one demo. That's fine — it means there is nothing to migrate, only to adopt.

---

## 3. Design Goals & Non-Goals

### Goals

1. **Fresh-install static binary.** A user on a factory-fresh macOS or Windows machine downloads one file and double-clicks it. No installer, no redistributables, no framework downloads, no package manager. This is Compass's identity the way zero-copy is Caliper's.
2. **Full family membership.** Compass loads `.caliperapp` bundles, enforces the same manifest gate, implements the host-neutral services, consumes the same registry, and reuses runtime packs — so the ecosystem is one ecosystem with two faces, not two ecosystems.
3. **Native interface-heavy UX.** Real menus, native file dialogs, AUI docking, property grids, document/view — the things wx is *for* and immediate-mode toolkits are bad at: accessibility, IME, OS conventions, complex persistent layouts.
4. **A plugin UI model that cannot break.** Because applets never link a toolkit, Compass applets are immune to the one thing that forces Caliper's ABI epoch bumps (UI-stack pins). Compass-only applets should survive host upgrades indefinitely.

### Non-Goals

- **Realtime GPU visualization.** That's Caliper's face. Compass may later offer a CPU-backed `tensor_bridge` for showing images/plots (§6), but never competes on in-loop GPU rendering.
- **Hosting ImGui applets.** An applet requiring `caliper.ui.v1` simply doesn't list Compass-compatible services; the manifest gate excludes it. No emulation layers.
- **Linux static binary (for now).** GTK3 cannot be honestly statically linked; Linux ships later as an AppImage-style bundle (the "one file, fresh install" *experience* without the static-link *mechanism*). Until then Linux remains a dev platform.

---

## 4. The Static-Binary Principle — made precise

**Definition:** the Compass host executable, as downloaded, runs on a fresh OS install with zero prerequisites. Concretely:

| Platform | Mechanism | Notes |
|---|---|---|
| macOS | static wx (already done) + system frameworks only (Cocoa, CoreGraphics, Security…) → single Mach-O | System frameworks are present on every fresh macOS by definition. Codesign + notarize at distribution polish time. |
| Windows | **static CRT (`/MT`)** + static wx (msw build) → single `.exe` | No VC++ redistributable dependency — the usual fresh-install killer. See §5.3 for why `/MT` is safe here when it wasn't for Caliper. |
| Linux (later) | AppImage-style bundle | GTK3 is dynamic; pretending otherwise is how you get broken binaries. Same one-file UX, different mechanism. |

**What the principle does *not* forbid:** `dlopen`-ing applets. A static host is still a host — plugins are *additive*. The fresh-install state (zero applets installed) is a first-class, fully functional state: the shell, Browse tab, and any built-in tools all work. Runtime packs (e.g. an applet needing libtorch) also don't violate the principle — they are downloads an *applet* requires, prompted at applet-install time; the host itself never needs them.

**What the principle *does* forbid:** any host feature that requires a runtime the OS doesn't ship — no .NET, no JVM, no Python, no WebView2-that-must-be-installed, no "please install X first" dialog, ever.

---

## 5. Where Compass Diverges From Caliper (the heart of this document)

### 5.1 UI crosses the boundary as data + handles, never as linked toolkit code

Caliper's trade: applets compile the pinned ImGui and share the host's context — maximum DX, paid for with epoch bumps when the pin moves, allocator handoff, and toolchain matching. That trade is **unavailable** to Compass: wx has process-global singletons and RTTI-driven event dispatch; two copies of wx in one process (host's static copy + an applet's) is undefined behavior wearing a trench coat, and a static host exports no symbols for a plugin to link against.

So Compass inverts it. **`compass.ui.v1`** (a host-specific service, exactly as `caliper.ui.v1` is for Caliper):

```c
typedef uint64_t CompassWidgetId;   /* opaque handle; host owns every widget */

typedef struct CompassUiV1 {
    uint32_t struct_size;
    /* Declarative UI: applet ships XRC (wx's native XML resource format,
       already compiled into the static wx build) inside its bundle's assets/.
       Host inflates it into a docked AUI pane. */
    CompassWidgetId (*load_panel_xrc)(const char* xrc_utf8, const char* panel_name);
    void            (*close_panel)(CompassWidgetId panel);
    /* Handles into the inflated tree */
    CompassWidgetId (*find_widget)(CompassWidgetId root, const char* xrc_name);
    /* Values & events — pure C, allocation stays host-side */
    bool (*get_value)(CompassWidgetId w, char* buf_utf8, uint32_t buf_len);
    bool (*set_value)(CompassWidgetId w, const char* value_utf8);
    bool (*set_enabled)(CompassWidgetId w, bool enabled);
    typedef void (*CompassEventFn)(void* user, CompassWidgetId source,
                                   const char* event_kind);
    bool (*bind)(CompassWidgetId w, const char* event_kind,
                 CompassEventFn fn, void* user);
    /* Menus, status bar, file dialogs — native chrome contributions */
    bool (*add_menu_item)(const char* menu_path_utf8, CompassEventFn fn, void* user);
    bool (*set_status)(const char* text_utf8);
} CompassUiV1;
```

This is the VS Code/Eclipse lesson applied at the C ABI: **contribution points + declarative descriptions + host-owned widgets**. The payoffs compound: no toolkit pin → no UI-driven epoch bumps for Compass applets; no C++ across the boundary → the static CRT is safe (§5.3); and the host can restyle, re-dock, persist, and theme every applet's UI uniformly — exactly what an Adobe-style shell needs. The cost is expressiveness: XRC + a handle API will never match raw toolkit access. §9's risk table owns that honestly; the mitigation is growing `compass.ui.vN` deliberately (new versioned services), plus §5.2's canvas for fully custom surfaces.

### 5.2 Rendering: native 2D contexts; no GL anywhere in the contract

Compass renders through `wxGraphicsContext` — wx's abstract 2D API over **native backends** (CoreGraphics on macOS, Direct2D on Windows, Cairo on Linux). That is the same architectural shape as Caliper's `HostRenderer` (one interface, native implementations), arrived at by the wx project decades ago — which is why it appears in Caliper's prior-art table.

For applets that need custom drawing (plots, visualizations, editors), **`compass.canvas.v1`**: the applet receives paint callbacks for a host-owned panel and draws through a C table of 2D ops (paths, fills, strokes, text, transforms, images) that the host executes on the panel's `wxGraphicsContext`. Resolution-independent, native-quality, and — like everything else — toolkit-free at the boundary. The pixel-space contract from the family ABI applies verbatim (physical vs. logical units, `dpi_scale`), since Compass's own Retina fix is where that lesson came from.

The GL 2.1 quaternion demo's fate follows: its math and interaction port onto `compass.canvas.v1` as the first real Compass applet (Phase C2); GLEW, GLM, and the system-GL dependency leave the repo with it. Compass's contract never mentions OpenGL — which also means Compass is entirely unaffected by Caliper's Metal/Vulkan migration, as siblings should be.

### 5.3 Static CRT (`/MT`) on Windows — a deliberate, safe divergence from Caliper's D7

Caliper moved to `/MD` because ImGui *objects and allocations* cross its plugin boundary; mismatched CRT heaps there are a real crash class. Compass's boundary, by §5.1's construction, is **pure C with same-side allocation discipline**: strings are copied via caller-provided buffers, handles are integers, no C++ object ever crosses, nothing allocated on one side is freed on the other. Under those rules, host and applets may each statically link their own CRT safely — which is exactly what the fresh-install principle wants. The rule is enforceable: the family conformance lint already checks ABI hygiene; Compass adds a check that applet exports reference no wx symbols.

### 5.4 ML services: implement the host-neutral catalog, share code when `libcaliper` lands

Compass implements the host-neutral services in priority order: `log.v1`, `jobs.v1`, `data.v1`, `artifacts.v1`, `metrics.v1` (dashboards rendered natively — wxGrid/wxDataViewCtrl tables and canvas plots, fed by the same DuckDB-backed store design). `device.v1` reports CPU honestly. `tensor_bridge.v1` is **optional and later**: a CPU-staged implementation backed by `wxBitmap` behind the same opaque `CaliperTextureId` — enough to *display* model outputs in an interface-heavy tool, never pretending to be Caliper's zero-copy path.

Until Caliper's Phase 6 extracts `libcaliper` (loader, negotiation, service implementations, pack manager, registry client as an embeddable library), Compass vendors minimal implementations against the same SDK headers; when `libcaliper` exists, Compass swaps to it and deletes the vendored code (Phase C4). Compass consumes `caliper-sdk` releases like any applet author does — pinned versions, never a source checkout of the Caliper repo.

---

## 6. Service Matrix — one ecosystem, two faces

| Service | Caliper | Compass | Cross-host consequence |
|---|---|---|---|
| `caliper.log.v1` | ✅ | ✅ (C1) | |
| `caliper.jobs.v1` | ✅ | ✅ (C3) | Headless/compute applets run in **both** hosts |
| `caliper.data.v1` | ✅ | ✅ (C3) | Same datasets, same Arrow streams |
| `caliper.artifacts.v1` | ✅ | ✅ (C3) | Same content-addressed store format |
| `caliper.metrics.v1` | ✅ (ImPlot dashboards) | ✅ (native dashboards, C3) | A run logged in one face is browsable in the other |
| `caliper.device.v1` | ✅ (CUDA/MPS/CPU) | ✅ CPU-only (C3) | |
| `caliper.tensor_bridge.v1` | ✅ GPU-native | ◽ optional, CPU/wxBitmap (post-C4) | |
| `caliper.ui.v1` (ImGui) | ✅ | ❌ never | ImGui applets are Caliper-only — by manifest, not by error |
| `compass.ui.v1` / `compass.canvas.v1` | ❌ never | ✅ (C2) | Native-UI applets are Compass-only — same mechanism |

Host targeting needs **no new mechanism**: `required_services` in `caliper.toml` already expresses it, the manifest gate already enforces it, and the registry's Browse tab in each host simply filters to "applets whose required services this host provides." An applet may even ship UI for *both* faces (probe `compass.ui.v1` vs `caliper.ui.v1` at runtime) — supported, not required.

---

## 7. Migration Plan — phases C0–C4

Compass deliberately trails Caliper: C1 needs a tagged `caliper-sdk` release (Caliper Phase 3). C0 can start immediately. Every phase leaves Compass shippable as a static binary.

- **C0 — Identity & hygiene (now).** Commit this document. Quarantine the quaternion demo (`src/main.cpp` → `demos/quaternion/`); the app target becomes a minimal wx shell (frame, menu, AUI manager, empty workspace) that **is** the static-binary deliverable. Keep the three-layer build. *Exit:* fresh-install shell binary on macOS; demo still buildable as a separate target.
- **C1 — Family contract (after Caliper Phase 3).** Consume `caliper-sdk` release; implement manifest gate, bundle discovery, loader, epoch negotiation, `log.v1`. Build the **same fixture/hello applet Caliper uses** (UI-less, logs only) and load it in both hosts. *Exit:* one `.caliperapp`, two hosts, both load it — the family membership proof, cheap and early.
- **C2 — The Compass face.** `compass.ui.v1` (XRC + handles + events + menu contributions) and `compass.canvas.v1`; AUI shell with persistent layouts; **Windows port** (static wx msw, `/MT`) since the use case is cross-platform desktop. Port the quaternion demo as the first Compass applet; delete GLEW/GLM/GL from the host. *Exit:* quaternion applet runs from a bundle on macOS **and** Windows, drawn via native backends; host repo contains no OpenGL.
- **C3 — Host-neutral services.** `jobs`, `data`, `artifacts`, `metrics` (native dashboards), `device` — vendored implementations against SDK headers, conformance-tested with the family's service contract tests. Registry Browse tab with host-aware filtering. *Exit:* a compute-only applet logs metrics in Compass and the same run opens in Caliper's dashboard.
- **C4 — `libcaliper` convergence (after Caliper Phase 6).** Swap vendored implementations for `libcaliper`; runtime-pack support for applets that need it. *Exit:* the platform core exists in exactly one codebase; Compass's diff against it is chrome + `compass.*` services only.

---

## 8. Decision Log

| # | Decision | Status | Rationale / trade accepted |
|---|---|---|---|
| CD1 | **Static binary on a fresh install** is Compass's founding principle (macOS/Windows fully static; Linux later via AppImage-style bundle) | Proposed | One-file UX; no redistributable hell. Cost: bigger binary, Linux honesty. |
| CD2 | **UI crosses the boundary as data + opaque handles (XRC + C API); applets never link wx** | Proposed | wx can't be duplicated across plugins; static host has no symbol surface. Gain: no UI epoch bumps, uniform theming/docking, `/MT` safety. Cost: bounded expressiveness (see R2). |
| CD3 | Windows stays **`/MT` static CRT** — deliberate divergence from Caliper's D7 | Proposed | Safe because CD2 keeps C++ and allocations off the boundary; required by CD1. Enforced by conformance lint (no wx symbols in applet exports). |
| CD4 | **No OpenGL in Compass's contract**; rendering via `wxGraphicsContext` native backends; GL 2.1 demo ported to `compass.canvas.v1`, GLEW/GLM retired | Proposed | Same interface-over-native-backends shape as Caliper's `HostRenderer`; Compass becomes independent of Caliper's renderer migration. |
| CD5 | Compass consumes **`caliper-sdk` releases** (never a Caliper source checkout) and swaps vendored service implementations for **`libcaliper`** at C4 | Proposed | Same discipline demanded of applet authors; one platform core long-term. |
| CD6 | Host targeting via existing `required_services` — no new manifest mechanism | Proposed | The gate already does it; dual-face applets probe at runtime. |
| CD7 | SDK keeps the `caliper-` name even with two hosts | Proposed (revisit at C1) | Renaming infrastructure mid-build is churn; "Caliper platform, Compass host" reads fine. Revisit only if a third party is confused in practice. |

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| R1: Static wx on Windows is unproven here (port "not yet implemented") | High | Medium | C2 makes it a phase deliverable with CI; wx officially supports static msw builds; fall back to `/MT` + as-static-as-possible while preserving the no-redistributable guarantee. |
| R2: XRC + handle API too weak for Adobe-grade applet UI | Medium | High | `compass.canvas.v1` covers fully custom surfaces; grow `compass.ui.vN` deliberately (versioned, additive, like every family service); host-side custom controls exposed via XRC class names. Accept that the *richest* chrome lives host-side — that's the VS Code model working as intended. |
| R3: Two hosts double the platform maintenance | Medium | High | Compass trails Caliper by design (C1 gated on Caliper Phase 3, C4 on Phase 6); shared conformance/service tests; `libcaliper` collapses the duplication at C4. Until then Compass's vendored layer is deliberately minimal. |
| R4: Registry/Browse confusion ("why won't this applet install here?") | Medium | Low | Host-aware filtering by `required_services`; incompatible applets shown greyed with the reason ("needs caliper.ui.v1 — open in Caliper"), mirroring the family's friendly-failure rule. |
| R5: Static binary size growth (wx + DuckDB-backed services) | Low | Low | Single-digit-MB libraries; acceptable cost of CD1. Measure per release. |

---

*Family documents: `caliper/PLATFORM.md` (governing contract — ABI, services, bundles, packs, registry, migration phases), `WXWIDGETS.md` (wx build/feature reference), `cmake/README.md` (three-layer dependency system).*

# Compass I0 — Identity & Hygiene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute PLATFORM.md v2.1 phase I0 — commit the corrected spec, quarantine the GL demo and `sound_test` under `demos/`, and replace the app target with the minimal instrument shell (frame, menus, AUI workspace, layout persistence) that ships as a fresh-install static binary on macOS.

**Architecture:** The `compass` executable stops being the quaternion demo and becomes the shell: a `wxApp` + `wxFrame` with a `wxAuiManager`-managed workspace, whose AUI perspective and window geometry persist across runs via `wxConfig`/`wxPersistenceManager`. The demo moves to `demos/quaternion/` (own target, still buildable, keeps its GLEW/GLM links); the shell links **only** static wxWidgets — no GL, no GLEW, no GLM.

**Tech Stack:** C++20, CMake ≥3.16, wxWidgets 3.3.2 (static, monolithic, built from the `third_party/wxWidgets` submodule by `cmake/External/wxwidgets.cmake`).

**Testing posture (per owner's global TDD rule):** I0 is UI scaffolding — nothing branches, transforms, or enforces a rule. No unit tests are written in this phase; verification is compile + runtime smoke + `otool -L` static-linking checks, spelled out per task. The first TDD target arrives in I1 (the `.quat` document model and its undo command stack).

## Global Constraints

- **Static binary on a fresh install** (PLATFORM.md CD1): the `compass` binary may link only system frameworks/libs. Verified by `otool -L` in Task 6.
- **No new dependencies** — nothing enters `third_party/` or `cmake/External/` in this phase (§5.2 admission policy; GLAD arrives at I1, not now).
- **No new fixed-function GL** — the shell contains zero GL code. The demo's GL 2.1 code moves verbatim (its rewrite is I1, §6.2).
- **No self-registering static initializers** (§5.4) — everything the shell wires up is explicit.
- **wxWidgets version is 3.3.2 everywhere** — docs currently drift (say 3.2.9); Task 1 fixes them. Build strings: `libwx_osx_cocoau-3.3.a`, setup dir `osx_cocoa-unicode-static-3.3`.
- **C++20, CMake ≥3.16** (existing `CMakeLists.txt` values, unchanged).
- Build directory for all commands: reuse `cmake-build-debug/` (wx is already built there; a fresh build dir triggers a ~10-min wx rebuild — works, but slow).
- **Pre-existing additions to preserve:** `demos/hello_world/` (a working minimal demo) already exists and is wired into the root `CMakeLists.txt` via `add_subdirectory(demos/hello_world)` — keep it building in every task that touches the root CMakeLists.
- **Docs-as-code (same-commit rule):** the repo has a MkDocs wiki (`mkdocs.yml`, `docs/wiki/`). Any task that changes what a wiki page states must update that page in the same commit. Specifically: Task 3 (demo quarantine) must update `docs/wiki/howto/run-the-demos.md` and `docs/wiki/tutorials/building-from-source.md`, which currently say the `compass` target *is* the quaternion demo — after Task 3/4 they must describe the `quaternion_demo` target under `demos/quaternion/` and `compass` as the shell. Verify docs with `uvx --with mkdocs-material mkdocs build --strict` (must exit 0). Note: `docs/wiki/reference/build-system.md` embeds the live root `CMakeLists.txt` via a snippet, so it tracks CMake edits automatically.

---

### Task 1: Correct spec drift, then commit the v2.1 spec and the pending glew fix

The uncommitted PLATFORM.md v2.1 states wxWidgets **3.2.9** in §2 and §5.2, and WXWIDGETS.md says 3.2.9 throughout its header — but the repo pins the wx submodule at **v3.3.2** and `cmake/External/wxwidgets.cmake` sets `WX_VERSION "3.3"` (Windows libs `wxmsw33u*`). The spec's §5.2 also lists wx as "core+aui+propgrid+glcanvas" while the actual build is `--enable-monolithic` (one lib containing core/aui/propgrid) plus a separate `_gl` lib. Fix the docs to match reality, then commit — I0's first deliverable is "commit this document."

**Files:**
- Modify: `PLATFORM.md:68` and `PLATFORM.md:137` (the two `3.2.9` occurrences)
- Modify: `WXWIDGETS.md:3-8` (version header)
- Commit (already modified, no further edits): `cmake/External/glew.cmake`

**Interfaces:**
- Consumes: nothing.
- Produces: a committed PLATFORM.md v2.1 that later tasks cite in commit messages.

- [ ] **Step 1: Fix PLATFORM.md §2 audit row**

In `PLATFORM.md`, replace:

```
| wxWidgets 3.2.9 built **static** via ExternalProject | `cmake/External/wxwidgets.cmake`, `WXWIDGETS.md` | **Keep — the founding principle in motion.** Seed of the fresh-install guarantee (§4). |
```

with:

```
| wxWidgets 3.3.2 built **static** via ExternalProject | `cmake/External/wxwidgets.cmake`, `WXWIDGETS.md` | **Keep — the founding principle in motion.** Seed of the fresh-install guarantee (§4). |
```

- [ ] **Step 2: Fix PLATFORM.md §5.2 catalog row**

Replace:

```
| `compass::wx` | wxWidgets 3.2.9 (static, core+aui+propgrid+glcanvas) | native UI | built today; wrap as target |
```

with:

```
| `compass::wx` | wxWidgets 3.3.2 (static, monolithic build — core+aui+propgrid in one lib — plus glcanvas lib) | native UI | built today; wrap as target |
```

- [ ] **Step 3: Fix WXWIDGETS.md version header**

Replace lines 3–8's version claims:

```
This document outlines the available features and configure options for wxWidgets 3.2.9 used in this project.
```
→
```
This document outlines the available features and configure options for wxWidgets 3.3.2 used in this project.
```

and in the summary block, `**Version**: 3.2.9` → `**Version**: 3.3.2`, and `**Build Type**: osx_cocoa-unicode-static-3.2` → `**Build Type**: osx_cocoa-unicode-static-3.3`.

- [ ] **Step 4: Verify no stale version strings remain**

Run: `grep -rn "3\.2\.9" PLATFORM.md WXWIDGETS.md`
Expected: no output.

- [ ] **Step 5: Commit in two pieces**

```bash
git add cmake/External/glew.cmake
git commit -m "build: glew.cmake uses release tarball (src/glew.c is generated, absent from git clones)"
git add PLATFORM.md WXWIDGETS.md
git commit -m "docs: PLATFORM.md v2.1 — Compass as desktop-instrument family (source-level SDK, phases I0-I4); fix wx version drift 3.2.9 -> 3.3.2"
```

---

### Task 2: Repo hygiene — retire the glew and glm submodules in favor of Layer 0

`.gitmodules` pins `glew` and `glm` as submodules, but Layer 0 no longer uses them that way: the just-committed `glew.cmake` **deletes** the submodule checkout and downloads the release tarball (a git clone lacks the generated `src/glew.c`), and `cmake/Dependencies.cmake:58` clones GLM 1.0.1 itself if `third_party/glm` is missing. Keeping the submodules means `git submodule update --init` recreates directories the build then destroys/ignores. Retire both; only `third_party/wxWidgets` remains a submodule.

**Files:**
- Modify: `.gitmodules` (remove glew + glm entries)
- Modify: `.gitignore` (ignore the now-downloaded `third_party/glew/`, `third_party/glm/`)
- Modify: `init-submodules.sh`, `init-submodules.bat` (drop glew/glm references if present)

**Interfaces:**
- Consumes: Task 1's committed `glew.cmake`.
- Produces: a `third_party/` layout where wxWidgets is the only submodule; Task 3's demo target still finds `GLEW::GLEW` and `glm::glm` exactly as before.

- [ ] **Step 1: Deregister the submodules (keep directories on disk)**

```bash
git submodule deinit -f third_party/glew || true
git rm --cached third_party/glew third_party/glm
```

Then edit `.gitmodules` to contain only:

```
[submodule "third_party/wxWidgets"]
	path = third_party/wxWidgets
	url = https://github.com/wxWidgets/wxWidgets.git
```

- [ ] **Step 2: Ignore the downloaded trees**

Append to `.gitignore`:

```
third_party/glew/
third_party/glm/
```

- [ ] **Step 3: Update init scripts**

In `init-submodules.sh` and `init-submodules.bat`, remove any lines that init/update `third_party/glew` or `third_party/glm` (or, if they just run a blanket `git submodule update --init --recursive`, leave them — the blanket form is now correct since only wx remains). Verify with:

Run: `grep -n "glew\|glm" init-submodules.sh init-submodules.bat`
Expected: no output (or only comments explaining glew/glm are fetched by CMake).

- [ ] **Step 4: Verify configure still succeeds**

Run: `cmake -S . -B cmake-build-debug`
Expected: exits 0; log shows wxWidgets already built, GLEW and GLM found/configured (from the on-disk `third_party/` trees).

- [ ] **Step 5: Commit**

```bash
git add .gitmodules .gitignore init-submodules.sh init-submodules.bat
git commit -m "build: retire glew/glm submodules — Layer 0 fetches both (glew tarball, glm 1.0.1 clone); wxWidgets is the only submodule"
```

---

### Task 3: Quarantine the demo and sound_test under `demos/`; shell stub keeps the build green

Move `src/main.cpp` (692-line quaternion demo) to `demos/quaternion/` and `src/sound_test.cpp` to `demos/sound_test/`, each with its own target. The `compass` target gets a stub shell (`wxApp` + empty `wxFrame`) so every commit builds. The stub is intentionally minimal — Task 4 replaces it with the real shell.

**Files:**
- Move: `src/main.cpp` → `demos/quaternion/main.cpp` (verbatim, `git mv`)
- Move: `src/sound_test.cpp` → `demos/sound_test/sound_test.cpp` (verbatim, `git mv`)
- Create: `demos/quaternion/CMakeLists.txt`
- Create: `demos/sound_test/CMakeLists.txt`
- Create: `src/main.cpp` (new stub)
- Modify: `CMakeLists.txt` (root)

**Interfaces:**
- Consumes: `wxWidgets::wxWidgets`, `GLEW::GLEW`, `glm::glm`, `${OPENGL_LIBRARIES}` — the imported targets/vars defined by `cmake/Dependencies.cmake` at root scope (visible in subdirectories).
- Produces: targets `compass` (shell), `quaternion_demo`, `sound_test`; Task 4 replaces `src/main.cpp`'s frame with `MainFrame` from `src/main_frame.{h,cpp}`.

- [ ] **Step 1: Move the sources**

```bash
mkdir -p demos/quaternion demos/sound_test
git mv src/main.cpp demos/quaternion/main.cpp
git mv src/sound_test.cpp demos/sound_test/sound_test.cpp
```

- [ ] **Step 2: Create `demos/quaternion/CMakeLists.txt`**

```cmake
# Quarantined GL 2.1 demo (PLATFORM.md §2, §7 I0). Rendering is rewritten on
# GL 3.3 core in I1; do not extend this code.
add_executable(quaternion_demo WIN32 main.cpp)
target_compile_definitions(quaternion_demo PRIVATE GLEW_STATIC)
target_link_libraries(quaternion_demo
    PRIVATE
        wxWidgets::wxWidgets
        ${OPENGL_LIBRARIES}
        GLEW::GLEW
        glm::glm
)
```

- [ ] **Step 3: Create `demos/sound_test/CMakeLists.txt`**

```cmake
# Parked utility (PLATFORM.md §2: "not platform-relevant").
add_executable(sound_test sound_test.cpp)
target_link_libraries(sound_test PRIVATE wxWidgets::wxWidgets)
```

- [ ] **Step 4: Create the stub shell `src/main.cpp`**

```cpp
#include <wx/wx.h>

class CompassApp : public wxApp {
public:
    bool OnInit() override {
        if (!wxApp::OnInit())
            return false;
        SetAppName("Compass");
        SetVendorName("Compass");
        auto* frame = new wxFrame(nullptr, wxID_ANY, "Compass",
                                  wxDefaultPosition, wxSize(1000, 700));
        frame->Show(true);
        return true;
    }
};

wxIMPLEMENT_APP(CompassApp);
```

- [ ] **Step 5: Rewrite the root `CMakeLists.txt`**

```cmake
cmake_minimum_required(VERSION 3.16)
project(compass VERSION 0.1)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Include dependency management system (PyTorch-style)
include(cmake/Dependencies.cmake)

# The shell — links native UI only; GL enters via libcompass at I1 (PLATFORM.md §6)
add_executable(compass WIN32 src/main.cpp)
target_link_libraries(compass PRIVATE wxWidgets::wxWidgets)

option(COMPASS_BUILD_DEMOS "Build quarantined demos (demos/)" ON)
if(COMPASS_BUILD_DEMOS)
    add_subdirectory(demos/hello_world)
    add_subdirectory(demos/quaternion)
    add_subdirectory(demos/sound_test)
endif()
```

- [ ] **Step 6: Build all three targets**

Run: `cmake -S . -B cmake-build-debug && cmake --build cmake-build-debug -j8`
Expected: `compass`, `quaternion_demo`, `sound_test` all link with no errors.

- [ ] **Step 7: Smoke-run**

Run: `./cmake-build-debug/compass` — an empty native window titled "Compass" appears; quit cleanly (Cmd-Q).
Run: `./cmake-build-debug/demos/quaternion/quaternion_demo` — the quaternion demo runs exactly as before the move.

- [ ] **Step 8: Commit**

```bash
git add -A src demos CMakeLists.txt
git commit -m "refactor(I0): quarantine quaternion demo and sound_test under demos/; compass target becomes shell stub"
```

---

### Task 4: The minimal shell — menus, AUI workspace, About

Replace the stub frame with `MainFrame`: menu bar (File/View/Help), status bar, `wxAuiManager` with a center workspace pane and one dockable sidebar pane. The sidebar exists so docking and (in Task 5) layout persistence are observable — it is a placeholder, not a feature.

**Files:**
- Create: `src/main_frame.h`
- Create: `src/main_frame.cpp`
- Modify: `src/main.cpp`
- Modify: `CMakeLists.txt` (add the new source)

**Interfaces:**
- Consumes: nothing beyond wx.
- Produces: `class MainFrame : public wxFrame` with default ctor; `MainFrame::SaveLayout()` / `MainFrame::RestoreLayout()` are added in Task 5 — this task creates the private members they rely on: `wxAuiManager m_aui;` and `wxString m_defaultPerspective;`.

- [ ] **Step 1: Create `src/main_frame.h`**

```cpp
#pragma once

#include <wx/frame.h>
#include <wx/aui/aui.h>

class MainFrame : public wxFrame {
public:
    MainFrame();
    ~MainFrame() override;

private:
    void BuildMenuBar();
    void OnExit(wxCommandEvent& event);
    void OnAbout(wxCommandEvent& event);
    void OnResetLayout(wxCommandEvent& event);

    wxAuiManager m_aui;
    wxString m_defaultPerspective;
};
```

- [ ] **Step 2: Create `src/main_frame.cpp`**

```cpp
#include "main_frame.h"

#include <wx/aboutdlg.h>
#include <wx/menu.h>
#include <wx/panel.h>
#include <wx/settings.h>

namespace {
constexpr int ID_RESET_LAYOUT = wxID_HIGHEST + 1;
}

MainFrame::MainFrame()
    : wxFrame(nullptr, wxID_ANY, "Compass",
              wxDefaultPosition, wxSize(1000, 700)) {
    m_aui.SetManagedWindow(this);

    BuildMenuBar();
    CreateStatusBar();
    SetStatusText("Ready");

    auto* workspace = new wxPanel(this, wxID_ANY);
    workspace->SetBackgroundColour(
        wxSystemSettings::GetColour(wxSYS_COLOUR_APPWORKSPACE));
    m_aui.AddPane(workspace, wxAuiPaneInfo()
                                 .Name("workspace")
                                 .CenterPane());

    auto* sidebar = new wxPanel(this, wxID_ANY);
    m_aui.AddPane(sidebar, wxAuiPaneInfo()
                               .Name("sidebar")
                               .Caption("Panels")
                               .Left()
                               .BestSize(240, -1)
                               .CloseButton(true));

    m_aui.Update();
    m_defaultPerspective = m_aui.SavePerspective();

    Bind(wxEVT_MENU, &MainFrame::OnExit, this, wxID_EXIT);
    Bind(wxEVT_MENU, &MainFrame::OnAbout, this, wxID_ABOUT);
    Bind(wxEVT_MENU, &MainFrame::OnResetLayout, this, ID_RESET_LAYOUT);
}

MainFrame::~MainFrame() {
    m_aui.UnInit();
}

void MainFrame::BuildMenuBar() {
    auto* fileMenu = new wxMenu;
    fileMenu->Append(wxID_EXIT);

    auto* viewMenu = new wxMenu;
    viewMenu->Append(ID_RESET_LAYOUT, "&Reset Layout",
                     "Restore the default window layout");

    auto* helpMenu = new wxMenu;
    helpMenu->Append(wxID_ABOUT);

    auto* menuBar = new wxMenuBar;
    menuBar->Append(fileMenu, "&File");
    menuBar->Append(viewMenu, "&View");
    menuBar->Append(helpMenu, "&Help");
    SetMenuBar(menuBar);
}

void MainFrame::OnExit(wxCommandEvent&) {
    Close(true);
}

void MainFrame::OnAbout(wxCommandEvent&) {
    wxAboutDialogInfo info;
    info.SetName("Compass");
    info.SetVersion("0.1");
    info.SetDescription(
        "Desktop instruments: self-contained, cross-platform,\n"
        "document-centric native tools.");
    wxAboutBox(info, this);
}

void MainFrame::OnResetLayout(wxCommandEvent&) {
    m_aui.LoadPerspective(m_defaultPerspective, true);
}
```

- [ ] **Step 3: Point `src/main.cpp` at `MainFrame`**

```cpp
#include <wx/wx.h>

#include "main_frame.h"

class CompassApp : public wxApp {
public:
    bool OnInit() override {
        if (!wxApp::OnInit())
            return false;
        SetAppName("Compass");
        SetVendorName("Compass");
        (new MainFrame())->Show(true);
        return true;
    }
};

wxIMPLEMENT_APP(CompassApp);
```

- [ ] **Step 4: Add the source to the root `CMakeLists.txt`**

Replace:

```cmake
add_executable(compass WIN32 src/main.cpp)
```

with:

```cmake
add_executable(compass WIN32 src/main.cpp src/main_frame.cpp)
```

- [ ] **Step 5: Build and smoke-run**

Run: `cmake --build cmake-build-debug --target compass -j8 && ./cmake-build-debug/compass`
Expected: window with native macOS menu bar (File/View/Help), status bar "Ready", a docked "Panels" pane on the left that can be dragged/floated/closed, workspace filling the center. Help → About shows the dialog. View → Reset Layout restores the sidebar after closing it. File → Exit quits.

- [ ] **Step 6: Commit**

```bash
git add src CMakeLists.txt
git commit -m "feat(I0): minimal instrument shell — frame, menus, status bar, AUI workspace"
```

---

### Task 5: Layout persistence

Window geometry persists via wx's built-in `wxPersistenceManager` (registered in `OnInit`); the AUI perspective persists via `wxConfig` (on macOS: `~/Library/Preferences/Compass Preferences`), saved on close and restored after the panes are created.

**Files:**
- Modify: `src/main_frame.h`
- Modify: `src/main_frame.cpp`
- Modify: `src/main.cpp`

**Interfaces:**
- Consumes: `m_aui`, `m_defaultPerspective` from Task 4.
- Produces: config keys `/Layout/Perspective` (string). Frame geometry is stored by `wxPersistenceManager` under its own keys — no code owns them.

- [ ] **Step 1: Declare persistence members in `src/main_frame.h`**

Add to the `private:` section of `MainFrame`:

```cpp
    void OnClose(wxCloseEvent& event);
    void SaveLayout();
    void RestoreLayout();
```

- [ ] **Step 2: Implement in `src/main_frame.cpp`**

Add `#include <wx/config.h>` to the includes. At the end of the constructor (after the existing `Bind` calls), add:

```cpp
    Bind(wxEVT_CLOSE_WINDOW, &MainFrame::OnClose, this);
    RestoreLayout();
```

Add the three member functions:

```cpp
void MainFrame::OnClose(wxCloseEvent& event) {
    SaveLayout();
    event.Skip();
}

void MainFrame::SaveLayout() {
    wxConfigBase::Get()->Write("/Layout/Perspective", m_aui.SavePerspective());
}

void MainFrame::RestoreLayout() {
    wxString perspective;
    if (wxConfigBase::Get()->Read("/Layout/Perspective", &perspective)
        && !perspective.empty()) {
        m_aui.LoadPerspective(perspective, true);
    }
}
```

- [ ] **Step 3: Register frame-geometry persistence in `src/main.cpp`**

Add `#include <wx/persist/toplevel.h>` and change `OnInit`'s frame creation to:

```cpp
        auto* frame = new MainFrame();
        wxPersistentRegisterAndRestore(frame, "MainFrame");
        frame->Show(true);
```

- [ ] **Step 4: Build and verify the round-trip**

Run: `cmake --build cmake-build-debug --target compass -j8 && ./cmake-build-debug/compass`

Manual round-trip: resize the window, drag the "Panels" pane to the right edge, quit; relaunch.
Expected: window reopens at the resized geometry with the pane docked on the right. View → Reset Layout returns the pane to the left. Delete the prefs (`defaults delete Compass` or remove `~/Library/Preferences/Compass Preferences`) → next launch shows the default layout again.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat(I0): persist AUI perspective and window geometry across runs"
```

---

### Task 6: I0 exit verification — fresh-install static binary on macOS

The phase exit criterion (§7): a shell binary that runs on a factory-fresh macOS install. Concretely: a Release build whose load commands reference only OS-shipped frameworks/libs.

**Files:**
- Modify: `README.md` (record the shell + demo layout and the static-check command)

**Interfaces:**
- Consumes: everything above.
- Produces: I0 complete; I1 planning may begin.

- [ ] **Step 1: Release build**

Run:
```bash
cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release -DCOMPASS_BUILD_DEMOS=OFF
cmake --build build-release --target compass -j8
```
Expected: succeeds. (This builds wx from scratch into `build-release/` — roughly 10 minutes on first run.)

- [ ] **Step 2: Static-linking audit**

Run: `otool -L build-release/compass | grep -v -E '/usr/lib/|/System/Library/'`
Expected: no output except the binary's own name line — every dependency is an OS-shipped framework (`Cocoa`, `IOKit`, …) or `/usr/lib/libSystem.B.dylib`-family. Any Homebrew/`@rpath` line is a failure: stop and fix the link line before proceeding.

- [ ] **Step 3: Fresh-environment smoke test**

Run: `cp build-release/compass /tmp/ && /tmp/compass`
Expected: launches from a bare path with no project/build context; window, menus, docking, persistence all work.

- [ ] **Step 4: Record in README.md**

Append a short section:

```markdown
## Layout (post-I0)

- `src/` — the Compass shell (frame, menus, AUI workspace, layout persistence)
- `demos/quaternion/` — quarantined GL 2.1 quaternion/slerp demo (rewritten on GL 3.3 core in I1)
- `demos/sound_test/` — parked audio utility
- `PLATFORM.md` — governing spec (v2.1); this phase was I0

Static check (macOS): `otool -L <binary>` must list only `/usr/lib` and
`/System/Library` dependencies.
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs(I0): record demo quarantine layout and static-binary audit; I0 exit verified"
```

---

## Out of scope for this plan (by the spec's own rules)

- **I1 (Rotation Workbench + GL 3.3 modernization)** — needs its own plan; it introduces GLAD through the §5.2 admission policy and rewrites the demo's rendering. Plan it after I0 ships.
- **I2 (extract `libcompass` + template)** — CD9 forbids designing the framework before Instrument #1 exists monolithically; planning its contents now would violate the spec being implemented.
- **I3/I4 (Signal Workbench, Windows port, notarization, release trains)** — sequenced behind I2.
- **`.github/workflows` CI** (§5.7 path-filtered CI, template gate) — becomes meaningful at I2 when the template exists; a bare macOS build check could land any time but is not an I0 exit criterion.

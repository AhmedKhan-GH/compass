# Building from source

Compass builds on **macOS and Windows** today (both are first-class as of I3). Linux builds (GTK3) work but ship only as a dev platform — no static binary yet (see [the static-binary principle](../explanation/static-binary.md)).

No package manager, no system-package dependencies: everything third-party is built from source inside the repo (see the [build system reference](../reference/build-system.md)).

## Prerequisites

**macOS** — Xcode Command Line Tools (`xcode-select --install`); CMake ≥ 3.16 (plus Ninja or Make); Git.

**Windows** — Visual Studio 2022 or later with the **Desktop development with C++** workload (any edition — the build locates it via `vswhere`); CMake ≥ 3.16 and Ninja (both bundled with CLion, or install standalone); Git.

## Clone and initialize

```bash
git clone <repo-url> compass
cd compass
./init-submodules.sh          # macOS/Linux; on Windows run init-submodules.bat
```

Only wxWidgets is a submodule; GLAD and nlohmann/json are vendored, and GLM is cloned by CMake at configure time.

## Configure and build

**macOS / Linux:**

```bash
cmake -S . -B build
cmake --build build -j
```

**Windows** — from a *x64 Native Tools Command Prompt for VS* (or CLion with the Visual Studio toolchain, which sets this up for you):

```bat
cmake -S . -B build -G Ninja
cmake --build build -j
```

!!! warning "First configure is slow"
    The first configure builds **static wxWidgets 3.3.3** from source (roughly 10 minutes on macOS; longer for the static msw build on Windows). Subsequent configures detect the built library and are fast. Each fresh build directory pays this cost once — prefer reusing one build dir.

## What gets built

| Target | What it is |
|---|---|
| `compass` | **Instrument #1 — Plot Workbench**: a function grapher. `.plot` worksheets, expression list, view property grid, native-2D (`wxGraphicsContext`) plot canvas, PNG/CSV export. `src/` |
| `signal_workbench` | **Instrument #2 — Signal Workbench** (flagship): opens EDF recordings, GL 3.3 waveform canvas, annotation model. `instruments/signal_workbench/` |
| `instrument_template` | The buildable SDK skeleton — copy `templates/instrument/` to start a new instrument. Built in every CI run as the SDK spec. |
| `hello_world`, `gl_smoke`, `sound_test` | Demos/exemplars under `demos/` — see [run the demos](../howto/run-the-demos.md). Toggle with `-DCOMPASS_BUILD_DEMOS=OFF`. |
| `test_*` (8 suites) | Headless doctest suites (expression, sampler, csv, plot/signal documents, EDF, decimator). Run with `ctest --test-dir build`. Toggle with `-DCOMPASS_BUILD_TESTS=OFF`. |

## Run

**macOS / Linux:**

```bash
./build/compass
./build/instruments/signal_workbench/signal_workbench
ctest --test-dir build --output-on-failure
```

**Windows:**

```bat
build\compass.exe
build\instruments\signal_workbench\signal_workbench.exe
ctest --test-dir build --output-on-failure
```

## Verify the static-binary guarantee

**macOS** — nothing outside `/usr/lib` and `/System/Library` may appear:

```bash
otool -L build/compass | grep -vE '/usr/lib/|/System/Library/'
```

Expected: no output — every dynamic dependency is an OS-shipped framework.

**Windows** — only system DLLs may appear:

```bat
dumpbin /dependents build\compass.exe
```

Expected: kernel32, user32, gdi32, comctl32, … but **no** `VCRUNTIME140.dll` / `MSVCP140.dll`. The `/MT` static CRT means no VC++ redistributable is required.

See [the static-binary principle](../explanation/static-binary.md).

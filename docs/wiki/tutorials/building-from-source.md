# Building from source

macOS is the primary development platform today. Linux builds work (GTK3) but is a dev platform only; the Windows build lands at phase I3.

## Prerequisites

- Xcode Command Line Tools (`xcode-select --install`)
- CMake ≥ 3.16 (plus Ninja or Make)
- Git

No other dependencies: everything third-party is built from source inside the repo (see the [build system reference](../reference/build-system.md)).

## Clone and initialize

```bash
git clone <repo-url> compass
cd compass
./init-submodules.sh          # or: git submodule update --init --recursive
```

## Configure and build

```bash
cmake -S . -B build
cmake --build build -j8
```

!!! warning "First configure is slow"
    The first configure builds **static wxWidgets 3.3.2** from source into the build directory (roughly 10 minutes). Subsequent configures detect the built library and are fast. Each fresh build directory pays this cost once — prefer reusing one build dir.

## What gets built

| Target | What it is |
|---|---|
| `compass` | The instrument shell: native window, menus, status bar, AUI workspace with layout persistence — static wx only. `src/` |
| `hello_world` | The minimal instrument shape: native window, menus, status bar — static wx only. `demos/hello_world/` |
| `quaternion_demo` | Quarantined legacy quaternion/slerp GL demo. `demos/quaternion/` (deleted at the I3 GL modernization). |
| `sound_test` | Parked audio utility. `demos/sound_test/` |

## Run

```bash
./build/compass
./build/demos/hello_world/hello_world
```

## Verify the static-binary guarantee

```bash
otool -L build/demos/hello_world/hello_world | grep -vE '/usr/lib/|/System/Library/'
```

Expected: no output — every dynamic dependency must be an OS-shipped framework. See [the static-binary principle](../explanation/static-binary.md).

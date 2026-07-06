# Run the demos

Demos are quarantined history and minimal exemplars — not instruments. They live under `demos/`, each with its own target (see `PLATFORM.md` §5.7 for the repo layout).

## hello_world — the minimal instrument shape

The smallest binary the architecture produces: one `wxApp` + `wxFrame` with native menus and a status bar, linking static wxWidgets and nothing else (~6 MB, zero non-system dynamic dependencies).

```bash
cmake --build build --target hello_world -j8
./build/demos/hello_world/hello_world
```

Read `demos/hello_world/hello_world.cpp` first when learning the codebase — it is the instrument pattern with all domain logic removed.

## The quaternion/slerp demo

The original Compass application: interactive quaternion vs. Euler rotation, slerp/squad interpolation, camera orbit, rotation trails. Phase I0 moved it out of the `compass` target into `demos/quaternion/` as the `quaternion_demo` target (`demos/quaternion/main.cpp`); the `compass` target is now the instrument shell.

```bash
cmake --build build --target quaternion_demo -j8
./build/demos/quaternion/quaternion_demo
```

!!! warning "Legacy GL — do not extend"
    This demo renders with OpenGL 2.1 fixed-function calls (`glBegin`, GLU) — the deprecated path `PLATFORM.md` §6.2 commits to eliminating. It is quarantined history: CD12 made the Plot Workbench (native 2D) Instrument #1, and this demo is deleted when the GL modernization lands at phase I3. Do not add new fixed-function code anywhere in the repo.

## sound_test

A parked audio utility (`demos/sound_test/sound_test.cpp`), kept buildable but not platform-relevant.

```bash
cmake --build build --target sound_test -j8
./build/demos/sound_test/sound_test
```

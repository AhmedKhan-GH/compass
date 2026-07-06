# Run the demos

Demos are quarantined history and minimal exemplars — not instruments. They live under `demos/`, each with its own target (see `PLATFORM.md` §5.7 for the repo layout).

## hello_world — the minimal instrument shape

The smallest binary the architecture produces: one `wxApp` + `wxFrame` with native menus and a status bar, linking static wxWidgets and nothing else (~6 MB, zero non-system dynamic dependencies).

```bash
cmake --build build --target hello_world -j8
./build/demos/hello_world/hello_world
```

Read `demos/hello_world/hello_world.cpp` first when learning the codebase — it is the instrument pattern with all domain logic removed.

## gl_smoke — the modern GL 3.3 smoke test

The first real consumer of the framework's `compass::Canvas2D` (`demos/gl_smoke/gl_smoke.cpp`): a `wxGLCanvas` with a 3.3-core forward-compatible context, GLAD-loaded, drawing with shaders — no fixed-function calls. It proves the GLAD loader and the 3.3-core context path that the Signal Workbench waveform canvas relies on.

```bash
cmake --build build --target gl_smoke -j
./build/demos/gl_smoke/gl_smoke
```

!!! note "The old quaternion demo is gone"
    The original app was a GL 2.1 fixed-function quaternion/slerp demo. Per CD12 it was quarantined, then **deleted at I3** when the GL modernization landed (GLAD replaced GLEW, `Canvas2D` took over the context). No fixed-function GL survives in the repo — do not reintroduce it.

## hello_gl — window, a button, and an animated GL sine wave

The richer GL exemplar (`demos/hello_gl/hello_gl.cpp`): a native window with a Play/Pause button and a `compass::Canvas2D` drawing a sine wave whose shape is computed in the vertex shader, animated by a `wxTimer`. It is the subject of the [Your first app](../tutorials/first-app.md) tutorial — start there for the walkthrough.

```bash
cmake --build build --target hello_gl -j
./build/demos/hello_gl/hello_gl
```

## sound_test

A parked audio utility (`demos/sound_test/sound_test.cpp`), kept buildable but not platform-relevant.

```bash
cmake --build build --target sound_test -j8
./build/demos/sound_test/sound_test
```

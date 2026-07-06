# Your first app

*(New here? [Building from source](building-from-source.md) covers the toolchain and how every third-party library is built in-tree.)*

This walks **`hello_gl`** — the smallest self-contained Compass app that shows the three things every visual instrument needs: a **native window**, a **native control** (a button), and a **live OpenGL viewport**. It draws an animated sine wave whose shape is computed on the GPU, on top of the framework's `compass::Canvas2D` — the same 3.3-core viewport the Signal Workbench uses for waveforms.

It is deliberately *not* a document instrument: no file format, no undo, no save. It exists to teach the window/buttons/GL loop in isolation. When you want the real thing — a document type with load/save/undo — graduate to `templates/instrument/` (the SDK skeleton, [the architecture page](../explanation/architecture.md) explains why) and study the Plot Workbench (`src/`) as the worked example.

The whole app is one file:

```
demos/hello_gl/
├── hello_gl.cpp        # the app — one canvas class, one frame class, one wxApp
└── CMakeLists.txt      # the build — links the framework shell + compass::gl
```

Here it is in full; the sections below walk each piece:

```cpp
--8<-- "demos/hello_gl/hello_gl.cpp"
```

## 1. The window

`HelloGlApp::OnInit` creates a `HelloGlFrame` and shows it — the standard wx entry point (`wxIMPLEMENT_APP` generates `main`). The frame owns a vertical `wxBoxSizer`: the GL canvas gets proportion `1` with `wxEXPAND` so it fills the window, and a horizontal bar holding the button sits beneath it at its natural height. That is the entire layout — native widgets, laid out by a sizer, exactly as any wx app does it.

## 2. The GL canvas

`SineCanvas` subclasses **`compass::Canvas2D`**, the framework's OpenGL viewport. You override just two methods and never touch context creation, GLAD loading, or the physical-vs-logical pixel conversion — the base class owns all of that in one place (see [rendering](../explanation/rendering.md#the-pixel-space-rule)).

- **`OnInitGL()`** runs once, after the 3.3-core context and GLAD are ready. It compiles a shader program and uploads a VBO of 256 x-positions evenly spaced across `[-1, 1]` — *only* the x coordinate. The **vertex shader** computes the y for each point on the GPU:

    ```glsl
    y = uAmp * sin(uFreq * aX * 3.14159265 + uPhase);
    ```

    so the wave is GPU-resident: animating it never re-uploads geometry, it just changes the `uPhase` uniform.

- **`OnDrawGL(fb_width, fb_height)`** runs every paint. It clears to a dark background, sets the three uniforms from the canvas's current amplitude/frequency/phase, and draws the points as a single `GL_LINE_STRIP`. `glViewport` is already set to the physical framebuffer size by the base class — the arguments are physical pixels if you need them.

No fixed-function GL, no `glBegin` — the 3.3-core, forward-compatible path Compass commits to everywhere.

## 3. Buttons and animation

Animation is a **`wxTimer`** on the frame, firing about every 16 ms (~60 fps). Each tick advances the canvas phase by a small delta and calls `Refresh()`, which schedules a repaint — so `OnDrawGL` runs with a new `uPhase` and the wave scrolls. Drive animation from a timer, never a sleep loop; the UI thread must stay free.

A single **`wxButton`**, wired with a `Bind(wxEVT_BUTTON, ...)` lambda, toggles playback: if the timer is running it stops it and relabels the button **Play**, otherwise it restarts the timer and relabels it **Pause**. That is the whole interaction surface — one button controlling one timer.

## 4. Build it

Demos are gated behind `COMPASS_BUILD_DEMOS` (on by default). Configure once, then build the target:

```bash
cmake -S . -B build            # first configure builds static wx (slow once)
cmake --build build --target hello_gl -j
```

The executable lands at `build/demos/hello_gl/hello_gl` (`.exe` on Windows).

## 5. See it

```bash
./build/demos/hello_gl/hello_gl      # Windows: build\demos\hello_gl\hello_gl.exe
```

A window opens with the blue sine wave scrolling left; the **Pause** button freezes it (and becomes **Play** to resume). That is the whole loop — window, a native button, and a GPU-drawn animation — in one file, ready to copy from.

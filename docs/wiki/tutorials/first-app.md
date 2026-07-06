# Your first app

*(New here? [Development basics](development-basics.md) explains what you write vs. what the framework provides, and where every library comes from.)*

This walks **`hello_gl`** — the smallest self-contained Compass app that shows the three things every visual instrument needs: a **native window**, a **native control** (a button), and a **live OpenGL viewport**. It draws an animated sine wave whose shape is computed on the GPU, on top of the framework's `compass::Canvas2D` — the same 3.3-core viewport the Signal Workbench uses for waveforms.

It is deliberately *not* a document instrument: no file format, no undo, no save. It exists to teach the window/button/GL loop in isolation. When you want the real thing — a document type with load/save/undo — graduate to `templates/instrument/` (the SDK skeleton, [the architecture page](../explanation/architecture.md) explains why) and study the Plot Workbench (`src/`) as the worked example.

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

`HelloGlApp::OnInit` creates a `HelloGlFrame` and shows it — the standard wx entry point. `wxIMPLEMENT_APP` generates the platform entry point for you (`main` on macOS and Linux, `WinMain` on Windows) and hands control to `OnInit`, so you never write one yourself. The frame owns a vertical `wxBoxSizer`: the GL canvas gets proportion `1` with `wxEXPAND` so it fills the window, and a horizontal bar holding the button sits beneath it at its natural height. That is the entire layout — native widgets, laid out by a sizer, exactly as any wx app does it.

## 2. The GL canvas

`SineCanvas` subclasses **`compass::Canvas2D`**, the framework's OpenGL viewport. The base class exists so that an instrument writes drawing code and nothing else; everything about *getting* a modern GL context and keeping it correct is done once, for every canvas in the app.

What `compass::Canvas2D` does **for you**:

- **Creates the context.** On the first paint it builds a **3.3-core, forward-compatible** `wxGLContext` (RGBA, double-buffered, depth 24), makes it current, and calls `gladLoadGL()` **exactly once** to bind the GL entry points. Forward-compatible means the deprecated fixed-function path is gone: `glBegin`, `GLU`, immediate-mode calls will not even link. Shaders are the only way to draw — which is the path Compass commits to everywhere.
- **Sets the viewport in physical pixels, every paint.** `OnPaint` computes the framebuffer size as `GetClientSize() * GetContentScaleFactor()` and calls `glViewport(0, 0, fbw, fbh)` before handing you the frame. This is **the one place** the logical-to-physical pixel conversion happens (the pixel-space rule, [rendering](../explanation/rendering.md#the-pixel-space-rule); PLATFORM.md §6.3). Instruments never call `GetContentScaleFactor` themselves — if you find yourself reaching for the scale factor, you are duplicating the base class.

The **contract** you honor in return is two methods:

- **`OnInitGL()`** runs **exactly once**, after the context and GLAD are ready. Create every GL object here — shader programs, VAOs, VBOs — and nowhere else. `SineCanvas` compiles the shader program and uploads a VBO of 256 x-positions evenly spaced across `[-1, 1]` — *only* the x coordinate. Doing this per-frame would re-upload geometry on every paint for no reason.
- **`OnDrawGL(fb_width, fb_height)`** runs on **every paint**, with `glViewport` already set to the physical framebuffer (`fb_width`/`fb_height` are physical pixels, there if you need them). It clears to a dark background, sets the shader uniforms, and draws the 256 points as a single `GL_LINE_STRIP`. It creates nothing — the objects it uses already exist from `OnInitGL`.

The wave is **GPU-resident**, and that is the point of the split. The **vertex shader** computes each point's y on the GPU from a phase uniform:

```glsl
y = uAmp * sin(uFreq * aX * 3.14159265 + uPhase);
```

The x-positions live in a static VBO uploaded once; amplitude and frequency are fixed constants set once. So animating the wave changes exactly **one float** — `uPhase` — and never touches the geometry buffer. The CPU uploads nothing per frame; the GPU recomputes the curve.

## 3. Button and animation

Animation is a **`wxTimer`** on the frame, firing about every 16 ms (~60 fps). Each tick advances the canvas phase by a small delta and calls `Refresh()`. `Refresh()` does not paint synchronously — it **schedules** a repaint, so `OnDrawGL` runs shortly after with a new `uPhase` and the wave scrolls one step. Animation is nothing more than "change state, `Refresh()`, repeat." Drive it from a timer, never a sleep loop: the UI thread must stay free to process events, and a sleep would freeze the whole window.

A single **`wxButton`**, wired with a `Bind(wxEVT_BUTTON, ...)` lambda, toggles playback: if the timer is running it stops it and relabels the button **Play**, otherwise it restarts the timer and relabels it **Pause**. Stopping the timer stops the `Refresh()` calls, so the last painted frame simply stays on screen — a paused wave, no extra state. That is the whole interaction surface: one button controlling one timer.

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

A window opens with the blue sine wave scrolling; the **Pause** button freezes it (and becomes **Play** to resume). That is the whole loop — window, a native button, and a GPU-drawn animation — in one file, ready to copy from.

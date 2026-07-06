# Rendering

Two routes, one rule each (`PLATFORM.md` §6).

## Route 1 — native 2D

`wxGraphicsContext` (CoreGraphics on macOS, Direct2D on Windows, Cairo on Linux) for everything document-chrome-like: tables, text, small plots, print/export fidelity. This is the default route; it needs no GL context and prints/exports natively.

## Route 2 — the GL viewport

**OpenGL 3.3 core, forward-compatible, compatibility profile banned**, via the framework's `Canvas3D`/`Canvas2D` widgets (I1+) for spatial and dense documents: 3-D scenes, million-point waveforms with pan/zoom. macOS caps core profiles at 4.1, so 3.3 core is the honest portable target — the same frozen-GL reasoning as Caliper's fallback renderer.

GL is an *internal implementation choice of the framework*: instruments write against the canvas API (a per-frame draw callback plus small mesh/line/text helpers), never raw GL state. If a future family phase needs a toolkit-free plugin contract, the canvas API — not GL — is what crosses it.

## The GL debt, paid once at I1

The legacy quaternion demo renders with GL 2.1 fixed-function (`glBegin`, GLU) — doubly deprecated. The I1 modernization: GLAD replaces GLEW, `Canvas3D` owns the context, the demo's drawing is rewritten on small VBO/shader helpers, and **no fixed-function call survives in the repo**.

## The pixel-space rule

Non-negotiable, learned in this repo (the Retina fix in `README.md`), exported to Caliper's family ABI, and enforced by construction here:

- framebuffer sizes are **physical pixels**
- widget/layout coordinates are **logical units**
- `GetContentScaleFactor()` converts, and the conversion lives in **exactly one place** — inside `Canvas3D/2D`

Instruments never see the scale factor.

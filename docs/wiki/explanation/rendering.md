# Rendering

Two routes, one rule each (`PLATFORM.md` §6).

## Route 1 — native 2D

`wxGraphicsContext` (CoreGraphics on macOS, Direct2D on Windows, Cairo on Linux) for everything document-chrome-like: tables, text, small plots, print/export fidelity. This is the default route; it needs no GL context and prints/exports natively.

## Route 2 — the GL viewport

**OpenGL 3.3 core, forward-compatible, compatibility profile banned**, via the framework's `Canvas2D` widget (present since I3, per CD12) for spatial and dense documents: million-point waveforms with pan/zoom (the Signal Workbench canvas). macOS caps core profiles at 4.1, so 3.3 core is the honest portable target — the same frozen-GL reasoning as Caliper's fallback renderer.

GL is an *internal implementation choice of the framework*: instruments write against the canvas API (a per-frame draw callback plus small mesh/line/text helpers), never raw GL state. If a future family phase needs a toolkit-free plugin contract, the canvas API — not GL — is what crosses it.

## The GL debt, paid at I3

The legacy quaternion demo rendered with GL 2.1 fixed-function (`glBegin`, GLU) — doubly deprecated. The modernization landed at I3 (deferred from I1 by CD12: Instrument #1 is native-2D, and GLAD's first real consumer is the flagship's waveform canvas): GLAD replaced GLEW, `Canvas2D` owns the context, the quarantined demo was deleted, and **no fixed-function call survives in the repo**. The `gl_smoke` demo is the standing proof of the 3.3-core path.

## Theming — following the OS appearance

The UI follows the system light/dark setting. On Windows this is wxWidgets 3.3's `MSWEnableDarkMode(DarkMode_Auto)` (dark title bar, menus, and standard controls) plus a Win11 Mica backdrop; macOS follows the system appearance natively. Native widgets re-theme themselves, but **custom-drawn surfaces do not** — so the Plot Workbench canvas reads its palette (`wxSYS_COLOUR_WINDOW`/`WINDOWTEXT`) from `wxSystemSettings` per paint rather than hardcoding colors, which also makes PNG export inherit the theme. The enabling code lives in the framework (`compass::App`), so every instrument gets the dark chrome for free.

## The pixel-space rule

Non-negotiable, learned in this repo (the Retina fix in `README.md`), exported to Caliper's family ABI, and enforced by construction here:

- framebuffer sizes are **physical pixels**
- widget/layout coordinates are **logical units**
- `GetContentScaleFactor()` converts, and the conversion lives in **exactly one place** — inside `Canvas3D/2D`

Instruments never see the scale factor.

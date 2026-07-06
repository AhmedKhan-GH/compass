# Windows 11 Dark Mode — Design

| | |
|---|---|
| **Date** | 2026-07-06 |
| **Status** | Approved (owner, 2026-07-06) |
| **Scope** | Follow-system dark appearance for all Compass instruments, Win11 Mica backdrop, theme-aware Plot Workbench canvas |

## Decisions (from brainstorming)

1. **Follow the OS appearance** (`DarkMode_Auto`), not forced-dark. The app is dark
   when the system is dark, light when light — the modern Win11 behavior, and the
   one that composes with macOS (which already follows system natively).
2. **PNG/CSV export follows the theme.** `RenderToBitmap` reuses `Draw()`; a dark
   session exports dark PNGs. One palette, one code path.
3. **Mica backdrop on Windows 11** (`DWMWA_SYSTEMBACKDROP_TYPE = DWMSBT_MAINWINDOW`).
   Accepted limitation: with opaque AUI panels filling the client area, Mica reads
   mainly through the title bar/chrome. No client-area extension, no transparent
   panels — that fragility is out of scope.
4. **Theming lives in the framework** (`libcompass`), not per-instrument: every
   instrument (Plot, Signal, template) gets the dark chrome for free. The only
   instrument-specific work is custom-drawn surfaces (Plot's canvas).

## Changes

### 1. `compass::App::OnInit()` — enable dark mode (framework)

Before the frame is created:

```cpp
#ifdef __WXMSW__
    MSWEnableDarkMode(wxApp::DarkMode_Auto);
#endif
```

wx 3.3.3's MSW dark mode themes the title bar, menus, scrollbars, and standard
controls (buttons, checkboxes, text fields, wxDataViewCtrl, propgrid, AUI chrome).
No-op guard on macOS/Linux.

### 2. Mica backdrop — after frame creation (framework, MSW-only)

In `App::OnInit()` after `CreateMainFrame()`:

```cpp
#ifdef __WXMSW__
    // DWMWA_SYSTEMBACKDROP_TYPE (38) = DWMSBT_MAINWINDOW (2) → Mica.
    int backdrop = 2;
    DwmSetWindowAttribute(frame->GetHWND(), 38, &backdrop, sizeof(backdrop));
#endif
```

Numeric constants used directly (values are ABI-frozen) so old SDKs still compile;
on Windows 10 and earlier the call fails silently — graceful no-op. Links `dwmapi`
(added to `WX_SYSTEM_LIBS` on the WIN32 branch).

### 3. Theme-aware `PlotCanvas::Draw` (Plot Workbench)

Replace the three hardcoded colors with system-derived ones, computed per paint:

| Element | Today | Themed |
|---|---|---|
| background | `*wxWHITE_BRUSH` | `wxSYS_COLOUR_WINDOW` |
| gridlines | `wxColour(230,230,230)` | blend(background → text, ~12%) |
| axes | `wxColour(120,120,120)` | blend(background → text, ~45%) |

Dark detection via `wxSystemSettings::GetAppearance().IsDark()`. Per-curve colors
are user data (`.plot` file) and stay untouched; the parse-error red in
`ExpressionPanel::ApplyStatus` gets a brighter dark-mode variant
(`wxColour(255,110,110)` when dark). Export inherits all of this by construction.

### 4. Live theme switching (best-effort)

`DocumentFrame` binds `wxEVT_SYS_COLOUR_CHANGED` → `Refresh()` on itself and its
children. Native controls re-theme themselves; custom canvases repaint and re-read
the system colors on the next paint.

### 5. macOS impact

Steps 1–2 are `#ifdef __WXMSW__` no-ops. Step 3 uses cross-platform
`wxSystemSettings`, so the Mac canvas now also follows the system appearance
(previously always white) — an intentional bonus consistent with decision 1.

## Out of scope

- GL `Canvas2D` clear-color theming (Signal Workbench waveform view) — separate
  spatial-instrument concern.
- Mica in the client area (frame extension + transparent panels).
- A user-facing theme toggle; the OS setting is the single source of truth.

## Testing

- Unit suites unaffected (no headless logic changes) — must stay 8/8 green.
- Manual on Windows 11: launch with OS dark → dark title bar/menus/panels, dark
  canvas; flip OS to light while running → app follows.
- macOS: build green; canvas follows system appearance.

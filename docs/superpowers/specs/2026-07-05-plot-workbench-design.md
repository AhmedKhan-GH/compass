# Plot Workbench — Design Spec (Compass Instrument #1)

| | |
|---|---|
| **Status** | Approved design, 2026-07-05 (brainstormed with owner; supersedes the Rotation Workbench as I1) |
| **Governing spec** | `PLATFORM.md` v2.1 — this instrument is phase **I1** |
| **Depends on** | Phase I0 (shell: frame, AUI, layout persistence) — not yet executed |

## 1. What it is

A **function grapher**: type `sin(x)/x`, see the curve instantly; overlay more expressions, restyle them, pan/zoom, save the worksheet, export PNG/CSV. One static binary that works offline on a locked-down machine.

**Why this instrument** (the demo thesis): the world's default grapher (Desmos) is a web app. A grapher as a ~6 MB double-clickable binary — no browser, no account, no install — is the sharpest demonstration of Compass's identity: a *native, interface-heavy desktop application* with a visual payoff, per `PLATFORM.md` §1. It is a genuine utility, needs **no external files** (the document is the worksheet you type), and is light: the only real engineering is the expression parser, a perfect TDD core.

**The trade accepted (CD12):** no GL in Instrument #1. The plot canvas uses native 2D (`wxGraphicsContext`), which §6.1 sanctions for plots. The §6.2 GL modernization (GLAD in, GLEW out, 3.3-core `Canvas2D`, fixed-function demo deleted) moves to **I3**, where the flagship's waveform canvas is GLAD's first real consumer — consistent with extract-don't-invent applied to dependencies (§5.2 rule 1).

## 2. Scope

### In
- Expressions of one variable `x`, plotted as colored curves over a shared view rectangle.
- Expression list panel: add/remove, show/hide checkbox, per-curve color and line width.
- View control: pan (drag), zoom (wheel, centered on cursor), axis ranges editable in a property grid; grid lines toggle.
- Undo/redo across everything (expressions, styles, view changes).
- Document: `.plot` JSON worksheet — save, open, dirty tracking, save/reopen round-trip.
- Export: PNG snapshot of the canvas; CSV of sampled values for visible curves.
- Status bar: cursor position in plot coordinates; per-expression parse errors shown inline in the list panel (bad expression ≠ crash; it just doesn't draw).

### Out (explicitly)
- No GL (CD12; I3). No implicit multiplication (`2x` — error message suggests `2*x`). No parametric/polar/inequalities. No CSV *import* (a future instrument's job). No asymptote detection beyond non-finite breaks (near-vertical lines at `tan(x)` poles are an accepted v1 artifact). No custom palettes beyond a fixed color cycle.

## 3. Expression language

- **Grammar:** decimal numbers; variable `x`; constants `pi`, `e`; binary `+ - * /` (left-assoc) and `^` (right-assoc); unary minus; parentheses; function call `name(expr)`.
- **Functions:** `sin cos tan asin acos atan exp log log10 sqrt abs floor ceil`. (`log` is natural log.)
- **Semantics:** parsed once to an AST; evaluated per sample. Domain errors (`sqrt(-1)`, `log(0)`, overflow) produce NaN/±inf → a gap in the curve, never an exception.
- **Errors:** parse failure returns a position + message ("unexpected token ')' at column 7"); the expression row shows an error badge and the curve is skipped.

## 4. Document format — `.plot` (JSON, version-tagged)

```json
{
  "version": 1,
  "view": { "xmin": -10.0, "xmax": 10.0, "ymin": -5.0, "ymax": 5.0, "grid": true },
  "expressions": [
    { "text": "sin(x)/x", "color": "#4C6EF5", "width": 2.0, "visible": true }
  ]
}
```

Rules: unknown fields ignored (forward-compat); missing optional fields defaulted; `version` > 1 or malformed JSON → clean error dialog, no document created; expressions that fail to parse still load (with their error badge) — a saved worksheet never loses user text.

## 5. Architecture

Monolithic on the I0 shell (no `libcompass` until I2). Pure-logic units are wx-free and headless-testable; UI units are thin.

| Unit | File(s) (under `src/plot/`) | Responsibility | Tests |
|---|---|---|---|
| `Expression` | `expression.h/.cpp` | tokenize → recursive-descent parse → AST; `Compile(text) -> {Expression | error{pos,msg}}`; `Eval(x) -> double` | **TDD** |
| `Sampler` | `sampler.h/.cpp` | uniform sampling at 2 samples/pixel across visible x-range → polylines, split at non-finite values | **TDD** |
| `PlotDocument` | `plot_document.h/.cpp` | expression list + view rect + dirty flag + **command stack** (undo/redo); JSON save/load; observer notification | **TDD** |
| `CsvExporter` | `csv_exporter.h/.cpp` | sampled values of visible curves → CSV (`x, f1(x), f2(x), …`) | **TDD** |
| `PlotCanvas` | `plot_canvas.h/.cpp` | `wxGraphicsContext`: axes, grid, tick labels, curves; drag-pan, wheel-zoom (emit commands, coalesced per gesture); PNG snapshot | smoke |
| `ExpressionPanel` | `expression_panel.h/.cpp` | `wxDataViewCtrl` rows (visible ✓, color swatch, text, error badge); add/remove; edits → commands | smoke |
| `ViewPanel` | `view_panel.h/.cpp` | `wxPropertyGrid`: xmin/xmax/ymin/ymax, grid toggle | smoke |
| Frame wiring | extends I0 `MainFrame` | AUI: canvas center, expressions left, view props right; menus New/Open/Save/Save As/Export PNG/Export CSV/Undo/Redo; native dialogs; status bar | smoke |

**Commands** (each undoable; the stack lives in `PlotDocument`): `AddExpression`, `RemoveExpression`, `EditExpressionText`, `SetExpressionStyle` (color/width/visible), `SetView` (pan/zoom/ranges — one drag or wheel gesture coalesces into one command).

**Data flow:** edit anywhere → command → document mutates → notifies → canvas resamples visible curves and redraws; panels refresh. Undo/redo replays through the same path, so every surface stays in sync by construction.

## 6. Error handling

| Failure | Behavior |
|---|---|
| Unparseable expression | error badge on its row + status-bar message; other curves unaffected |
| NaN/inf during eval | gap in curve (polyline break) |
| Malformed/unsupported `.plot` | modal dialog with reason; current document untouched |
| Degenerate view (xmin ≥ xmax, zoom underflow past double precision) | command rejected with status-bar notice; view unchanged |
| PNG/CSV write failure | modal dialog with OS error |

## 7. Testing (owner's TDD rule: stakes × logic)

- **TDD (headless, wx-free):** `Expression` — token/parse/precedence/associativity (`2^3^2 == 512`), constants, every function, error positions, malformed inputs; `Sampler` — count, range, non-finite splitting (`1/x` yields two polylines); `PlotDocument` — every command's apply/undo/redo, dirty transitions, JSON round-trip (save → load → deep-equal), malformed-JSON rejection, unparseable-expression preservation; `CsvExporter` — header/rows/NaN cells.
- **Test framework:** admit **doctest** (MIT, single header) through Layer 0 as a *dev-only* catalog entry — never linked into shipped binaries; run via CTest. (First test-framework admission; noted in the catalog as test-only.)
- **Not test-driven:** canvas drawing, panels, dialogs, AUI wiring — smoke-verified per plan steps.

## 8. Ripple effects on the platform docs (applied in the same commit as this spec)

1. `PLATFORM.md`: §1.1 exemplar row (Rotation → Plot Workbench), §2 demo/GLEW verdicts, §5.2 `compass::gl` timing (I1 → I3), §5.4/§5.7 naming examples, §6.2 modernization phase, §7 I1/I3 cards, new decision **CD12**, new risk **R7** (I3 now carries GL + flagship + Windows).
2. Roadmap (`docs/superpowers/plans/2026-07-05-platform-transformation-roadmap.md`): I1 card rewritten; I2 extraction contents lose the GL canvas; I3 gains the GL modernization; standing rule 6 timing.
3. Wiki: phase table, architecture/rendering/catalog/admission pages, run-the-demos, decisions mirror (CD12).
4. I0 plan: two stale "rewritten at I1" references → I3; GLAD constraint line.

The I0 plan's *tasks* are unchanged — the shell and demo quarantine are instrument-agnostic.

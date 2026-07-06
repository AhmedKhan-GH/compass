# Library catalog

The curated dependency surface (`PLATFORM.md` §5.2). A library is in the catalog if and only if it passed the [admission policy](../howto/admit-a-library.md); the catalog row says what it's for — and what not to use it for.

## Admitted

| `compass::` target | Library | For | Not for |
|---|---|---|---|
| `compass::wx` (alias → wxWidgets::wxWidgets) | wxWidgets 3.3.3 (static; monolithic on macOS/Linux, multi-lib on Windows; + gl lib) | all native UI: frames, AUI docking, property grids, dialogs, `wxGraphicsContext` 2D | rendering dense/spatial data (that's the GL canvas) |
| `compass::glm` (alias → glm::glm) | GLM | geometry math in viewport/canvas code | general-purpose math outside rendering paths |
| `compass::json` (nlohmann/json, vendored) | JSON | document sidecar read/write (Plot `.plot`, Signal annotations) | large/streaming JSON — it loads whole files |
| `compass::gl` (GLAD 3.3-core) | GLAD loader, vendored static | loading GL 3.3-core entry points for `compass::Canvas2D` | any GL beyond 3.3 core; instruments never call raw GL — use the canvas |

System OpenGL is the one sanctioned system dependency (a framework the OS ships, consistent with the fresh-install guarantee).

## Dev-only (never shipped)

| Library | Role |
|---|---|
| doctest (vendored, `third_party/doctest`) | unit-test framework for the headless logic (expression, sampler, EDF, documents); linked into `tests/` binaries only, never into shipped instruments |

## Scheduled / anticipated

| Library | Enters as | Gated on |
|---|---|---|
| ~~EDF parser~~ (implemented in-repo: `src/signal/edf_reader`) | — no external lib | EDF is simple enough to parse directly; WFDB later if needed |
| SQLite or DuckDB | TBD name | first instrument needing embedded storage; DuckDB preferred if Run Browser happens (reads Caliper's stores) |

!!! note "Source of truth"
    `PLATFORM.md` §5.2 is the governing catalog. This page mirrors it with build-level detail; on discrepancy the spec wins.

# Library catalog

The curated dependency surface (`PLATFORM.md` §5.2). A library is in the catalog if and only if it passed the [admission policy](../howto/admit-a-library.md); the catalog row says what it's for — and what not to use it for.

## Admitted

| Target (planned `compass::` name at I2) | Library | For | Not for |
|---|---|---|---|
| `wxWidgets::wxWidgets` → `compass::wx` | wxWidgets 3.3.2 (static, monolithic + gl lib) | all native UI: frames, AUI docking, property grids, dialogs, `wxGraphicsContext` 2D | rendering dense/spatial data (that's the GL canvas) |
| `glm::glm` → `compass::glm` | GLM | geometry math in viewport/canvas code | general-purpose math outside rendering paths |
| `GLEW::GLEW` *(exiting)* | GLEW 2.2.0 | GL function loading for the legacy demo only | any new code — replaced by GLAD at I1 (`compass::gl`) |

System OpenGL is the one sanctioned system dependency (a framework the OS ships, consistent with the fresh-install guarantee).

## Scheduled / anticipated

| Library | Enters as | Gated on |
|---|---|---|
| GLAD (3.3-core loader) | `compass::gl` | I1 GL modernization (`PLATFORM.md` §6.2) |
| EDF/WFDB parser | TBD name | Signal Workbench, I3 |
| SQLite or DuckDB | TBD name | first instrument needing embedded storage; DuckDB preferred if Run Browser happens (reads Caliper's stores) |

!!! note "Source of truth"
    `PLATFORM.md` §5.2 is the governing catalog. This page mirrors it with build-level detail; on discrepancy the spec wins.

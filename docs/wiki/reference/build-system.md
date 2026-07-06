# Build system

Everything third-party is built from source, statically, inside the repo — the PyTorch-inspired **three-layer** system (`cmake/README.md`), which `PLATFORM.md` §5.2 formalizes as **Layer 0** of the SDK.

## The three layers

1. **Source layer** — dependency sources under `third_party/` (wxWidgets as a git submodule; GLEW fetched as a release tarball because git clones lack the generated `src/glew.c`; GLM cloned at a pinned tag by `Dependencies.cmake`).
2. **Build layer** — `cmake/Dependencies.cmake` orchestrates compilation (`ExternalProject_Add` / configure+make) into the build directory.
3. **Integration layer** — imported CMake targets carry the usage requirements; application code links targets, never raw paths.

## Current imported targets

| Target | Library | Defined in |
|---|---|---|
| `wxWidgets::wxWidgets` | wxWidgets 3.3.2, static, monolithic (`--enable-monolithic --disable-shared`), plus separate `_gl` lib | `cmake/External/wxwidgets.cmake` |
| `GLEW::GLEW` | GLEW 2.2.0, static (`GLEW_STATIC`) | `cmake/External/glew.cmake` |
| `glm::glm` | GLM (header-only) | `cmake/Dependencies.cmake` |
| `${OPENGL_LIBRARIES}` *(variable)* | system OpenGL framework | `find_package(OpenGL)` |

At phase I2 these gain `compass::` wrapper names (`compass::wx`, `compass::gl`, `compass::glm`) per the [library catalog](library-catalog.md); at I1 GLEW is replaced by a GLAD 3.3-core loader.

## Root CMakeLists.txt (embedded live)

```cmake
--8<-- "CMakeLists.txt"
```

## Where things land

| Artifact | Location |
|---|---|
| wxWidgets static libs + headers | `<build>/third_party/wxWidgets-build/install/` |
| GLEW static lib | `<build>/third_party/glew/install/` (per `glew.cmake`) |
| App binaries | `<build>/compass`, `<build>/demos/<name>/<name>` |

!!! note "Windows"
    The Windows path (static wx msw via nmake, `/MT` static CRT) exists in `cmake/External/wxwidgets.cmake` and `cmake/build-wxwidgets-windows.bat` but is unproven in CI — it becomes a deliverable at phase I3.

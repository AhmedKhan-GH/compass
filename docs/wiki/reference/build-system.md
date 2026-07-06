# Build system

Everything third-party is built from source, statically, inside the repo — the PyTorch-inspired **three-layer** system (`cmake/README.md`), which `PLATFORM.md` §5.2 formalizes as **Layer 0** of the SDK.

## The three layers

1. **Source layer** — dependency sources under `third_party/` (wxWidgets as a git submodule; GLAD 3.3-core loader vendored directly under `third_party/glad/`; nlohmann/json vendored as a single header; GLM cloned at a pinned tag by `Dependencies.cmake`).
2. **Build layer** — `cmake/Dependencies.cmake` orchestrates compilation (`ExternalProject_Add` / configure+make) into the build directory.
3. **Integration layer** — imported CMake targets carry the usage requirements; application code links targets, never raw paths.

## Current imported targets

Each is exposed under a namespaced `compass::` alias (the Layer 0 catalog, done at I2) so instrument code links `compass::wx` / `compass::gl`, never a raw path.

| Catalog target | Backing target | Library | Defined in |
|---|---|---|---|
| `compass::wx` | `wxWidgets::wxWidgets` | wxWidgets 3.3.3, static. macOS/Linux: monolithic (`--enable-monolithic --disable-shared`). Windows: multi-lib via `makefile.vc` (core/base/aui/propgrid/gl/…), static CRT (`RUNTIME_LIBS=static`, `/MT`) | `cmake/External/wxwidgets.cmake` |
| `compass::gl` | `glad` | GLAD OpenGL 3.3-core loader, vendored static (replaced GLEW at I3) | `cmake/External/glad.cmake` |
| `compass::json` | — | nlohmann/json, vendored single header | `cmake/External/nlohmann.cmake` |
| `compass::glm` | `glm::glm` | GLM (header-only) | `cmake/Dependencies.cmake` |
| `${OPENGL_LIBRARIES}` *(variable)* | — | system OpenGL (the one sanctioned system dependency) | `find_package(OpenGL)` |

## Root CMakeLists.txt (embedded live)

```cmake
--8<-- "CMakeLists.txt"
```

## Where things land

| Artifact | Location |
|---|---|
| wxWidgets static libs + headers (macOS/Linux) | `<build>/third_party/wxWidgets-build/install/` |
| wxWidgets static libs (Windows) | `third_party/wxWidgets/lib/vc_x64_lib/` (built in-tree by `makefile.vc`) |
| GLAD static lib | built from `third_party/glad/src/gl.c` into the build tree |
| App binaries | `<build>/compass`, `<build>/instruments/<name>/<name>`, `<build>/demos/<name>/<name>` |

!!! note "Windows"
    The Windows path (static wx msw via nmake, `/MT` static CRT) is proven as of I3: `cmake/External/wxwidgets.cmake` links the multi-lib msw modules and `cmake/build-wxwidgets-windows.bat` builds wx with `RUNTIME_LIBS=static` (locating Visual Studio via `vswhere`, any edition). A build produces a single self-contained `.exe` that depends only on system DLLs — no VC++ redistributable.

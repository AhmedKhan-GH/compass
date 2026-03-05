# Compass CMake Dependency System

This directory contains the CMake-based dependency management system for Compass, inspired by PyTorch's architecture.

## Architecture Overview

The build system uses a three-layer approach:

1. **Source Layer**: Dependencies managed as git submodules in `repos/`
2. **Build Layer**: CMake orchestrates compilation via `ExternalProject_Add`
3. **Integration Layer**: Modern CMake targets provide clean linking

## Directory Structure

```
cmake/
├── Dependencies.cmake           # Main dependency orchestrator
├── External/                    # External project build scripts
│   ├── glew.cmake              # GLEW (Makefile-based)
│   └── wxwidgets.cmake         # wxWidgets (Autotools-based)
└── Modules/                     # CMake find modules
    └── FindCompassDeps.cmake   # Helper for finding built dependencies
```

## Dependency Categories

### 1. Header-Only Libraries (GLM)
- **Location**: `repos/glm/`
- **Build Method**: `add_subdirectory()` - builds CMake config files
- **Usage**: Link via `glm::glm` target
- **Build Output**: `build/third_party/glm/`

### 2. Makefile-Based Libraries (GLEW)
- **Location**: `repos/glew/`
- **Build Method**: `ExternalProject_Add()` with make commands
- **Usage**: Link via `GLEW::GLEW` target
- **Build Output**: `build/third_party/glew/install/`

### 3. Autotools-Based Libraries (wxWidgets)
- **Location**: `repos/wxWidgets/`
- **Build Method**: `ExternalProject_Add()` with configure/make
- **Usage**: Use via `find_package(wxWidgets)` with built `wx-config`
- **Build Output**: `build/third_party/wxWidgets/install/`

### 4. System Libraries (OpenGL)
- **Location**: System-provided
- **Build Method**: `find_package()`
- **Usage**: Link via `${OPENGL_LIBRARIES}`

## Build Flow

1. **CMake Configure Phase**:
   - `CMakeLists.txt` includes `cmake/Dependencies.cmake`
   - `Dependencies.cmake` configures all submodules
   - `ExternalProject_Add()` schedules builds but doesn't execute yet
   - `FindCompassDeps.cmake` sets up wxWidgets finding

2. **CMake Build Phase**:
   - GLM built first (simple header library)
   - GLEW built via external make (produces `libGLEW.a`)
   - wxWidgets built via configure/make (produces `wx-config`)
   - Main executables built after dependencies complete

3. **Linking Phase**:
   - Modern CMake targets (`GLEW::GLEW`, `glm::glm`) used
   - Dependencies automatically propagated to targets

## Build Artifacts Location

All build artifacts go into `build/third_party/`:

```
build/
└── third_party/
    ├── glm/                    # GLM CMake build
    │   └── cmake/
    ├── glew/                   # GLEW build
    │   └── install/
    │       ├── include/
    │       └── lib/libGLEW.a
    └── wxWidgets/              # wxWidgets build
        └── install/
            ├── bin/wx-config
            ├── include/
            └── lib/
```

## How to Build

```bash
# Initialize submodules (first time only)
git submodule update --init --recursive

# Configure and build
mkdir -p build
cd build
cmake ..
cmake --build . -j$(sysctl -n hw.ncpu)
```

## Adding New Dependencies

### For CMake-based libraries:

1. Add submodule: `git submodule add <url> repos/<name>`
2. Edit `cmake/Dependencies.cmake`:
   ```cmake
   set(LIB_SOURCE_DIR "${COMPASS_THIRD_PARTY_ROOT}/<name>")
   add_subdirectory("${LIB_SOURCE_DIR}" "${COMPASS_BUILD_ROOT}/<name>")
   ```

### For non-CMake libraries:

1. Add submodule: `git submodule add <url> repos/<name>`
2. Create `cmake/External/<name>.cmake`:
   ```cmake
   include(ExternalProject)
   ExternalProject_Add(<name>_external
       SOURCE_DIR ${COMPASS_THIRD_PARTY_ROOT}/<name>
       # ... configure build commands ...
   )
   add_library(<name>::<name> IMPORTED)
   add_dependencies(<name>::<name> <name>_external)
   ```
3. Include in `cmake/Dependencies.cmake`:
   ```cmake
   include(${CMAKE_CURRENT_LIST_DIR}/External/<name>.cmake)
   ```

## Advantages Over Shell Scripts

1. **Cross-platform**: Single system works on macOS, Linux, Windows
2. **Parallel builds**: CMake automatically parallelizes
3. **Dependency tracking**: Rebuilds only what's needed
4. **IDE integration**: Works seamlessly with CLion, VS Code, etc.
5. **Clean targets**: Modern CMake targets with automatic include/lib propagation
6. **No manual paths**: No hardcoded platform-specific paths
7. **Reproducible**: CMake cache ensures consistent builds

## Comparison to Old System

| Aspect | Old (Shell Scripts) | New (CMake) |
|--------|-------------------|-------------|
| Build location | `third-party/` | `build/third_party/` |
| Platform support | Separate scripts | Single CMakeLists.txt |
| Rebuild detection | Manual `make clean` | Automatic |
| IDE support | Poor | Excellent |
| Parallel builds | Manual `-j` flag | Automatic |
| Dependency order | Manual | Automatic |

## Platform-Specific Notes

### macOS
- Uses `clang/clang++` by default
- GLEW built with `GLEW_STATIC=1`
- wxWidgets configured for Cocoa

### Linux
- GLEW built with `GLEW_STATIC=1`
- wxWidgets configured with GTK3
- Requires X11 development headers

### Windows
- Not yet fully implemented
- Would use MSBuild or CMake for wxWidgets
- GLEW built via CMake

# cmake/External/caliper.cmake
# Import libcaliper (the embed C ABI seam) from an EXISTING caliper build tree.
#
# C1 is a CONSUMER of libcaliper v1.1 (caliper/embed.h + metrics.v1_1). We do NOT
# build caliper here; we link its already-built static-library closure. The exact
# closure + order is lifted verbatim from the caliper build's own link line for
# examples/embed_host (the run-proven second embedder) — see
# .superpowers/sdd/compass/task-c1-report.md for how it was extracted. Keeping the
# order identical is load-bearing: static archives resolve left-to-right.
#
# Two knobs (cache vars, sane defaults for this machine):
#   CALIPER_SRC_DIR   — the caliper repo root (headers: include/ + sdk/include/)
#   CALIPER_BUILD_DIR — a configured+built caliper build tree (the .a closure)
#   CALIPER_TORCH_DIR — libtorch root (dylibs pulled in transitively by libcaliper)

set(CALIPER_SRC_DIR   "/Users/ahmed/CLionProjects/caliper"
    CACHE PATH "caliper repo root (embed.h + service headers)")
set(CALIPER_BUILD_DIR "${CALIPER_SRC_DIR}/cmake-build-debug"
    CACHE PATH "a built caliper tree providing the libcaliper .a closure")
set(CALIPER_TORCH_DIR "${CALIPER_SRC_DIR}/third_party/libtorch"
    CACHE PATH "libtorch root (transitive dylib dependency of libcaliper)")

if(NOT APPLE)
    message(FATAL_ERROR "caliper.cmake: only the macOS/Metal closure is wired for C1.")
endif()

# --- Sanity: the seam header and the core archive must both exist ----------
if(NOT EXISTS "${CALIPER_SRC_DIR}/include/caliper/embed.h")
    message(FATAL_ERROR
        "caliper.cmake: embed.h not found under CALIPER_SRC_DIR=${CALIPER_SRC_DIR}. "
        "Point -DCALIPER_SRC_DIR at the caliper repo (branch feat/embed-v1_1).")
endif()
if(NOT EXISTS "${CALIPER_BUILD_DIR}/libcaliper.a")
    message(FATAL_ERROR
        "caliper.cmake: libcaliper.a not found under CALIPER_BUILD_DIR=${CALIPER_BUILD_DIR}. "
        "Build caliper first (its cmake-build-debug), or pass -DCALIPER_BUILD_DIR.")
endif()

# --- The static-library closure, in the caliper build's own link order -----
# (verbatim from cmake-build-debug/build.ninja LINK_LIBRARIES for embed_host)
set(_cal_closure
    "${CALIPER_BUILD_DIR}/libcaliper.a"
    "-framework CoreVideo"
    "${CALIPER_BUILD_DIR}/cmake/wrappers/glew/liblibglew_static.a"
    "${CALIPER_BUILD_DIR}/third_party/glfw/src/libglfw3.a"
    "${CALIPER_BUILD_DIR}/cmake/wrappers/imgui/libimgui.a"
    "${CALIPER_BUILD_DIR}/cmake/wrappers/implot/libimplot.a"
    "${CALIPER_BUILD_DIR}/cmake/wrappers/implot3d/libimplot3d.a"
    "${CALIPER_BUILD_DIR}/cmake/wrappers/imgui-node-editor/libimgui-node-editor.a"
    "${CALIPER_BUILD_DIR}/third_party/duckdb/src/libduckdb_static.a"
    "${CALIPER_BUILD_DIR}/third_party/duckdb/extension/libduckdb_generated_extension_loader.a"
    "${CALIPER_BUILD_DIR}/third_party/duckdb/extension/parquet/libparquet_extension.a"
    "${CALIPER_BUILD_DIR}/third_party/duckdb/extension/core_functions/libcore_functions_extension.a"
    "${CALIPER_BUILD_DIR}/cmake/wrappers/imgui-color-text-edit/libimgui-color-text-edit.a"
    "${CALIPER_BUILD_DIR}/third_party/ImGuiFileDialog/libImGuiFileDialog.a"
    "${CALIPER_TORCH_DIR}/lib/libc10.dylib"
    "${CALIPER_TORCH_DIR}/lib/libkineto.a"
    "${CALIPER_TORCH_DIR}/lib/libtorch.dylib"
    "${CALIPER_TORCH_DIR}/lib/libtorch_cpu.dylib"
    "${CALIPER_TORCH_DIR}/lib/libc10.dylib"
    "${CALIPER_BUILD_DIR}/libcaliper_host_lib.a"
    "${CALIPER_BUILD_DIR}/libcaliper_app_paths.a"
    "${CALIPER_BUILD_DIR}/libcaliper_metal_backend.a"
    "-framework Metal" "-framework OpenGL" "-framework Cocoa" "-framework IOKit"
    "-framework CoreFoundation" "-framework QuartzCore" "-framework Foundation"
    # libtorch is a dylib closure resolved at runtime via this rpath — identical
    # to the caliper exe and embed_host. (See report: the "no torch" gate is met
    # in COMPASS'S OWN objects; the transitive dylib closure still carries torch.)
    "-Wl,-rpath,${CALIPER_TORCH_DIR}/lib"
)

add_library(caliper::embed INTERFACE IMPORTED GLOBAL)
set_target_properties(caliper::embed PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES
        "${CALIPER_SRC_DIR}/include;${CALIPER_SRC_DIR}/sdk/include"
    INTERFACE_LINK_LIBRARIES "${_cal_closure}")

# Default applets dir: the caliper build's applets tree (instance_scope lives
# here). A consumer overrides with -DCALIPER_APPLETS_DIR or the CALIPER_EMBED_APPLETS
# env var at runtime; the app falls back to this compiled-in default.
set(CALIPER_APPLETS_DIR "${CALIPER_BUILD_DIR}/applets"
    CACHE PATH "applet scan dir handed to CaliperCoreDesc.applets_dir")

message(STATUS "caliper: embed seam from ${CALIPER_SRC_DIR}")
message(STATUS "caliper: .a closure from ${CALIPER_BUILD_DIR}")
message(STATUS "caliper: applets dir ${CALIPER_APPLETS_DIR}")

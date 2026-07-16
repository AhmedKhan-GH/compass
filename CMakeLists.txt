cmake_minimum_required(VERSION 3.16)
project(compass VERSION 0.1)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# C1 — Compass as a CONSUMER of libcaliper (embed v1.1). The app is native wx
# chrome (rescued libcompass App + DocumentFrame) around a live libcaliper
# viewport + a native metrics table over caliper.metrics.v1_1. The self-rendered
# GL path (hello_gl / gl_smoke / canvas2d / compass::gl) is deleted — the canvas
# is libcaliper's CAMetalLayer via caliper/embed.h, never a wx GL canvas (D13).

if(MSVC)
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
    add_compile_options(/utf-8)
endif()

# COMPASS_WITH_CALIPER — the C1/C2 product (the `compass` app, the wx-free
# compass_core logic, and the C2 tests) consumes libcaliper from an already-built
# caliper tree at a local path (see cmake/External/caliper.cmake). That tree can't
# exist on a generic CI runner, so gate the whole caliper-dependent subtree behind
# this option. Default ON (local dev + IDE builds unchanged); CI configures with
# -DCOMPASS_WITH_CALIPER=OFF to build/test only the caliper-free parts (the wx
# shell + the demos, including the Windows Canvas2D GL loader).
option(COMPASS_WITH_CALIPER "Build the libcaliper-consumer app + C2 core/tests (needs a local caliper tree)" ON)

# wxWidgets: vendored static, built from source (the proven build lore stays —
# cmake/External/wxwidgets.cmake creates the wxWidgets::wxWidgets interface lib).
include(cmake/External/wxwidgets.cmake)

# libcaliper: consumed from an already-built caliper tree (creates caliper::embed
# + CALIPER_APPLETS_DIR). C1 links this closure; it does not build caliper.
if(COMPASS_WITH_CALIPER)
    include(cmake/External/caliper.cmake)
endif()

# GLAD 3.3-core loader → compass::gl (§6.2, CD12). Consumed by compass::Canvas2D
# (the demos' self-rendered GL viewport); must precede add_subdirectory(libcompass).
include(cmake/External/glad.cmake)

# Layer 1 — the rescued wx framework (App + DocumentFrame + Canvas2D GL viewport)
# + the wx-free C2 logic library (compass_core: .compass document, SQL builders,
# Arrow decode, store-root classifier, HTML report).
add_subdirectory(libcompass)

# The Compass application (C2): native chrome + libcaliper viewport + the
# run-comparison document (picker, side-by-side tables/plots, annotations, export).
# Needs the caliper closure — built only when COMPASS_WITH_CALIPER is ON.
if(COMPASS_WITH_CALIPER)
    add_executable(compass
        app/main.cpp
        app/workspace_frame.cpp
        app/viewport_panel.cpp
        app/metrics_table.cpp
        app/run_picker.cpp
        app/plot_series_canvas.cpp
        app/comparison_panel.cpp
        app/annotations_panel.cpp
        app/report_builder.cpp
    )
    target_link_libraries(compass PRIVATE compass_shell compass_core caliper::embed)
    target_compile_definitions(compass PRIVATE
        COMPASS_APPLETS_DIR_DEFAULT="${CALIPER_APPLETS_DIR}")
    set_target_properties(compass PROPERTIES
        CXX_STANDARD 20 CXX_STANDARD_REQUIRED ON)
endif()

# Demos (demos/) — minimal exemplars, each its own target. hello_gl is the
# animated GL 3.3 sine wave the "Your first app" tutorial walks; it links
# compass_shell for compass::Canvas2D. Opt out with -DCOMPASS_BUILD_DEMOS=OFF.
option(COMPASS_BUILD_DEMOS "Build the demos (demos/)" ON)
if(COMPASS_BUILD_DEMOS)
    add_subdirectory(demos/hello_world) # minimal wxApp+wxFrame, static wx only
    add_subdirectory(demos/gl_smoke)    # GL 3.3 smoke test (first compass::Canvas2D consumer)
    add_subdirectory(demos/hello_gl)    # animated GL sine wave — "Your first app" tutorial
    add_subdirectory(demos/sound_test)  # parked audio utility (kept buildable)
endif()

# C2 tests (doctest) — exercise compass_core, which needs caliper's Arrow C
# headers, so they build only alongside the caliper subtree. enable_testing()
# runs unconditionally so a (possibly empty) CTest manifest always exists — CI
# with -DCOMPASS_WITH_CALIPER=OFF then passes `ctest --no-tests=ignore` cleanly
# instead of erroring on a missing test configuration. Opt out with
# -DCOMPASS_BUILD_TESTS=OFF.
option(COMPASS_BUILD_TESTS "Build Compass unit tests" ON)
if(COMPASS_BUILD_TESTS)
    enable_testing()
    if(COMPASS_WITH_CALIPER)
        add_subdirectory(tests/c2)
    endif()
endif()

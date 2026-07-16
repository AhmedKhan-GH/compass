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

# wxWidgets: vendored static, built from source (the proven build lore stays —
# cmake/External/wxwidgets.cmake creates the wxWidgets::wxWidgets interface lib).
include(cmake/External/wxwidgets.cmake)

# libcaliper: consumed from an already-built caliper tree (creates caliper::embed
# + CALIPER_APPLETS_DIR). C1 links this closure; it does not build caliper.
include(cmake/External/caliper.cmake)

# GLAD 3.3-core loader → compass::gl (§6.2, CD12). Consumed by compass::Canvas2D
# (the demos' self-rendered GL viewport); must precede add_subdirectory(libcompass).
include(cmake/External/glad.cmake)

# Layer 1 — the rescued wx framework (App + DocumentFrame + Canvas2D GL viewport)
# + the wx-free C2 logic library (compass_core: .compass document, SQL builders,
# Arrow decode, store-root classifier, HTML report).
add_subdirectory(libcompass)

# The Compass application (C2): native chrome + libcaliper viewport + the
# run-comparison document (picker, side-by-side tables/plots, annotations, export).
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

# C2 tests (doctest). Opt out with -DCOMPASS_BUILD_TESTS=OFF.
option(COMPASS_BUILD_TESTS "Build Compass unit tests" ON)
if(COMPASS_BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests/c2)
endif()

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

# Layer 1 — the rescued wx framework (App + DocumentFrame; no GL).
add_subdirectory(libcompass)

# The Compass application (C1): native chrome + libcaliper viewport + metrics.
add_executable(compass
    app/main.cpp
    app/workspace_frame.cpp
    app/viewport_panel.cpp
    app/metrics_table.cpp
)
target_link_libraries(compass PRIVATE compass_shell caliper::embed)
target_compile_definitions(compass PRIVATE
    COMPASS_APPLETS_DIR_DEFAULT="${CALIPER_APPLETS_DIR}")
set_target_properties(compass PROPERTIES
    CXX_STANDARD 20 CXX_STANDARD_REQUIRED ON)

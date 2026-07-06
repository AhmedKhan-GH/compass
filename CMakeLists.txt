cmake_minimum_required(VERSION 3.16)
project(compass VERSION 0.1)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Include dependency management system (PyTorch-style)
include(cmake/Dependencies.cmake)
# GLAD 3.3-core loader → compass::gl (§6.2, CD12; replaces GLEW at I3).
include(cmake/External/glad.cmake)
# Layer 0 catalog: compass:: targets + compass_add_instrument() (§5.2, §5.4).
include(cmake/catalog.cmake)

# Layer 1 — the instrument framework (header-only for now).
add_subdirectory(libcompass)

# Plot Workbench logic (wx-free); shared by the app and the tests.
add_subdirectory(src/plot)

# The instrument template must always build against the framework (PLATFORM.md
# §5.6 — the template is the SDK spec; a framework change that breaks it fails here).
add_subdirectory(templates/instrument)

# Instrument #1 — Plot Workbench, via the SDK entry point (§5.4). Native UI
# (wxGraphicsContext 2D, no GL at I1); GL enters via libcompass at I3 (CD12).
compass_add_instrument(compass
    SOURCES
        src/main.cpp
        src/main_frame.cpp
        src/plot_canvas.cpp
        src/expression_panel.cpp
        src/view_panel.cpp
    LIBS compass_plot
)

option(COMPASS_BUILD_DEMOS "Build quarantined demos (demos/)" ON)
if(COMPASS_BUILD_DEMOS)
    add_subdirectory(demos/hello_world)
    add_subdirectory(demos/gl_smoke)
    add_subdirectory(demos/sound_test)
endif()

# Plot Workbench (Instrument #1, I1) — headless logic units, unit-tested.
# doctest is dev-only (never linked into shipped binaries); tests run via CTest.
option(COMPASS_BUILD_TESTS "Build unit tests (doctest + CTest)" ON)
if(COMPASS_BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests/compass)
    add_subdirectory(tests/plot)
endif()

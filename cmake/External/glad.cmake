# GLAD — OpenGL 3.3 core loader (catalog target compass::gl). Generated with the
# glad2 tool (`glad --api gl:core=3.3 c`) and vendored under third_party/glad;
# built static by Layer 0. Replaces GLEW (§6.2, CD12): GLAD loads only the fixed
# 3.3-core entry points the framework's Canvas2D/3D need — no loader guesswork.
#
# Consumer: compass::Canvas2D (libcompass), first used by the Signal Workbench
# waveform canvas at I3.

set(GLAD_DIR "${PROJECT_SOURCE_DIR}/third_party/glad")

if(EXISTS "${GLAD_DIR}/src/gl.c")
    add_library(glad STATIC "${GLAD_DIR}/src/gl.c")
    target_include_directories(glad PUBLIC "${GLAD_DIR}/include")
    set_target_properties(glad PROPERTIES POSITION_INDEPENDENT_CODE ON)

    if(NOT TARGET compass::gl)
        add_library(compass::gl ALIAS glad)
    endif()
    message(STATUS "GLAD (compass::gl): OpenGL 3.3 core loader at ${GLAD_DIR}")
else()
    message(FATAL_ERROR
        "GLAD sources missing at ${GLAD_DIR}. Regenerate with:\n"
        "  uvx --from glad2 glad --api gl:core=3.3 --out-path third_party/glad c")
endif()

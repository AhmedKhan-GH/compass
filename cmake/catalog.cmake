# Layer 0 — the curated library catalog (PLATFORM.md §5.2) and the instrument
# entry point (§5.4). Every admitted library is exposed as a namespaced
# `compass::` target so instrument code links `compass::wx` / `compass::glm`,
# never a raw path. Included after cmake/Dependencies.cmake (which defines the
# underlying wxWidgets::wxWidgets and glm::glm imported targets).

# --- catalog wrappers ---
if(NOT TARGET compass::wx)
    add_library(compass::wx ALIAS wxWidgets::wxWidgets)
endif()
if(NOT TARGET compass::glm)
    add_library(compass::glm ALIAS glm::glm)
endif()

# --- the instrument entry point (§5.4) ---
#
#   compass_add_instrument(<name>
#       SOURCES a.cpp b.cpp ...
#       [LIBS   compass::glm my_logic_lib ...])   # catalog / project targets only
#
# Produces the static-binary app target: links the framework shell + catalog wx,
# applies WIN32 (no console), and includes the instrument's own directory so its
# sources find their sibling headers by bare name. Static-CRT (/MT) and bundle
# metadata are layered on at I3/I4.
function(compass_add_instrument name)
    cmake_parse_arguments(ARG "" "" "SOURCES;LIBS" ${ARGN})
    if(NOT ARG_SOURCES)
        message(FATAL_ERROR "compass_add_instrument(${name}) requires SOURCES")
    endif()
    add_executable(${name} WIN32 ${ARG_SOURCES})
    target_include_directories(${name} PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})
    target_link_libraries(${name} PRIVATE compass_shell compass::wx ${ARG_LIBS})
endfunction()

# libcompass — Layer 1, the instrument framework (PLATFORM.md §5.3).
#
# C1 RESCUE: the wx chrome is kept; the self-rendered GL viewport (canvas2d /
# compass::gl) is GONE — C1's canvas is libcaliper's CAMetalLayer via the embed
# ABI, never a wx GL canvas (D13). Two targets keep the layering honest:
#
#   compass_framework — wx-FREE core (compass::Document base); header-only.
#   compass_shell     — wx-dependent shell (compass::App, DocumentFrame); linked
#                       by the Compass executable.

# --- wx-free core (header-only) ---
add_library(compass_framework INTERFACE)
target_include_directories(compass_framework INTERFACE include)
target_compile_features(compass_framework INTERFACE cxx_std_20)

# --- wx-dependent shell (no GL) ---
add_library(compass_shell STATIC
    src/app.cpp
    src/document_frame.cpp
)
target_include_directories(compass_shell PUBLIC include)
target_link_libraries(compass_shell
    PUBLIC compass_framework wxWidgets::wxWidgets)

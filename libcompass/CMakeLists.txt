# libcompass — Layer 1, the instrument framework (PLATFORM.md §5.3),
# extracted from Instrument #1 at I2 (CD9). Two targets keep the layering honest:
#
#   compass_framework — wx-FREE core (compass::Document); linked by logic libs.
#   compass_shell     — wx-dependent shell (compass::App, DocumentFrame); linked
#                       by instrument executables.

# --- wx-free core (header-only for now) ---
add_library(compass_framework INTERFACE)
target_include_directories(compass_framework INTERFACE include)
target_compile_features(compass_framework INTERFACE cxx_std_20)

# --- wx-dependent shell ---
add_library(compass_shell STATIC
    src/app.cpp
    src/document_frame.cpp
)
target_include_directories(compass_shell PUBLIC include)
target_link_libraries(compass_shell PUBLIC compass_framework wxWidgets::wxWidgets)

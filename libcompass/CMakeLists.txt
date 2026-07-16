# libcompass — Layer 1, the instrument framework (PLATFORM.md §5.3).
#
# C1 RESCUE: the wx chrome is kept; the self-rendered GL viewport (canvas2d /
# compass::gl) is GONE — C1's canvas is libcaliper's CAMetalLayer via the embed
# ABI, never a wx GL canvas (D13). Two targets keep the layering honest:
#
#   compass_framework — wx-FREE core (compass::Document base); header-only.
#   compass_shell     — wx-dependent shell (compass::App, DocumentFrame); linked
#                       by the Compass executable.

# --- wx-free core (header-only base) ---
add_library(compass_framework INTERFACE)
target_include_directories(compass_framework INTERFACE include)
target_compile_features(compass_framework INTERFACE cxx_std_20)

# --- wx-free C2 logic (compiled): the .compass document model, the metrics.v1_1
#     SQL builders, the Arrow decoder, the store-root classifier, and the HTML
#     report renderer. No wx, no DuckDB linkage — only nlohmann/json and the
#     header-only Arrow C struct layout (caliper/arrow_c.h via sdk/include). Kept
#     wx-free so the tests exercise the branching/rule logic headless. ---
include(${PROJECT_SOURCE_DIR}/cmake/External/nlohmann.cmake)
add_library(compass_core STATIC
    src/comparison_state.cpp
    src/comparison_document.cpp
    src/metrics_sql.cpp
    src/arrow_decode.cpp
    src/store_root.cpp
    src/report.cpp
)
target_include_directories(compass_core PUBLIC include)
target_include_directories(compass_core PRIVATE "${CALIPER_SRC_DIR}/sdk/include")
target_link_libraries(compass_core PUBLIC compass_framework PRIVATE compass::json)
target_compile_features(compass_core PUBLIC cxx_std_20)

# --- wx-dependent shell + GL viewport ---
# compass::Canvas2D (the 3.3-core forward-compatible wxGLCanvas base) is kept
# alongside the caliper-consumer chrome: it is the self-rendered viewport the
# demos (demos/hello_gl) and the "Your first app" tutorial teach. The main
# Compass app still draws via libcaliper's CAMetalLayer (D13); Canvas2D lives
# here so instruments/demos can subclass it, per the docs.
add_library(compass_shell STATIC
    src/app.cpp
    src/document_frame.cpp
    src/canvas2d.cpp
)
target_include_directories(compass_shell PUBLIC include)
target_link_libraries(compass_shell
    PUBLIC compass_framework wxWidgets::wxWidgets compass::gl)

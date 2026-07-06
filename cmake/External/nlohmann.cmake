# nlohmann/json — single-header JSON (catalog target compass::json). Admitted at
# I3 (§5.2): two real consumers (Plot + Signal document sidecars), MIT-licensed,
# header-only → compiles straight into the static binary. Vendored under
# third_party/nlohmann (pinned v3.11.3). Include as <nlohmann/json.hpp>.
if(NOT TARGET compass::json)
    add_library(compass_json INTERFACE)
    target_include_directories(compass_json INTERFACE "${PROJECT_SOURCE_DIR}/third_party")
    target_compile_features(compass_json INTERFACE cxx_std_20)
    add_library(compass::json ALIAS compass_json)
endif()

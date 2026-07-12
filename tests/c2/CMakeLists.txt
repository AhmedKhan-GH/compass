# C2 tests (doctest, dev-only). The wx-free logic is exercised headless; the
# value-correctness test links the real libcaliper closure and seeds a store.

set(_doctest ${CMAKE_SOURCE_DIR}/third_party/doctest)

# --- cheap wx-free logic tests (link compass_core only) ---
foreach(t test_comparison_state test_metrics_sql test_store_root)
    add_executable(${t} ${t}.cpp)
    target_link_libraries(${t} PRIVATE compass_core)
    target_include_directories(${t} PRIVATE ${_doctest})
    add_test(NAME ${t} COMMAND ${t})
endforeach()

# --- report golden test (needs the golden file path) ---
add_executable(test_report test_report.cpp)
target_link_libraries(test_report PRIVATE compass_core)
target_include_directories(test_report PRIVATE ${_doctest})
target_compile_definitions(test_report PRIVATE
    C2_GOLDEN_PATH="${CMAKE_CURRENT_SOURCE_DIR}/report_golden.html")
add_test(NAME test_report COMMAND test_report)

# --- value-correctness against a real seeded store (links libcaliper) ---
add_executable(test_metrics_values test_metrics_values.cpp)
target_link_libraries(test_metrics_values PRIVATE compass_core caliper::embed)
target_include_directories(test_metrics_values PRIVATE ${_doctest})
add_test(NAME test_metrics_values COMMAND test_metrics_values)

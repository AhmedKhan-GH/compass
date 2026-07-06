# Plot Workbench unit tests (doctest, dev-only). One test executable per logic
# unit as they land; registered with CTest. doctest.h is header-only in
# third_party/ (never shipped — tests are not linked into any product binary).

# The plot logic library — pure C++, wx-free. App and tests both link this.
add_library(compass_plot STATIC
    ${CMAKE_SOURCE_DIR}/src/plot/expression.cpp
    ${CMAKE_SOURCE_DIR}/src/plot/sampler.cpp
)
target_include_directories(compass_plot PUBLIC ${CMAKE_SOURCE_DIR}/src)

function(compass_add_plot_test name)
    add_executable(${name} ${name}.cpp)
    target_link_libraries(${name} PRIVATE compass_plot)
    target_include_directories(${name} PRIVATE ${CMAKE_SOURCE_DIR}/third_party/doctest)
    add_test(NAME ${name} COMMAND ${name})
endfunction()

compass_add_plot_test(test_expression)
compass_add_plot_test(test_sampler)

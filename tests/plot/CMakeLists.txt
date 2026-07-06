# Plot Workbench unit tests (doctest, dev-only). One test executable per logic
# unit; registered with CTest. doctest.h is header-only in third_party/ (never
# shipped — tests are not linked into any product binary). The compass_plot
# logic library is defined in src/plot/ and linked here.

function(compass_add_plot_test name)
    add_executable(${name} ${name}.cpp)
    target_link_libraries(${name} PRIVATE compass_plot)
    target_include_directories(${name} PRIVATE ${CMAKE_SOURCE_DIR}/third_party/doctest)
    add_test(NAME ${name} COMMAND ${name})
endfunction()

compass_add_plot_test(test_expression)
compass_add_plot_test(test_sampler)
compass_add_plot_test(test_plot_document)
compass_add_plot_test(test_csv_exporter)

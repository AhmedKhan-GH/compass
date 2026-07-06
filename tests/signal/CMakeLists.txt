# Signal Workbench unit tests (doctest, dev-only). One executable per logic unit.
function(compass_add_signal_test name)
    add_executable(${name} ${name}.cpp)
    target_link_libraries(${name} PRIVATE compass_signal)
    target_include_directories(${name} PRIVATE ${CMAKE_SOURCE_DIR}/third_party/doctest)
    add_test(NAME ${name} COMMAND ${name})
endfunction()

compass_add_signal_test(test_edf_reader)
compass_add_signal_test(test_waveform_decimator)
compass_add_signal_test(test_signal_document)

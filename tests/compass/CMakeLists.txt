# libcompass framework unit tests (doctest, dev-only).

add_executable(test_document test_document.cpp)
target_link_libraries(test_document PRIVATE compass_framework)
target_include_directories(test_document PRIVATE ${CMAKE_SOURCE_DIR}/third_party/doctest)
add_test(NAME test_document COMMAND test_document)

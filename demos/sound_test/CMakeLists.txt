# Parked utility (PLATFORM.md §2: "not platform-relevant").
add_executable(sound_test sound_test.cpp)
target_link_libraries(sound_test PRIVATE wxWidgets::wxWidgets)

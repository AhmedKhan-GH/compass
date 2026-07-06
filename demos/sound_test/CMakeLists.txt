# Parked utility (PLATFORM.md §2: "not platform-relevant").
# WIN32: it's a wxIMPLEMENT_APP GUI app — without this it links as a console
# subsystem exe and MSVC looks for main() instead of WinMain() (LNK2019).
add_executable(sound_test WIN32 sound_test.cpp)
target_link_libraries(sound_test PRIVATE wxWidgets::wxWidgets)

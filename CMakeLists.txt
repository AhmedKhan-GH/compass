cmake_minimum_required(VERSION 3.16)
project(compass VERSION 0.1)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Include dependency management system (PyTorch-style)
include(cmake/Dependencies.cmake)

# The shell — links native UI only; GL enters via libcompass at I3 (PLATFORM.md §6, CD12)
add_executable(compass WIN32 src/main.cpp)
target_link_libraries(compass PRIVATE wxWidgets::wxWidgets)

option(COMPASS_BUILD_DEMOS "Build quarantined demos (demos/)" ON)
if(COMPASS_BUILD_DEMOS)
    add_subdirectory(demos/hello_world)
    add_subdirectory(demos/quaternion)
    add_subdirectory(demos/sound_test)
endif()

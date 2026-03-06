cmake_minimum_required(VERSION 3.16)
project(compass VERSION 1.0)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Include dependency management system (PyTorch-style)
include(cmake/Dependencies.cmake)

add_executable(compass WIN32 src/main.cpp)

# Define GLEW_STATIC for static linking
target_compile_definitions(compass PRIVATE GLEW_STATIC)

# Link libraries using modern CMake targets
# Dependencies are automatically handled via the IMPORTED targets
target_link_libraries(compass
    PRIVATE
        wxWidgets::wxWidgets
        ${OPENGL_LIBRARIES}
        GLEW::GLEW
        glm::glm
)

# Sound test executable
add_executable(sound_test src/sound_test.cpp)
target_link_libraries(sound_test PRIVATE wxWidgets::wxWidgets)

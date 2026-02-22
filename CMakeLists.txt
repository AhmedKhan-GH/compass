cmake_minimum_required(VERSION 3.16)
project(compass VERSION 1.0)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Find wxWidgets
set(wxWidgets_CONFIG_EXECUTABLE "${CMAKE_SOURCE_DIR}/third-party/wx-macos-static/bin/wx-config")
find_package(wxWidgets REQUIRED COMPONENTS core base gl)

include(${wxWidgets_USE_FILE})

# Find OpenGL
find_package(OpenGL REQUIRED)

# Set GLEW paths
set(GLEW_INCLUDE_DIR "${CMAKE_SOURCE_DIR}/third-party/glew-macos/include")
set(GLEW_LIBRARY "${CMAKE_SOURCE_DIR}/third-party/glew-macos/lib/libGLEW.a")

# Include directories for OpenGL and GLEW
include_directories(${OPENGL_INCLUDE_DIRS} ${GLEW_INCLUDE_DIR})

add_executable(compass src/main.cpp)

# Explicitly set include directories for the target (helps IDE symbol resolution)
target_include_directories(compass PRIVATE ${GLEW_INCLUDE_DIR} ${OPENGL_INCLUDE_DIRS})

# Link wxWidgets, OpenGL, and GLEW libraries
target_link_libraries(compass ${wxWidgets_LIBRARIES} ${OPENGL_LIBRARIES} ${GLEW_LIBRARY})

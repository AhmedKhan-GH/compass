# cmake/Dependencies.cmake
# Main dependency orchestrator for Compass project
# Inspired by PyTorch's dependency management system

message(STATUS "Configuring Compass dependencies...")

# Set third-party root directories
set(COMPASS_THIRD_PARTY_ROOT "${PROJECT_SOURCE_DIR}/third_party")
set(COMPASS_BUILD_ROOT "${CMAKE_CURRENT_BINARY_DIR}/third_party")

# Platform detection
if(APPLE)
    set(COMPASS_PLATFORM "macos")
elseif(WIN32)
    set(COMPASS_PLATFORM "windows")
elseif(UNIX)
    set(COMPASS_PLATFORM "linux")
else()
    message(FATAL_ERROR "Unsupported platform")
endif()

message(STATUS "Building for platform: ${COMPASS_PLATFORM}")

# ============================================================================
# Category 1: Header-Only Libraries - GLM
# ============================================================================
message(STATUS "Configuring GLM (header-only)...")

set(GLM_SOURCE_DIR "${COMPASS_THIRD_PARTY_ROOT}/glm")
set(GLM_BUILD_DIR "${COMPASS_BUILD_ROOT}/glm")
set(GLM_INSTALL_DIR "${GLM_BUILD_DIR}/install")

# Determine number of parallel jobs
include(ProcessorCount)
ProcessorCount(N_JOBS)
if(N_JOBS EQUAL 0)
    set(N_JOBS 4)
endif()

# Check if GLM is already built/installed
set(GLM_ALREADY_BUILT FALSE)
if(EXISTS "${GLM_INSTALL_DIR}/include/glm/glm.hpp" AND
   EXISTS "${GLM_INSTALL_DIR}/lib/cmake/glm/glmConfig.cmake")
    message(STATUS "GLM already built at ${GLM_INSTALL_DIR}")
    set(GLM_ALREADY_BUILT TRUE)
endif()

# Check if source exists in repos directory, if not download it
if(NOT EXISTS "${GLM_SOURCE_DIR}/glm/glm.hpp")
    message(STATUS "GLM source not found at ${GLM_SOURCE_DIR}")
    message(STATUS "Downloading GLM from GitHub to third_party directory...")

    # Create third_party directory if it doesn't exist
    file(MAKE_DIRECTORY "${COMPASS_THIRD_PARTY_ROOT}")

    # Download directly to repos directory using execute_process at configure time
    execute_process(
        COMMAND git clone --depth 1 --branch 1.0.1 https://github.com/g-truc/glm.git "${GLM_SOURCE_DIR}"
        RESULT_VARIABLE GLM_CLONE_RESULT
        OUTPUT_VARIABLE GLM_CLONE_OUTPUT
        ERROR_VARIABLE GLM_CLONE_ERROR
    )

    if(NOT GLM_CLONE_RESULT EQUAL 0)
        message(FATAL_ERROR "Failed to clone GLM: ${GLM_CLONE_ERROR}")
    endif()

    message(STATUS "GLM downloaded successfully to ${GLM_SOURCE_DIR}")
else()
    message(STATUS "Using GLM source at ${GLM_SOURCE_DIR}")
endif()

# Now build GLM if not already built
if(NOT GLM_ALREADY_BUILT)
    # Build GLM from third_party source using ExternalProject
    include(ExternalProject)

    ExternalProject_Add(glm_build
        SOURCE_DIR ${GLM_SOURCE_DIR}
        CMAKE_ARGS
            -DCMAKE_BUILD_TYPE=Release
            -DGLM_BUILD_TESTS=OFF
            -DCMAKE_INSTALL_PREFIX=${GLM_INSTALL_DIR}
            -DCMAKE_POLICY_DEFAULT_CMP0048=NEW
            -Wno-dev
        BUILD_COMMAND ${CMAKE_COMMAND} --build <BINARY_DIR> --target install -- -j${N_JOBS}
        INSTALL_COMMAND ""
        USES_TERMINAL_CONFIGURE 1
        USES_TERMINAL_BUILD 1
        LOG_CONFIGURE TRUE
    )

    # Create directory to prevent CMake errors
    file(MAKE_DIRECTORY "${GLM_INSTALL_DIR}/include")
    file(MAKE_DIRECTORY "${GLM_INSTALL_DIR}/lib/cmake/glm")

    # Set up the target manually
    add_library(glm::glm INTERFACE IMPORTED GLOBAL)
    set_target_properties(glm::glm PROPERTIES
        INTERFACE_INCLUDE_DIRECTORIES "${GLM_INSTALL_DIR}/include"
    )
    add_dependencies(glm::glm glm_build)
else()
    # Use already built GLM - create dummy target
    add_custom_target(glm_build
        COMMENT "GLM already built, skipping"
    )

    # Set up the target manually
    add_library(glm::glm INTERFACE IMPORTED GLOBAL)
    set_target_properties(glm::glm PROPERTIES
        INTERFACE_INCLUDE_DIRECTORIES "${GLM_INSTALL_DIR}/include"
    )
endif()

message(STATUS "GLM configured successfully")

# ============================================================================
# Category 2: Makefile-Based Libraries - GLEW (ExternalProject)
# ============================================================================
message(STATUS "Configuring GLEW (Makefile-based)...")
include(${CMAKE_CURRENT_LIST_DIR}/External/glew.cmake)

# ============================================================================
# Category 3: Autotools-Based Libraries - wxWidgets (ExternalProject)
# ============================================================================
message(STATUS "Configuring wxWidgets (Autotools-based)...")
include(${CMAKE_CURRENT_LIST_DIR}/External/wxwidgets.cmake)

# ============================================================================
# System Libraries
# ============================================================================
message(STATUS "Finding system libraries...")

# Find OpenGL
find_package(OpenGL REQUIRED)
if(OPENGL_FOUND)
    message(STATUS "OpenGL found: ${OPENGL_LIBRARIES}")
else()
    message(FATAL_ERROR "OpenGL not found")
endif()

message(STATUS "All dependencies configured successfully")

# ============================================================================
# Note on wxWidgets linking:
# ============================================================================
# wxWidgets will be built during the build phase via ExternalProject_Add.
# We cannot call find_package(wxWidgets) here because it hasn't been built yet.
# Instead, we manually create the link flags that will be available after build.
# This is similar to how PyTorch handles NCCL and other external projects.

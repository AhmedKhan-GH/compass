# cmake/External/glew.cmake
# GLEW build configuration - builds during CMake configure step
# If not present as submodule, downloads from SourceForge
# Builds static library (GLEW_STATIC=1)
# Only rebuilds if install directory doesn't exist

set(GLEW_SOURCE_DIR "${PROJECT_SOURCE_DIR}/third_party/glew")
set(GLEW_BUILD_DIR "${CMAKE_BINARY_DIR}/third_party/glew")
set(GLEW_INSTALL_DIR "${GLEW_BUILD_DIR}/install")

# Platform-specific library names and parallel job count
include(ProcessorCount)
ProcessorCount(N_JOBS)
if(N_JOBS EQUAL 0)
    set(N_JOBS 4)
endif()

if(APPLE)
    set(GLEW_LIB_NAME "libGLEW.a")
elseif(WIN32)
    set(GLEW_LIB_NAME "glew32s.lib")
else()
    set(GLEW_LIB_NAME "libGLEW.a")
endif()

# Check if source exists, if not download to third_party directory first
if(NOT EXISTS "${GLEW_SOURCE_DIR}/Makefile")
    message(STATUS "GLEW source not found at ${GLEW_SOURCE_DIR}")
    message(STATUS "Downloading GLEW 2.2.0 release from SourceForge...")

    # Create third_party directory if it doesn't exist
    file(MAKE_DIRECTORY "${PROJECT_SOURCE_DIR}/third_party")

    # Download release tarball which has pre-generated sources
    set(GLEW_TARBALL "${CMAKE_BINARY_DIR}/glew-2.2.0.tgz")
    file(DOWNLOAD
        "https://sourceforge.net/projects/glew/files/glew/2.2.0/glew-2.2.0.tgz/download"
        "${GLEW_TARBALL}"
        EXPECTED_HASH SHA256=d4fc82893cfb00109578d0a1a2337fb8ca335b3ceccf97b97e5cc7f08e4353e1
        SHOW_PROGRESS
    )

    # Extract tarball
    execute_process(
        COMMAND ${CMAKE_COMMAND} -E tar xzf "${GLEW_TARBALL}"
        WORKING_DIRECTORY "${CMAKE_BINARY_DIR}"
        RESULT_VARIABLE GLEW_EXTRACT_RESULT
    )

    if(NOT GLEW_EXTRACT_RESULT EQUAL 0)
        message(FATAL_ERROR "Failed to extract GLEW tarball")
    endif()

    # Move extracted directory to third_party location
    file(RENAME "${CMAKE_BINARY_DIR}/glew-2.2.0" "${GLEW_SOURCE_DIR}")
    file(REMOVE "${GLEW_TARBALL}")

    message(STATUS "GLEW downloaded successfully to ${GLEW_SOURCE_DIR}")
else()
    message(STATUS "Using GLEW source at ${GLEW_SOURCE_DIR}")
endif()

# Check if GLEW is already built, if not build it now
if(NOT EXISTS "${GLEW_INSTALL_DIR}/lib/${GLEW_LIB_NAME}")
    message(STATUS "========================================")
    message(STATUS "Building GLEW...")
    message(STATUS "========================================")

    # Platform-specific build commands
    if(APPLE)
        # Build
        message(STATUS "Building GLEW with ${N_JOBS} parallel jobs...")
        execute_process(
            COMMAND make -j${N_JOBS} GLEW_DEST=${GLEW_INSTALL_DIR} SYSTEM=darwin GLEW_STATIC=1 glew.lib
            WORKING_DIRECTORY ${GLEW_SOURCE_DIR}
            RESULT_VARIABLE GLEW_BUILD_RESULT
            COMMAND_ECHO STDOUT
        )

        if(NOT GLEW_BUILD_RESULT EQUAL 0)
            message(FATAL_ERROR "Failed to build GLEW")
        endif()

        # Install
        message(STATUS "Installing GLEW...")
        execute_process(
            COMMAND make install GLEW_DEST=${GLEW_INSTALL_DIR} SYSTEM=darwin GLEW_STATIC=1
            WORKING_DIRECTORY ${GLEW_SOURCE_DIR}
            RESULT_VARIABLE GLEW_INSTALL_RESULT
            COMMAND_ECHO STDOUT
        )

        if(NOT GLEW_INSTALL_RESULT EQUAL 0)
            message(FATAL_ERROR "Failed to install GLEW")
        endif()
    elseif(WIN32)
        message(FATAL_ERROR "Windows build for GLEW not yet implemented in this CMake system")
    else()
        # Linux
        message(STATUS "Building GLEW with ${N_JOBS} parallel jobs...")
        execute_process(
            COMMAND make -j${N_JOBS} GLEW_DEST=${GLEW_INSTALL_DIR} GLEW_STATIC=1 glew.lib
            WORKING_DIRECTORY ${GLEW_SOURCE_DIR}
            RESULT_VARIABLE GLEW_BUILD_RESULT
            COMMAND_ECHO STDOUT
        )

        if(NOT GLEW_BUILD_RESULT EQUAL 0)
            message(FATAL_ERROR "Failed to build GLEW")
        endif()

        # Install
        message(STATUS "Installing GLEW...")
        execute_process(
            COMMAND make install GLEW_DEST=${GLEW_INSTALL_DIR} GLEW_STATIC=1
            WORKING_DIRECTORY ${GLEW_SOURCE_DIR}
            RESULT_VARIABLE GLEW_INSTALL_RESULT
            COMMAND_ECHO STDOUT
        )

        if(NOT GLEW_INSTALL_RESULT EQUAL 0)
            message(FATAL_ERROR "Failed to install GLEW")
        endif()
    endif()

    message(STATUS "========================================")
    message(STATUS "GLEW build complete!")
    message(STATUS "========================================")
else()
    message(STATUS "GLEW already built at ${GLEW_INSTALL_DIR}")
endif()

# Create interface library for easy linking
add_library(GLEW::GLEW STATIC IMPORTED GLOBAL)

# Create directories to prevent CMake validation errors
file(MAKE_DIRECTORY "${GLEW_INSTALL_DIR}/include")

# Set library location
set_target_properties(GLEW::GLEW PROPERTIES
    IMPORTED_LOCATION "${GLEW_INSTALL_DIR}/lib/${GLEW_LIB_NAME}"
    INTERFACE_INCLUDE_DIRECTORIES "${GLEW_INSTALL_DIR}/include"
)

# For macOS, GLEW needs framework dependencies
if(APPLE)
    set_target_properties(GLEW::GLEW PROPERTIES
        INTERFACE_LINK_LIBRARIES "-framework OpenGL"
    )
elseif(UNIX)
    set_target_properties(GLEW::GLEW PROPERTIES
        INTERFACE_LINK_LIBRARIES "GL;X11"
    )
endif()

message(STATUS "GLEW will be built at: ${GLEW_BUILD_DIR}")
message(STATUS "GLEW will be installed to: ${GLEW_INSTALL_DIR}")

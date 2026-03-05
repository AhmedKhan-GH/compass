# cmake/External/wxwidgets.cmake
# wxWidgets build configuration - builds during CMake configure step
# Downloads source to third_party/ (if not present as submodule)
# Builds in cmake-build-debug/third_party/wxWidgets-build/
# Installs to cmake-build-debug/third_party/wxWidgets-install/
# Only rebuilds if install directory doesn't exist

# Determine number of parallel jobs
include(ProcessorCount)
ProcessorCount(N_JOBS)
if(N_JOBS EQUAL 0)
    set(N_JOBS 4)
endif()

# Source and install directories
set(WX_SOURCE_DIR "${PROJECT_SOURCE_DIR}/third_party/wxWidgets")
set(WX_BUILD_DIR "${CMAKE_BINARY_DIR}/third_party/wxWidgets-build")
set(WX_INSTALL_DIR "${CMAKE_BINARY_DIR}/third_party/wxWidgets-install")

# wxWidgets version for library names
set(WX_VERSION "3.3")

# Check if source exists, if not download to third_party directory first
if(NOT EXISTS "${WX_SOURCE_DIR}/configure")
    message(STATUS "wxWidgets source not found at ${WX_SOURCE_DIR}")
    message(STATUS "Downloading wxWidgets from GitHub to third_party directory...")

    file(MAKE_DIRECTORY "${PROJECT_SOURCE_DIR}/third_party")

    execute_process(
        COMMAND git clone --depth 1 --branch v3.2.6 --recurse-submodules https://github.com/wxWidgets/wxWidgets.git "${WX_SOURCE_DIR}"
        RESULT_VARIABLE WX_CLONE_RESULT
    )

    if(NOT WX_CLONE_RESULT EQUAL 0)
        message(FATAL_ERROR "Failed to clone wxWidgets")
    endif()

    message(STATUS "wxWidgets downloaded successfully to ${WX_SOURCE_DIR}")
else()
    message(STATUS "Using wxWidgets source at ${WX_SOURCE_DIR}")
endif()

# Platform-specific configuration
if(APPLE)
    set(WX_CONFIGURE_ARGS
        --prefix=${WX_INSTALL_DIR}
        --with-opengl
        --with-regex=builtin
        --with-libjpeg=builtin
        --with-libtiff=builtin
        --with-libpng=builtin
        --with-zlib=builtin
        --with-expat=builtin
        --disable-shared
        --enable-monolithic
        --with-macosx-version-min=10.10
    )
    set(WX_DEFINITIONS "__WXMAC__" "__WXOSX__" "__WXOSX_COCOA__" "wxDEBUG_LEVEL=0")
    set(WX_MAIN_LIBRARY "${WX_INSTALL_DIR}/lib/libwx_osx_cocoau-${WX_VERSION}.a")
elseif(WIN32)
    message(FATAL_ERROR "Windows build for wxWidgets not yet implemented in this CMake system")
else()
    # Linux
    set(WX_CONFIGURE_ARGS
        --prefix=${WX_INSTALL_DIR}
        --with-opengl
        --with-gtk=3
        --with-regex=builtin
        --with-libjpeg=builtin
        --with-libtiff=builtin
        --with-libpng=builtin
        --with-zlib=builtin
        --with-expat=builtin
        --disable-shared
        --enable-monolithic
    )
    set(WX_DEFINITIONS "__WXGTK__")
    set(WX_MAIN_LIBRARY "${WX_INSTALL_DIR}/lib/libwx_gtk3u_core-${WX_VERSION}.a")
endif()

# Check if wxWidgets is already built, if not build it now
if(NOT EXISTS "${WX_MAIN_LIBRARY}")
    message(STATUS "========================================")
    message(STATUS "Building wxWidgets (this will take several minutes)...")
    message(STATUS "========================================")

    # Create build directory
    file(MAKE_DIRECTORY "${WX_BUILD_DIR}")

    # Configure
    message(STATUS "Configuring wxWidgets...")
    execute_process(
        COMMAND ${WX_SOURCE_DIR}/configure ${WX_CONFIGURE_ARGS}
        WORKING_DIRECTORY ${WX_BUILD_DIR}
        RESULT_VARIABLE WX_CONFIGURE_RESULT
        COMMAND_ECHO STDOUT
    )

    if(NOT WX_CONFIGURE_RESULT EQUAL 0)
        message(FATAL_ERROR "Failed to configure wxWidgets")
    endif()

    # Build
    message(STATUS "Building wxWidgets with ${N_JOBS} parallel jobs...")
    execute_process(
        COMMAND make -j${N_JOBS}
        WORKING_DIRECTORY ${WX_BUILD_DIR}
        RESULT_VARIABLE WX_BUILD_RESULT
        COMMAND_ECHO STDOUT
    )

    if(NOT WX_BUILD_RESULT EQUAL 0)
        message(FATAL_ERROR "Failed to build wxWidgets")
    endif()

    # Install
    message(STATUS "Installing wxWidgets...")
    execute_process(
        COMMAND make install
        WORKING_DIRECTORY ${WX_BUILD_DIR}
        RESULT_VARIABLE WX_INSTALL_RESULT
        COMMAND_ECHO STDOUT
    )

    if(NOT WX_INSTALL_RESULT EQUAL 0)
        message(FATAL_ERROR "Failed to install wxWidgets")
    endif()

    message(STATUS "========================================")
    message(STATUS "wxWidgets build complete!")
    message(STATUS "========================================")
else()
    message(STATUS "wxWidgets already built at ${WX_INSTALL_DIR}")
endif()

# Create interface library
add_library(wxWidgets::wxWidgets INTERFACE IMPORTED GLOBAL)

# Platform-specific library paths and system dependencies
if(APPLE)
    set(WX_LIBRARIES
        "${WX_INSTALL_DIR}/lib/libwx_osx_cocoau-${WX_VERSION}.a"
    )
    set(WX_INCLUDE_DIRS
        "${WX_INSTALL_DIR}/include/wx-${WX_VERSION}"
        "${WX_INSTALL_DIR}/lib/wx/include/osx_cocoa-unicode-static-${WX_VERSION}"
    )
    set(WX_SYSTEM_LIBS
        "-framework IOKit"
        "-framework Carbon"
        "-framework Cocoa"
        "-framework AudioToolbox"
        "-framework System"
        "-framework OpenGL"
        "-framework WebKit"
        "-framework QuartzCore"
        "${WX_INSTALL_DIR}/lib/libwx_osx_cocoau_gl-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwxpng-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwxjpeg-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwxtiff-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwxregexu-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwxexpat-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwxzlib-${WX_VERSION}.a"
        "iconv"
        "pthread"
    )
elseif(UNIX)
    set(WX_LIBRARIES
        "${WX_INSTALL_DIR}/lib/libwx_gtk3u_core-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwx_baseu-${WX_VERSION}.a"
    )
    set(WX_INCLUDE_DIRS
        "${WX_INSTALL_DIR}/include/wx-${WX_VERSION}"
        "${WX_INSTALL_DIR}/lib/wx/include/gtk3-unicode-static-${WX_VERSION}"
    )
    set(WX_SYSTEM_LIBS
        "gtk-3"
        "X11"
    )
endif()

# Create placeholder directories so CMake doesn't complain about non-existent paths
# These will be populated during the build phase by ExternalProject
file(MAKE_DIRECTORY "${WX_INSTALL_DIR}/include")
file(MAKE_DIRECTORY "${WX_INSTALL_DIR}/lib")
foreach(include_dir ${WX_INCLUDE_DIRS})
    file(MAKE_DIRECTORY "${include_dir}")
endforeach()

# Set interface properties
set_target_properties(wxWidgets::wxWidgets PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES "${WX_INCLUDE_DIRS}"
    INTERFACE_LINK_LIBRARIES "${WX_LIBRARIES};${WX_SYSTEM_LIBS}"
    INTERFACE_COMPILE_DEFINITIONS "${WX_DEFINITIONS}"
)

# Export variables for compatibility
set(wxWidgets_FOUND TRUE CACHE BOOL "wxWidgets found" FORCE)
set(wxWidgets_INCLUDE_DIRS "${WX_INCLUDE_DIRS}" CACHE STRING "wxWidgets include dirs" FORCE)
set(wxWidgets_LIBRARIES "${WX_LIBRARIES}" CACHE STRING "wxWidgets libraries" FORCE)

message(STATUS "wxWidgets will be built during make in: ${WX_SOURCE_DIR}")
message(STATUS "wxWidgets will be installed to: ${WX_INSTALL_DIR}")
message(STATUS "wxWidgets include dirs: ${WX_INCLUDE_DIRS}")
message(STATUS "wxWidgets libraries: ${WX_LIBRARIES}")

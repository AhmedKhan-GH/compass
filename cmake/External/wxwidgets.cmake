# cmake/External/wxwidgets.cmake
# wxWidgets configuration
# All platforms: Builds from source

set(WX_SOURCE_DIR "${PROJECT_SOURCE_DIR}/third_party/wxWidgets")
set(WX_VERSION "3.3")

if(WIN32)
    # Windows: Build from source using MSVC nmake
    # Determine build configuration
    if(CMAKE_BUILD_TYPE MATCHES "Debug")
        set(WX_BUILD_TYPE "debug")
        set(WX_LIB_SUFFIX "d")
        set(WX_SETUP_DIR "mswud")
    else()
        set(WX_BUILD_TYPE "release")
        set(WX_LIB_SUFFIX "")
        set(WX_SETUP_DIR "mswu")
    endif()

    set(WX_INSTALL_DIR "${WX_SOURCE_DIR}/lib/vc_x64_lib")
    set(WX_MAIN_LIBRARY "${WX_INSTALL_DIR}/wxmsw33u${WX_LIB_SUFFIX}_core.lib")

    # Check source exists
    if(NOT EXISTS "${WX_SOURCE_DIR}/build/msw/makefile.vc")
        message(FATAL_ERROR "wxWidgets submodule not initialized. Run: init-submodules.bat")
    endif()

    # Build if needed
    if(NOT EXISTS "${WX_MAIN_LIBRARY}")
        message(STATUS "========================================")
        message(STATUS "Building wxWidgets (${WX_BUILD_TYPE}) from source for Windows...")
        message(STATUS "This may take several minutes...")
        message(STATUS "========================================")

        # Use batch script to set up MSVC environment and build
        execute_process(
            COMMAND cmd /c "${PROJECT_SOURCE_DIR}/cmake/build-wxwidgets-windows.bat" "${WX_SOURCE_DIR}/build/msw" "${WX_BUILD_TYPE}"
            RESULT_VARIABLE WX_BUILD_RESULT
            OUTPUT_VARIABLE WX_BUILD_OUTPUT
            ERROR_VARIABLE WX_BUILD_ERROR
        )

        if(NOT WX_BUILD_RESULT EQUAL 0)
            message(STATUS "Build output: ${WX_BUILD_OUTPUT}")
            message(STATUS "Build error: ${WX_BUILD_ERROR}")
            message(FATAL_ERROR "Failed to build wxWidgets (exit code: ${WX_BUILD_RESULT}). Make sure Visual Studio Build Tools are installed.")
        endif()

        # Verify libraries were created
        if(NOT EXISTS "${WX_MAIN_LIBRARY}")
            message(FATAL_ERROR "Build completed but library not found at: ${WX_MAIN_LIBRARY}")
        endif()

        message(STATUS "wxWidgets build complete!")
        message(STATUS "========================================")
    else()
        message(STATUS "wxWidgets (${WX_BUILD_TYPE}) already built")
    endif()

    # Library configuration
    set(WX_LIBRARIES
        "${WX_INSTALL_DIR}/wxmsw33u${WX_LIB_SUFFIX}_core.lib"
        "${WX_INSTALL_DIR}/wxbase33u${WX_LIB_SUFFIX}.lib"
        "${WX_INSTALL_DIR}/wxmsw33u${WX_LIB_SUFFIX}_gl.lib"
        "${WX_INSTALL_DIR}/wxpng${WX_LIB_SUFFIX}.lib"
        "${WX_INSTALL_DIR}/wxjpeg${WX_LIB_SUFFIX}.lib"
        "${WX_INSTALL_DIR}/wxzlib${WX_LIB_SUFFIX}.lib"
    )
    set(WX_INCLUDE_DIRS
        "${WX_SOURCE_DIR}/include"
        "${WX_INSTALL_DIR}/${WX_SETUP_DIR}"
    )
    set(WX_DEFINITIONS "__WXMSW__" "UNICODE" "_UNICODE")
    if(CMAKE_BUILD_TYPE MATCHES "Debug")
        list(APPEND WX_DEFINITIONS "wxDEBUG_LEVEL=1")
    else()
        list(APPEND WX_DEFINITIONS "wxDEBUG_LEVEL=0")
    endif()
    set(WX_SYSTEM_LIBS
        comctl32 rpcrt4 winmm gdi32 ole32 uuid shell32
    )

elseif(APPLE)
    # macOS: Build from source (existing logic)
    set(WX_SOURCE_DIR "${PROJECT_SOURCE_DIR}/third_party/wxWidgets")
    set(WX_BUILD_DIR "${CMAKE_BINARY_DIR}/third_party/wxWidgets-build")
    set(WX_MAIN_LIBRARY "${WX_INSTALL_DIR}/lib/libwx_osx_cocoau-${WX_VERSION}.a")

    # Check source exists
    if(NOT EXISTS "${WX_SOURCE_DIR}/configure")
        message(FATAL_ERROR "wxWidgets submodule not initialized. Run: git submodule update --init --recursive")
    endif()

    # Build if needed
    if(NOT EXISTS "${WX_MAIN_LIBRARY}")
        message(STATUS "Building wxWidgets for macOS...")
        file(MAKE_DIRECTORY "${WX_BUILD_DIR}")

        execute_process(
            COMMAND ${WX_SOURCE_DIR}/configure
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
            WORKING_DIRECTORY ${WX_BUILD_DIR}
            RESULT_VARIABLE WX_CONFIGURE_RESULT
        )

        if(NOT WX_CONFIGURE_RESULT EQUAL 0)
            message(FATAL_ERROR "Failed to configure wxWidgets")
        endif()

        execute_process(
            COMMAND make -j8
            WORKING_DIRECTORY ${WX_BUILD_DIR}
            RESULT_VARIABLE WX_BUILD_RESULT
        )

        if(NOT WX_BUILD_RESULT EQUAL 0)
            message(FATAL_ERROR "Failed to build wxWidgets")
        endif()

        execute_process(
            COMMAND make install
            WORKING_DIRECTORY ${WX_BUILD_DIR}
            RESULT_VARIABLE WX_INSTALL_RESULT
        )

        if(NOT WX_INSTALL_RESULT EQUAL 0)
            message(FATAL_ERROR "Failed to install wxWidgets")
        endif()
    endif()

    set(WX_LIBRARIES "${WX_INSTALL_DIR}/lib/libwx_osx_cocoau-${WX_VERSION}.a")
    set(WX_INCLUDE_DIRS
        "${WX_INSTALL_DIR}/include/wx-${WX_VERSION}"
        "${WX_INSTALL_DIR}/lib/wx/include/osx_cocoa-unicode-static-${WX_VERSION}"
    )
    set(WX_DEFINITIONS "__WXMAC__" "__WXOSX__" "__WXOSX_COCOA__" "wxDEBUG_LEVEL=0")
    set(WX_SYSTEM_LIBS
        "-framework IOKit" "-framework Carbon" "-framework Cocoa"
        "-framework AudioToolbox" "-framework System" "-framework OpenGL"
        "-framework WebKit" "-framework QuartzCore"
        "${WX_INSTALL_DIR}/lib/libwx_osx_cocoau_gl-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwxpng-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwxjpeg-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwxtiff-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwxregexu-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwxexpat-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwxzlib-${WX_VERSION}.a"
        iconv pthread
    )

else()
    # Linux: Build from source
    set(WX_SOURCE_DIR "${PROJECT_SOURCE_DIR}/third_party/wxWidgets")
    set(WX_BUILD_DIR "${CMAKE_BINARY_DIR}/third_party/wxWidgets-build")
    set(WX_MAIN_LIBRARY "${WX_INSTALL_DIR}/lib/libwx_gtk3u_core-${WX_VERSION}.a")

    if(NOT EXISTS "${WX_SOURCE_DIR}/configure")
        message(FATAL_ERROR "wxWidgets submodule not initialized. Run: git submodule update --init --recursive")
    endif()

    if(NOT EXISTS "${WX_MAIN_LIBRARY}")
        message(STATUS "Building wxWidgets for Linux...")
        file(MAKE_DIRECTORY "${WX_BUILD_DIR}")

        execute_process(
            COMMAND ${WX_SOURCE_DIR}/configure
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
            WORKING_DIRECTORY ${WX_BUILD_DIR}
            RESULT_VARIABLE WX_CONFIGURE_RESULT
        )

        if(NOT WX_CONFIGURE_RESULT EQUAL 0)
            message(FATAL_ERROR "Failed to configure wxWidgets")
        endif()

        execute_process(
            COMMAND make -j8
            WORKING_DIRECTORY ${WX_BUILD_DIR}
            RESULT_VARIABLE WX_BUILD_RESULT
        )

        if(NOT WX_BUILD_RESULT EQUAL 0)
            message(FATAL_ERROR "Failed to build wxWidgets")
        endif()

        execute_process(
            COMMAND make install
            WORKING_DIRECTORY ${WX_BUILD_DIR}
            RESULT_VARIABLE WX_INSTALL_RESULT
        )

        if(NOT WX_INSTALL_RESULT EQUAL 0)
            message(FATAL_ERROR "Failed to install wxWidgets")
        endif()
    endif()

    set(WX_LIBRARIES
        "${WX_INSTALL_DIR}/lib/libwx_gtk3u_core-${WX_VERSION}.a"
        "${WX_INSTALL_DIR}/lib/libwx_baseu-${WX_VERSION}.a"
    )
    set(WX_INCLUDE_DIRS
        "${WX_INSTALL_DIR}/include/wx-${WX_VERSION}"
        "${WX_INSTALL_DIR}/lib/wx/include/gtk3-unicode-static-${WX_VERSION}"
    )
    set(WX_DEFINITIONS "__WXGTK__")
    set(WX_SYSTEM_LIBS gtk-3 X11)
endif()

# Create interface library
add_library(wxWidgets::wxWidgets INTERFACE IMPORTED GLOBAL)
set_target_properties(wxWidgets::wxWidgets PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES "${WX_INCLUDE_DIRS}"
    INTERFACE_LINK_LIBRARIES "${WX_LIBRARIES};${WX_SYSTEM_LIBS}"
    INTERFACE_COMPILE_DEFINITIONS "${WX_DEFINITIONS}"
)

# Export variables
set(wxWidgets_FOUND TRUE CACHE BOOL "wxWidgets found" FORCE)
set(wxWidgets_INCLUDE_DIRS "${WX_INCLUDE_DIRS}" CACHE STRING "wxWidgets include dirs" FORCE)
set(wxWidgets_LIBRARIES "${WX_LIBRARIES}" CACHE STRING "wxWidgets libraries" FORCE)

message(STATUS "wxWidgets configuration complete")
message(STATUS "  Install dir: ${WX_INSTALL_DIR}")
message(STATUS "  Include dirs: ${WX_INCLUDE_DIRS}")
message(STATUS "  Libraries: ${WX_LIBRARIES}")

@echo off
REM Script to properly initialize git submodules on Windows
REM On Windows: Only GLM is needed as a submodule (header-only library)
REM wxWidgets and GLEW will be downloaded as prebuilt binaries by CMake

echo Starting submodule initialization process (Windows)...

REM Remove build directories
echo Removing build directories...
if exist cmake-build-debug rmdir /s /q cmake-build-debug
if exist cmake-build-release rmdir /s /q cmake-build-release
if exist cmake-build-relwithdebinfo rmdir /s /q cmake-build-relwithdebinfo
if exist build rmdir /s /q build
if exist out rmdir /s /q out

REM Deinitialize and clean submodules first
echo Cleaning git submodules...
git submodule deinit -f --all 2>nul

REM Remove submodule entries from .git
echo Removing .git/modules...
if exist .git\modules rmdir /s /q .git\modules

REM Remove all third_party directories forcefully
echo Removing all third_party directories...
if exist third_party rmdir /s /q third_party
mkdir third_party

REM Sync submodule URLs
echo Syncing submodule URLs...
git submodule sync --recursive

REM Initialize all submodules
echo Initializing all submodules...
git submodule update --init --recursive --force

REM Verify submodules are properly initialized
echo.
echo Verifying submodules...
set SUBMODULES_OK=1

if exist "third_party\glm\glm\glm.hpp" (
    echo   [OK] GLM submodule OK
) else (
    echo   [X] GLM submodule missing
    set SUBMODULES_OK=0
)

if exist "third_party\wxWidgets\build\msw\makefile.vc" (
    echo   [OK] wxWidgets submodule OK
) else (
    echo   [X] wxWidgets submodule missing
    set SUBMODULES_OK=0
)

if exist "third_party\glew\Makefile" (
    echo   [OK] GLEW submodule OK
) else (
    echo   [X] GLEW submodule missing
    set SUBMODULES_OK=0
)

echo.
if %SUBMODULES_OK%==1 (
    echo [OK] Submodule initialization complete!
    echo.
    echo Next steps:
    echo   1. Configure: cmake -B build
    echo   2. Build:     cmake --build build --parallel
    echo.
    echo Note: wxWidgets and GLEW will be built from source by CMake during configure.
) else (
    echo [X] Submodule initialization failed!
    echo Please check the errors above and try again.
    exit /b 1
)

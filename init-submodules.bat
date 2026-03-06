@echo off
echo ========================================
echo Initializing Submodules Script
echo ========================================
echo.

REM Remove cmake-build-debug directory
echo [1/3] Removing cmake-build-debug directory...
if exist cmake-build-debug (
    rmdir /s /q cmake-build-debug
    echo   - Removed cmake-build-debug
) else (
    echo   - cmake-build-debug does not exist, skipping
)
echo.

REM Clean third_party directory contents but keep the directory
echo [2/3] Cleaning third_party directory...
if exist third_party (
    rmdir /s /q third_party
    mkdir third_party
    echo   - Cleared third_party directory
) else (
    mkdir third_party
    echo   - Created third_party directory
)
echo.

REM Initialize and update git submodules
echo [3/3] Initializing git submodules...
git submodule update --init --recursive
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Failed to initialize submodules
    pause
    exit /b 1
)
echo   - Submodules initialized successfully
echo.

echo ========================================
echo Initialization Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Reload CMake in CLion to build wxWidgets automatically
echo   2. Or manually run: build-wxwidgets.bat debug
echo.
pause

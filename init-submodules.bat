@echo off
echo ========================================
echo Initializing Submodules Script
echo ========================================
echo.

REM Sync submodule URLs (ensures .gitmodules is in sync)
echo [1/2] Syncing submodule URLs...
git submodule sync --recursive
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Failed to sync submodules
    pause
    exit /b 1
)
echo   - Submodule URLs synced
echo.

REM Initialize and update git submodules (Windows: wxWidgets and glm only, skip GLEW)
echo [2/2] Initializing git submodules...
git submodule update --init --recursive third_party/wxWidgets third_party/glm
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

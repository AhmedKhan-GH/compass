@echo off
REM Build wxWidgets with nmake for Windows
REM Usage: build-wxwidgets.bat <debug|release>

setlocal

set BUILD_TYPE=%1
if "%BUILD_TYPE%"=="" set BUILD_TYPE=debug

echo Building wxWidgets (%BUILD_TYPE%) with static linking and OpenGL support...

call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat" x64
cd third_party\wxWidgets\build\msw

REM Build with debug symbols for both debug and release variants.
REM Keep /FS and avoid /MP because wxWidgets shares /Fd PDB names per lib,
REM which can still trigger C1041 under parallel compilation.
if "%BUILD_TYPE%"=="release" (
    nmake /f makefile.vc BUILD=%BUILD_TYPE% SHARED=0 TARGET_CPU=X64 USE_OPENGL=1 DEBUG_INFO=1 CFLAGS="/FS" CXXFLAGS="/FS"
) else (
    nmake /f makefile.vc BUILD=%BUILD_TYPE% SHARED=0 TARGET_CPU=X64 USE_OPENGL=1 DEBUG_INFO=1 CFLAGS="/FS" CXXFLAGS="/FS"
)

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: wxWidgets %BUILD_TYPE% build failed
    exit /b 1
)

REM Clean up any 'nul' files created by wxWidgets build scripts
cd "%~dp0\.."
for /r %%f in (nul NUL) do @if exist "%%f" del /f /q "%%f"

echo wxWidgets %BUILD_TYPE% build complete!
exit /b 0

# Compass

A cross-platform OpenGL application built with wxWidgets, GLEW, and GLM.

## Prerequisites

- CMake 3.16 or higher
- C++20 compatible compiler
- Git

## Setup Guide

### 1. Initialize Submodules

First, initialize and update the Git submodules to fetch all dependencies (wxWidgets, GLEW, GLM):

**On Windows:**
```bash
init-submodules.bat
```

**On macOS/Linux:**
```bash
./init-submodules.sh
```

Or manually:
```bash
git submodule update --init --recursive
```

### 2. CMake Build Configuration

Configure the project with CMake:

```bash
cmake -B build -S .
```

For a specific build type (Debug/Release):
```bash
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
```

### 3. Build the Project

Build the C++ project:

```bash
cmake --build build
```

Or with specific configuration:
```bash
cmake --build build --config Release
```

## Running the Application

After building, run the executable:

**Windows:**
```bash
build\Release\compass.exe
```

**macOS/Linux:**
```bash
./build/compass
```

## Project Structure

```
compass/
├── cmake/              # CMake configuration files
├── src/               # Source files
│   ├── main.cpp       # Main application
│   └── sound_test.cpp # Sound test utility
├── third_party/       # Git submodules (wxWidgets, GLEW, GLM)
└── CMakeLists.txt     # Main CMake configuration
```

## Dependencies

This project uses the following libraries as Git submodules:

- **wxWidgets 3.2.9** - Cross-platform GUI framework
- **GLEW** - OpenGL Extension Wrangler Library (static)
- **GLM** - OpenGL Mathematics library

For detailed wxWidgets configuration information, see [WXWIDGETS.md](WXWIDGETS.md).

## Troubleshooting

### Submodule Issues
If you encounter submodule-related errors, try:
```bash
git submodule update --init --recursive --force
```

### Build Issues
Clean the build directory and reconfigure:
```bash
rm -rf build  # or rmdir /s build on Windows
cmake -B build -S .
cmake --build build
```

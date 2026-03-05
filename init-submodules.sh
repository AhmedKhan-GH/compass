#!/bin/bash

# Script to properly initialize git submodules for Compass project
# This removes build artifacts and existing submodule directories before reinitializing

echo "Starting submodule initialization process..."

# Remove build directories
echo "Removing build directories..."
rm -rf cmake-build-debug
rm -rf cmake-build-release
rm -rf cmake-build-relwithdebinfo
rm -rf build
rm -rf out

# Deinitialize and clean submodules first
echo "Cleaning git submodules..."
git submodule deinit -f --all 2>/dev/null || true

# Remove submodule entries from .git
echo "Removing .git/modules..."
rm -rf .git/modules

# Remove all third_party directories forcefully
echo "Removing all third_party directories..."
find third_party -mindepth 1 -delete 2>/dev/null || true
rm -rf third_party
mkdir -p third_party

# Sync submodule URLs
echo "Syncing submodule URLs..."
git submodule sync --recursive

# Initialize and update submodules
echo "Initializing submodules..."
git submodule update --init --recursive --force

# Generate GLEW sources (only needed on macOS/Linux, Windows uses pre-built binaries)
if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" && "$OSTYPE" != "cygwin" ]]; then
    echo "Generating GLEW sources..."
    if [ -d "third_party/glew" ]; then
        cd third_party/glew
        make extensions > /dev/null 2>&1
        if [ -f "auto/src/glew_head.c" ]; then
            echo "  ✓ GLEW sources generated successfully"
        else
            echo "  ⚠ GLEW source generation may have failed (check manually)"
        fi
        cd ../..
    else
        echo "  ✗ GLEW submodule not found"
    fi
else
    echo "Skipping GLEW source generation on Windows (using pre-built binaries)"
fi

# Verify submodules are properly initialized
echo ""
echo "Verifying submodules..."
SUBMODULES_OK=true

if [ -f "third_party/wxWidgets/CMakeLists.txt" ]; then
    echo "  ✓ wxWidgets submodule OK"
else
    echo "  ✗ wxWidgets submodule missing"
    SUBMODULES_OK=false
fi

if [ -f "third_party/glew/Makefile" ]; then
    echo "  ✓ GLEW submodule OK"
else
    echo "  ✗ GLEW submodule missing"
    SUBMODULES_OK=false
fi

if [ -f "third_party/glm/glm/glm.hpp" ]; then
    echo "  ✓ GLM submodule OK"
else
    echo "  ✗ GLM submodule missing"
    SUBMODULES_OK=false
fi

echo ""
if [ "$SUBMODULES_OK" = true ]; then
    echo "✓ Submodule initialization complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Configure: cmake -B build"
    echo "  2. Build:     cmake --build build --parallel"
else
    echo "✗ Submodule initialization failed!"
    echo "Please check the errors above and try again."
    exit 1
fi

#!/bin/bash

# Script to properly initialize git submodules for Compass project
# Idempotent operation - safe to run multiple times
#
# NOTE: wxWidgets is the only submodule. GLEW and GLM are fetched by CMake
# at configure time (GLEW release tarball, GLM 1.0.1 clone) — see
# cmake/External/glew.cmake and cmake/Dependencies.cmake.

echo "Starting submodule initialization process..."

# Sync submodule URLs (ensures .gitmodules is in sync)
echo "Syncing submodule URLs..."
git submodule sync --recursive

# Initialize and update submodules
echo "Initializing submodules..."
git submodule update --init --recursive third_party/wxWidgets

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

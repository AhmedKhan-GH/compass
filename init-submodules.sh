#!/bin/bash

# Script to properly initialize git submodules for Compass project
# Idempotent operation - safe to run multiple times

echo "Starting submodule initialization process..."

# Sync submodule URLs (ensures .gitmodules is in sync)
echo "Syncing submodule URLs..."
git submodule sync --recursive

# Initialize and update submodules
echo "Initializing submodules..."
# Initialize all submodules defined in .gitmodules
if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" && "$OSTYPE" != "cygwin" ]]; then
    # macOS/Linux: initialize all submodules including GLEW
    git submodule update --init --recursive third_party/wxWidgets third_party/glew third_party/glm
else
    # Windows: initialize only wxWidgets and glm (skip GLEW)
    git submodule update --init --recursive third_party/wxWidgets third_party/glm
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

# Only verify GLEW on non-Windows platforms
if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" && "$OSTYPE" != "cygwin" ]]; then
    if [ -f "third_party/glew/Makefile" ]; then
        echo "  ✓ GLEW submodule OK"
    else
        echo "  ✗ GLEW submodule missing"
        SUBMODULES_OK=false
    fi
else
    echo "  ⊘ GLEW submodule skipped (Windows uses pre-built binaries)"
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

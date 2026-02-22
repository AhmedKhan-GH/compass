#!/bin/bash
# Build script for GLEW on Linux

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
GLEW_DIR="$PROJECT_ROOT/../external/glew"
BUILD_DIR="$GLEW_DIR/build-linux"
INSTALL_DIR="$PROJECT_ROOT/third-party/glew-linux"

echo "Building GLEW for Linux..."

# Check if source exists
if [ ! -d "$GLEW_DIR" ]; then
    echo "Error: GLEW source not found at $GLEW_DIR"
    echo "Please clone GLEW to $PROJECT_ROOT/../external/"
    exit 1
fi

# Create install directory
mkdir -p "$INSTALL_DIR/lib"
mkdir -p "$INSTALL_DIR/include"

# Build GLEW
cd "$GLEW_DIR"
make clean || true
make -j$(nproc) GLEW_DEST="$INSTALL_DIR"

# Install
echo "Installing to $INSTALL_DIR..."
make install GLEW_DEST="$INSTALL_DIR"

echo "GLEW build completed successfully!"
echo "Install location: $INSTALL_DIR"

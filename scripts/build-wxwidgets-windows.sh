#!/bin/bash
# Build script for wxWidgets on Windows (MinGW)
# Run this in MSYS2 MinGW64 environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
WX_VERSION="3.2.9"
WX_DIR="$PROJECT_ROOT/../external/wxWidgets"
BUILD_DIR="$WX_DIR/build-win-static"
INSTALL_DIR="$PROJECT_ROOT/third-party/wx-windows-static"

echo "Building wxWidgets $WX_VERSION for Windows..."

# Check if source exists
if [ ! -d "$WX_DIR" ]; then
    echo "Error: wxWidgets source not found at $WX_DIR"
    echo "Please clone wxWidgets to $PROJECT_ROOT/../external/"
    exit 1
fi

# Create build directory
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Configure wxWidgets
echo "Configuring wxWidgets..."
../configure \
    --prefix="$INSTALL_DIR" \
    --with-opengl \
    --with-msw \
    --with-regex=builtin \
    --with-libjpeg=builtin \
    --with-libtiff=builtin \
    --with-zlib=builtin \
    --with-expat=builtin \
    --with-libpng=builtin \
    --disable-shared \
    --enable-monolithic \
    --enable-unicode \
    --disable-glcanvas-egl \
    --host=x86_64-w64-mingw32

# Build
echo "Building wxWidgets..."
make -j$(nproc)

# Install
echo "Installing to $INSTALL_DIR..."
make install

echo "wxWidgets build completed successfully!"
echo "Install location: $INSTALL_DIR"

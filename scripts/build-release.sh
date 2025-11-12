#!/bin/bash

# Script to build and create a release zip locally
# Usage: ./scripts/build-release.sh [version]
# Example: ./scripts/build-release.sh 1.0.0

set -e

VERSION=${1:-$(node -p "require('./package.json').version")}
PLUGIN_NAME="decky-spotify"
RELEASE_DIR="release"
PLUGIN_DIR="$RELEASE_DIR/$PLUGIN_NAME"
ZIP_NAME="${PLUGIN_NAME}-v${VERSION}.zip"

echo "Building release for version $VERSION..."

# Clean previous release
rm -rf $RELEASE_DIR
mkdir -p $PLUGIN_DIR

# Build the plugin
echo "Building plugin..."
pnpm run build

# Copy required files
echo "Copying files..."
cp -r dist $PLUGIN_DIR/
cp plugin.json $PLUGIN_DIR/
cp main.py $PLUGIN_DIR/
cp package.json $PLUGIN_DIR/
cp LICENSE $PLUGIN_DIR/

# Copy optional files
[ -f README.md ] && cp README.md $PLUGIN_DIR/
[ -d py_modules ] && [ "$(ls -A py_modules)" ] && cp -r py_modules $PLUGIN_DIR/
[ -d assets ] && [ "$(ls -A assets)" ] && cp -r assets $PLUGIN_DIR/
[ -d defaults ] && [ "$(ls -A defaults)" ] && cp -r defaults $PLUGIN_DIR/

# Copy backend binaries if they exist
if [ -d "backend/out" ] && [ "$(ls -A backend/out)" ]; then
  mkdir -p $PLUGIN_DIR/bin
  cp -r backend/out/* $PLUGIN_DIR/bin/
fi

# Create zip
echo "Creating zip archive..."
cd $RELEASE_DIR
zip -r $ZIP_NAME $PLUGIN_NAME/
cd ..

echo ""
echo "✅ Release created successfully!"
echo "📦 Archive: $RELEASE_DIR/$ZIP_NAME"
echo ""
echo "To create a GitHub release:"
echo "  1. git tag v$VERSION"
echo "  2. git push origin v$VERSION"


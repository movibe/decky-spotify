#!/bin/bash

# Script to create a new release with versioning and git tag
# Usage: ./scripts/create-release.sh [patch|minor|major]
# Example: ./scripts/create-release.sh patch

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 [patch|minor|major]"
  echo "Example: $0 patch"
  exit 1
fi

VERSION_TYPE=$1

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Error: Version type must be 'patch', 'minor', or 'major'"
  exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Update version in package.json
npm version $VERSION_TYPE --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "New version: $NEW_VERSION"

# Update plugin.json version if it has a version field
if [ -f "plugin.json" ]; then
  # Note: plugin.json might not have version, so we'll skip if it doesn't exist
  echo "Version updated in package.json"
fi

# Build and create release zip
echo "Building release..."
pnpm run release:build $NEW_VERSION

# Create git tag
TAG="v$NEW_VERSION"
echo ""
echo "Creating git tag: $TAG"
read -p "Do you want to create and push the tag? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git add package.json plugin.json 2>/dev/null || true
  git commit -m "chore: bump version to $NEW_VERSION" || true
  git tag -a "$TAG" -m "Release $TAG"
  echo ""
  echo "✅ Tag created: $TAG"
  echo ""
  echo "To push the tag and trigger the GitHub release:"
  echo "  git push origin $TAG"
  echo "  git push origin main  # or your default branch"
else
  echo "Tag not created. You can create it manually with:"
  echo "  git tag -a $TAG -m 'Release $TAG'"
  echo "  git push origin $TAG"
fi

echo ""
echo "✅ Release ready!"
echo "📦 Archive: release/decky-spotify-v${NEW_VERSION}.zip"


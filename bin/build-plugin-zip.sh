#!/bin/bash
# Build production-ready aether.zip for public distribution
#
# This script creates a clean, production-ready zip file of the Aether plugin
# that can be distributed publicly and used in WordPress Playground blueprints.
#
# Excluded from the zip:
# - Development files (tests/, node_modules/, .git/, etc.)
# - Build artifacts and logs
# - Configuration files not needed in production

set -e

echo "Building aether.zip for public distribution..."

# Create temporary build directory
BUILD_DIR=$(mktemp -d)
PLUGIN_DIR="$BUILD_DIR/aether"

echo "Copying plugin files to temporary build directory..."

# Copy plugin files, excluding dev/test files
rsync -av \
	--exclude='tests/' \
	--exclude='node_modules/' \
	--exclude='.git/' \
	--exclude='.github/' \
	--exclude='bin/' \
	--exclude='*.log' \
	--exclude='.phpunit.result.cache' \
	--exclude='composer.lock' \
	--exclude='package-lock.json' \
	--exclude='.DS_Store' \
	--exclude='phpcs.xml' \
	--exclude='phpstan.neon' \
	--exclude='.editorconfig' \
	--exclude='.gitignore' \
	--exclude='*.md' \
	--exclude='docs/' \
	./ "$PLUGIN_DIR/"

# Navigate to build directory
cd "$BUILD_DIR"

echo "Creating zip file..."

# Create zip
zip -r -q aether.zip aether/

# Move to original directory
mv aether.zip "$OLDPWD/"

# Cleanup
rm -rf "$BUILD_DIR"

echo "✓ aether.zip created successfully"
echo "  Location: $(pwd)/aether.zip"
echo "  Size: $(du -h aether.zip | cut -f1)"


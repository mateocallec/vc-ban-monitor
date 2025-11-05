#!/bin/bash

# ========================================
# Clean the repository
# ========================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$SCRIPT_DIR/.."
cd "$PROJECT_DIR/"

rm -rf .private
rm -rf dist
rm -rf node_modules

echo "✅ Cleaning complete!"

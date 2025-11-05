#!/bin/bash

# ========================================
# Script to format all JS, CSS, and JSON
# files in the project using Prettier
# ========================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$SCRIPT_DIR/.."
cd "$PROJECT_DIR/"

npm run format

echo "✅ Formatting complete!"

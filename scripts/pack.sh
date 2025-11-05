#!/bin/bash

# ========================================
# Interactive Chrome Extension CRX packer
# ========================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$SCRIPT_DIR/.."
cd "$PROJECT_DIR/"

npm run build

echo "✅ Build complete!"

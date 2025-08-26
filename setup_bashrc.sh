#!/bin/bash
# ============================================
# Setup script to add Well Versed env to bashrc
# ============================================

BASHRC_FILE="$HOME/.bashrc"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "This will add Well Versed environment setup to your ~/.bashrc"
echo "The environment will only load when you're in the project directory"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat >> "$BASHRC_FILE" << 'EOF'

# ============================================
# Well Versed Project Environment
# ============================================
wellversed_auto_env() {
    # Only load if we're in the well-versed-app directory
    if [[ "$PWD" == *"/well-versed-app"* ]]; then
        if [ -f "$PWD/env.sh" ]; then
            source "$PWD/env.sh" 2>/dev/null
        elif [ -f "$PWD/../env.sh" ]; then
            source "$PWD/../env.sh" 2>/dev/null
        fi
    fi
}

# Auto-load when changing directories
PROMPT_COMMAND="wellversed_auto_env; $PROMPT_COMMAND"

# Also check on new shell
wellversed_auto_env
EOF

    echo "✓ Added to ~/.bashrc"
    echo ""
    echo "To activate now, run:"
    echo "  source ~/.bashrc"
    echo ""
    echo "The environment will auto-load when you cd into the project"
else
    echo "Cancelled"
fi
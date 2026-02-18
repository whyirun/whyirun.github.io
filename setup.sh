#!/bin/bash
# Setup script for Why I Run Editor
# Run this once to initialize everything

set -e

echo ""
echo "  ✦ Why I Run — Editor Setup"
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "  ✗ Node.js not found. Install from https://nodejs.org"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "  ✗ Git not found. Install from https://git-scm.com"; exit 1; }
echo "  ✓ Node.js $(node --version)"
echo "  ✓ Git $(git --version | cut -d' ' -f3)"

# Install dependencies
echo ""
echo "  Installing dependencies..."
npm install --silent
echo "  ✓ Dependencies installed"

# Initialize git if not already
if [ ! -d ".git" ]; then
  echo ""
  echo "  Initializing git repo..."
  git init -b main
  git add .gitignore package.json server.js why_I_run_editor.html why_I_run_annotated.md
  git commit -m "Initial commit: Why I Run editor"
  echo "  ✓ Git repo initialized with initial commit"
else
  echo "  ✓ Git repo already exists"
fi

# Check for remote
echo ""
if git remote -v 2>/dev/null | grep -q origin; then
  echo "  ✓ GitHub remote already configured"
else
  echo "  ⚠ No GitHub remote configured yet."
  echo ""
  echo "  To enable auto-push to GitHub:"
  echo "  1. Create a new repo at https://github.com/new"
  echo "     Name it: why-i-run"
  echo "     Keep it private, DON'T add README/gitignore"
  echo ""
  echo "  2. Then run:"
  echo "     git remote add origin https://github.com/YOUR_USERNAME/why-i-run.git"
  echo "     git push -u origin main"
fi

echo ""
echo "  ✦ Setup complete! Start the editor with:"
echo "    npm start"
echo ""
echo "  Then open http://localhost:3456 in your browser"
echo ""

#!/bin/bash
# Why I Run — Editor launcher
# Usage: run (after adding alias to your shell profile)

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo ""
echo "  ✦ Why I Run — Editor"
echo ""

# Check if data.json exists and has changes to commit
if [ -f "data.json" ]; then
  CHANGES=$(git status --porcelain data.json 2>/dev/null)
  if [ -n "$CHANGES" ]; then
    git add data.json
    git commit -m "Auto-save: $(date '+%Y-%m-%d %H:%M')" --quiet 2>/dev/null
    echo "  ✓ Committed unsaved changes"
  fi
fi

# Try to push if there's internet
if curl -s --max-time 3 https://github.com > /dev/null 2>&1; then
  echo "  ✓ Internet connected"
  if git remote -v 2>/dev/null | grep -q origin; then
    echo "  → Pushing to GitHub..."
    if git push origin main --quiet 2>/dev/null; then
      echo "  ✓ Pushed to GitHub"
    else
      echo "  ⚠ Push failed (will retry next time)"
    fi
  else
    echo "  ⚠ No remote configured — skipping push"
  fi
else
  echo "  ⚠ No internet — skipping push"
fi

# Start server and open browser
echo ""
echo "  → Starting editor at http://localhost:3456"
echo "  → Press Ctrl+C to stop"
echo ""

# Open browser after a short delay (background)
(sleep 1 && open "http://localhost:3456" 2>/dev/null || xdg-open "http://localhost:3456" 2>/dev/null) &

# Start the server (foreground — Ctrl+C stops it)
node server.js

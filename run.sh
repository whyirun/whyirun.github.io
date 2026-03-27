#!/bin/bash
# On Running — Editor launcher
# Usage: running (after adding alias to your shell profile)

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo ""
echo "  ✦ On Running — Editor"
echo ""

# Commit any pending changes (data.json, essays.json, and anything else)
CHANGES=$(git status --porcelain 2>/dev/null)
if [ -n "$CHANGES" ]; then
  git add data.json essays.json 2>/dev/null
  git add . 2>/dev/null
  git commit -m "Auto-save: $(date '+%Y-%m-%d %H:%M')" --quiet 2>/dev/null
  echo "  ✓ Committed pending changes"
fi

# Try to push if there's internet
if curl -s --max-time 3 https://github.com > /dev/null 2>&1; then
  echo "  ✓ Internet connected"
  if git remote -v 2>/dev/null | grep -q pages; then
    echo "  → Pushing to GitHub..."
    if git push pages main --quiet 2>/dev/null; then
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
echo "  → Real-time push enabled (commits push to GitHub automatically)"
echo "  → Press Ctrl+C to stop"
echo ""

# Open browser after a short delay (background)
(sleep 1 && open "http://localhost:3456" 2>/dev/null || xdg-open "http://localhost:3456" 2>/dev/null) &

# Start the server (foreground — Ctrl+C stops it)
node server.js

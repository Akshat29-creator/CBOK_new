#!/usr/bin/env bash
echo "======================================================"
echo "          Starting LLM Next-Word Lab..."
echo "======================================================"
echo ""

if which xdg-open > /dev/null; then
  xdg-open http://localhost:3000 &
elif which open > /dev/null; then
  open http://localhost:3000 &
fi

npm run dev

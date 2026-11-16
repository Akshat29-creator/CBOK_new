#!/usr/bin/env bash
set -e

echo "======================================================"
echo "       LLM Next-Word Lab: Automated Setup"
echo "======================================================"
echo ""

echo "1. Installing Node.js packages..."
npm install

echo ""
echo "2. Checking Ollama and downloading model (qwen2.5:0.5b)..."
node scripts/setup.mjs

echo ""
echo "======================================================"
echo "Setup completed! You can now run: ./start.sh or npm run dev"
echo "======================================================"

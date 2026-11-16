@echo off
title LLM Next-Word Lab - Setup Pipeline
cls
echo ======================================================
echo        LLM Next-Word Lab: Automated Setup
echo ======================================================
echo.

echo 1. Installing Node.js packages...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install npm packages. Make sure Node.js is installed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 2. Checking Ollama and downloading model (qwen2.5:0.5b)...
node scripts/setup.mjs

echo.
echo ======================================================
echo Setup completed! You can now run: start.bat
echo ======================================================
pause

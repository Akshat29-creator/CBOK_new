@echo off
title LLM Next-Word Lab
cls
echo ======================================================
echo           Starting LLM Next-Word Lab...
echo ======================================================
echo.
echo Opening browser at http://localhost:3000 ...
start http://localhost:3000
echo.
echo Starting Next.js development server...
call npm run dev
pause

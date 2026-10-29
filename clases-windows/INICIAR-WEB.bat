@echo off
setlocal
chcp 65001 >nul
title Estudio de clases USS - web
cd /d "%~dp0"
set "PATH=%PATH%;%ProgramFiles%\nodejs;%LOCALAPPDATA%\Microsoft\WinGet\Links"

where node >nul 2>nul
if errorlevel 1 (
  echo [X] Falta Node.js. Abre primero CREAR-VIDEO.bat: instala todo lo necesario.
  pause
  exit /b 1
)
where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo [X] Falta ffmpeg. Abre primero CREAR-VIDEO.bat: instala todo lo necesario.
  pause
  exit /b 1
)
if exist "node_modules\@anthropic-ai\sdk" if exist "node_modules\playwright" goto deps_ok
echo [..] Preparando la web, solo la primera vez...
call npm install --no-audit --no-fund
call npx playwright install chromium
:deps_ok

echo.
echo  Si Windows pregunta por el Firewall, marca "Redes privadas" y pulsa "Permitir acceso"
echo  para que tu equipo pueda entrar desde sus PCs.
echo.
node web\servidor.mjs
echo.
echo [!] La web se apago.
pause

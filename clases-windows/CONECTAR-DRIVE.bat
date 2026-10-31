@echo off
setlocal
chcp 65001 >nul
title Conectar Google Drive
cd /d "%~dp0"
set "PATH=%PATH%;%ProgramFiles%\nodejs;%LOCALAPPDATA%\Microsoft\WinGet\Links"

where node >nul 2>nul
if errorlevel 1 (
  echo [X] Falta Node.js. Abre primero CREAR-VIDEO.bat: instala todo lo necesario.
  pause
  exit /b 1
)
if not exist "google-drive-cliente.json" (
  echo [X] Falta google-drive-cliente.json en esta carpeta.
  echo     Sigue LEEME-WINDOWS.txt, seccion GOOGLE DRIVE, para crearlo en Google Cloud.
  echo     Sin Google Cloud: usa Google Drive para escritorio y pon DRIVE_RUTA_LOCAL en .env.
  pause
  exit /b 1
)
node motor\drive.mjs conectar
echo.
pause

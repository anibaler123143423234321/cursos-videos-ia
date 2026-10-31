@echo off
setlocal
chcp 65001 >nul
title Estudio de clases USS - instalar todo
cd /d "%~dp0"
set "PATH=%PATH%;%ProgramFiles%\nodejs;%LOCALAPPDATA%\Microsoft\WinGet\Links"
set "REABRIR="
set "VOZ=es_MX-claude-high"
echo.
echo ==================================================
echo   INSTALAR TODO EN ESTA PC (una sola vez)
echo ==================================================
echo  Instala lo que falte: Node.js, ffmpeg, Python, el motor de video y la voz local gratis.
echo  Tarda de 10 a 30 minutos (casi todo es esperar descargas). Puedes abrirlo de nuevo sin miedo.
echo.

rem ---------- 1. Programas (winget) ----------
where node >nul 2>nul
if errorlevel 1 (
  echo [..] Instalando Node.js...
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  set "REABRIR=1"
) else echo [OK] Node.js
where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo [..] Instalando ffmpeg...
  winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
  set "REABRIR=1"
) else echo [OK] ffmpeg
set "PY="
py -3 -c "import sys" >nul 2>nul && set "PY=py -3"
if not defined PY (python -c "import sys" >nul 2>nul && set "PY=python")
if not defined PY (
  echo [..] Instalando Python ^(para la voz local^)...
  winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements
  set "REABRIR=1"
) else echo [OK] Python
if defined REABRIR (
  echo.
  echo [!] Se instalaron programas nuevos y Windows aun no los ve.
  echo     Cierra esta ventana y abre INSTALAR-TODO.bat otra vez: seguira desde aqui.
  pause
  exit /b 0
)

rem ---------- 2. Motor de video y navegador interno ----------
echo [..] Preparando el motor (npm install)...
call npm install --no-audit --no-fund || goto fallo
echo [..] Preparando el navegador interno que dibuja el video...
call npx playwright install chromium || goto fallo
echo [OK] Motor listo

rem ---------- 3. Voz local gratis (Piper) ----------
if exist "voces\%VOZ%.onnx" (
  echo [OK] Voz local gratis ^(%VOZ%^)
) else (
  echo [..] Instalando la voz local gratis ^(unos 150 MB^)...
  if not exist "voces\venv\Scripts\python.exe" %PY% -m venv voces\venv || goto fallo
  "voces\venv\Scripts\python.exe" -m pip install --disable-pip-version-check --upgrade piper-tts || goto fallo
  "voces\venv\Scripts\python.exe" -m piper.download_voices %VOZ% --data-dir voces || goto fallo
  echo [OK] Voz local gratis ^(%VOZ%^)
)

rem ---------- 4. Claves y Google Drive ----------
echo.
if not exist ".env" (
  copy /y ".env.ejemplo" ".env" >nul
  echo [!] Se creo un .env nuevo, sin claves. Copia el .env de la otra PC encima de este,
  echo     o pega las claves en la web: Ajustes.
) else echo [OK] .env ^(claves^)
if exist "google-drive-cliente.json" (
  if exist "drive-token.json" (echo [OK] Google Drive conectado) else (echo [!] Falta conectar Google Drive: doble clic en CONECTAR-DRIVE.bat)
) else (
  echo [!] Falta google-drive-cliente.json: copialo de la otra PC ^(o ver LEEME-WINDOWS.txt, PASO 8^).
)

echo.
echo ==================================================
echo   LISTO. Para encender la web: doble clic en INICIAR-WEB.bat
echo ==================================================
pause
exit /b 0

:fallo
echo.
echo [X] Algo fallo (mira el mensaje de arriba). Revisa tu internet y vuelve a abrir INSTALAR-TODO.bat.
echo     Si sigue fallando, copia lo de arriba y pegaselo a Claude Code.
pause
exit /b 1

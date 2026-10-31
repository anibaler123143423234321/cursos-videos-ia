@echo off
setlocal
chcp 65001 >nul
title Voz local gratis (Piper) - instalacion
cd /d "%~dp0"
echo.
echo  VOZ LOCAL GRATIS (Piper): habla sin internet, sin cuenta y sin limite de caracteres.
echo  Descarga unos 150 MB, solo la primera vez. Queda en la carpeta "voces".
echo.

rem Voz a instalar: la que pases al abrirlo (ej.: INSTALAR-VOZ-LOCAL.bat es_AR-daniela-high) o la de Mexico
set "VOZ=%~1"
if "%VOZ%"=="" set "VOZ=es_MX-claude-high"

set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY (
  echo [..] Falta Python. Lo instalo con winget...
  winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements
  echo.
  echo [!] Cierra esta ventana y vuelve a abrir INSTALAR-VOZ-LOCAL.bat
  pause
  exit /b 1
)

if not exist "voces\venv\Scripts\python.exe" (
  echo [..] Preparando Piper en voces\venv ...
  %PY% -m venv voces\venv || goto fallo
)
echo [..] Instalando Piper...
"voces\venv\Scripts\python.exe" -m pip install --disable-pip-version-check --upgrade piper-tts || goto fallo
echo [..] Descargando la voz %VOZ% ...
"voces\venv\Scripts\python.exe" -m piper.download_voices %VOZ% --data-dir voces || goto fallo
echo [..] Prueba de voz...
"voces\venv\Scripts\python.exe" -m piper -m "voces\%VOZ%.onnx" --data-dir voces -f voces\prueba.wav -- "Hola, soy la voz local gratuita del estudio de clases." || goto fallo
start "" "voces\prueba.wav"
echo.
echo [OK] Voz local lista: %VOZ%
echo      En la web: Voz y avatar ^> "Voz local gratis". O en .env:  VOZ=local
if not "%VOZ%"=="es_MX-claude-high" echo      Como no es la voz por defecto, agrega en .env:  PIPER_VOZ=%VOZ%
pause
exit /b 0

:fallo
echo.
echo [X] No se pudo instalar la voz local. Copia lo de arriba y pegaselo a Claude Code.
pause
exit /b 1

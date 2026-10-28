@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title Clases en video - USS
cd /d "%~dp0"
if not exist "salidas" mkdir "salidas"
set "PATH=%PATH%;%ProgramFiles%\nodejs;%LOCALAPPDATA%\Microsoft\WinGet\Links"

echo.
echo ==================================================
echo   CLASES EN VIDEO - Comprobando lo necesario
echo ==================================================
echo.

rem ---------- 1. Node.js ----------
where node >nul 2>nul
if not errorlevel 1 goto node_ok
echo [X] No tienes Node.js instalado.
choice /c SN /m "    Quieres instalarlo ahora"
if errorlevel 2 goto node_manual
winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
set "PATH=%PATH%;%ProgramFiles%\nodejs"
where node >nul 2>nul
if not errorlevel 1 goto node_ok
echo.
echo [!] Node.js se instalo pero Windows aun no lo ve.
echo     Cierra esta ventana y abre CREAR-VIDEO.bat otra vez.
pause
exit /b 1
:node_manual
echo     Descargalo de https://nodejs.org (version LTS), instalalo y vuelve a abrir este archivo.
start "" "https://nodejs.org"
pause
exit /b 1
:node_ok
echo [OK] Node.js encontrado

rem ---------- 2. ffmpeg ----------
where ffmpeg >nul 2>nul
if not errorlevel 1 goto ffmpeg_ok
echo [X] No tienes ffmpeg (sirve para unir el video).
choice /c SN /m "    Quieres instalarlo ahora"
if errorlevel 2 goto ffmpeg_manual
winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
set "PATH=%PATH%;%LOCALAPPDATA%\Microsoft\WinGet\Links"
where ffmpeg >nul 2>nul
if not errorlevel 1 goto ffmpeg_ok
echo.
echo [!] ffmpeg se instalo pero Windows aun no lo ve.
echo     Cierra esta ventana y abre CREAR-VIDEO.bat otra vez.
pause
exit /b 1
:ffmpeg_manual
echo     Sin ffmpeg no se puede crear el video. Abre CREAR-VIDEO.bat cuando quieras instalarlo.
pause
exit /b 1
:ffmpeg_ok
echo [OK] ffmpeg encontrado

rem ---------- 3. Motor (solo la primera vez) ----------
if exist "node_modules\playwright" if exist "node_modules\gsap" goto deps_ok
echo [..] Preparando el motor, solo la primera vez, puede tardar unos minutos...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo [X] npm install fallo. Revisa tu internet y vuelve a intentar.
  pause
  exit /b 1
)
:deps_ok
call npx playwright install chromium
if exist ".env" (echo [OK] .env encontrado ^(ElevenLabs^)) else (echo [i] Sin .env: se usara la voz de Windows ^(ver LEEME-WINDOWS.txt, PASO 4^))

rem ---------- 4. Menu de clases ----------
:menu
echo.
echo ==================================================
echo   CLASES DISPONIBLES (carpeta clases)
echo ==================================================
set /a n=0
for /d %%D in ("clases\*") do (
  if exist "%%D\clase.json" (
    set /a n+=1
    set "c!n!=%%~nxD"
    set "estado="
    if exist "salidas\%%~nxD.mp4" set "estado=   [video listo]"
    echo   !n!^) %%~nxD!estado!
  )
)
if %n%==0 (
  echo.
  echo   No hay clases todavia. Crea una con Claude Code ^(LEEME-WINDOWS.txt, PASO 5^).
  echo.
  pause
  exit /b 0
)
echo.
echo   S^) Salir
echo.
set "op="
set /p "op=Escribe el numero de la clase: "
if not defined op goto menu
if /i "%op%"=="S" exit /b 0
set "sel="
for /l %%i in (1,1,%n%) do if "%op%"=="%%i" set "sel=!c%%i!"
if not defined sel (
  echo [X] Opcion no valida.
  goto menu
)

echo.
echo   Que hago con "%sel%"?
echo   1^) Video final 1920x1080           ^(Enter^)
echo   2^) Borrador rapido ^(para revisar^)
echo   3^) Vista previa con sonido en el navegador
echo   4^) Solo la voz ^(para crear el avatar en HeyGen/Hedra^)
echo   5^) Guion para grabar TU voz ^(la opcion mas natural^)
set "m="
set /p "m=Opcion: "
set "extra="
if "%m%"=="2" set "extra=--rapido"
if "%m%"=="3" set "extra=--vista"
if "%m%"=="4" set "extra=--solo-voz"
if "%m%"=="5" set "extra=--guion"

node motor\crear-video.mjs "%sel%" %extra%
if errorlevel 1 (
  echo.
  echo [X] Algo fallo con "%sel%". Copia el mensaje de arriba y pegaselo a Claude Code.
  pause
  goto menu
)
if "%extra%"=="" explorer /select,"%CD%\salidas\%sel%.mp4"
if "%extra%"=="--rapido" explorer /select,"%CD%\salidas\%sel%-borrador.mp4"
if "%extra%"=="--solo-voz" explorer /select,"%CD%\clases\%sel%\salida\voz-completa.mp3"
if "%extra%"=="--guion" (
  if not exist "clases\%sel%\voz" mkdir "clases\%sel%\voz"
  start "" notepad "clases\%sel%\GUION-PARA-GRABAR.txt"
  start "" explorer "%CD%\clases\%sel%\voz"
)
pause
goto menu

@echo off
setlocal EnableDelayedExpansion
title VideosAnuncios - Crear video
cd /d "%~dp0"
if not exist "proyectos" mkdir "proyectos"
if not exist "salidas" mkdir "salidas"
set "PATH=%PATH%;%ProgramFiles%\nodejs;%LOCALAPPDATA%\Microsoft\WinGet\Links"

echo.
echo ==================================================
echo   VIDEOS ANUNCIOS - Comprobando lo necesario
echo ==================================================
echo.

rem ---------- 1. Node.js ----------
where node >nul 2>nul
if not errorlevel 1 goto node_ok
echo [X] No tienes Node.js instalado.
choice /c SN /m "    Quieres instalarlo ahora (S/N)"
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
choice /c SN /m "    Quieres instalarlo ahora (S/N)"
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

rem ---------- 3. Importar zips de Design y acomodar carpetas ----------
echo [..] Buscando anuncios nuevos en Descargas...
set "VA_RAIZ=%CD%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-Content -LiteralPath '%~f0' -Raw; $m='#'+'==PS=='; $i=$c.LastIndexOf($m); Invoke-Expression $c.Substring($i)"

rem ---------- 4. Menu de proyectos ----------
:menu
echo.
echo ==================================================
echo   PROYECTOS DISPONIBLES (carpeta proyectos)
echo ==================================================
set /a n=0
for /d %%D in ("proyectos\*") do (
  if exist "%%D\index.html" (
    set /a n+=1
    set "p!n!=%%~nxD"
    set "estado="
    if exist "salidas\%%~nxD.mp4" set "estado=   [video listo]"
    echo   !n!^) %%~nxD!estado!
  )
)
if %n%==0 (
  echo.
  echo   No hay proyectos todavia.
  echo   Descarga el zip que te dio Claude Design en tu carpeta Descargas
  echo   sin descomprimirlo, y vuelve a abrir este archivo.
  echo.
  pause
  exit /b 0
)
echo.
echo   T) Procesar todos     S) Salir
echo.
set "op="
set /p "op=Escribe el numero del video que quieres crear: "
if not defined op goto menu
if /i "%op%"=="S" exit /b 0
if /i "%op%"=="T" (
  for /l %%i in (1,1,%n%) do call :procesar "!p%%i!"
  goto fin_ronda
)
set "sel="
for /l %%i in (1,1,%n%) do if "%op%"=="%%i" set "sel=!p%%i!"
if not defined sel (
  echo [X] Opcion no valida.
  goto menu
)
call :procesar "%sel%"
:fin_ronda
echo.
pause
goto menu

rem ---------- 5. Procesar un proyecto ----------
:procesar
set "slug=%~1"
echo.
echo ==================================================
echo   Creando: %slug%
echo ==================================================
rem busca el script que crea el video, se llame como se llame
set "P=%CD%\proyectos\%slug%"
set "rfile="
for %%S in (render\all.mjs render\render.mjs render\index.mjs render\main.mjs all.mjs render.mjs scripts\render.mjs render\all.js render\render.js render.js) do (
  if not defined rfile if exist "%P%\%%S" set "rfile=%P%\%%S"
)
if not defined rfile for /f "delims=" %%F in ('dir /b /s "%P%\*.mjs" 2^>nul ^| findstr /v /i "node_modules"') do if not defined rfile set "rfile=%%F"
if not defined rfile (
  echo [X] No encuentro el script que crea el video dentro de "%slug%".
  echo     Envia el zip de este proyecto a Claude para revisarlo.
  exit /b 1
)
for %%F in ("%rfile%") do set "rdir=%%~dpF"
for %%F in ("%rfile%") do set "rname=%%~nxF"
echo [..] Script de video: %rname%
pushd "%rdir%"
if not exist "package.json" if exist "..\package.json" cd ..
if not exist "package.json" call npm init -y >nul
if not exist "node_modules\playwright" (
  echo [..] Preparando el capturador, solo la primera vez, puede tardar unos minutos...
  call npm install --no-audit --no-fund
  if not exist "node_modules\playwright" call npm install playwright --no-audit --no-fund
  call npx playwright install chromium
)
popd
rem se ejecuta desde la carpeta del proyecto, igual que el .bat original de Design
pushd "%P%"
echo [..] Generando musica, voz, subtitulos y cuadros...
node "%rfile%"
if errorlevel 1 (
  popd
  echo.
  echo [X] Algo fallo al crear "%slug%".
  echo     Haz una captura de esta ventana y enviala a Claude para corregirlo.
  exit /b 1
)
popd

rem busca el mp4 mas reciente del proyecto (o en Descargas, por si se guardo ahi)
set "mp4="
for /f "usebackq delims=" %%F in (`powershell -NoProfile -Command "$d=(New-Object -ComObject Shell.Application).Namespace('shell:Downloads').Self.Path; $l=@(Get-ChildItem -LiteralPath 'proyectos\%slug%' -Recurse -Filter *.mp4 -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch 'node_modules' }); $l+=@(Get-ChildItem -LiteralPath $d -Filter *.mp4 -ErrorAction SilentlyContinue); $l | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-90) } | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName"`) do set "mp4=%%F"
if not defined mp4 (
  echo [X] El render termino pero no encuentro el archivo .mp4 de "%slug%".
  exit /b 1
)
copy /y "%mp4%" "salidas\%slug%.mp4" >nul
echo.
echo ==================================================
echo   LISTO:  VideosAnuncios\salidas\%slug%.mp4
echo ==================================================
explorer /select,"%CD%\salidas\%slug%.mp4"
exit /b 0

rem ===== a partir de aqui: codigo interno que usa el .bat (no tocar) =====
goto :eof
#==PS==
# VideosAnuncios - importa zips de Claude Design. NO BORRA NADA: copia y conserva todo.
$ErrorActionPreference = 'Continue'
$raiz  = $env:VA_RAIZ
$proy  = Join-Path $raiz 'proyectos'
$imp   = Join-Path $raiz 'zips-importados'
$ant   = Join-Path $raiz '_anteriores'
New-Item -ItemType Directory -Force -Path $proy | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Zips de Design: carpeta del .bat, Descargas y sus subcarpetas
$carpetas = @($raiz)
try {
  $desc = (New-Object -ComObject Shell.Application).Namespace('shell:Downloads').Self.Path
  if ($desc -and (Test-Path -LiteralPath $desc)) { $carpetas += $desc }
} catch {}
$perfil = Join-Path $env:USERPROFILE 'Downloads'
if (Test-Path -LiteralPath $perfil) { $carpetas += $perfil }
$carpetas = $carpetas | Select-Object -Unique

$hechos = @{}
foreach ($c in $carpetas) {
  $zips = @(Get-ChildItem -LiteralPath $c -Filter *.zip -File -Recurse -Depth 2 -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch '\\(node_modules|zips-importados|_anteriores)\\' })
  foreach ($z in $zips) {
    if ($hechos.ContainsKey($z.FullName)) { continue }
    $hechos[$z.FullName] = 1
    $esAnuncio = $false
    try {
      $a = [System.IO.Compression.ZipFile]::OpenRead($z.FullName)
      $nombres = @($a.Entries | ForEach-Object { ($_.FullName -replace '\\', '/').ToLower() })
      $a.Dispose()
      $tieneIndex = @($nombres | Where-Object { $_ -like '*index.html' }).Count -gt 0
      $tieneRender = @($nombres | Where-Object { $_ -like '*all.mjs' -or $_ -like '*.mjs' }).Count -gt 0
      if ($tieneIndex -and ($tieneRender -or $z.Name -like 'anuncio-*')) { $esAnuncio = $true }
    } catch {}
    if (-not $esAnuncio) { continue }

    Write-Host "[..] Importando $($z.Name)"
    $slug = ($z.BaseName -replace '^anuncio-', '')
    $dest = Join-Path $proy $slug
    if (Test-Path -LiteralPath $dest) {
      $r = Read-Host "     El proyecto '$slug' ya existe. Reemplazarlo? La version anterior se guarda en _anteriores (S/N)"
      if ($r -notmatch '^[sS]') { Write-Host "[!]  Se mantuvo '$slug'."; continue }
      New-Item -ItemType Directory -Force -Path $ant | Out-Null
      Move-Item -LiteralPath $dest -Destination (Join-Path $ant ($slug + '_' + (Get-Date -Format 'yyyyMMdd-HHmmss'))) -Force
    }
    $tmp = Join-Path $raiz ('_tmp_' + $slug)
    if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force }
    try {
      [System.IO.Compression.ZipFile]::ExtractToDirectory($z.FullName, $tmp)
      # carpeta del proyecto = la que tiene index.html mas cerca de la raiz del zip
      $idx = Get-ChildItem -LiteralPath $tmp -Filter index.html -File -Recurse -ErrorAction SilentlyContinue |
             Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
             Sort-Object { $_.FullName.Length } | Select-Object -First 1
      if (-not $idx) { Write-Host "[!]  $($z.Name) no trae index.html"; continue }
      $origen = $idx.DirectoryName
      # si el zip trae una carpeta 'proyectos\nombre', se respeta ese nombre
      if ((Split-Path -Leaf (Split-Path -Parent $origen)) -eq 'proyectos') { $dest = Join-Path $proy (Split-Path -Leaf $origen) }
      New-Item -ItemType Directory -Force -Path $dest | Out-Null
      # copia TODO el contenido de la carpeta del proyecto
      Copy-Item -Path (Join-Path $origen '*') -Destination $dest -Recurse -Force
      # y si el zip tiene archivos fuera de esa carpeta, tambien se conservan junto al proyecto
      $fuera = Join-Path $dest '_zip-completo'
      if ($origen -ne $tmp) { New-Item -ItemType Directory -Force -Path $fuera | Out-Null; Copy-Item -Path (Join-Path $tmp '*') -Destination $fuera -Recurse -Force }
      # correccion automatica: e.message.split(...) falla si el error no es un Error (rompia la voz)
      $utf8 = New-Object System.Text.UTF8Encoding($false)
      Get-ChildItem -LiteralPath $dest -Filter *.mjs -File -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch '\\(node_modules|_zip-completo)\\' } | ForEach-Object {
          $c = [System.IO.File]::ReadAllText($_.FullName)
          $n = [regex]::Replace($c, '\b(e|e2|err|error)\.message\.split\(', 'String(($1 && $1.message) || $1).split(')
          if ($n -ne $c) { [System.IO.File]::WriteAllText($_.FullName, $n, $utf8); Write-Host "     [auto] Corregido manejo de errores en $($_.Name)" }
        }
      Write-Host "[OK] Proyecto agregado: $(Split-Path -Leaf $dest)"
      New-Item -ItemType Directory -Force -Path $imp | Out-Null
      Move-Item -LiteralPath $z.FullName -Destination (Join-Path $imp $z.Name) -Force
      Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
    } catch {
      Write-Host "[!]  No pude importar $($z.Name): $($_.Exception.Message)"
      Write-Host "     La carpeta temporal queda en: $tmp"
    }
  }
}

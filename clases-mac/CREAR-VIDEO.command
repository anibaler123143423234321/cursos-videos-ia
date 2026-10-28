#!/bin/bash
# Clases en video (USS) - lanzador para Mac.
# Doble clic (la primera vez: clic derecho > Abrir) o en Terminal:  bash CREAR-VIDEO.command
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
mkdir -p salidas

pausa() { read -r -p "Presiona Enter para continuar..." _; }

echo ""
echo "=================================================="
echo "  CLASES EN VIDEO - Comprobando lo necesario"
echo "=================================================="
echo ""

falta=0
if command -v node >/dev/null 2>&1; then echo "[OK] Node.js $(node -v)"; else echo "[X] Falta Node.js"; falta=1; fi
if command -v ffmpeg >/dev/null 2>&1; then echo "[OK] ffmpeg"; else echo "[X] Falta ffmpeg"; falta=1; fi
if [ "$falta" = 1 ]; then
  if command -v brew >/dev/null 2>&1; then
    read -r -p "    Instalar lo que falta con Homebrew? (S/N) " r
    if [[ "$r" =~ ^[sS] ]]; then
      brew install node ffmpeg || { echo "[X] Homebrew no pudo instalar."; pausa; exit 1; }
    else
      exit 1
    fi
  else
    echo ""
    echo "    Primero instala Homebrew (LEEME-MAC.txt, PASO 1) y vuelve a abrir este archivo."
    pausa
    exit 1
  fi
fi

if [ ! -d node_modules/playwright ] || [ ! -d node_modules/gsap ]; then
  echo "[..] Preparando el motor (solo la primera vez, unos minutos)..."
  npm install --no-audit --no-fund || { echo "[X] npm install fallo"; pausa; exit 1; }
fi
npx playwright install chromium >/dev/null 2>&1 || npx playwright install chromium

if [ -f .env ]; then echo "[OK] .env encontrado (ElevenLabs)"; else echo "[i] Sin .env: se usara la voz de macOS (ver LEEME-MAC.txt, PASO 4)"; fi

while true; do
  echo ""
  echo "=================================================="
  echo "  CLASES DISPONIBLES (carpeta clases)"
  echo "=================================================="
  clases=()
  for d in clases/*/; do
    [ -f "${d}clase.json" ] && clases+=("$(basename "$d")")
  done
  if [ ${#clases[@]} -eq 0 ]; then
    echo "  No hay clases todavia. Crea una con Claude Code (LEEME-MAC.txt, PASO 5)."
    pausa
    exit 0
  fi
  i=1
  for c in "${clases[@]}"; do
    estado=""
    [ -f "salidas/$c.mp4" ] && estado="   [video listo]"
    echo "  $i) $c$estado"
    i=$((i + 1))
  done
  echo ""
  echo "  S) Salir"
  echo ""
  read -r -p "Escribe el numero de la clase: " op
  [[ "$op" =~ ^[sS]$ ]] && exit 0
  if ! [[ "$op" =~ ^[0-9]+$ ]] || [ "$op" -lt 1 ] || [ "$op" -gt ${#clases[@]} ]; then
    echo "[X] Opcion no valida."
    continue
  fi
  slug="${clases[$((op - 1))]}"

  echo ""
  echo "  Que hago con \"$slug\"?"
  echo "  1) Video final 1920x1080           (Enter)"
  echo "  2) Borrador rapido (para revisar)"
  echo "  3) Vista previa con sonido en el navegador"
  echo "  4) Solo la voz (para crear el avatar en HeyGen/Hedra)"
  read -r -p "Opcion: " m
  case "$m" in
    2) extra="--rapido" ;;
    3) extra="--vista" ;;
    4) extra="--solo-voz" ;;
    *) extra="" ;;
  esac

  if node motor/crear-video.mjs "$slug" $extra; then
    case "$extra" in
      "") open -R "salidas/$slug.mp4" ;;
      --rapido) open -R "salidas/$slug-borrador.mp4" ;;
      --solo-voz) open -R "clases/$slug/salida/voz-completa.mp3" ;;
    esac
  else
    echo ""
    echo "[X] Algo fallo con \"$slug\". Copia el mensaje de arriba y pegaselo a Claude Code."
  fi
  pausa
done

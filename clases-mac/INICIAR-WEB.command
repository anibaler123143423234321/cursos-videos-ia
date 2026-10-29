#!/bin/bash
# Estudio de clases USS - enciende la web. Doble clic o: bash INICIAR-WEB.command
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1 || ! command -v ffmpeg >/dev/null 2>&1; then
  echo "[X] Falta Node.js o ffmpeg. Abre primero CREAR-VIDEO.command: instala todo lo necesario."
  read -r -p "Enter para salir" _
  exit 1
fi
if [ ! -d node_modules/@anthropic-ai/sdk ] || [ ! -d node_modules/playwright ]; then
  echo "[..] Preparando la web, solo la primera vez..."
  npm install --no-audit --no-fund && npx playwright install chromium
fi
node web/servidor.mjs
echo "[!] La web se apago."
read -r -p "Enter para salir" _

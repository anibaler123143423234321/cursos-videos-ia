#!/bin/bash
# Conecta Google Drive (una sola vez). Doble clic o: bash CONECTAR-DRIVE.command
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [ ! -f google-drive-cliente.json ]; then
  echo "[X] Falta google-drive-cliente.json en esta carpeta. Sigue LEEME-MAC.txt, seccion GOOGLE DRIVE."
  echo "    Sin Google Cloud: usa Google Drive para escritorio y pon DRIVE_RUTA_LOCAL en .env."
  read -r -p "Enter para salir" _
  exit 1
fi
node motor/drive.mjs conectar
read -r -p "Enter para salir" _

#!/bin/bash
# Voz local gratis (Piper): habla sin internet, sin cuenta y sin limite. Doble clic o: bash INSTALAR-VOZ-LOCAL.command
# Otra voz: bash INSTALAR-VOZ-LOCAL.command es_AR-daniela-high
cd "$(dirname "$0")" || exit 1
VOZ="${1:-es_MX-claude-high}"
echo "Voz local gratis (Piper). Descarga unos 150 MB, solo la primera vez. Queda en la carpeta voces."
fallo() { echo "[X] No se pudo instalar la voz local. Copia lo de arriba y pegaselo a Claude Code."; read -r -p "Enter para salir" _; exit 1; }
if ! command -v python3 >/dev/null 2>&1; then
  echo "[X] Falta Python 3. Instalalo con: brew install python  (o desde python.org) y vuelve a abrir este archivo."
  fallo
fi
[ -x voces/venv/bin/python ] || python3 -m venv voces/venv || fallo
voces/venv/bin/python -m pip install --disable-pip-version-check --upgrade piper-tts || fallo
voces/venv/bin/python -m piper.download_voices "$VOZ" --data-dir voces || fallo
voces/venv/bin/python -m piper -m "voces/$VOZ.onnx" --data-dir voces -f voces/prueba.wav -- "Hola, soy la voz local gratuita del estudio de clases." || fallo
afplay voces/prueba.wav 2>/dev/null
echo "[OK] Voz local lista: $VOZ. En la web: Voz y avatar > Voz local gratis. O en .env: VOZ=local"
[ "$VOZ" = "es_MX-claude-high" ] || echo "     Como no es la voz por defecto, agrega en .env: PIPER_VOZ=$VOZ"
read -r -p "Enter para salir" _

#!/bin/bash
# Instala todo en esta Mac (una sola vez): Node.js, ffmpeg, Python, el motor de video y la voz local gratis.
# Doble clic o: bash INSTALAR-TODO.command   (se puede abrir de nuevo sin miedo: solo instala lo que falta)
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
VOZ="es_MX-claude-high"
fallo() { echo; echo "[X] Algo fallo (mira el mensaje de arriba). Revisa tu internet y vuelve a abrir INSTALAR-TODO.command."; read -r -p "Enter para salir" _; exit 1; }
echo "INSTALAR TODO EN ESTA MAC (una sola vez). Tarda de 10 a 30 minutos."
if ! command -v brew >/dev/null 2>&1; then
  echo "[X] Falta Homebrew. Instalalo como dice LEEME-MAC.txt (PASO 1) y vuelve a abrir este archivo."
  fallo
fi
for p in node ffmpeg python3; do
  if command -v "$p" >/dev/null 2>&1; then echo "[OK] $p"; else
    echo "[..] Instalando $p..."
    brew install "$([ "$p" = python3 ] && echo python || echo "$p")" || fallo
  fi
done
echo "[..] Preparando el motor..."
npm install --no-audit --no-fund || fallo
npx playwright install chromium || fallo
echo "[OK] Motor listo"
if [ -f "voces/$VOZ.onnx" ]; then echo "[OK] Voz local gratis ($VOZ)"; else
  echo "[..] Instalando la voz local gratis (unos 150 MB)..."
  [ -x voces/venv/bin/python ] || python3 -m venv voces/venv || fallo
  voces/venv/bin/python -m pip install --disable-pip-version-check --upgrade piper-tts || fallo
  voces/venv/bin/python -m piper.download_voices "$VOZ" --data-dir voces || fallo
  echo "[OK] Voz local gratis ($VOZ)"
fi
echo
if [ -f .env ]; then echo "[OK] .env (claves)"; else
  cp .env.ejemplo .env
  echo "[!] Se creo un .env nuevo, sin claves: copia el .env de la otra PC encima, o pega las claves en la web (Ajustes)."
fi
if [ -f google-drive-cliente.json ]; then
  [ -f drive-token.json ] && echo "[OK] Google Drive conectado" || echo "[!] Falta conectar Google Drive: doble clic en CONECTAR-DRIVE.command"
else
  echo "[!] Falta google-drive-cliente.json: copialo de la otra PC (o ver LEEME-MAC.txt, PASO 8)."
fi
echo
echo "LISTO. Para encender la web: doble clic en INICIAR-WEB.command"
read -r -p "Enter para salir" _

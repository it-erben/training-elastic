#!/usr/bin/env bash
# Erzeugt die Beispiel-Logs in environment/data/ mit frischen Timestamps
# (letzte 48 Stunden bis jetzt). Laeuft im Node-Container -- es wird KEIN
# Node.js auf dem Host benoetigt, nur Docker.
#
# Aufruf (von ueberall):  environment/gen-logs.sh
# Danach im Tagesverzeichnis ./reset.sh, damit Filebeat alles neu einliest.
set -euo pipefail
cd "$(dirname "$0")/.."

docker run --rm -v "$(pwd):/repo" -w /repo node:22-alpine \
  node tools/generate-logs/generate.js

echo ""
echo "✔ Beispiel-Logs in environment/data/ neu generiert (letzte 48h)."

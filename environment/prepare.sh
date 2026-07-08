#!/usr/bin/env bash
# Kurs-Vorbereitung: prüft Docker, lädt alle Images, macht einen Smoke-Test
# und aktualisiert die Timestamps der Beispiel-Logs.
#
# Bitte VOR dem Kurs ausführen (Details: VORBEREITUNG.md).
set -euo pipefail
cd "$(dirname "$0")"

STACK_VERSION="$(grep '^STACK_VERSION=' day1/.env | cut -d= -f2)"
FEHLER=0

schritt() { printf '\n== %s ==\n' "$1"; }

schritt "1/5 Docker prüfen"
if ! docker version > /dev/null 2>&1; then
  echo "✗ Docker läuft nicht. Bitte Docker Desktop starten (siehe VORBEREITUNG.md)."
  exit 1
fi
if ! docker compose version > /dev/null 2>&1; then
  echo "✗ Docker Compose v2 fehlt. Bitte Docker Desktop aktualisieren."
  exit 1
fi
echo "✔ Docker und Compose v2 vorhanden"

schritt "2/5 Images laden (~5 GB, kann dauern)"
for image in \
  "docker.elastic.co/elasticsearch/elasticsearch:${STACK_VERSION}" \
  "docker.elastic.co/kibana/kibana:${STACK_VERSION}" \
  "docker.elastic.co/logstash/logstash:${STACK_VERSION}" \
  "docker.elastic.co/beats/filebeat:${STACK_VERSION}" \
  "docker.elastic.co/elastic-agent/elastic-agent:${STACK_VERSION}" \
  "minio/minio:latest" \
  "node:22-alpine"; do
  echo "-> ${image}"
  docker pull -q "${image}" || { echo "✗ Pull fehlgeschlagen: ${image}"; FEHLER=1; }
done

schritt "3/5 Beispiel-Logs mit aktuellen Timestamps generieren"
# Generator laeuft im Node-Container -- kein Host-Node noetig (nur Docker).
./gen-logs.sh

schritt "4/5 Smoke-Test: Tag-1-Umgebung starten"
(cd day1 && docker compose up -d --wait)
if curl -fs http://localhost:9200 > /dev/null; then
  echo "✔ Elasticsearch antwortet auf http://localhost:9200"
else
  echo "✗ Elasticsearch nicht erreichbar"
  FEHLER=1
fi
if curl -fs http://localhost:5601/api/status > /dev/null; then
  echo "✔ Kibana antwortet auf http://localhost:5601"
else
  echo "✗ Kibana nicht erreichbar"
  FEHLER=1
fi

schritt "5/5 Aufräumen"
(cd day1 && docker compose down)

echo ""
if [ "${FEHLER}" -eq 0 ]; then
  echo "✔✔✔ Bereit für den Kurs! ✔✔✔"
else
  echo "✗ Es gab Fehler -- bitte Ausgabe prüfen und ggf. den Trainer kontaktieren."
  exit 1
fi

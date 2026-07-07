#!/usr/bin/env bash
# Setzt die Tag-1-Umgebung komplett zurück (löscht alle indexierten Daten).
set -euo pipefail
cd "$(dirname "$0")"

docker compose down -v
docker compose up -d --wait

echo ""
echo "✔ Tag-1-Umgebung frisch gestartet."
echo "  Elasticsearch: http://localhost:9200"
echo "  Kibana:        http://localhost:5601"

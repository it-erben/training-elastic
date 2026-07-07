#!/usr/bin/env bash
# Setzt die Tag-3-Umgebung komplett zurück (löscht Daten, Zertifikate,
# Snapshots und Fleet-Zustand).
set -euo pipefail
cd "$(dirname "$0")"

docker compose --profile fleet --profile s3 down -v
docker compose up -d --wait

echo ""
echo "✔ Tag-3-Cluster frisch gestartet."
echo "  Elasticsearch: https://localhost:9200 (elastic / siehe .env)"
echo "  Kibana:        http://localhost:5601"
echo ""
echo "  Fleet nachstarten:  docker compose --profile fleet up -d"

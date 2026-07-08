#!/usr/bin/env bash
# Setzt die Packetbeat-Demo komplett zurück (löscht alle indexierten Daten).
set -euo pipefail
cd "$(dirname "$0")"

docker compose down -v
docker compose up -d --wait

echo ""
echo "✔ Packetbeat-Demo frisch gestartet."
echo "  Elasticsearch: http://localhost:9200"
echo "  Kibana:        http://localhost:5601"
echo ""
echo "  Daten fließen nach ~1 Minute. In Kibana:"
echo "  Discover -> Data-View 'packetbeat-*'  bzw."
echo "  Dashboards -> nach 'Packetbeat' suchen (HTTP / DNS / Flows)."

#!/usr/bin/env bash
# Setzt die Tag-2-Daten zurück: löscht alle indexierten Daten und die
# Filebeat-Registry, sodass alle Logs neu eingelesen werden.
#
# Bewusst KEIN kompletter Neuaufbau (down -v): Index-Templates und
# Cluster-Einstellungen bleiben erhalten -- Lab 07 legt ein Template an,
# das einen Reset überleben muss.
#
# Eigene Konfig-Änderungen (filebeat.yml, logstash/pipeline/) bleiben
# ebenfalls erhalten. Für den Konfig-Urzustand: git checkout -- filebeat/ logstash/
set -euo pipefail
cd "$(dirname "$0")"

# Filebeat stoppen, damit Registry-Volume freigegeben wird
docker compose rm -sf filebeat > /dev/null

# Indexierte Daten löschen (Kurs-Indizes + Filebeat-Data-Streams)
curl -s -X DELETE 'http://localhost:9200/weblogs,javalogs,applogs?ignore_unavailable=true' > /dev/null || true
curl -s -X DELETE 'http://localhost:9200/_data_stream/filebeat-*?expand_wildcards=all' > /dev/null || true

# Registry weg -> Filebeat liest alle Logdateien neu ein
docker volume rm -f elastic-training-day2_filebeat-registry > /dev/null

# Logstash neu starten (verwirft gepufferte In-Flight-Events)
docker compose restart logstash > /dev/null

docker compose up -d --wait

echo ""
echo "✔ Tag-2-Daten zurückgesetzt, Logs werden neu eingelesen."
echo "  Elasticsearch: http://localhost:9200"
echo "  Kibana:        http://localhost:5601"
echo "  Logstash-API:  http://localhost:9600"

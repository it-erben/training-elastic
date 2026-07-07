# Übungsumgebungen (Docker Compose)

Jeder Kurstag hat eine eigene, in sich abgeschlossene Docker-Compose-Umgebung.
Die Compose-Dateien sind bewusst lesbar gehalten - sie sind selbst Teil des
Lehrmaterials.

| Verzeichnis | Inhalt                                                           | RAM (ca.)   |
| :---------- | :--------------------------------------------------------------- | :---------- |
| `day1/`     | Elasticsearch + Kibana (Security aus)                            | 3 GB        |
| `day2/`     | + Logstash + Filebeat (Security aus)                             | 4,5 GB      |
| `day3/`     | 3-Node-Cluster + Kibana, TLS/Security an; Profile: `fleet`, `s3` | 4,5--5,5 GB |

Gemeinsame Log-Beispieldaten für Tag 2 liegen in `data/`.

## Regeln

1. **Immer nur die Umgebung EINES Tages laufen lassen.** Beim Tageswechsel im
   alten Verzeichnis `docker compose down` ausführen (Daten bleiben erhalten;
   nur `down -v` löscht sie).
2. **Vor dem Kurs `prepare.sh` ausführen** - prüft Docker, lädt alle Images
   und macht einen Smoke-Test. Details in [VORBEREITUNG.md](VORBEREITUNG.md).
3. **Kaputt? `./reset.sh` im Tagesverzeichnis.** Löscht alles und startet
   frisch, dauert unter 3 Minuten.

## Voraussetzungen

- Docker Desktop (Windows/Mac) bzw. Docker Engine + Compose v2 (Linux)
- Docker-Ressourcen: mindestens **8 GB RAM**, 4 CPUs, 30 GB Disk
- Linux nativ: `sudo sysctl -w vm.max_map_count=262144`

Alle Komponenten laufen mit Elastic-Stack-Version `9.3.0`
(gepinnt in der `.env` jedes Tagesverzeichnisses).

# Umgebung Tag 1: Elasticsearch + Kibana

Single-Node-Elasticsearch mit Kibana, Security deaktiviert - kein Login nötig.
Diese Umgebung wird für alle Übungen von Tag 1 verwendet
(Labs 01--04: Einführung, Discover, Visualisierungen, Maps).

## Starten

```bash
docker compose up -d --wait
```

Der erste Start dauert 1--2 Minuten. `--wait` blockiert, bis beide Dienste
ihre Healthchecks bestehen.

| Dienst        | URL                     |
|:--------------|:------------------------|
| Elasticsearch | `http://localhost:9200` |
| Kibana        | `http://localhost:5601` |

## Stoppen

```bash
docker compose down
```

Die indexierten Daten bleiben erhalten (Docker-Volume `esdata`).

## Reset

Wenn etwas kaputt ist oder du von vorn beginnen willst:

```bash
./reset.sh
```

Löscht **alle Daten** und startet die Umgebung frisch (< 3 Minuten).
Unter Windows ohne Git Bash/WSL stattdessen:

```powershell
docker compose down -v
docker compose up -d --wait
```

## Troubleshooting

### Elasticsearch startet nicht (Exit-Code 78 / max_map_count)

Nur unter Linux (nicht Docker Desktop):

```bash
sudo sysctl -w vm.max_map_count=262144
```

### Elasticsearch startet nicht (Exit-Code 137 / OOM)

Docker hat zu wenig Speicher. Docker Desktop → Settings → Resources →
Memory auf mindestens **8 GB** stellen.

### Port 9200 oder 5601 belegt

Anderen Dienst stoppen oder Port-Mapping in `docker-compose.yml` anpassen
(z.B. `"19200:9200"`).

### Wichtig: Nur die Umgebung EINES Tages laufen lassen

Vor dem Start dieser Umgebung sicherstellen, dass die Umgebungen anderer
Tage gestoppt sind (`docker compose down` im jeweiligen Verzeichnis),
sonst kollidieren Ports und der Arbeitsspeicher reicht nicht.

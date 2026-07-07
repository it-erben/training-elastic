# Umgebung Tag 3: 3-Node-Cluster mit Security

Verteilter Elasticsearch-Cluster (3 Nodes) mit aktivierter Security
(TLS auf HTTP- und Transport-Ebene) plus Kibana. Wird für die Labs 08--11
verwendet (Cluster/Shards, ILM, Fleet, Alerting).

**Vorher die Tag-2-Umgebung stoppen:** `cd ../day2 && docker compose down`

## Starten

```bash
docker compose up -d --wait
```

Der erste Start dauert 3--5 Minuten: der `setup`-Container erzeugt zunächst
CA und Node-Zertifikate, dann startet der Cluster.

| Dienst        | URL                        | Zugang                        |
|:--------------|:---------------------------|:------------------------------|
| Elasticsearch | `https://localhost:9200`   | `elastic` / `changeme` (.env) |
| Kibana        | `http://localhost:5601`    | `elastic` / `changeme`        |

Direkter Zugriff per curl (Zertifikat der eigenen CA - `-k` nötig oder CA angeben):

```bash
curl -k -u elastic:changeme https://localhost:9200/_cat/nodes?v
```

## Cluster-Topologie

| Node | Rollen                 | zone | temp | Port   |
|:-----|:-----------------------|:-----|:-----|:-------|
| es01 | master, data, ingest   | a    | hot  | 9200   |
| es02 | master, data           | b    | warm | intern |
| es03 | master, data           | b    | warm | intern |

Alle drei Nodes sind master-fähig (Quorum 2/3) - **jeder** Node darf für
Failover-Übungen gestoppt werden:

```bash
docker compose stop es02     # Cluster wird gelb, Replicas übernehmen
docker compose start es02    # Recovery beobachten: GET _cat/recovery
```

Die Attribute `zone` und `temp` werden in den Labs für
Shard-Allocation-Filtering und ILM mit echter Tier-Migration genutzt.

## Snapshots

Alle Nodes haben ein gemeinsames Snapshot-Verzeichnis
(`path.repo=/usr/share/elasticsearch/snapshots`, Docker-Volume `snapshots`).
Repository anlegen (Dev Tools):

```
PUT _snapshot/backup
{
  "type": "fs",
  "settings": { "location": "/usr/share/elasticsearch/snapshots" }
}
```

## Fleet (Lab 10)

Fleet Server + ein Elastic Agent als optionales Profil:

```bash
docker compose --profile fleet up -d --wait
```

Fleet ist in `kibana/kibana.yml` vorkonfiguriert (Fleet-Server-Host,
Output mit CA, zwei Agent Policies). Der Agent enrollt sich automatisch
in die Policy "Agent Policy Training" (System-Integration).
Fleet-UI: Kibana → Management → Fleet.

## MinIO als S3-Snapshot-Ziel (Trainer-Demo)

```bash
docker compose --profile s3 up -d
```

Konsole: `http://localhost:9001` (minioadmin/minioadmin), S3-API: Port 9000.

## Reset

```bash
./reset.sh
```

Löscht Daten, Zertifikate, Snapshots und Fleet-Zustand, startet den
Basis-Cluster neu (Fleet danach bei Bedarf wieder per Profil starten).

## Troubleshooting

### Cluster wird nicht grün / Node startet nicht

1. `docker compose ps` - ist der setup-Container "healthy" durchgelaufen?
2. `docker compose logs setup` - Zertifikatserzeugung fehlgeschlagen?
3. RAM prüfen: Docker Desktop braucht mind. 8 GB (3 ES-Nodes à 1 GB Limit)

### "self-signed certificate" Fehler

Erwartet - der Cluster nutzt eine eigene CA. Bei curl `-k` verwenden oder
die CA aus dem Volume exportieren:

```bash
docker compose cp es01:/usr/share/elasticsearch/config/certs/ca/ca.crt .
curl --cacert ca.crt -u elastic:changeme https://localhost:9200
```

### Fleet Server wird nicht healthy

1. Kibana muss vorher healthy sein (`docker compose ps`)
2. `docker compose logs fleet-server` - Enrollment-Fehler?
3. Internetzugang nötig (Integrations-Pakete werden vom Elastic Package
   Registry geladen)
4. Im Zweifel: `./reset.sh` und Fleet-Profil neu starten

# Umgebung Tag 2: Elasticsearch + Kibana + Logstash + Filebeat

Erweitert die Tag-1-Umgebung um Logstash und Filebeat. Wird für die
Labs 05--07 verwendet (Filebeat, Logstash-Pipelines, Grok/Geoip).

**Vorher die Tag-1-Umgebung stoppen:** `cd ../day1 && docker compose down`

## Starten

```bash
docker compose up -d --wait
```

| Dienst        | URL / Port                                           |
| :------------ | :--------------------------------------------------- |
| Elasticsearch | `http://localhost:9200`                              |
| Kibana        | `http://localhost:5601`                              |
| Logstash      | Monitoring-API `http://localhost:9600`               |
| Filebeat      | kein Port - Logs: `docker compose logs -f filebeat` |

## Beispieldaten

Filebeat und Logstash sehen das Verzeichnis [`../data`](../data) als `/data`:

| Datei               | Format                                    | Lab    |
| :------------------ | :---------------------------------------- | :----- |
| `apache-access.log` | Apache Combined Log Format                | 05, 07 |
| `java-app.log`      | Log4j-Pattern inkl. Multiline-Stacktraces | 05     |
| `app-json.log`      | NDJSON (ecs-logging-Stil)                 | 05     |

> **Hinweis:** Die Logs decken 48 Stunden bis zum Generierungszeitpunkt ab.
> Falls in Kibana nichts zu sehen ist: Zeitfilter vergrößern oder die Logs
> mit `node ../../tools/generate-logs/generate.js` neu generieren
> (danach `./reset.sh`, damit Filebeat alles neu einliest).

## Konfiguration ändern

- **Filebeat** (`filebeat/filebeat.yml`): nach Änderungen
  `docker compose restart filebeat`
- **Logstash** (`logstash/pipeline/*.conf`): lädt Änderungen automatisch
  neu (`config.reload.automatic`); Syntax-Fehler erscheinen in
  `docker compose logs -f logstash`

## Reset

```bash
./reset.sh
```

Löscht alle indexierten Daten **und die Filebeat-Registry** - alle Logs
werden danach neu eingelesen. Index-Templates, Cluster-Einstellungen und
eigene Konfig-Änderungen bleiben erhalten; für den Urzustand der Konfigs:
`git checkout -- filebeat/ logstash/`

## Troubleshooting

### Filebeat liefert keine Daten

1. `docker compose logs filebeat` - Konfig-Fehler? (YAML-Einrückung!)
2. Filebeat merkt sich gelesene Dateien (Registry). Sollen Logs neu
   eingelesen werden: `./reset.sh`
3. Zeitfilter in Kibana prüfen (Daten liegen bis zu 48h zurück)

### Logstash-Pipeline greift nicht

1. `docker compose logs -f logstash` - Syntax-Fehler beim Reload?
2. Kommt überhaupt etwas an? `stdout`-Output prüfen
3. Ist der Filebeat-Output auf `logstash:5044` umgestellt und Filebeat
   neu gestartet?

### Geoip-Filter liefert keine Daten

Der Geoip-Filter lädt die GeoLite2-Datenbank beim ersten Start herunter --
dafür ist einmalig Internetzugang nötig.

# Demo: Packetbeat

Kleine, in sich abgeschlossene Demo, die zeigt, wie **Packetbeat** den
Netzwerkverkehr live mitschneidet, in strukturierte Transaktionen zerlegt
(HTTP, DNS, Flows) und nach Elasticsearch schickt.

Bewusst **kein Host-Networking**: Packetbeat teilt sich den Netzwerk-Namespace
eines Traffic-Generator-Containers (`network_mode: "service:trafficgen"`) und
sieht dadurch dessen kompletten Verkehr. Läuft deshalb identisch auf Mac,
Windows und Linux -- kein Sonderfall pro Betriebssystem.

## Was läuft hier?

| Container      | Rolle                                                            |
|:---------------|:-----------------------------------------------------------------|
| `elasticsearch`| Speicher + Suche                                                 |
| `kibana`       | UI (Discover + fertige Packetbeat-Dashboards)                    |
| `webserver`    | interner nginx als HTTP-Ziel                                     |
| `trafficgen`   | erzeugt im 2-Sekunden-Takt HTTP- und DNS-Verkehr                 |
| `packetbeat`   | schnüffelt im Namespace von `trafficgen` mit                     |

Der Generator macht jede Runde: HTTP 200 (`/`), HTTP 404 (`/gibtsnicht`),
einen internen DNS-Lookup (`webserver`) und einen externen (`elastic.co`).
Damit sind alle drei Packetbeat-Dashboards sofort mit Daten gefüllt.

## Starten

```bash
docker compose up -d --wait
```

Erster Start 1--2 Minuten (Image-Downloads). Packetbeat lädt beim Start
automatisch seine Dashboards in Kibana.

| Dienst        | URL                     |
|:--------------|:------------------------|
| Elasticsearch | `http://localhost:9200` |
| Kibana        | `http://localhost:5601` |

## Was in Kibana ansehen

1. **Discover** -> Data-View `packetbeat-*`. Jedes Dokument ist eine
   Transaktion. Interessante Felder:
   - `type` (`http`, `dns`, `flow`)
   - HTTP: `http.response.status_code`, `url.path`, `http.request.method`,
     `event.duration`
   - DNS: `dns.question.name`, `dns.answers`, `dns.response_code`
2. **Dashboards** -> nach `Packetbeat` suchen. Direkt nutzbar:
   - `[Packetbeat] HTTP` -- Requests, Status-Codes, langsamste Antworten
   - `[Packetbeat] DNS Tunneling` / DNS-Overview -- Abfragen, Antwortzeiten
   - `[Packetbeat] Flows` -- Verbindungen und Datenvolumen

Zum Vorführen die Zeitspanne oben rechts auf **Last 15 minutes** stellen und
Auto-Refresh (z.B. 10s) aktivieren -- die Daten laufen dann live rein.

## Eigenen Verkehr erzeugen

Der Generator läuft dauerhaft. Für einen manuellen Request zusätzlich:

```bash
docker compose exec trafficgen wget -q -O- http://webserver/
docker compose exec trafficgen nslookup github.com
```

Das taucht Sekunden später als neue Transaktion in Discover auf.

## Stoppen

```bash
docker compose down
```

Indexierte Daten bleiben erhalten (Volume `esdata`).

## Reset

```bash
./reset.sh
```

Löscht **alle Daten** und startet frisch. Windows ohne Git Bash/WSL:

```powershell
docker compose down -v
docker compose up -d --wait
```

## Troubleshooting

### Keine Daten in Discover

```bash
docker compose logs -f packetbeat
```

`Publish event` / gemeldete Metriken = es fließt. Der erste Batch braucht
bis zu einer Minute. Prüfen, dass `trafficgen` läuft:
`docker compose logs trafficgen`.

### Packetbeat startet nicht / keine Berechtigung zum Mitschneiden

Der Container braucht `NET_RAW` und `NET_ADMIN` (im Compose gesetzt) und
läuft als `root`. Unter Docker Desktop mit sehr restriktiven Policies kann
das eingeschränkt sein -- dann in der Compose-Datei prüfen, dass `cap_add`
erhalten ist.

### Dashboards fehlen in Kibana

Nachträglich laden:

```bash
docker compose exec packetbeat packetbeat setup --dashboards
```

### Elasticsearch startet nicht (max_map_count / OOM)

Siehe `../day1/README.md` -- gleiche Ursachen (Linux: `vm.max_map_count`,
Docker-Speicher auf mind. 8 GB).

### Nur diese Umgebung laufen lassen

Vorher die Tages-Umgebungen stoppen (`docker compose down` im jeweiligen
Verzeichnis) -- sonst kollidieren Ports 9200/5601 und der RAM reicht nicht.

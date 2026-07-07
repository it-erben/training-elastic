# Elastic Stack - Komplett (GFU s2004)

Materialien für die 3-tägige Schulung **„Elastic Stack - Komplett: Einstieg
in Elasticsearch, Kibana, Logstash, Beats"**. Zielgruppe sind Entwickler,
Administratoren und Architekten mit Grundkenntnissen in Webtechnologien.

Der rote Faden ist die fiktive **Mustertech GmbH** (Online-Elektronikshop):

| Tag | Motto                   | Inhalte                                         |
| :-- | :---------------------- | :---------------------------------------------- |
| 1   | **Daten analysieren**   | Elasticsearch-Grundlagen, REST-API, Kibana, ML  |
| 2   | **Logs einsammeln**     | Filebeat, Logstash, Grok, Geoip                 |
| 3   | **Plattform betreiben** | Cluster, ILM, Backup, Security, Alerting, Fleet |

## Voraussetzungen

- **Docker Desktop** (bzw. Docker Engine + Compose v2 unter Linux) mit
  mindestens **8 GB RAM** für Docker
- Browser (Chrome oder Firefox, aktuelle Version)
- Vor dem Kurs: [`environment/VORBEREITUNG.md`](environment/VORBEREITUNG.md)
  durchführen (Images vorladen!)

Jeder Teilnehmer betreibt die Übungsumgebungen lokal per Docker Compose --
es gibt keine zentrale Trainer-Instanz. Details: [`environment/README.md`](environment/README.md)

## Repo-Struktur

```
slides/          Foliensätze (Marp-Markdown), Module 01-13
labs/            Hands-on-Übungen, Labs 01-11 (+ Bonus-Labs)
environment/     Docker-Compose-Umgebungen pro Kurstag + Beispieldaten
workshop-demo/   Demo-Skripte für den Mapping-Workshop (Modul 08 / Lab 08)
tools/           Slide-Rendering, Log-Generator, Infra-Fallback
```

## Tagesplan

### Tag 1: Grundlagen & Kibana

| Modul | Slides                           | Lab                                  | Dauer   |
| :---- | :------------------------------- | :----------------------------------- | :------ |
| --    | Begrüßung, Umgebungs-Check       | --                                   | 20 Min. |
| 01    | `01-einfuehrung`                 | `lab-01-einfuehrung`                 | 70 + 25 |
| 02    | `02-discover-abfragen`           | `lab-02-discover-abfragen`           | 35 + 20 |
| 03    | `03-visualisierungen-dashboards` | `lab-03-visualisierungen-dashboards` | 50 + 30 |
| 04    | `04-machine-learning`            | -- (Trainer-Demo)                    | 25 Min. |

Puffer/Bonus für Schnelle: `lab-03b-fortgeschrittene-dashboards`, `lab-04-maps`

### Tag 2: Beats & Logstash

| Modul | Slides                      | Lab                         | Dauer   |
| :---- | :-------------------------- | :-------------------------- | :------ |
| --    | Recap Tag 1                 | --                          | 10 Min. |
| 05    | `05-beats-filebeat`         | `lab-05-filebeat`           | 55 + 40 |
| 06    | `06-logstash-grundlagen`    | `lab-06-logstash-pipelines` | 40 + 30 |
| 07    | `07-logstash-filter-praxis` | `lab-07-grok-geoip`         | 45 + 45 |

### Tag 3: Cluster, Betrieb & Fleet

| Modul | Slides                               | Lab                       | Dauer   |
| :---- | :----------------------------------- | :------------------------ | :------ |
| --    | Recap Tag 2                          | --                        | 10 Min. |
| 08    | `08-cluster-architektur-optimierung` | `lab-08-cluster-shards`   | 50 + 30 |
| 09    | `09-index-lifecycle-management`      | `lab-09-ilm`              | 30 + 25 |
| 10    | `10-betrieb-backup-updates`          | -- (Snapshot-Demo)        | 30 Min. |
| 11    | `11-security-lizenzen`               | -- (Security-Demo)        | 30 Min. |
| 12    | `12-alerting-monitoring-siem`        | `lab-11-alerting` (Bonus) | 35 + 15 |
| 13    | `13-fleet-elastic-agent`             | `lab-10-fleet`            | 25 + 25 |

## Labs

Die Labs bauen innerhalb eines Tages aufeinander auf - bitte in der
angegebenen Reihenfolge bearbeiten. Musterlösungen liegen jeweils unter
`labs/lab-NN-*/files/loesung/`.

| Lab | Verzeichnis                                | Thema                                    | Umgebung |
| :-- | :----------------------------------------- | :--------------------------------------- | :------- |
| 01  | `labs/lab-01-einfuehrung`                  | Kibana, Data Views, erste REST-Aufrufe   | day1     |
| 02  | `labs/lab-02-discover-abfragen`            | Discover, KQL, Filter                    | day1     |
| 03  | `labs/lab-03-visualisierungen-dashboards`  | Lens, Dashboards                         | day1     |
| 03b | `labs/lab-03b-fortgeschrittene-dashboards` | Bonus: Formeln, Time Shifts              | day1     |
| 04  | `labs/lab-04-maps`                         | Bonus: Kibana Maps                       | day1     |
| 05  | `labs/lab-05-filebeat`                     | Filebeat: Inputs, JSON, Multiline        | day2     |
| 06  | `labs/lab-06-logstash-pipelines`           | Logstash: Pipeline, mutate/date, Routing | day2     |
| 07  | `labs/lab-07-grok-geoip`                   | Grok, Geoip, Web-Traffic-Dashboard       | day2     |
| 08  | `labs/lab-08-cluster-shards`               | Cluster, Failover, Mapping-Optimierung   | day3     |
| 09  | `labs/lab-09-ilm`                          | ILM: Rollover, Phasen, Data Streams      | day3     |
| 10  | `labs/lab-10-fleet`                        | Fleet Server & Elastic Agent             | day3     |
| 11  | `labs/lab-11-alerting`                     | Bonus: Alerting-Rule mit Auslösung       | day3     |

## Umgebung starten

Pro Kurstag eine Umgebung - **immer nur eine gleichzeitig**:

```bash
cd environment/day1   # bzw. day2, day3
docker compose up -d --wait
```

Kibana: `http://localhost:5601` - an Tag 1/2 ohne Login, an Tag 3 mit
`elastic`/`changeme`. Kaputt? `./reset.sh` im Tagesverzeichnis (< 3 Min.).
Details und Troubleshooting: README im jeweiligen Tagesverzeichnis.

## Slides rendern

```bash
./tools/render-slides.sh   # erzeugt PDFs unter pdf/ (braucht npx/marp-cli)
```

## Hilfe bei Problemen

- Umgebungs-/Docker-Probleme: `environment/dayN/README.md` (Troubleshooting-Abschnitt)
- Kibana zeigt keine Daten: Zeitfilter prüfen (Übungsdaten decken die
  letzten 48 Stunden ab - ggf. „Last 3 days" wählen) und aktive Filter
  kontrollieren
- Beispieldaten fehlen an Tag 1: Kibana Home → **Try sample data** →
  **Sample eCommerce orders** → Add data

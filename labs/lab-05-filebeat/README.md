# Lab 05: Filebeat

## Übungsziel

Am Ende dieser Übung hast du:

- Die Tag-2-Umgebung mit Filebeat, Logstash, Elasticsearch und Kibana
  gestartet
- Eine Filebeat-Konfiguration gelesen und verstanden
- Apache-Logs in Discover gefunden und das Problem unstrukturierter Logs
  erlebt
- JSON-Logs mit dem ndjson-Parser eingelesen und nach strukturierten
  Feldern gefiltert
- Java-Stacktraces mit dem multiline-Parser zu einem Event pro Fehler
  zusammengefasst
- Alle Inputs mit einem `logtype`-Feld für Lab 06 gekennzeichnet

**Dauer:** ca. 40 Minuten

---

## Teil 0: Tag-2-Umgebung starten

Ab jetzt arbeiten wir mit der Umgebung `environment/day2`. Sie enthält
zusätzlich zu Elasticsearch und Kibana auch **Logstash** und **Filebeat**.

### Schritt 0.1: Tag-1-Umgebung stoppen

Falls die Umgebung von Tag 1 noch läuft:

```bash
cd environment/day1
docker compose down
cd ../..
```

### Schritt 0.2: Tag-2-Umgebung starten

```bash
cd environment/day2
docker compose up -d --wait
```

**Erwartetes Ergebnis:** Alle vier Container starten und werden als
`Healthy` bzw. `Started` gemeldet. Das kann beim ersten Mal einige
Minuten dauern (Image-Downloads).

Prüfe anschließend:

- Elasticsearch antwortet: `curl http://localhost:9200`
- Kibana ist erreichbar: <http://localhost:5601>

> **Tipp:** Alle Details zur Umgebung (Ports, Reset, Troubleshooting)
> findest du in [`environment/day2/README.md`](../../environment/day2/README.md).

---

## Teil 1: Ausgangszustand verstehen

Filebeat läuft bereits und liest die Apache-Logs ein. Bevor wir etwas
ändern, schauen wir uns an, **was** da läuft.

### Schritt 1.1: Die Filebeat-Konfiguration lesen

Öffne die Datei `environment/day2/filebeat/filebeat.yml` in deinem Editor.

**Aufgabe:** Beantworte anhand der Datei folgende Fragen:

1. Welcher Input-Typ wird verwendet?
2. Welche Datei wird eingelesen?
3. Wohin schickt Filebeat die Events?

Der Kern der Konfiguration:

```yaml
filebeat.inputs:
  - type: filestream
    id: apache-access
    paths:
      - /data/apache-access.log

output.elasticsearch:
  hosts: ["http://elasticsearch:9200"]
```

> **Tipp:** Der Pfad `/data/apache-access.log` gilt **im Container**.
> Auf deinem Rechner liegt die Datei unter
> `environment/data/apache-access.log`. Wirf ruhig einen Blick hinein.

### Schritt 1.2: Filebeat-Logs prüfen

**Aufgabe:** Sieh dir die Logs des Filebeat-Containers an:

> Dafür musst du im Verzeichnis `environment/day2` sein

```bash
docker compose logs filebeat | tail -20
```

**Erwartetes Ergebnis:** Keine Fehlermeldungen. Du siehst eine Zeile
wie `Input 'filestream' starting` und regelmäßige
`Non-zero metrics`-Meldungen.

### Schritt 1.3: Data View anlegen

Filebeat schreibt standardmäßig in den Data Stream `filebeat-9.3.0`.
Damit Discover die Daten anzeigt, brauchst du einen Data View:

1. Öffne Kibana: <http://localhost:5601>
2. Navigiere zu **Stack Management > Data Views**
   (Hauptmenü ganz unten unter *Management*)
3. Klicke auf **Create data view**
4. Trage ein:
    - **Name:** `filebeat-*`
    - **Index pattern:** `filebeat-*`
    - **Timestamp field:** `@timestamp`
5. Klicke auf **Save data view to Kibana**

**Erwartetes Ergebnis:** Rechts im Dialog wird angezeigt, dass das
Pattern mindestens eine Quelle matcht (`filebeat-9.3.0`).

### Schritt 1.4: Apache-Logs in Discover ansehen

1. Navigiere zu **Analytics > Discover**
2. Wähle oben links den Data View `filebeat-*`
3. Stelle den Zeitfilter oben rechts auf **Last 3 days**

> **Tipp:** Die Beispiel-Logs decken die letzten 48 Stunden ab. Mit dem
> Standard-Zeitfilter ("Last 15 minutes") siehst du mit der Zeit fast nichts mehr.
> **Last 3 days** ist für alle Übungen an Tag 2 die richtige Wahl.

**Erwartetes Ergebnis:** Rund **10.000 Treffer**: die Apache-Access-Logs
des Mustertech-Shops.

**Aufgabe:** Klappe ein Dokument auf (Pfeil links neben der Zeile) und
sieh dir die Felder an:

- `message` enthält die **komplette rohe Log-Zeile**
- `log.file.path` zeigt die Quelldatei
- `@timestamp` ist der **Einlese-Zeitpunkt**, nicht die Zeit aus dem Log

### Schritt 1.5: Das Problem erleben

**Aufgabe:** Versuche, alle Requests mit HTTP-Status 404 zu finden.

Probiere in der Suchleiste:

```
message: "404"
```

Das liefert mehr Treffer als es echte 404-Antworten gibt: Die Suche
findet auch Zeilen, in denen die **Antwortgröße** zufällig 404 Bytes
beträgt. Ein Feld wie `http.response.status_code`, mit dem du sauber
filtern, zählen oder visualisieren könntest, gibt es **nicht**.

> Genau dieses Problem lösen wir in den Labs 06 und 07 mit Logstash und
> Grok. Heute kümmern wir uns erst um die Logs, die schon Struktur
> mitbringen.

---

## Teil 2: JSON-Logs einlesen

Die Mustertech-Microservices loggen NDJSON (ein JSON-Objekt pro Zeile)
nach `/data/app-json.log`. Diese Logs lesen wir jetzt mit dem
**ndjson-Parser** ein.

### Schritt 2.1: Rohdaten ansehen

**Aufgabe:** Wirf einen Blick in die Datei:

```bash
head -2 environment/data/app-json.log
```

Du siehst JSON-Objekte mit Feldern wie `service.name`, `log.level`,
`http.response.status_code` und `trace.id`. Die Struktur ist schon da,
Filebeat muss sie nur auspacken.

### Schritt 2.2: Input mit ndjson-Parser ergänzen

**Aufgabe:** Öffne `environment/day2/filebeat/filebeat.yml` und füge unter
dem Kommentar `# Teil 2 (Lab 05)` folgenden Input hinzu:

```yaml
  - type: filestream
    id: app-json
    paths:
      - /data/app-json.log
    parsers:
      - ndjson:
          target: ""
          overwrite_keys: true
          add_error_key: true
```

Die drei Parser-Optionen bedeuten:

| Option                 | Wirkung                                               |
| :--------------------- | :---------------------------------------------------- |
| `target: ""`           | JSON-Felder landen auf der obersten Ebene             |
| `overwrite_keys: true` | `@timestamp` & Co. aus dem Log überschreiben Filebeat |
| `add_error_key: true`  | kaputte JSON-Zeilen bekommen ein `error.*`-Feld       |

> **Tipp:** YAML ist einrückungssensitiv! Der neue Block beginnt mit
> `- type:` auf **derselben Einrückungsebene** wie der bestehende
> Apache-Input (zwei Leerzeichen).

### Schritt 2.3: Filebeat neu starten

```bash
cd environment/day2
docker compose restart filebeat
docker compose logs -f filebeat
cd ../..
```

**Erwartetes Ergebnis:** Filebeat startet ohne Fehler und meldet einen
neuen Harvester für `/data/app-json.log`. Beende die Log-Ansicht mit
`Ctrl+C`.

> **Tipp:** Steht im Log etwas wie `error loading config file` oder
> `yaml: line ...`, stimmt die Einrückung nicht. Korrigieren und erneut
> `docker compose restart filebeat`.

### Schritt 2.4: Strukturierte Felder in Discover

1. Wechsle zurück zu **Discover** (Data View `filebeat-*`,
   Zeitfilter **Last 3 days**)
2. Lade die Seite neu, damit Kibana die neuen Felder kennt

**Erwartetes Ergebnis:** Rund **5.000 zusätzliche Events**. In der
Feldliste links tauchen neue Felder auf: `service.name`, `log.level`,
`http.response.status_code`, `url.path`, `trace.id`, ...

**Aufgabe:** Probiere die neuen Möglichkeiten aus:

1. Alle Events des Checkout-Service:

    ```
    service.name: "checkout-service"
    ```

2. Alle Server-Fehler:

    ```
    http.response.status_code >= 500
    ```

3. Alle Fehler-Logs eines bestimmten Service:

    ```
    service.name: "payment-service" AND log.level: "error"
    ```

**Aufgabe:** Füge die Spalten `service.name`, `log.level`, `url.path` und
`message` hinzu (Plus-Symbol in der Feldliste). Vergleiche ein
JSON-Event mit einem Apache-Event: Der Unterschied zwischen
strukturiert und unstrukturiert ist jetzt direkt sichtbar.

**Aufgabe:** Klappe ein JSON-Event auf und prüfe `@timestamp`: Dank
`overwrite_keys: true` steht hier der **echte Log-Zeitpunkt** aus der
Anwendung, nicht der Einlese-Zeitpunkt.

---

## Teil 3: Java-Logs mit Multiline

Das Java-Backend loggt nach `/data/java-app.log`, inklusive
Stacktraces über mehrere Zeilen. Wir machen absichtlich zuerst den
klassischen Fehler und lesen die Datei **ohne** Multiline-Konfiguration
ein.

### Schritt 3.1: Input OHNE Multiline ergänzen

**Aufgabe:** Füge in `environment/day2/filebeat/filebeat.yml` unter dem
Kommentar `# Teil 3 (Lab 05)` diesen Input hinzu, **bewusst noch ohne
Parser**:

```yaml
  - type: filestream
    id: java-app
    paths:
      - /data/java-app.log
```

Dann Filebeat neu starten:

> Bitte wieder daran denken, dies im Verzeichnis `environment/day2` auszuführen

```bash
docker compose restart filebeat
```

### Schritt 3.2: Das Problem live sehen

1. Wechsle zu **Discover** (Zeitfilter **Last 3 days**)
2. Suche nach Stacktrace-Zeilen:

    ```
    message: "Caused by"
    ```

**Erwartetes Ergebnis:** Du findest Events, deren `message` **nur aus
einer einzigen Stacktrace-Zeile** besteht, z. B.
`Caused by: java.net.http.HttpTimeoutException: request timed out`.

**Aufgabe:** Suche auch nach:

```
message: "OrderService.java"
```

Das trifft nur `at ...`-Stacktrace-Zeilen. Jede davon ist ein
**eigenes Event** - ohne Zeitstempel-Bezug,
ohne Log-Level, ohne Zusammenhang zum eigentlichen Fehler. Die Datei hat
2.415 Zeilen, aber nur 2.000 echte Log-Nachrichten: Der Rest sind
Stacktrace-Zeilen, die zu ihrer Fehlermeldung gehören.

> Genau so sieht das Multiline-Problem in der Praxis aus: Fehlerzählungen
> stimmen nicht mehr, und der Stacktrace ist über viele Dokumente
> zerrissen.

### Schritt 3.3: Multiline-Parser ergänzen

Jede echte Log-Zeile beginnt mit einem Datum (`2026-06-30 12:01:23,189 ...`).
Alles, was **nicht** mit einem Datum beginnt, gehört zur vorherigen
Zeile. Genau das drücken wir mit dem Multiline-Parser aus.

**Aufgabe:** Erweitere den `java-app`-Input um den Parser:

```yaml
  - type: filestream
    id: java-app
    paths:
      - /data/java-app.log
    parsers:
      - multiline:
          type: pattern
          pattern: '^\d{4}-\d{2}-\d{2} '
          negate: true
          match: after
```

| Option                           | Gelesen als                        |
| :------------------------------- | :--------------------------------- |
| `pattern: '^\d{4}-\d{2}-\d{2} '` | "Zeile beginnt mit einem Datum"    |
| `negate: true`                   | "Alles, was NICHT so beginnt, ..." |
| `match: after`                   | "... gehört zur vorherigen Zeile"  |

### Schritt 3.4: Reset und neu einlesen

Ein einfacher Restart reicht diesmal **nicht**: Filebeat hat sich in der
Registry gemerkt, dass `java-app.log` bereits vollständig gelesen wurde,
und würde die Datei nicht neu einlesen. Außerdem wollen wir die
kaputten Einzelzeilen-Events wieder loswerden.

**Aufgabe:** Führe den Reset aus:

```bash
cd environment/day2
./reset.sh
```

Das Skript löscht die indexierten Daten **und** die Filebeat-Registry
(Templates und Cluster-Einstellungen bleiben erhalten). Filebeat liest
danach alle drei Log-Dateien mit der aktuellen Konfiguration neu ein.
Warte etwa 30 Sekunden.

**Erwartetes Ergebnis:** In Discover (Zeitfilter **Last 3 days**) siehst
du insgesamt rund **17.000 Events** (10.000 Apache + 5.000 JSON +
2.000 Java).

### Schritt 3.5: Erfolg prüfen

**Aufgabe:** Suche erneut nach:

```
message: "Caused by"
```

**Erwartetes Ergebnis:** Nur noch 23 Treffer - ein Event pro Fehler,
in dem alle 37 "Caused by"-Zeilen der Datei stecken. Jedes Event enthält jetzt die
**komplette Fehlermeldung inklusive Stacktrace** in einem einzigen
`message`-Feld. Klappe ein Event auf und prüfe: Die erste Zeile ist die
`ERROR`-Meldung, darunter folgen `at ...`- und `Caused by:`-Zeilen.

**Aufgabe:** Suche nach `message: "OrderService.java"`. Auch diese
Treffer sind jetzt vollständige Fehler-Events statt einzelner
Stacktrace-Zeilen.

---

## Teil 4: Inputs für Lab 06 kennzeichnen

Im nächsten Lab schalten wir Logstash zwischen Filebeat und Elasticsearch. Damit
Logstash weiß, welches Event aus welcher Quelle stammt, geben wir jedem
Input ein eigenes Feld `logtype` mit. **Dieser Schritt ist Voraussetzung für
Lab 06** — ohne `logtype` landet das Output-Routing dort im Leeren.

### Schritt 4.1: fields und fields_under_root ergänzen

**Aufgabe:** Ergänze bei **allen drei Inputs** einen `fields`-Block mit
jeweils passendem Wert:

```yaml
  - type: filestream
    id: apache-access
    paths:
      - /data/apache-access.log
    fields:
      logtype: apache
    fields_under_root: true
```

Analog:

- `app-json` bekommt `logtype: app`
- `java-app` bekommt `logtype: java`

`fields_under_root: true` sorgt dafür, dass das Feld als `logtype`
(statt `fields.logtype`) im Event landet.

### Schritt 4.2: Reset und prüfen

Damit **alle** Events das neue Feld bekommen, brauchst du wieder einen
kompletten Neueinlese-Lauf:

```bash
./reset.sh
```

**Aufgabe:** Prüfe in Discover (Seite neu laden, Zeitfilter
**Last 3 days**):

```
logtype: java
```

**Erwartetes Ergebnis:** Rund 2.000 Treffer: nur die Java-Events.
Klicke in der Feldliste auf `logtype`: Die Werteverteilung zeigt
`apache`, `app` und `java`.

### Schritt 4.3: Mit der Musterlösung vergleichen

**Aufgabe:** Vergleiche deine `filebeat.yml` mit der Musterlösung in
[`files/loesung/filebeat.yml`](files/loesung/filebeat.yml). Sie ist
der erwartete Endzustand dieses Labs und der Startpunkt für Lab 06.

> **Tipp:** In [`files/filebeat-snippets.yml`](files/filebeat-snippets.yml)
> findest du alle Snippets aus diesem Lab noch einmal als Lückentext zum
> Nachschlagen.

---

## Zusammenfassung

Du hast erfolgreich:

- [x] Die Tag-2-Umgebung gestartet und die Filebeat-Konfiguration verstanden
- [x] Apache-Logs in Discover gefunden - und erlebt, warum unstrukturierte
  Logs unpraktisch sind
- [x] JSON-Logs mit dem ndjson-Parser in strukturierte, filterbare Felder
  verwandelt
- [x] Java-Stacktraces mit dem multiline-Parser zu einem Event pro Fehler
  zusammengefasst
- [x] Die Filebeat-Registry und `./reset.sh` in Aktion gesehen
- [x] Alle Inputs mit `logtype` gekennzeichnet

**Nächstes Lab:** Logstash-Pipelines. Wir stellen den Filebeat-Output
auf Logstash um und bauen unsere erste Verarbeitungs-Pipeline!

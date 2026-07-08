# Lab 06: Logstash-Pipelines

## Übungsziel

Am Ende dieser Übung hast du:

- Den Filebeat-Output von Elasticsearch auf Logstash umgestellt
- Events in der Logstash-Konsole (`stdout`/`rubydebug`) beobachtet und die
  Event-Struktur verstanden
- Die Java-Logs von Mustertech mit `grok` und `date` in strukturierte
  Events verwandelt
- Fehler-Events per Conditional mit einem Tag markiert
- Java-Logs in den Elasticsearch-Index `javalogs` geroutet und in Kibana
  analysiert

**Dauer:** ca. 30 Minuten

**Voraussetzungen:** Die Tag-2-Umgebung läuft (`environment/day2`) und
Lab 05 ist abgeschlossen (Filebeat liest die drei Logdateien mit
`logtype`-Markern). Falls du Lab 05 nicht beendet hast, kopiere die
Musterlösung:

```bash
cp labs/lab-05-filebeat/files/loesung/filebeat.yml environment/day2/filebeat/filebeat.yml
```

Alle Dateipfade in diesem Lab beziehen sich auf das Repository-Wurzelverzeichnis.

---

## Teil 1: Filebeat-Output auf Logstash umstellen

Bisher hat Filebeat direkt nach Elasticsearch geschrieben. Jetzt schalten
wir Logstash dazwischen:

```
Filebeat  -->  Logstash (Port 5044)  -->  stdout / Elasticsearch
```

### Schritt 1.1: Die Start-Pipeline ansehen

Öffne `environment/day2/logstash/pipeline/main.conf`. Die mitgelieferte
Pipeline nimmt Events per beats-Input an und gibt sie unverändert auf der
Konsole aus:

```ruby
input {
  beats {
    port => 5044
  }
}

filter {
  # Lab 06: mutate, date, Conditionals
  # Lab 07: grok, geoip
}

output {
  stdout {
    codec => rubydebug
  }
}
```

**Aufgabe:** Prüfe mit der Monitoring-API, dass Logstash läuft:

```bash
curl "http://localhost:9600/?pretty"
```

**Erwartetes Ergebnis:** Eine JSON-Antwort mit `"status" : "green"` und
der Logstash-Version.

### Schritt 1.2: filebeat.yml umstellen

Öffne `environment/day2/filebeat/filebeat.yml` und ersetze den bisherigen
Output

```yaml
output.elasticsearch:
  hosts: ["http://elasticsearch:9200"]
```

durch den Logstash-Output:

> Achte darauf, dass sich nicht nur der Hostname ändert, sondern auch der Output-Typ

```yaml
output.logstash:
  hosts: ["logstash:5044"]
```

Die drei `filebeat.inputs` aus Lab 05 bleiben unverändert.

> **Hinweis:** Filebeat kann immer nur **einen** Output haben. Es darf
> also kein `output.elasticsearch:` mehr in der Datei stehen.

### Schritt 1.3: Filebeat neu starten

Starte Filebeat neu und beobachte die Logstash-Konsole:

```bash
cd environment/day2
docker compose restart filebeat
docker compose logs -f logstash
```

**Erwartetes Ergebnis:** Es kommen **keine** Events an. Warum? Filebeat
merkt sich in seiner **Registry**, welche Dateien es bereits gelesen hat.
Die alten Events werden nach der Umstellung nicht noch einmal gesendet.

### Schritt 1.4: Umgebung zurücksetzen

Beende die Log-Ansicht mit `Strg+C` und setze die Umgebung zurück. Das
Skript löscht alle indexierten Daten und die Filebeat-Registry; deine
Konfig-Änderungen bleiben erhalten:

```bash
# innerhalb von environment/day2
./reset.sh
docker compose logs -f logstash
```

> **Hinweis zur Wartezeit:** `reset.sh` löscht die Daten, startet Filebeat
> neu und liest alle drei Logdateien komplett neu ein. Bis die ersten
> Events durch die Pipeline laufen, vergehen etwa 30-60 Sekunden - da ist
> nichts hängen geblieben. Den Reset brauchst du im Lab noch öfter (nach
> jeder Filter-Änderung), die Wartezeit gehört also dazu.

**Erwartetes Ergebnis:** Nach kurzer Zeit rauschen Events im
`rubydebug`-Format durch die Konsole:

```ruby
{
       "message" => "2026-06-30 12:01:23,189 INFO [main] com.mustertech.shop.order.OrderService - ...",
    "@timestamp" => 2026-07-02T09:15:42.318Z,
       "logtype" => "java",
           "log" => { "file" => { "path" => "/data/java-app.log" } },
         "agent" => { "type" => "filebeat", ... },
    ...
}
```

**Aufgabe:** Sieh dir einige Events genauer an und beantworte:

1. In welchem Feld steht die rohe Logzeile?
2. Welche drei Werte kann das Feld `logtype` annehmen?
3. Entspricht `@timestamp` der Zeit aus der Logzeile oder dem
   Einlese-Zeitpunkt?

> **Tipp:** Lass das Fenster mit `docker compose logs -f logstash` für den
> Rest des Labs offen - dort siehst du deine Events und auch Syntax-Fehler
> beim automatischen Config-Reload. Ein einzelnes Event findest du leichter
> mit grep, z. B. ein Java-Event samt Feldern:
>
> ```bash
> docker compose logs logstash | grep -A 25 '"logtype" => "java"' | head -30
> ```

---

## Teil 2: Java-Logs parsen (grok + date)

Die Java-Logs stecken komplett im Feld `message`: Loglevel, Thread und
Logger sind nicht einzeln abfragbar. Das ändern wir jetzt.

> **Tipp:** Wer lieber mit Lückentext arbeitet: In
> `labs/lab-06-logstash-pipelines/files/main-skeleton.conf` liegt ein
> Gerüst der fertigen Pipeline zum Ausfüllen.

Eine Logzeile sieht so aus:

```
2026-06-30 12:01:23,189 INFO [main] com.mustertech.shop.order.OrderService - Produktkatalog-Cache aktualisiert: 12841 Artikel in 3421 ms
```

### Schritt 2.1: grok-Filter einbauen

Öffne `environment/day2/logstash/pipeline/main.conf` und ersetze den
leeren `filter`-Block durch:

```ruby
filter {
  if [logtype] == "java" {
    # Erste Zeile des Events parsen; (?m) lässt GREEDYDATA über
    # Zeilenumbrüche laufen (Stacktrace bleibt in msg erhalten).
    grok {
      match => {
        "message" => "(?m)%{TIMESTAMP_ISO8601:log_ts} %{LOGLEVEL:level} \[%{DATA:thread}\] %{JAVACLASS:logger} - %{GREEDYDATA:msg}"
      }
    }
  }
}
```

Das Grok-Muster bekommst du hier fertig vorgegeben. Wie du solche
Muster selbst schreibst, lernst du in Modul 07. Wichtig ist heute nur:
Es zerlegt die Logzeile in die Felder `log_ts`, `level`, `thread`,
`logger` und `msg`.

Speichere die Datei und beobachte die Logstash-Konsole: Dank
`config.reload.automatic` lädt Logstash die Pipeline von selbst neu.

**Erwartetes Ergebnis:** Im Logstash-Log erscheint eine Zeile wie
`Pipeline started {"pipeline.id"=>"main"}`, ohne Fehlermeldung.

> **Wichtig:** Prüfe, ob dein Reload wirklich gegriffen hat. Bei einem
> Tippfehler (fehlende Klammer, `=>` vergessen) lädt Logstash die neue Pipeline
> nicht: Es meldet einen Konfigurationsfehler und lässt die alte Pipeline
> weiterlaufen. Tückisch daran: Die Events sehen unverändert aus, obwohl
> deine Änderung nie aktiv wurde. So prüfst du das:
>
> ```bash
> docker compose logs logstash | grep -E "Pipeline started|Failed to execute|Reason"
> ```
>
> Steht ganz unten ein frisches `Pipeline started`, ist alles gut. Erscheint
> stattdessen `Failed to execute action` mit einem `Reason:`, korrigiere den
> Tippfehler und speichere erneut.

### Schritt 2.2: Daten neu einspielen und prüfen

Die Filter greifen nur für Events, die **neu** durch die Pipeline
laufen. Spiele die Logs deshalb erneut ein:

```bash
# in environment/day2
./reset.sh
docker compose logs -f logstash
```

**Erwartetes Ergebnis:** Java-Events haben jetzt zusätzliche Felder:

```ruby
{
    "logtype" => "java",
     "log_ts" => "2026-06-30 12:01:23,189",
      "level" => "INFO",
     "thread" => "main",
     "logger" => "com.mustertech.shop.order.OrderService",
        "msg" => "Produktkatalog-Cache aktualisiert: 12841 Artikel in 3421 ms",
    ...
}
```

**Aufgabe:** Suche in der Ausgabe ein Event mit `"level" => "ERROR"` und
einem mehrzeiligen Stacktrace im Feld `msg`. Filebeat hat die
Stacktrace-Zeilen dank der Multiline-Konfiguration aus Lab 05 schon zu
einem Event zusammengefasst.

> **Tipp:** Bei tausenden durchlaufenden Events ein einzelnes ERROR-Event
> zu erwischen ist mühsam. Filtere gezielt - das zeigt die ERROR-Events mit
> den umliegenden Feldern (inklusive `msg` mit Stacktrace):
>
> ```bash
> docker compose logs logstash | grep -B 10 -A 30 '"level" => "ERROR"'
> ```
>
> Apache- und JSON-Events laufen übrigens unverändert durch, denn der
> Filter greift wegen `if [logtype] == "java"` nur für Java-Logs.

### Schritt 2.3: date-Filter ergänzen

`@timestamp` zeigt noch den Einlese-Zeitpunkt. Für die Analyse in Kibana
brauchen wir aber die Zeit **aus der Logzeile**. Die liegt seit dem
grok-Filter im Feld `log_ts`.

Ergänze **innerhalb** des `if [logtype] == "java"`-Blocks, direkt unter
dem grok-Filter:

```ruby
    # Timestamp aus der Logzeile übernehmen (statt Einlese-Zeitpunkt)
    date {
      match => ["log_ts", "yyyy-MM-dd HH:mm:ss,SSS"]
      timezone => "UTC"
    }
```

Speichern, Reload abwarten, Daten neu einspielen:

```bash
./reset.sh
docker compose logs -f logstash
```

Bei Java-Events entspricht `@timestamp` jetzt
dem Wert aus `log_ts` (die Logs decken die rund 48 Stunden vor dem
Erzeugen der Beispieldaten ab):

```ruby
     "log_ts" => "2026-06-30 12:01:23,189",
 "@timestamp" => 2026-06-30T12:01:23.189Z,
```

> **Tipp:** Falls stattdessen der Tag `_grokparsefailure` oder
> `_dateparsefailure` in `tags` auftaucht, vergleiche deine
> `main.conf` mit `labs/lab-06-logstash-pipelines/files/loesung/main.conf`.

---

## Teil 3: Conditionals und Output-Routing

Zum Abschluss markieren wir Fehler-Events und schreiben die Java-Logs
nach Elasticsearch. Alle anderen Logtypen bleiben vorerst auf der
Konsole.

### Schritt 3.1: ERROR-Events taggen

Ergänze im `if [logtype] == "java"`-Block unter dem date-Filter:

```ruby
    # Fehler-Events taggen
    if [level] == "ERROR" {
      mutate {
        add_tag => ["fehler"]
      }
    }

    # Hilfsfeld entfernen
    mutate {
      remove_field => ["log_ts"]
    }
```

Das Feld `log_ts` hat seinen Zweck erfüllt (der Wert steckt jetzt in
`@timestamp`) und wird entfernt, bevor es unnötig im Index landet.

### Schritt 3.2: Output-Routing einbauen

Ersetze den kompletten `output`-Block durch:

```ruby
output {
  if [logtype] == "java" {
    elasticsearch {
      hosts => ["http://elasticsearch:9200"]
      index => "javalogs"
    }
  } else {
    stdout {
      codec => rubydebug
    }
  }
}
```

Deine `main.conf` entspricht jetzt der Musterlösung in
`labs/lab-06-logstash-pipelines/files/loesung/main.conf`.

### Schritt 3.3: Neu einspielen und in Elasticsearch prüfen

```bash
./reset.sh
```

Warte einen Moment und prüfe dann, ob der Index gefüllt wird:

```bash
curl "http://localhost:9200/javalogs/_count?pretty"
```

**Erwartetes Ergebnis:** Rund 2000 Dokumente im Index `javalogs`.
In `docker compose logs -f logstash` erscheinen nur noch Apache- und
JSON-Events; die Java-Logs gehen an Elasticsearch.

Ein Blick auf ein Beispiel-Dokument:

```bash
curl "http://localhost:9200/javalogs/_search?size=1&pretty"
```

**Aufgabe:** Prüfe im Ergebnis: Sind `level`, `thread`, `logger` und
`msg` als eigene Felder vorhanden? Ist `log_ts` wirklich verschwunden?

### Schritt 3.4: In Kibana analysieren

1. Öffne Kibana: `http://localhost:5601`
2. Navigiere zu **Stack Management > Data Views** und klicke auf
   **Create data view**
    - Name: `javalogs`
    - Index pattern: `javalogs`
    - Timestamp field: `@timestamp`
3. Wechsle zu **Analytics > Discover** und wähle den Data View
   `javalogs`
4. Stelle den Zeitfilter auf **Last 7 days**. Die Java-Logs umfassen nur
   rund 48 Stunden, aber die 7 Tage geben Puffer, falls die Umgebung schon
   ein paar Tage läuft

**Erwartetes Ergebnis:** Das Histogramm zeigt die Java-Events verteilt
über zwei Tage, nicht als einen einzigen Balken zum Einlese-Zeitpunkt.
Genau das leistet der date-Filter.

### Schritt 3.5: Fehler-Events finden

Gib in die Suchleiste folgende KQL-Abfrage ein:

```
tags: "fehler"
```

**Erwartetes Ergebnis:** Nur noch ERROR-Events (rund 90 Treffer).

**Aufgabe:**

1. Füge die Spalten `level`, `logger` und `msg` hinzu
2. Öffne die Detailansicht eines Events, dessen `msg` einen
   Stacktrace enthält (z. B. mit `msg: *Exception*` suchen)
3. Klicke in der Feldliste auf `logger`: Welche Klasse von Mustertech
   produziert die meisten Fehler?

> **Tipp:** Die Kombination aus Multiline (Filebeat), grok mit `(?m)`
> und dem Tag `fehler` macht aus einem rohen Stacktrace ein sauber
> filterbares Fehler-Event - die Basis für Alerting am dritten Kurstag.

---

## Zusammenfassung

Du hast erfolgreich:

- [x] Filebeat auf den Logstash-Output umgestellt
- [x] Events im `rubydebug`-Format gelesen und die Event-Struktur
      verstanden
- [x] Java-Logs mit `grok` in Felder zerlegt und mit `date` den echten
      Zeitstempel gesetzt
- [x] ERROR-Events per Conditional getaggt
- [x] Java-Logs in den Index `javalogs` geroutet und in Kibana
      analysiert

Die Musterlösung findest du unter
`labs/lab-06-logstash-pipelines/files/loesung/`.

**Nächstes Lab:** Grok & Geoip. Wir parsen die Apache-Logs selbst und
reichern sie mit Geodaten an.

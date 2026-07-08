# Lab 07: Grok & Geoip

## Übungsziel

Am Ende dieser Übung hast du:

- Eine Apache-Logzeile im Kibana Grok Debugger schrittweise zerlegt
- Die Apache-Logs mit `%{HTTPD_COMBINEDLOG}` und dem date-Filter geparst
- Ein eigenes Grok-Pattern für die Java-Logs nachgebaut und verstanden
- Die Client-IPs per Geoip-Filter um Standortdaten angereichert
- Ein Index-Template mit `geo_point`-Mapping angelegt
- Ein Web-Traffic-Dashboard mit Top-URLs, Status-Codes und Weltkarte gebaut
- Die Fehlerrate als Lens-Formel berechnet und Bot- von Browser-Traffic
  getrennt
- Latenz-Perzentile aus den strukturierten App-Logs visualisiert

**Dauer:** ca. 45 Minuten (ohne Bonus-Aufgaben)

### Voraussetzung

Die Tag-2-Umgebung (`environment/day2`) läuft und du hast **Lab 06**
abgeschlossen: Die Java-Logs landen geparst im Index `javalogs`,
Apache- und App-Logs gehen noch an `stdout`.

Falls du Lab 06 nicht abgeschlossen hast: Kopiere
`../lab-06-logstash-pipelines/files/loesung/main.conf` nach
`environment/day2/logstash/pipeline/main.conf` und führe
`./reset.sh` aus.

> **Tipp:** Logstash lädt Änderungen an `logstash/pipeline/*.conf`
> automatisch neu. Beobachte während des gesamten Labs die Logs in
> einem eigenen Terminal: `docker compose logs -f logstash`.
> Syntax-Fehler siehst du dort sofort.

---

## Teil 1: Apache-Logs mit Grok parsen

Die Zugriffslogs des Mustertech-Webshops liegen im Apache Combined
Log Format vor. Bevor wir die Pipeline anfassen, entwickeln wir das
Pattern im Grok Debugger.

### Schritt 1.1: Grok Debugger öffnen

1. Öffne Kibana: `http://localhost:5601`
2. Navigiere zu **Management > Dev Tools**
3. Wechsle oben auf den Tab **Grok Debugger**

Du siehst zwei Eingabefelder: **Sample Data** (eine Logzeile) und
**Grok Pattern** (dein Pattern). Der Button **Simulate** führt das
Pattern aus.

### Schritt 1.2: Eine Beispielzeile schrittweise zerlegen

Füge diese Zeile aus `apache-access.log` in **Sample Data** ein
(eine Zeile, ohne Umbrüche):

```text
91.12.34.93 - - [30/Jun/2026:12:00:05 +0000] "GET /static/js/app.js HTTP/1.1" 200 47332 "https://www.mustertech-shop.de/" "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
```

Beginne mit einem minimalen Pattern in **Grok Pattern**:

```text
%{IP:client} %{GREEDYDATA:rest}
```

Klicke auf **Simulate**.

**Erwartetes Ergebnis:** Unter **Structured Data** erscheint ein
JSON-Dokument mit `client: "91.12.34.93"`. Der gesamte Rest der
Zeile steht in `rest`.

**Aufgabe:** Erweitere das Pattern Baustein für Baustein. Nach jedem
Schritt: **Simulate** klicken und prüfen, was noch in `rest` steht.

```text
%{IP:client} %{USER:ident} %{USER:auth} %{GREEDYDATA:rest}
```

```text
%{IP:client} %{USER:ident} %{USER:auth} \[%{HTTPDATE:zeit}\] %{GREEDYDATA:rest}
```

```text
%{IP:client} %{USER:ident} %{USER:auth} \[%{HTTPDATE:zeit}\] "%{WORD:methode} %{URIPATHPARAM:pfad} HTTP/%{NUMBER:httpversion}" %{NUMBER:status} %{NUMBER:bytes} %{GREEDYDATA:rest}
```

**Erwartetes Ergebnis:** Du siehst jetzt einzelne Felder für IP,
Zeitstempel, Methode, Pfad, Status-Code und Bytes. In `rest` stehen
nur noch Referrer und User-Agent.

> **Tipp:** Die eckigen Klammern um den Zeitstempel sind
> Regex-Sonderzeichen und müssen mit `\[` und `\]` escaped werden.
> Matcht ein Schritt nicht mehr ("Provided Grok patterns do not
> match data"), liegt der Fehler im zuletzt hinzugefügten Baustein.

### Schritt 1.3: Das fertige Pattern HTTPD_COMBINEDLOG

Das Combined Log Format ist so verbreitet, dass Logstash ein
fertiges Pattern mitbringt. Ersetze dein Pattern durch:

```text
%{HTTPD_COMBINEDLOG}
```

Klicke auf **Simulate**.

**Erwartetes Ergebnis:** Die komplette Zeile wird zerlegt,
inklusive Referrer und User-Agent, ohne dass du ein Feld selbst
benennen musstest.

> **Tipp:** Der Grok Debugger zeigt die **Legacy-Feldnamen**
> (`clientip`, `verb`, `response`, ...). Logstash 9 läuft mit
> ECS-Kompatibilität und erzeugt stattdessen ECS-Felder wie
> `source.address`, `http.request.method` und
> `http.response.status_code`. Das Pattern ist dasselbe, nur die
> Feldnamen im Ergebnis unterscheiden sich.

### Schritt 1.4: Grok und date in die Pipeline einbauen

Öffne `environment/day2/logstash/pipeline/main.conf` und ergänze im
`filter`-Block **vor** dem `java`-Zweig einen Zweig für die
Apache-Logs:

```ruby
if [logtype] == "apache" {
  grok {
    match => { "message" => "%{HTTPD_COMBINEDLOG}" }
  }

  date {
    match => ["timestamp", "dd/MMM/yyyy:HH:mm:ss Z"]
    remove_field => ["timestamp"]
  }
}
```

Der grok-Filter legt den Apache-Zeitstempel im Hilfsfeld `timestamp`
ab. Der date-Filter übernimmt ihn nach `@timestamp` und entfernt das
Hilfsfeld anschließend.

Speichere die Datei. Logstash lädt die Pipeline automatisch neu.

### Schritt 1.5: Felder im Log-Output prüfen

Die Apache-Events laufen noch über den `stdout`-Output aus Lab 06,
perfekt zum Prüfen:

```bash
docker compose logs -f logstash
```

**Erwartetes Ergebnis:** Die Apache-Events erscheinen als
`rubydebug`-Ausgabe mit strukturierten ECS-Feldern, z. B.:

```text
"source" => { "address" => "91.12.34.93" },
"url" => { "original" => "/static/js/app.js" },
"http" => {
  "request" => { "method" => "GET" },
  "response" => { "status_code" => 200, "body" => { "bytes" => 47332 } }
},
"user_agent" => { "original" => "Mozilla/5.0 (iPhone; ..." },
"@timestamp" => 2026-06-30T12:00:05.000Z
```

**Aufgabe:** Prüfe drei Dinge im Output:

1. Existiert `http.response.status_code` als Zahl?
2. Entspricht `@timestamp` dem Zeitstempel **aus der Logzeile**
   (nicht der aktuellen Uhrzeit)?
3. Taucht in `tags` **kein** `_grokparsefailure` auf?

> **Tipp:** Kein Output sichtbar? Filebeat hat die Datei vermutlich
> schon vollständig gelesen. Ein `./reset.sh` im Verzeichnis
> `environment/day2` liest alle Logs neu ein.

---

## Teil 2: Eigenes Pattern für Java

Die Pipeline parst die Java-Logs seit Lab 06 mit einem
selbstgebauten Pattern. Jetzt baust du es im Grok Debugger einmal
selbst nach, damit du es künftig auch für eigene Formate kannst.

### Schritt 2.1: Java-Logzeile in den Debugger laden

Füge in **Sample Data** diese Zeile aus `java-app.log` ein:

```text
2026-06-30 12:01:23,189 INFO [main] com.mustertech.shop.order.OrderService - Produktkatalog-Cache aktualisiert: 12841 Artikel in 3421 ms
```

### Schritt 2.2: Pattern selbst zusammensetzen

**Aufgabe:** Baue das Pattern schrittweise auf, ohne in die Lösung
zu schauen. Diese Bausteine brauchst du:

| Baustein                      | Soll matchen                             |
|:------------------------------|:-----------------------------------------|
| `%{TIMESTAMP_ISO8601:log_ts}` | `2026-06-30 12:01:23,189`                |
| `%{LOGLEVEL:level}`           | `INFO`                                   |
| `\[%{DATA:data}\]`            | `[main]` (Klammern escapen!)             |
| `%{JAVACLASS:class}`          | `com.mustertech.shop.order.OrderService` |
| `%{GREEDYDATA:message}`       | die eigentliche Log-Nachricht            |

Beachte: Zwischen Klassenname und Nachricht steht ein
`" - "` (Leerzeichen, Bindestrich, Leerzeichen).

**Erwartetes Ergebnis:** Dein Pattern sieht so aus und liefert
fünf Felder:

```text
%{TIMESTAMP_ISO8601:log_ts} %{LOGLEVEL:level} \[%{DATA:thread}\] %{JAVACLASS:logger} - %{GREEDYDATA:msg}
```

```json
{
  "log_ts": "2026-06-30 12:01:23,189",
  "level": "INFO",
  "thread": "main",
  "logger": "com.mustertech.shop.order.OrderService",
  "msg": "Produktkatalog-Cache aktualisiert: 12841 Artikel in 3421 ms"
}
```

---

## Teil 3: Geoip-Anreicherung und Routing nach Elasticsearch

Jetzt reichern wir die Client-IPs mit Standortdaten an und schreiben
alle drei Logtypen in eigene Indizes. Damit die Koordinaten später
auf einer Karte funktionieren, braucht der Index **vorher** das
richtige Mapping.

### Schritt 3.1: Index-Template anlegen (WICHTIG: zuerst!)

Ohne Vorbereitung mappt Elasticsearch `source.geo.location` dynamisch
als zwei Zahlenfelder; Kibana Maps braucht aber den Typ `geo_point`.
Mappings lassen sich nachträglich nicht ändern, deshalb legen wir das
Template an, **bevor** der Index `weblogs` entsteht.

Öffne **Management > Dev Tools** (Tab **Console**) und führe aus:

```text
PUT _index_template/weblogs
{
  "index_patterns": ["weblogs*"],
  "template": {
    "mappings": {
      "properties": {
        "source": {
          "properties": {
            "address": { "type": "keyword" },
            "geo": {
              "properties": {
                "location": { "type": "geo_point" },
                "country_iso_code": { "type": "keyword" },
                "city_name": { "type": "keyword" }
              }
            }
          }
        },
        "url": {
          "properties": {
            "original": { "type": "keyword" }
          }
        },
        "http": {
          "properties": {
            "response": {
              "properties": {
                "status_code": { "type": "integer" }
              }
            }
          }
        }
      }
    }
  }
}
```

(Das Template findest du auch in `files/loesung/index-template.txt`.)

**Erwartetes Ergebnis:** `{ "acknowledged": true }`

> **Tipp:** Falls der Index `weblogs` doch schon existiert (z. B. weil
> du vorgearbeitet hast): `DELETE weblogs` in den Dev Tools ausführen
> und später neu befüllen; das Template greift nur für neu
> erstellte Indizes.

### Schritt 3.2: geoip- und useragent-Filter ergänzen

Erweitere in `main.conf` den `apache`-Zweig um zwei Filter
(**nach** grok und date):

```ruby
if [logtype] == "apache" {
  grok {
    match => { "message" => "%{HTTPD_COMBINEDLOG}" }
  }

  date {
    match => ["timestamp", "dd/MMM/yyyy:HH:mm:ss Z"]
    remove_field => ["timestamp"]
  }

  geoip {
    source => "[source][address]"
    target => "[source]"
  }

  useragent {
    source => "[user_agent][original]"
    target => "[user_agent]"
  }
}
```

- **geoip** schlägt die IP aus `source.address` in der
  GeoLite2-Datenbank nach und schreibt die Ergebnisse ECS-konform
  unter `source.geo.*`
- **useragent** zerlegt den User-Agent-String in Browser,
  Betriebssystem und Gerät (`user_agent.name`, `user_agent.os.name`, ...)

> **Tipp:** Beim ersten Einsatz lädt Logstash die GeoLite2-Datenbank
> automatisch herunter; dafür ist einmalig Internetzugang nötig.
> Den Download siehst du in den Logstash-Logs.

### Schritt 3.3: Output-Routing auf drei Indizes umstellen

Ersetze den kompletten `output`-Block in `main.conf`:

```ruby
output {
  if [logtype] == "apache" {
    elasticsearch {
      hosts => ["http://elasticsearch:9200"]
      index => "weblogs"
    }
  } else if [logtype] == "java" {
    elasticsearch {
      hosts => ["http://elasticsearch:9200"]
      index => "javalogs"
    }
  } else {
    elasticsearch {
      hosts => ["http://elasticsearch:9200"]
      index => "applogs"
    }
  }
}
```

Damit landen alle drei Logtypen strukturiert in Elasticsearch.
Der `stdout`-Output hat ausgedient.

Der Endzustand der Pipeline steht zum Vergleich in
`files/loesung/main.conf`.

### Schritt 3.4: Neu einlesen und prüfen

Führe im Verzeichnis `environment/day2` aus:

```bash
./reset.sh
```

Das löscht die bisherigen Indizes und die Filebeat-Registry; alle
Logs laufen frisch durch die neue Pipeline. Warte etwa
eine Minute und prüfe dann in den Dev Tools:

```text
GET _cat/indices/weblogs,javalogs,applogs?v
```

**Erwartetes Ergebnis:** Alle drei Indizes existieren; `weblogs` hat
rund 10.000 Dokumente (`docs.count`).

Prüfe jetzt die Geoip-Anreicherung:

```text
GET weblogs/_search
{
  "size": 1,
  "_source": ["source", "url", "http", "user_agent.name", "user_agent.os"]
}
```

**Erwartetes Ergebnis:** Das Dokument enthält unter `source.geo`
Felder wie `country_iso_code`, `city_name` und `location` mit
`lat`/`lon`, und `user_agent.name` zeigt einen echten
Browsernamen statt des rohen Strings.

Zum Schluss das Mapping kontrollieren:

```text
GET weblogs/_mapping/field/source.geo.location
```

**Erwartetes Ergebnis:** `"type": "geo_point"` - das Template hat
gegriffen.

> **Tipp:** Steht dort stattdessen ein Objekt mit `lat`/`lon` als
> `float`, wurde der Index vor dem Template angelegt. Lösung:
> `DELETE weblogs` und `./reset.sh`.

---

## Teil 4: Auswertung in Kibana

Die Weblogs sind strukturiert und angereichert. Zeit, sie der
Geschäftsführung von Mustertech zu zeigen.

### Schritt 4.1: Data View anlegen

1. Navigiere zu **Management > Stack Management > Data Views**
2. Klicke auf **Create data view**
3. Name: `weblogs`, Index pattern: `weblogs`
4. Timestamp field: `@timestamp`
5. Klicke auf **Save data view to Kibana**

Wirf anschließend in **Analytics > Discover** einen kurzen Blick auf
die Daten (Data View `weblogs`, Zeitfilter **Last 7 days**; die
Logs decken die letzten 48 Stunden ab).

**Aufgabe:** Filtere in Discover mit KQL auf deutsche Besucher:
`source.geo.country_iso_code: "DE"`. Wie hoch ist grob der Anteil
an allen Requests?

### Schritt 4.2: Dashboard "Web-Traffic" mit Top-URLs

1. Navigiere zu **Analytics > Dashboard > Create dashboard**
2. Klicke auf **Create visualization** (Lens)
3. Data View: `weblogs`
4. Konfiguriere ein **Bar**-Diagramm:
    - Vertical axis: **Top values** von `url.original` (Top 10)
    - Horizontal axis: **Count of records (# Records)**
5. Speichere das Panel als `Top-URLs`

### Schritt 4.3: Status-Codes über Zeit

1. Füge eine weitere Lens-Visualisierung hinzu
2. Konfiguriere ein **Bar stacked**-Diagramm:
    - Horizontal axis: `@timestamp`
    - Vertical axis: **Count of records (# Records)**
    - Breakdown: **Top values** von `http.response.status_code`
3. Speichere das Panel als `Status-Codes über Zeit`

**Erwartetes Ergebnis:** Überwiegend 200er, dazu ein konstantes
Grundrauschen aus 301/404 und irgendwo ein auffälliger Block
aus 5xx-Antworten.

### Schritt 4.4: Karte mit Client-Standorten

1. Klicke im Dashboard auf **Add panel > Maps**
2. Klicke auf **Add layer** und wähle **Clusters**
3. Data View: `weblogs`; Kibana erkennt `source.geo.location`
   automatisch als Geo-Feld
4. Klicke auf **Add and continue**, dann **Save & close**
5. Speichere das Dashboard als `Web-Traffic`

**Erwartetes Ergebnis:** Eine Weltkarte mit deutlichem Schwerpunkt
in Deutschland und Westeuropa, dazu Cluster in Nordamerika,
Brasilien, Japan, Australien, Indien und Südafrika.

> **Tipp:** Alle Details zu Maps (Styling, Tooltips, Choropleth,
> räumliche Filter) findest du in **Lab 04** (`lab-04-maps`).
> Die dort gezeigten Techniken funktionieren 1:1 mit deinem
> `weblogs`-Data-View.

### Schritt 4.5: Fehlerrate als Lens-Formel

Absolute Fehlerzahlen täuschen: Bei viel Traffic sind 50 Fehler
normal, bei wenig Traffic ein Alarmsignal. Aussagekräftig ist die
**Fehlerrate**: Anteil der 5xx-Antworten an allen Requests.

1. Füge eine weitere Lens-Visualisierung hinzu (Data View `weblogs`)
2. Wähle den Typ **Line**
3. Horizontal axis: `@timestamp`
4. Vertical axis: klicke auf das Feld, wechsle auf den Tab
   **Formula** und gib ein:

    ```text
    count(kql='http.response.status_code >= 500') / count()
    ```

5. Stelle unter **Value format** das Format **Percent** ein
   (2 Nachkommastellen)
6. Benenne die Achse um in `Fehlerrate` (Feld **Name**)
7. Speichere das Panel als `Fehlerrate (5xx)`

**Erwartetes Ergebnis:** Eine flache Linie um die 2--3 %, mit
einer markanten Spitze um die 15 % kurz vor Ende des Zeitraums.
Dieselbe Störung wie im Status-Code-Panel, aber jetzt als Kennzahl,
die unabhängig vom Traffic-Volumen funktioniert.

> **Tipp:** Lens-Formeln kombinieren Aggregationen mit KQL-Filtern.
> Das Muster `count(kql='...') / count()` ist der Standardweg für
> jede Art von Quote (Fehlerrate, Conversion, Bot-Anteil).

### Schritt 4.6: Bot- vs. Browser-Traffic

Der useragent-Filter aus Teil 3 hat die User-Agent-Strings in
strukturierte Felder zerlegt. Damit lässt sich Crawler-Traffic
vom echten Besucher-Traffic trennen.

1. Wirf zuerst in Discover einen Blick auf das Feld
   `user_agent.name`: Neben Browsern wie `Chrome`, `Firefox` und
   `Mobile Safari` tauchen `Googlebot`, `bingbot` und `curl` auf
2. Füge eine Lens-Visualisierung vom Typ **Pie** hinzu:
    - Slice by: **Top values** von `user_agent.name.keyword` (Top 8)
    - Metric: **Count of records**
3. Speichere das Panel als `Traffic nach Client`

**Aufgabe:** Wie hoch ist der Bot-Anteil? Filtere das Dashboard
mit KQL:

```text
user_agent.name: ("Googlebot" or "bingbot" or "curl")
```

Beobachte, wie **alle** Panels (auch Karte und Fehlerrate) auf den
Filter reagieren. Entferne ihn danach wieder.

**Erwartetes Ergebnis:** Rund 9 % der Requests stammen von
Crawlern und Tools. In echten Projekten ist das oft der erste
Filter, den man in ein Web-Dashboard einbaut.

### Schritt 4.7 (Bonus): Latenz-Perzentile aus den App-Logs

Die strukturierten JSON-Logs im Index `applogs` enthalten mit
`event.duration` die Bearbeitungsdauer jedes Requests
(in **Nanosekunden**, so will es ECS). Daraus baust du das
klassische Latenz-Panel.

1. Lege einen zweiten Data View an: Name `applogs`,
   Index pattern `applogs`, Timestamp field `@timestamp`
2. Füge dem Dashboard eine Lens-Visualisierung hinzu;
   ein Dashboard darf Panels aus **verschiedenen Data Views**
   mischen
3. Typ **Line**, Data View `applogs`:
    - Horizontal axis: `@timestamp`
    - Vertical axis (Tab **Formula**, Umrechnung in Millisekunden):

        ```text
        percentile(event.duration, percentile=95) / 1000000
        ```

    - Name: `p95 Latenz (ms)`
    - Breakdown: **Top values** von `service.name`
4. Speichere das Panel als `p95-Latenz pro Service`

**Erwartetes Ergebnis:** Die meisten Services liegen stabil unter
einer Sekunde. Während des Störungszeitraums schießt die p95-Latenz
von `checkout-service` und `cart-service` auf über 20 Sekunden hoch.
Auch `payment-service` wird spürbar langsamer, `product-service`
dagegen bleibt ruhig. Die Web-Fehler aus Schritt 4.5 und die langsamen
Backend-Antworten sind **derselbe Vorfall**, gesehen aus zwei
verschiedenen Logquellen.

> **Tipp:** Warum p95 statt Durchschnitt? Der Durchschnitt versteckt
> Ausreißer: "im Mittel 200 ms" kann bedeuten, dass jeder zwanzigste
> Kunde 10 Sekunden wartet. Perzentile zeigen, was die langsamsten
> Nutzer wirklich erleben.

### Bonus: Den 5xx-Fehler-Burst finden

In den Weblogs versteckt sich ein Vorfall: Für kurze Zeit hat der
Shop massenhaft Serverfehler produziert.

**Aufgabe:** Finde den Vorfall mit Discover oder deinem Dashboard:

1. Filtere mit KQL auf Serverfehler:

    ```text
    http.response.status_code >= 500
    ```

2. Grenze den Zeitraum über das Histogramm ein: Wann genau begann
   der Burst, wie lange dauerte er?
3. Ermittle die betroffenen Pfade (Feld `url.original` in der
   Feldliste anklicken) und die Verteilung der Status-Codes
   (500 vs. 503)

**Erwartetes Ergebnis:** Wenige Stunden vor dem Ende des
Log-Zeitraums häufen sich 500er und 503er deutlich. Am stärksten
trifft es den Warenkorb- und Bestell-Flow (`/warenkorb`, `/checkout`,
`/checkout/zahlung`) und die zugehörigen `/api/...`-Endpunkte. Im
übrigen Shop steigen die Fehler auch, aber weniger stark. Ein
Backend-Ausfall, der im Bestellprozess am deutlichsten durchschlägt.

> **Tipp:** Merke dir dieses Szenario: An Tag 3 bauen wir genau
> dafür einen **Alert**, der solche Fehler-Bursts automatisch
> meldet, statt dass jemand sie im Dashboard entdecken muss.

---

## Zusammenfassung

Du hast erfolgreich:

- [x] Eine Apache-Logzeile im Grok Debugger schrittweise zerlegt
- [x] Die Apache-Logs mit `%{HTTPD_COMBINEDLOG}` und date-Filter geparst
- [x] Das Java-Log-Pattern aus Bausteinen selbst nachgebaut
- [x] Ein Index-Template mit `geo_point`-Mapping angelegt,
  **vor** der Index-Erstellung
- [x] Client-IPs per Geoip und User-Agents per useragent-Filter
  angereichert
- [x] Alle drei Logtypen in eigene Indizes geroutet
  (`weblogs`, `javalogs`, `applogs`)
- [x] Ein Web-Traffic-Dashboard mit Top-URLs, Status-Codes und
  Weltkarte gebaut
- [x] Die Fehlerrate als Lens-Formel berechnet und Bot-Traffic
  identifiziert
- [x] Latenz-Perzentile pro Service aus den App-Logs visualisiert

Damit steht die komplette Pipeline von Tag 2:
**Filebeat -> Logstash (grok, date, geoip, useragent) →
Elasticsearch -> Kibana**.

**Nächster Schritt (Tag 3):** Alerting. Der 5xx-Burst aus der
Bonus-Aufgabe soll sich in Zukunft selbst melden!

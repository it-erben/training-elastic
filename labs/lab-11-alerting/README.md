# Lab 11: Alerting (Bonus)

> **Mini-Lab (ca. 15 Minuten):** Diese Übung ist als kompakte
> Bonus-Übung angelegt. Du baust eine vollständige Alerting-Kette:
> Rule > Condition > Action > Connector - und löst den Alarm
> anschließend selbst aus.

## Übungsziel

Am Ende dieser Übung hast du:

- Einen Index-Connector als Alarm-Ziel angelegt
- Eine Elasticsearch-Query-Rule mit Schwellwert erstellt
- Den Alarm durch gezieltes Nachindexieren von Fehler-Dokumenten
  ausgelöst
- Den gefeuerten Alert in den Rule-Details und im Ziel-Index
  nachvollzogen

**Szenario:** Der Webshop der Mustertech GmbH liefert am Wochenende
HTTP-Fehler, und niemand merkt es. Das soll nicht wieder passieren:
Ab jetzt schlägt der Cluster selbst Alarm, wenn sich Server-Fehler
(Statuscode >= 500) häufen.

---

## Teil 1: Sample-Daten laden

Falls die Sample Web Logs noch nicht im Cluster sind:

### Schritt 1.1: Sample Web Logs installieren

1. Öffne Kibana unter `http://localhost:5601`
   (Login: `elastic` / `changeme`)
2. Navigiere zur **Home**-Seite (Elastic-Logo oben links)
3. Klicke auf **Try sample data**
4. Klappe **Other sample data sets** auf
5. Klicke bei **Sample web logs** auf **Add data**

**Erwartetes Ergebnis:** Der Index `kibana_sample_data_logs` existiert
inklusive Data View. Prüfe das in den Dev Tools:

```
GET kibana_sample_data_logs/_count
```

Die Antwort sollte gut 14.000 Dokumente melden.

> **Tipp:** Wenn der Button **Remove** statt **Add data** angezeigt
> wird, sind die Daten bereits installiert. Weiter mit Teil 2.

---

## Teil 2: Connector und Rule anlegen

### Schritt 2.1: Index-Connector erstellen

Der Connector ist das Ziel unserer Alarm-Nachricht: hier ein
Elasticsearch-Index, in den jedes Alert-Ereignis als Dokument
geschrieben wird.

1. Navigiere zu **Stack Management > Connectors**
   (Bereich *Alerts and Insights*)
2. Klicke auf **Create connector**
3. Wähle den Typ **Index**
4. Konfiguriere:
    - **Connector name:** `alerts-uebung`
    - **Index:** `alerts-uebung`
    - **Refresh index:** aktivieren (damit du Ergebnisse sofort
      siehst)
5. Klicke auf **Save**

**Erwartetes Ergebnis:** Der Connector `alerts-uebung` erscheint in
der Connector-Liste.

> **Tipp:** Index und Server log sind die beiden Connector-Typen, die
> mit der Basic-Lizenz zur Verfügung stehen. Alle anderen Typen werden
> ausgegraut angezeigt.

### Schritt 2.2: Rule anlegen

1. Navigiere zu **Stack Management > Rules**
2. Klicke auf **Create rule**
3. Wähle den Rule-Typ **Elasticsearch query**
4. Vergib den Namen: `Fehlerrate Webshop`

### Schritt 2.3: Query und Bedingung definieren

1. Wähle als Abfrage-Variante **KQL or Lucene**
2. Wähle den Data View **Kibana Sample Data Logs**
3. Gib als Query ein:

    ```
    response.keyword >= 500
    ```

4. Setze die Bedingung:
    - **WHEN:** `count()`
    - **IS ABOVE:** `10`
    - **FOR THE LAST:** `5 minutes`
5. Setze unter **Rule schedule** das Prüfintervall auf **1 minute**

**Erwartetes Ergebnis:** Die Vorschau (Testabfrage) zeigt aktuell nur
wenige oder keine Treffer im 5-Minuten-Fenster, denn die Sample-Daten
verteilen ihre Fehler über Wochen. Genau deshalb müssen wir gleich
selbst nachhelfen.

### Schritt 2.4: Action konfigurieren

1. Füge unter **Actions** eine Action hinzu und wähle den Connector
   `alerts-uebung`
2. Trage als zu indexierendes Dokument ein:

    ```json
    {
      "regel": "{{rule.name}}",
      "zeitpunkt": "{{context.date}}",
      "treffer": "{{context.value}}",
      "bedingung": "{{context.conditions}}"
    }
    ```

3. Speichere die Rule mit **Save**

**Erwartetes Ergebnis:** Die Rule `Fehlerrate Webshop` erscheint in
der Rule-Liste mit Status **Enabled** und wird ab jetzt jede Minute
ausgeführt. Ergebnis zunächst: **OK** (kein Alert).

> **Tipp:** Die Platzhalter in geschweiften Klammern sind
> Mustache-Variablen. Über das Symbol neben dem Eingabefeld kannst du
> alle verfügbaren Variablen des Rule-Typs einsehen.

---

## Teil 3: Alert auslösen

Jetzt spielen wir den Störfall nach: Wir indexieren mehr als 10
Dokumente mit Statuscode 503 und aktuellem Zeitstempel.

### Schritt 3.1: Ingest-Pipeline für aktuelle Zeitstempel

Der Zeitstempel muss im aktuellen 5-Minuten-Fenster liegen. Statt ihn
von Hand einzutragen, lassen wir Elasticsearch das mit einer kleinen
Ingest-Pipeline erledigen. Führe in den **Dev Tools** aus:

```
PUT _ingest/pipeline/set-now
{
  "description": "Setzt den Zeitstempel auf die aktuelle Zeit",
  "processors": [
    {
      "set": {
        "field": "@timestamp",
        "value": "{{_ingest.timestamp}}"
      }
    }
  ]
}
```

> **Tipp:** Die Sample Web Logs sind ein Data Stream; das echte
> Zeitfeld heißt `@timestamp` (`timestamp` ist nur ein Lese-Alias).
> Die Pipeline setzt es beim Indexieren automatisch auf die aktuelle
> Zeit, so musst du keine UTC-Zeitstempel von Hand ausrechnen.

### Schritt 3.2: Fehler-Dokumente per Bulk indexieren

Indexiere 12 Fehler-Dokumente in einem Rutsch (die Pipeline hängt als
URL-Parameter dran). Führe in den Dev Tools aus:

```
POST kibana_sample_data_logs/_bulk?pipeline=set-now
{"create":{}}
{"response":"503","message":"Payment provider timeout","url":"/checkout/payment","clientip":"10.0.0.1","host":"shop.mustertech.de","bytes":0,"extension":"","request":"/checkout/payment","tags":["error","lab-11"]}
{"create":{}}
{"response":"503","message":"Payment provider timeout","url":"/checkout/payment","clientip":"10.0.0.2","host":"shop.mustertech.de","bytes":0,"extension":"","request":"/checkout/payment","tags":["error","lab-11"]}
{"create":{}}
{"response":"503","message":"Payment provider timeout","url":"/checkout/payment","clientip":"10.0.0.3","host":"shop.mustertech.de","bytes":0,"extension":"","request":"/checkout/payment","tags":["error","lab-11"]}
{"create":{}}
{"response":"503","message":"Payment provider timeout","url":"/checkout/payment","clientip":"10.0.0.4","host":"shop.mustertech.de","bytes":0,"extension":"","request":"/checkout/payment","tags":["error","lab-11"]}
{"create":{}}
{"response":"503","message":"Payment provider timeout","url":"/checkout/payment","clientip":"10.0.0.5","host":"shop.mustertech.de","bytes":0,"extension":"","request":"/checkout/payment","tags":["error","lab-11"]}
{"create":{}}
{"response":"503","message":"Payment provider timeout","url":"/checkout/payment","clientip":"10.0.0.6","host":"shop.mustertech.de","bytes":0,"extension":"","request":"/checkout/payment","tags":["error","lab-11"]}
{"create":{}}
{"response":"503","message":"Payment provider timeout","url":"/checkout/payment","clientip":"10.0.0.7","host":"shop.mustertech.de","bytes":0,"extension":"","request":"/checkout/payment","tags":["error","lab-11"]}
{"create":{}}
{"response":"503","message":"Payment provider timeout","url":"/checkout/payment","clientip":"10.0.0.8","host":"shop.mustertech.de","bytes":0,"extension":"","request":"/checkout/payment","tags":["error","lab-11"]}
{"create":{}}
{"response":"503","message":"Payment provider timeout","url":"/checkout/payment","clientip":"10.0.0.9","host":"shop.mustertech.de","bytes":0,"extension":"","request":"/checkout/payment","tags":["error","lab-11"]}
{"create":{}}
{"response":"503","message":"Payment provider timeout","url":"/checkout/payment","clientip":"10.0.0.10","host":"shop.mustertech.de","bytes":0,"extension":"","request":"/checkout/payment","tags":["error","lab-11"]}
{"create":{}}
{"response":"503","message":"Payment provider timeout","url":"/checkout/payment","clientip":"10.0.0.11","host":"shop.mustertech.de","bytes":0,"extension":"","request":"/checkout/payment","tags":["error","lab-11"]}
{"create":{}}
{"response":"503","message":"Payment provider timeout","url":"/checkout/payment","clientip":"10.0.0.12","host":"shop.mustertech.de","bytes":0,"extension":"","request":"/checkout/payment","tags":["error","lab-11"]}
```

**Erwartetes Ergebnis:** Die Antwort enthält `"errors": false` und
12 `"result": "created"`-Einträge.

**Aufgabe:** Prüfe, dass die Dokumente im aktuellen Zeitfenster
angekommen sind:

```
GET kibana_sample_data_logs/_count
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "response.keyword": "503" } },
        { "range": { "timestamp": { "gte": "now-5m", "lte": "now" } } }
      ]
    }
  }
}
```

Der Count sollte `12` sein - mehr als unser Schwellwert von 10.

### Schritt 3.3: Warten, bis die Rule feuert

Die Rule prüft jede Minute. Warte also **1 bis 2 Minuten**.

1. Navigiere zu **Stack Management > Rules**
2. Öffne die Rule `Fehlerrate Webshop` per Klick auf den Namen

**Erwartetes Ergebnis:** In den Rule-Details siehst du einen
**aktiven Alert**, inklusive Zeitpunkt der letzten Ausführung und
dem gemessenen Wert (12 Treffer, Schwellwert 10 überschritten).

> **Tipp:** Noch kein Alert? Prüfe: Ist die Rule **Enabled**? Liegt die
> letzte Ausführung nach deinem Bulk-Request? Notfalls über das
> Aktionen-Menü der Rule **Run rule** ausführen.

### Schritt 3.4: Alert-Dokument im Ziel-Index ansehen

Der Index-Connector hat für den Alert ein Dokument geschrieben.
Sieh es dir in den Dev Tools an:

```
GET alerts-uebung/_search
```

**Erwartetes Ergebnis:** Mindestens ein Dokument mit den Feldern
`regel`, `zeitpunkt`, `treffer` und `bedingung`, gefüllt aus den
Mustache-Variablen deiner Action.

**Aufgabe:** Wie viele Treffer meldet das Feld `treffer`? Vergleiche
den Wert mit deinem Count aus Schritt 3.2.

### Schritt 3.5 (optional): Entwarnung beobachten

Warte etwa 6 bis 7 Minuten, bis deine 503-Dokumente aus dem
5-Minuten-Fenster herausgewandert sind, und schaue erneut in die
Rule-Details.

**Erwartetes Ergebnis:** Der Alert wechselt in den Status
**Recovered**: Die Störung gilt als behoben.

---

## Aufräumen (optional)

```
DELETE _ingest/pipeline/set-now
POST kibana_sample_data_logs/_delete_by_query
{
  "query": { "term": { "tags.keyword": "lab-11" } }
}
```

Die Rule kannst du unter **Stack Management > Rules** deaktivieren
oder löschen.

---

## Zusammenfassung

Du hast erfolgreich:

- [x] Die Sample Web Logs als Datenbasis bereitgestellt
- [x] Einen Index-Connector als Alarm-Ziel angelegt
- [x] Eine Elasticsearch-Query-Rule mit Schwellwert und
  1-Minuten-Schedule erstellt
- [x] Den Alarm durch nachindexierte 503-Dokumente ausgelöst
- [x] Den Alert in den Rule-Details und als Dokument im Ziel-Index
  nachvollzogen

> **Ausblick:** Mit einer Trial- oder Platinum-Lizenz stünden an
> Stelle des Index-Connectors auch Slack, E-Mail, PagerDuty oder
> Webhooks bereit; die Rule selbst bliebe exakt gleich. Wie du die
> Trial aktivierst, hast du in Modul 11 gesehen.

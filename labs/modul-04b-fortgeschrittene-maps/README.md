# Modul 04b: Fortgeschrittene Maps

## Übungsziel

Am Ende dieser Übung hast du:

- Eine Flugrouten-Karte mit Point-to-Point-Verbindungen erstellt
- Routen nach Ticketpreis und Verspätung visuell unterschieden
- Map-Drilldowns konfiguriert, die per Klick auf ein Land zu einem
  gefilterten Detail-Dashboard navigieren
- Maps und Dashboards zu einem interaktiven Analyse-Workflow verknüpft

### Voraussetzung

Du hast **Modul 03b** und **Modul 04** abgeschlossen. Die Dashboards
`Überblick - Geschäftsführung` und `Controlling - Umsatzanalyse` sind
vorhanden. Beide Kibana-Beispieldatensätze (eCommerce und Flights)
sind geladen.

---

### Zeitraum einstellen

Stelle zu Beginn sicher, dass der Zeitfilter auf
**Last 7 days** steht.

### Verfügbare Felder im Flights-Datensatz

| Feld                 | Typ       | Beschreibung                     |
|:---------------------|:----------|:---------------------------------|
| `timestamp`          | date      | Abflugzeitpunkt                  |
| `OriginLocation`     | geo_point | Koordinaten Abflughafen          |
| `DestLocation`       | geo_point | Koordinaten Zielflughafen        |
| `OriginCityName`     | keyword   | Stadt Abflughafen                |
| `OriginCountry`      | keyword   | Land Abflughafen                 |
| `OriginAirportID`    | keyword   | IATA-Code Abflughafen            |
| `DestCityName`       | keyword   | Stadt Zielflughafen              |
| `DestCountry`        | keyword   | Land Zielflughafen               |
| `DestAirportID`      | keyword   | IATA-Code Zielflughafen          |
| `Carrier`            | keyword   | Fluggesellschaft                 |
| `AvgTicketPrice`     | number    | Durchschnittlicher Ticketpreis   |
| `DistanceKilometers` | number    | Flugdistanz in km                |
| `FlightTimeMin`      | number    | Flugzeit in Minuten              |
| `FlightDelay`        | boolean   | Verspätet (true/false)           |
| `FlightDelayMin`     | number    | Verspätung in Minuten            |
| `FlightDelayType`    | keyword   | Art der Verspätung               |
| `Cancelled`          | boolean   | Storniert (true/false)           |
| `DestWeather`        | keyword   | Wetter am Zielort                |
| `OriginWeather`      | keyword   | Wetter am Abflugort              |

---

## Teil 1: Flugrouten-Karte (Point-to-Point)

Erstelle eine Karte, die **Flugverbindungen als Linien** zwischen
Abflug- und Zielflughafen darstellt.

### Aufgabe 1.1: Karte anlegen

1. Navigiere zu **Analytics > Maps**
2. Klicke auf **Create map**
3. Setze den Zeitfilter auf **Last 7 days**

### Aufgabe 1.2: Point-to-Point-Layer hinzufügen

1. Klicke auf **Add layer**
2. Wähle **Point to point**
3. Wähle den Data View **Kibana Sample Data Flights**
4. Konfiguriere:
    - **Source**: `OriginLocation`
    - **Destination**: `DestLocation`
5. Klicke auf **Add and continue**

**Erwartetes Ergebnis:** Auf der Weltkarte erscheinen gebogene Linien
zwischen Abflug- und Zielflughäfen. Die Linien folgen einer
Großkreis-Route (kürzeste Verbindung auf der Erdkugel).

### Aufgabe 1.3: Linien-Styling nach Ticketpreis

Mache teure Flüge visuell erkennbar:

1. Klicke auf den Point-to-Point-Layer in der Legende
2. Unter **Layer style**:
    - **Line color**: Wechsle auf **By value**
    - Wähle das Feld `AvgTicketPrice`
    - Farbpalette: z.B. **Green to Red**
      (Grün = günstig, Rot = teuer)
    - **Width**: Wechsle auf **By value**
    - Wähle das Feld `DistanceKilometers`
    - Setze den Bereich auf Minimum `1` und Maximum `4`

**Erwartetes Ergebnis:** Kurze und günstige Flüge erscheinen als
dünne grüne Linien, lange und teure Flüge als dicke rote Linien.

### Aufgabe 1.4: Karte speichern

1. Klicke auf **Save**
2. Titel: `Flugrouten Weltkarte`
3. Wähle "Add To Dashboard -> None"

---

## Teil 2: Flugrouten-Karte erweitern

Erweitere die Flugrouten-Karte mit zusätzlichen Layern für Flughäfen
und Verspätungen.

### Aufgabe 2.1: Flughäfen als Punkte hinzufügen

Füge einen Layer hinzu, der die **Abflughäfen** als Punkte zeigt:

1. Klicke auf **Add layer**
2. Wähle **Documents**
3. Wähle den Data View **Kibana Sample Data Flights**
4. Geo-Feld: `OriginLocation`
5. Klicke auf **Add and continue**
6. Unter **Layer style**:
    - **Fill color**: Wähle eine auffällige Farbe (z.B. Orange)
    - **Symbol size**: `6`
    - **Border color**: Weiß
    - **Border width**: `1`

### Aufgabe 2.2: Tooltips für Flughäfen konfigurieren

1. Klicke auf den Document-Layer in der Legende
2. Unter **Tooltip fields** füge hinzu:
    - `OriginCityName` (Abflugstadt)
    - `OriginAirportID` (IATA-Code)
    - `Carrier` (Fluggesellschaft)
    - `AvgTicketPrice` (Ticketpreis)
    - `FlightDelay` (Verspätet?)
3. Klicke auf **Save & close**

**Test:** Hover über einen Punkt, um die Flughafen-Details zu sehen.

### Aufgabe 2.3: Verspätete Flüge hervorheben

Erstelle einen separaten Layer, der **nur verspätete Flüge** zeigt:

1. Klicke auf **Add layer**
2. Wähle **Point to point**
3. Data View: **Kibana Sample Data Flights**
4. Source: `OriginLocation`, Destination: `DestLocation`
5. Klicke auf **Add and continue**
6. Unter **Filtering**:
    - Klicke auf **Add filter**
    - Feld: `FlightDelay`, Operator: **is**, Wert: `true`
7. Unter **Layer style**:
    - **Line color**: Statisch **Rot**
    - **Width**: Statisch `3`
    - **Opacity**: `80%`

### Aufgabe 2.4: Layer-Reihenfolge organisieren

Ordne die Layer so, dass die Darstellung übersichtlich bleibt:

```text
Layer-Reihenfolge (von oben nach unten):
1. Flughäfen (Document-Layer, Punkte)
2. Verspätete Flüge (Point-to-Point, Rot)
3. Alle Flugrouten (Point-to-Point, Grün-Rot)
4. Basemap
```

> **Tipp:** Der oberste Layer wird zuletzt gezeichnet und liegt
> visuell "vorne". Punkte sollten über Linien liegen.

### Aufgabe 2.5: Karte speichern

Speichere die Karte `Flugrouten Weltkarte` mit allen Layern.

---

## Teil 3: Flug-Dashboard erstellen

Erstelle ein Dashboard, das die Flugrouten-Karte mit weiteren
Visualisierungen kombiniert.

### Aufgabe 3.1: Neues Dashboard erstellen

1. Navigiere zu **Analytics > Dashboard**
2. Klicke auf **Create dashboard**

### Aufgabe 3.2: Karte hinzufügen

1. Klicke auf **Add from library**
2. Wähle `Flugrouten Weltkarte`
3. Platziere die Karte in der oberen Hälfte über die volle Breite

### Aufgabe 3.3: Kennzahlen-Zeile erstellen

Erstelle drei Metriken inline im Dashboard:

1. **Anzahl Flüge:**
    - Klicke auf **Add** > **Visualization**, Typ **Metric**
    - Metrik: **Count**
    - Speichere als: `Anzahl Flüge`

2. **Durchschnittlicher Ticketpreis:**
    - Neue Metrik, Feld `AvgTicketPrice`, Funktion **Average**
    - Speichere als: `Durchschn. Ticketpreis`

3. **Verspätungsrate:**
    - Neue Metrik, Typ **Metric**, wähle **Formula**
    - Formel: `count(kql='FlightDelay: true') / count()`
    - Format: **Percent** mit 1 Dezimalstelle
    - Speichere als: `Verspätungsrate`

### Aufgabe 3.4: Top-Routen-Tabelle erstellen

1. Neue Visualisierung, Typ **Table**
2. Konfiguriere:

| Feld               | Funktion        | Anzeigename |
|:-------------------|:----------------|:------------|
| `OriginCityName`   | Top values (10) | Von         |
| `DestCityName`     | Top values (10) | Nach        |
| `AvgTicketPrice`   | Average         | Preis       |
| `FlightDelayMin`   | Average         | Versp. Min  |

3. Sortiere nach Preis absteigend
4. Speichere als: `Top Flugrouten`

### Aufgabe 3.5: Verspätungen nach Carrier (Balken)

1. Neue Visualisierung, Typ **Bar**
2. X-Achse: `Carrier` (Top values, alle)
3. Y-Achse: `FlightDelayMin` mit **Average**
4. Breakdown: `FlightDelay` (true/false)
5. Speichere als: `Verspätungen nach Carrier`

### Aufgabe 3.6: Dashboard-Layout

```text
+------------------------------------------------+
| Flugrouten Weltkarte (volle Breite)            |
+---------------+---------------+----------------+
| Anzahl Flüge  | Durchschn.    | Verspätungs-   |
|               | Ticketpreis   | rate            |
+---------------+---------------+----------------+
| Top Flugrouten (Tabelle)      | Verspätungen   |
|                               | nach Carrier   |
+-------------------------------+----------------+
```

### Aufgabe 3.7: Controls hinzufügen

1. **Carrier** (Options list auf `Carrier`)
2. **Abflugland** (Options list auf `OriginCountry`)
3. **Zielland** (Options list auf `DestCountry`)

### Aufgabe 3.8: Dashboard speichern

1. Titel: `Flugverkehr - Routenanalyse`
2. Beschreibung: "Flugrouten, Verspätungen und Preisanalyse"

---

## Teil 4: Map-Drilldowns

Verbinde die eCommerce-Karte und die Flugrouten-Karte mit
Dashboard-Drilldowns, sodass ein Klick auf der Karte zu einem
gefilterten Detail-Dashboard navigiert.

### Aufgabe 4.1: Regionales Detail-Dashboard vorbereiten

Erstelle zunächst ein Dashboard, das als Drilldown-Ziel dient:

1. **Analytics > Dashboard > Create dashboard**
2. Erstelle folgende Visualisierungen inline:
    - **Metrik:** Sum of `taxful_total_price` -- Speichere als:
      `Regional: Umsatz`
    - **Metrik:** Count -- Speichere als: `Regional: Bestellungen`
    - **Balkendiagramm:** X-Achse `category` (Top 8),
      Y-Achse Count -- Speichere als: `Regional: Kategorien`
    - **Tabelle:** `customer_full_name` (Top 10),
      Sum of `taxful_total_price`,
      Count -- Speichere als: `Regional: Top Kunden`
3. Layout:

```text
+-----------------------+-----------------------+
| Regional: Umsatz      | Regional: Bestellungen|
+-----------------------+-----------------------+
| Regional: Kategorien (volle Breite)           |
+-----------------------------------------------+
| Regional: Top Kunden (volle Breite)           |
+-----------------------------------------------+
```

4. Speichere als: `Regional - Detailansicht`
5. Beschreibung: "Detailanalyse für eine bestimmte Region"

### Aufgabe 4.2: Drilldown auf der eCommerce-Karte einrichten

1. Öffne das Dashboard `Überblick - Geschäftsführung` im
   Bearbeitungsmodus
2. Klicke auf die drei Punkte am Panel `Bestellungen Weltkarte`
3. Wähle **Create drilldown**
4. Wähle **Go to dashboard**
5. Konfiguriere:
    - Drilldown-Name: `Zur Regionalanalyse`
    - Ziel-Dashboard: `Regional - Detailansicht`
6. Speichere

### Aufgabe 4.3: Drilldown testen

1. Wechsle in den **View**-Modus
2. Klicke auf einen **Punkt** oder ein **Land** auf der Karte
3. Im Kontextmenü wähle **Zur Regionalanalyse**

**Erwartetes Ergebnis:** Du wirst zum Dashboard
`Regional - Detailansicht` navigiert. Die Visualisierungen zeigen
Daten gefiltert auf die angeklickte Region.

4. Prüfe:
    - Sind die Metriken gefiltert?
    - Zeigt die Tabelle nur Kunden aus der Region?
5. Klicke im Browser auf **Zurück**, um zum Überblick-Dashboard
   zurückzukehren

### Aufgabe 4.4: Drilldown auf der Flugrouten-Karte einrichten

1. Öffne das Dashboard `Flugverkehr - Routenanalyse` im
   Bearbeitungsmodus
2. Klicke auf die drei Punkte am Panel `Flugrouten Weltkarte`
3. Wähle **Create drilldown > Go to dashboard**
4. Konfiguriere:
    - Drilldown-Name: `Flüge ab diesem Flughafen`
    - Ziel-Dashboard: `Flugverkehr - Routenanalyse` (selbes Dashboard)
5. Speichere

**Test:** Klicke auf einen Flughafen-Punkt. Das Dashboard lädt
sich selbst neu, gefiltert auf den angeklickten Abflughafen.
So kannst du interaktiv das Streckennetz eines einzelnen Flughafens
erkunden.

### Aufgabe 4.5: Navigationsfluss testen

Teste den kompletten Workflow:

1. Starte im Dashboard `Überblick - Geschäftsführung`
2. Klicke auf die eCommerce-Karte auf ein Land (z.B. USA)
   -> Du landest in `Regional - Detailansicht`, gefiltert auf USA
3. Gehe zurück (Browser-Zurück)
4. Öffne `Flugverkehr - Routenanalyse`
5. Klicke auf einen Flughafen (z.B. Frankfurt)
   -> Das Dashboard zeigt nur Flüge ab Frankfurt
6. Setze den Filter zurück, um wieder alle Daten zu sehen

---

## Zusammenfassung

Du hast erfolgreich:

- [x] Eine **Flugrouten-Karte** mit Point-to-Point-Linien zwischen
  Abflug- und Zielflughäfen erstellt
- [x] Routen visuell nach **Ticketpreis** (Farbe) und **Distanz**
  (Linienstärke) unterschieden
- [x] **Verspätete Flüge** als separaten Layer rot hervorgehoben
- [x] Ein **Flug-Dashboard** mit Karte, Kennzahlen, Tabelle und
  Verspätungsanalyse gebaut
- [x] **Map-Drilldowns** konfiguriert, die von der Karte zu
  gefilterten Detail-Dashboards navigieren
- [x] Einen interaktiven **Navigationsfluss** zwischen mehreren
  Dashboards und Karten aufgebaut

---

## Troubleshooting

### Point-to-Point-Layer zeigt keine Linien

**Symptom:** Der Layer ist hinzugefügt, aber keine Linien sind
sichtbar.

**Lösung:**

1. Prüfe, ob **Source** und **Destination** auf unterschiedliche
   Geo-Felder zeigen (`OriginLocation` vs. `DestLocation`)
2. Prüfe den Zeitfilter - der Flights-Datensatz enthält Daten
   für die letzten Wochen
3. Zoome heraus, um interkontinentale Routen zu sehen

### Drilldown erscheint nicht im Kontextmenü

**Symptom:** Beim Klick auf die Karte fehlt die Drilldown-Option.

**Lösung:**

1. Drilldowns funktionieren nur im **View**-Modus
   (nicht im Edit-Modus)
2. Prüfe, ob der Drilldown korrekt gespeichert wurde:
   Edit > Panel > Drei Punkte > **Manage drilldowns**
3. Stelle sicher, dass du auf ein **Datenelement** klickst
   (Punkt oder Land), nicht auf die leere Basemap

### Verspätungsrate-Formel zeigt Fehler

**Symptom:** Die KQL-basierte Formel wird rot markiert.

**Lösung:**

1. Prüfe die Syntax: `count(kql='FlightDelay: true') / count()`
2. Die einfachen Anführungszeichen um den KQL-Ausdruck sind wichtig
3. Nutze die **Autovervollständigung** in der Formelleiste

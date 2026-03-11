# Modul 04: Maps-Visualisierungen

## Übungsziel

Am Ende dieser Übung hast du:

- Eine Karten-Visualisierung mit Bestellungen als Punkten erstellt
- Einen Choropleth-Layer für die Umsatzverteilung nach Land hinzugefügt
- Tooltips und Styling der Kartenlayer konfiguriert
- Die Karte in ein bestehendes Dashboard integriert

### Voraussetzung

Du hast **Modul 03** abgeschlossen. Das Dashboard
`Überblick - Geschäftsführung` ist vorhanden.

---

### Zeitraum einstellen

Stelle zu Beginn sicher, dass der Zeitfilter auf
**Last 7 days** steht.

### Relevante Felder im eCommerce-Datensatz

| Feld                         | Typ       | Beschreibung              |
|:-----------------------------|:----------|:--------------------------|
| `geoip.location`             | geo_point | Koordinaten (Lat/Lon)     |
| `geoip.city_name`            | keyword   | Stadt                     |
| `geoip.region_name`          | keyword   | Region                    |
| `geoip.country_iso_code`     | keyword   | Ländercode (DE, US...)    |
| `geoip.continent_name`       | keyword   | Kontinent                 |
| `taxful_total_price`         | number    | Bestellwert (brutto)      |
| `customer_full_name`         | text      | Kundenname                |
| `category`                   | keyword   | Produktkategorie(n)       |
| `order_date`                 | date      | Bestellzeitpunkt          |
| `total_quantity`             | number    | Anzahl Artikel            |

---

## Teil 1: Erste Karte erstellen

Erstelle eine neue Kartenvisualisierung mit Bestellungen als Punkten
auf der Weltkarte.

### Aufgabe 1.1: Karte anlegen

1. Navigiere zu **Analytics > Maps**
2. Klicke auf **Create map**
3. Kibana zeigt eine leere Weltkarte mit der Standard-Basemap

### Aufgabe 1.2: Document-Layer hinzufügen

1. Klicke auf **Add layer**
2. Wähle **Documents**
3. Wähle den Data View **Kibana Sample Data eCommerce**
4. Kibana erkennt automatisch das Feld `geoip.location` als Geo-Feld
5. Klicke auf **Add and continue**

**Erwartetes Ergebnis:** Auf der Weltkarte erscheinen Punkte an den
Standorten der Bestellungen. Die meisten Punkte sollten in Nordamerika,
Europa und Asien liegen.

### Aufgabe 1.3: Layer-Styling anpassen

1. Im rechten Panel unter **Layer style** findest du die
   Darstellungsoptionen
2. Ändere die **Fill color** auf eine gut sichtbare Farbe (z.B. Blau)
3. Setze die **Border width** auf 1 und die **Border color** auf eine dunklere Farbe
4. Ändere den **Symbol size** auf `8`

### Aufgabe 1.4: Karte speichern

1. Klicke auf **Save**
2. Titel: `Bestellungen Weltkarte`
3. Wähle "Add To Dashboard -> None"

---

## Teil 2: Choropleth-Layer (Umsatz nach Land)

Ergänze die Karte um einen Layer, der Länder farblich nach
Umsatzvolumen einfärbt.

### Aufgabe 2.1: Choropleth-Layer hinzufügen

1. Öffne die Karte `Bestellungen Weltkarte` zur Bearbeitung
2. Klicke auf **Add layer**
3. Wähle **Choropleth**
4. Konfiguriere:
    - **EMS boundaries**: `World Countries`
    - **Data view**: `Kibana Sample Data eCommerce`
    - **Join field** (rechts): `geoip.country_iso_code`
5. Klicke auf **Add and continue**

### Aufgabe 2.2: Metrik konfigurieren

1. Unter **Joins**:
    - klicke **and use metric**
    - Aggregation: **sum**
    - Feld: `taxful_total_price`
2. Unter **Layer style**:
    - Wähle eine Farbpalette mit gutem Kontrast (z.B. **Green to Red**
      oder **Blues**)
3. Klicke auf **Save**

**Erwartetes Ergebnis:** Die Weltkarte zeigt Länder eingefärbt nach
Gesamtumsatz. Länder mit hohem Umsatz erscheinen in intensiverer Farbe.

### Aufgabe 2.3: Layer-Reihenfolge anpassen

1. Stelle sicher, dass der **Document-Layer** (Punkte) über dem
   **Choropleth-Layer** liegt
2. Falls nötig, ziehe den Choropleth-Layer im linken Panel nach unten
3. Reduziere ggf. die **Opacity** des Choropleth-Layers auf ca. 70%,
   damit die Punkte sichtbar bleiben

### Aufgabe 2.4: Karte speichern

Speichere die aktualisierte Karte.

---

## Teil 3: Tooltips und Interaktivität

Konfiguriere die Karte so, dass Nutzer per Hover und Klick Details
sehen können.

### Aufgabe 3.1: Tooltips für den Document-Layer konfigurieren

1. Klicke auf den Layer **Kibana Sample Data eCommerce** in der Legende
2. Scrolle zu **Tooltip fields**
3. Füge folgende Felder hinzu:
    - `customer_full_name` (Kundenname)
    - `taxful_total_price` (Bestellwert)
    - `category` (Produktkategorie)
    - `geoip.city_name` (Stadt)
    - `order_date` (Bestelldatum)
4. Klicke auf **Save & close**

**Test:** Bewege die Maus über einen Punkt auf der Karte. Ein Tooltip
sollte die konfigurierten Felder anzeigen.

### Aufgabe 3.2: Tooltips für den Choropleth-Layer prüfen

1. Klicke auf ein Land auf der Karte
2. Der Tooltip sollte automatisch den Ländernamen und den
   Umsatz (Sum of taxful_total_price) anzeigen

### Aufgabe 3.3: Karte speichern

Speichere die Karte erneut.

---

## Teil 4: Karte ins Dashboard integrieren

### Aufgabe 4.1: Karte zum Überblick-Dashboard hinzufügen

1. Navigiere zu **Analytics > Dashboard**
2. Öffne das Dashboard `Überblick - Geschäftsführung` im
   Bearbeitungsmodus
3. Klicke auf **Add from library**
4. Suche und wähle `Bestellungen Weltkarte`
5. Platziere die Karte im Dashboard:

```text
+---------------+---------------+----------------+
| Gesamtumsatz  | Anzahl Best.  | Durchschn. BW  |
+---------------+---------------+----------------+
| Umsatz über Zeit (Linie, volle Breite)         |
+------------------------+-----------------------+
| Top Produktkategorien  | Bestellungen nach     |
| (Balken)               | Region (Kreis)        |
+------------------------+-----------------------+
| Bestellungen Weltkarte (volle Breite)          |
+------------------------------------------------+
```

### Aufgabe 4.2: Cross-Filtering testen

1. Speichere das Dashboard
2. Wechsle in den **View**-Modus
3. Wähle im Control "Kategorie" den Wert **Women's Clothing**
4. Beobachte: Die Karte zeigt nun nur Bestellungen dieser Kategorie
5. Setze den Filter zurück

### Aufgabe 4.3: Dashboard speichern

Speichere das Dashboard mit der integrierten Karte.

---

## Teil 5: Cluster-Layer

Erstelle eine zweite Karte, die Bestellungen als **aggregierte Cluster**
darstellt - ideal für große Datenmengen, bei denen einzelne Punkte
unübersichtlich werden.

### Aufgabe 5.1: Neue Karte mit Cluster-Layer anlegen

1. Navigiere zu **Analytics > Maps**
2. Klicke auf **Create map**
3. Klicke auf **Add layer**
4. Wähle **Clusters**
5. Wähle den Data View **Kibana Sample Data eCommerce**
6. Kibana erkennt automatisch das Feld `geoip.location`
7. Klicke auf **Add and continue**

**Erwartetes Ergebnis:** Die Karte zeigt farbige Kreise unterschiedlicher
Größe. Jeder Kreis repräsentiert ein Cluster aus mehreren Bestellungen.

### Aufgabe 5.2: Cluster-Metrik konfigurieren

Standardmäßig zeigt der Cluster-Layer die **Anzahl** der Dokumente.
Ändere die Metrik auf den **Gesamtumsatz**:

1. Klicke auf den Cluster-Layer in der Legende
2. Unter **Metrics** klicke auf **Count**
3. Ändere die Aggregation auf **Sum**
4. Wähle das Feld `taxful_total_price`

**Erwartetes Ergebnis:** Die Cluster zeigen nun den aggregierten Umsatz.
Größere und dunklere Cluster stehen für höheren Umsatz.

### Aufgabe 5.3: Cluster-Styling anpassen

Unter **Layer style**:

- Wähle eine Farbpalette, die dir gefällt
- Setze bei **Symbol size** den Bereich auf Minimum `12` und Maximum `40`

Lass' dir nun einen Moment Zeit und probiere, was du hier alles
an Optionen einstellen kannst.

### Aufgabe 5.4: Zoom-Verhalten testen

1. Zoome in die Karte hinein (z.B. auf Europa)
2. Beobachte: Die Cluster teilen sich automatisch in kleinere
   Untergruppen auf
3. Zoome weiter hinein - ab einem bestimmten Zoom-Level
   werden einzelne Punkte sichtbar
4. Zoome wieder heraus, um die globale Verteilung zu sehen

### Aufgabe 5.5: Karte speichern

1. Klicke auf **Save**
2. Titel: `Bestellungen Cluster-Ansicht`
3. Wähle "Add To Dashboard -> None"

---

## Teil 6: Räumlicher Filter (Spatial Filtering)

Nutze die Zeichenwerkzeuge der Karte, um Daten **geografisch
einzugrenzen**. Der räumliche Filter wirkt auf alle Visualisierungen
im Dashboard.

### Aufgabe 6.1: Filter per Rechteck zeichnen

1. Öffne die Karte `Bestellungen Weltkarte` zur Bearbeitung
2. Klicke in der Toolbar links auf das Tool-Symbol
   (Schraubschlüssel)
3. Wähle **Draw bounds to filter data**
4. Zeichne ein Rechteck über **Europa**:
    - Klicke auf die linke obere Ecke (z.B. Portugal)
    - Ziehe zur rechten unteren Ecke (z.B. Türkei)
    - Lasse los

**Erwartetes Ergebnis:** Nur Bestellungen innerhalb des gezeichneten
Rechtecks werden angezeigt. In der **Filterleiste** oben erscheint
ein neuer Geo-Filter.

### Aufgabe 6.2: Filter im Dashboard testen

1. Navigiere zum Dashboard `Überblick - Geschäftsführung`
2. Öffne die eingebettete Karte
3. Zeichne erneut ein Rechteck (z.B. über Nordamerika)
4. **Beobachte:**
    - Alle Metriken (Umsatz, Bestellungen) zeigen nur Werte
      aus dieser Region
    - Das Liniendiagramm filtert sich ebenfalls
    - Das Kreisdiagramm zeigt nur den gewählten Kontinent
5. Entferne den Filter über das **X** in der Filterleiste

### Aufgabe 6.3: Filter per Polygon zeichnen

1. Gehe zurück zur Karte `Bestellungen Weltkarte`
2. Wähle das Werkzeug **Draw shape to filter data**
3. Zeichne ein Polygon um eine bestimmte Region, z.B. die
   **US-Ostküste**:
    - Klicke mehrere Punkte entlang der Küste
    - Schließe das Polygon mit Doppelklick
4. Beobachte die gefilterten Daten

**Erwartetes Ergebnis:** Nur Bestellungen innerhalb des Polygons
werden angezeigt. Diese Methode erlaubt präzisere räumliche
Eingrenzung als ein Rechteck.

### Aufgabe 6.4: Filter per Distanz

1. Entferne den vorherigen Geo-Filter
2. Wähle das Werkzeug **Draw a distance to filter data**
3. Klicke auf eine Stadt (z.B. New York)
4. Ziehe einen Radius auf (z.B. ca. 500 km)

**Erwartetes Ergebnis:** Nur Bestellungen innerhalb des Radius um den
gewählten Punkt werden angezeigt. Nützlich für standortbezogene
Analysen (z.B. "Alle Bestellungen im Umkreis von 500 km um unser
Lager").

### Aufgabe 6.5: Karte speichern

Speichere die Karte. Entferne alle Geo-Filter, damit die Karte
im Dashboard wieder alle Daten zeigt.

---

## Zusammenfassung

Du hast erfolgreich:

- [x] Eine **Karten-Visualisierung** mit Bestellungen als Punkten erstellt
- [x] Einen **Choropleth-Layer** für die Umsatzverteilung nach Land
  hinzugefügt
- [x] **Tooltips** mit Kundenname, Bestellwert und Kategorie konfiguriert
- [x] Die Karte ins **Überblick-Dashboard** integriert und
  Cross-Filtering getestet
- [x] Einen **Cluster-Layer** mit aggregiertem Umsatz und
  dynamischer Größe erstellt
- [x] **Dynamisches Styling** konfiguriert (Farbe nach Bestellwert,
  Größe nach Artikelanzahl)
- [x] **Räumliche Filter** per Rechteck, Polygon und Distanz angewendet
  und deren Auswirkung auf Dashboard-Visualisierungen getestet

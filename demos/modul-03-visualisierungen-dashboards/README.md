# Live-Demos: Modul 03 -- Visualisierungen & Dashboards

Visualisierungen mit dem Lens Editor erstellen, ein
Dashboard live zusammenbauen, das mitgelieferte
eCommerce-Dashboard als Inspiration zeigen und die
Sharing-Optionen demonstrieren.

| Demo   | Thema                        | Dauer  |
|:-------|:-----------------------------|:-------|
| Demo 1 | Lens Editor                  | 10 Min |
| Demo 2 | Dashboard erstellen          | 10 Min |
| Demo 3 | Kibana Sample Dashboard      | 5 Min  |
| Demo 4 | Dashboard teilen             | 5 Min  |

## Voraussetzungen

- Die zentrale Instanz aus Modul 01 läuft bereits
- Falls nicht: `docker compose up -d` in diesem
  Verzeichnis ausführen

Kibana: <http://localhost:5601>

---

## Demo 1: Lens Editor live zeigen

Lens ist der primäre Visualisierungseditor in
Kibana. Er bietet Drag-and-Drop und automatische
Vorschläge.

### Schritt 1 -- Lens öffnen

1. Navigiere zu **Visualize Library**
   (Hamburger-Menü --> **Analytics** -->
   **Visualize Library**)
2. Klicke auf **Create visualization**
3. Wähle **Lens** als Editor

### Schritt 2 -- Data View auswählen

1. Stelle sicher, dass der Data View
   **kibana_sample_data_ecommerce** ausgewählt ist
2. Passe den Zeitraum an, sodass Daten sichtbar
   sind

### Schritt 3 -- Balkendiagramm erstellen

1. Ziehe das Feld `category.keyword` aus der
   linken Feldliste auf die Arbeitsfläche
2. Lens schlägt automatisch einen Diagrammtyp vor
3. Wechsle ggf. zum Typ **Bar vertical stacked**

> **Zeigen:** Lens erkennt automatisch, dass es
> sich um ein Kategorie-Feld handelt, und schlägt
> eine passende Darstellung vor.

### Schritt 4 -- Diagrammtyp wechseln

Wechsle zwischen verschiedenen Typen und zeige
die Unterschiede:

| Diagrammtyp            | Einsatzzweck           |
|:------------------------|:-----------------------|
| Bar vertical stacked    | Kategorien vergleichen |
| Pie                     | Anteile zeigen         |
| Line                    | Trends über Zeit       |
| Donut                   | Anteile (alternativ)   |
| Treemap                 | Hierarchien            |

### Schritt 5 -- Metrik hinzufügen

1. Klicke auf die Y-Achse (Metrik)
2. Ändere von **Count** auf **Sum** -->
   Feld: `taxful_total_price`
3. Gib als Label ein: `Umsatz`

> **Zeigen:** Jetzt zeigt das Diagramm den Umsatz
> pro Kategorie statt der Anzahl der Bestellungen.

### Schritt 6 -- Visualisierung speichern

1. Klicke auf **Save** oben rechts
2. Gib als Titel ein:
   `Umsatz nach Kategorie`
3. Klicke auf **Save**

**Diskussionspunkte:**

- Warum Lens und nicht die älteren Visualization-
  Editoren (TSVB, Aggregation-based)?
- Wann stößt Lens an Grenzen?

---

## Demo 2: Dashboard erstellen

### Schritt 1 -- Neues Dashboard anlegen

1. Navigiere zu **Dashboard**
   (Hamburger-Menü --> **Analytics** -->
   **Dashboard**)
2. Klicke auf **Create dashboard**

### Schritt 2 -- Gespeicherte Visualisierung hinzufügen

1. Klicke auf **Add from library**
2. Wähle die zuvor erstellte Visualisierung
   `Umsatz nach Kategorie`
3. Sie erscheint auf dem Dashboard

### Schritt 3 -- Weitere Visualisierung inline erstellen

1. Klicke auf **Create visualization**
2. Erstelle ein Liniendiagramm:
   - X-Achse: `order_date` (Date Histogram)
   - Y-Achse: **Count** (Anzahl Bestellungen)
3. Klicke auf **Save and return**

### Schritt 4 -- KPI-Panel hinzufügen

1. Klicke erneut auf **Create visualization**
2. Wähle den Typ **Metric**
3. Konfiguriere:
   - Metrik: **Sum** von `taxful_total_price`
   - Label: `Gesamtumsatz`
4. Klicke auf **Save and return**

### Schritt 5 -- Layout anpassen

1. Verschiebe die Panels per Drag-and-Drop
2. Ändere die Größe durch Ziehen an den Ecken
3. Ordne die Panels sinnvoll an:
   - KPI oben
   - Liniendiagramm in der Mitte
   - Balkendiagramm unten

> **Zeigen:** Das Layout ist frei konfigurierbar.
> Panels rasten automatisch ein.

### Schritt 6 -- Filter hinzufügen

1. Klicke auf **Add filter**
2. Erstelle einen Filter:
   - Feld: `geoip.country_iso_code`
   - Operator: **is**
   - Wert: `US`
3. Alle Panels aktualisieren sich gleichzeitig

> **Zeigen:** Filter wirken auf das gesamte
> Dashboard -- alle Panels reagieren sofort.

### Schritt 7 -- Dashboard speichern

1. Klicke auf **Save**
2. Gib als Titel ein:
   `eCommerce Übersicht`
3. Klicke auf **Save**

**Diskussionspunkte:**

- Wie viele Panels sollte ein Dashboard maximal
  haben?
- Wann erstellt man mehrere Dashboards statt
  eines großen?

---

## Demo 3: Kibana Sample Dashboard zeigen

Das Sample-Dashboard wurde automatisch mit den
eCommerce-Daten installiert und dient als
Inspiration.

### Schritt 1 -- Sample Dashboard öffnen

1. Navigiere zu **Dashboard**
2. Suche nach `[eCommerce] Revenue Dashboard`
3. Öffne das Dashboard

### Schritt 2 -- Panels durchgehen

Zeige die verschiedenen Panel-Typen:

| Panel                        | Typ             |
|:-----------------------------|:----------------|
| Gesamtumsatz                 | Metric          |
| Umsatz über Zeit             | Line            |
| Umsatz nach Kategorie        | Bar             |
| Bestellungen auf Weltkarte   | Map             |
| Top-Produkte                 | Table / Tagcloud|
| Markdown-Panel               | Markdown        |

> **Zeigen:** Das Dashboard nutzt verschiedene
> Visualisierungstypen, um einen umfassenden
> Überblick zu geben. Das Markdown-Panel zeigt,
> dass man auch erklärenden Text einbetten kann.

### Schritt 3 -- Interaktivität demonstrieren

1. Klicke auf einen Balken im Diagramm -->
   **Filter for value** erscheint
2. Zeige, wie sich alle anderen Panels
   aktualisieren
3. Entferne den Filter wieder über das
   Kreuz-Symbol

> **Zeigen:** Dashboards sind interaktiv -- ein
> Klick auf ein Element filtert das gesamte
> Dashboard. Das ist ein mächtiges Werkzeug für
> die explorative Datenanalyse.

**Diskussionspunkte:**

- Wie könnte ein Dashboard für euren Use Case
  aussehen?
- Welche Panels wären für eure Daten sinnvoll?

---

## Demo 4: Dashboard teilen

### Schritt 1 -- Share-Menü öffnen

1. Öffne das Dashboard
   `[eCommerce] Revenue Dashboard`
2. Klicke oben rechts auf **Share**

### Schritt 2 -- Sharing-Optionen zeigen

| Option              | Beschreibung                  |
|:--------------------|:------------------------------|
| **PDF Reports**     | Dashboard als PDF exportieren |
| **PNG Reports**     | Dashboard als PNG exportieren |
| **CSV Reports**     | Daten als CSV (pro Panel)     |
| **Get links**       | Direkte Links zum Dashboard   |
| **Embed code**      | iFrame-Code zum Einbetten     |

### Schritt 3 -- Link generieren

1. Klicke auf **Get links**
2. Kopiere den Link
3. Öffne den Link in einem neuen Tab

> **Zeigen:** Der Link enthält den aktuellen
> Zeitfilter und alle aktiven Filter. So kann man
> eine bestimmte Ansicht mit Kollegen teilen.

### Schritt 4 -- PDF-Export zeigen

1. Klicke auf **PDF Reports** -->
   **Generate PDF**
2. Kibana erstellt den Report im Hintergrund

> **Zeigen:** PDF- und PNG-Export benötigen die
> Kibana Reporting-Funktion. In der Basisversion
> ist CSV-Export verfügbar, PDF/PNG erfordern eine
> Lizenz (Gold oder höher).

**Diskussionspunkte:**

- Wann PDF vs. direkte Dashboard-Links?
- Wie kann man Reports automatisiert erstellen?
  (Watcher, Kibana Alerting)
- Sicherheitsaspekte beim Einbetten von
  Dashboards (iFrame)

---

## Ergebnis

Nach dieser Demo:

- Die Teilnehmer können Visualisierungen mit
  Lens erstellen
- Ein Dashboard ist live zusammengebaut worden
- Das Sample Dashboard dient als Referenz
- Die Sharing-Optionen sind bekannt

## Aufräumen

Am Ende des Schulungstags die zentrale Instanz
herunterfahren (im Verzeichnis von Modul 01):

```bash
docker compose down -v
```

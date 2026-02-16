# Modul 03: Visualisierungen & Dashboards

## Übungsziel

Am Ende dieser Übung hast du:

- Verschiedene Visualisierungstypen in Kibana Lens erstellt
- Ein Überblick-Dashboard für die Geschäftsführung gebaut
- Ein Controlling-Dashboard mit KPIs und Trendvergleichen
  zusammengestellt
- Ein Produktmanagement-Dashboard mit Hersteller- und
  Rabattanalyse erstellt
- Fortgeschrittene Techniken wie Formeln, Referenzlinien
  und Time Shift angewendet
- Dashboards mit Controls, Drilldowns und Cross-Filtering
  interaktiv gestaltet

**Geschätzte Dauer:** 120 Minuten

**Datenbasis:** Kibana Sample eCommerce Orders
(`kibana_sample_data_ecommerce`)

---

## Voraussetzungen

- Browser (Chrome oder Firefox)
- URL zur Kibana-Instanz (vom Trainer bereitgestellt)
- **Modul 01 und 02 abgeschlossen** -- E-Commerce-Daten
  geladen, Discover und KQL bekannt

### Zeitraum einstellen

Stelle zu Beginn sicher, dass der Zeitfilter auf
**Last 7 days** steht. Dieser Zeitraum gilt für alle
Visualisierungen, sofern nicht anders angegeben.

### Verfügbare Felder im eCommerce-Datensatz

Die folgenden Felder wirst du in den Übungen verwenden:

| Feld | Typ | Beschreibung |
| :--- | :--- | :--- |
| `order_date` | date | Bestellzeitpunkt |
| `taxful_total_price` | number | Bestellwert (brutto) |
| `taxless_total_price` | number | Bestellwert (netto) |
| `total_quantity` | number | Anzahl Artikel |
| `total_unique_products` | number | Verschiedene Produkte |
| `products.discount_percentage` | number | Rabatt in Prozent |
| `products.discount_amount` | number | Rabatt in EUR |
| `products.price` | number | Einzelpreis Produkt |
| `products.quantity` | number | Menge pro Produkt |
| `category` | keyword | Produktkategorie(n) |
| `manufacturer` | keyword | Hersteller |
| `customer_full_name` | text | Kundenname |
| `customer_gender` | keyword | Geschlecht (MALE/FEMALE) |
| `customer_id` | keyword | Kundennummer |
| `day_of_week` | keyword | Wochentag (Monday...) |
| `day_of_week_i` | number | Wochentag als Zahl (0-6) |
| `currency` | keyword | Währung (EUR) |
| `geoip.city_name` | keyword | Stadt |
| `geoip.region_name` | keyword | Region |
| `geoip.country_iso_code` | keyword | Ländercode (DE, US...) |
| `geoip.continent_name` | keyword | Kontinent |
| `geoip.location` | geo_point | Koordinaten |

---

## Teil 1: Grundlegende Visualisierungen erstellen

Bevor du Dashboards baust, erstellst du die wichtigsten
Grundbausteine in der **Visualize Library**.

### Aufgabe 1.1: Metrik -- Gesamtumsatz

1. Navigiere zu **Analytics > Visualize Library**
2. Klicke auf **Create visualization** und wähle **Lens**
3. Stelle sicher, dass der Data View
   **kibana_sample_data_ecommerce** ausgewählt ist
4. Wähle als Visualisierungstyp **Metric**
5. Ziehe `taxful_total_price` in den Bereich
   **Primary metric**
6. Ändere die Funktion von "Median" auf **Sum**
7. Speichere als: `Gesamtumsatz`

### Aufgabe 1.2: Metrik -- Anzahl Bestellungen

1. Neue Lens-Visualisierung, Typ **Metric**
2. Ziehe ein beliebiges Feld in **Primary metric**
3. Ändere die Funktion auf **Count**
4. Speichere als: `Anzahl Bestellungen`

### Aufgabe 1.3: Metrik -- Durchschnittlicher Bestellwert

1. Neue Lens-Visualisierung, Typ **Metric**
2. Ziehe `taxful_total_price` in **Primary metric**
3. Ändere die Funktion auf **Average**
4. Speichere als: `Durchschn. Bestellwert`

### Aufgabe 1.4: Balkendiagramm -- Top Produktkategorien

1. Neue Lens-Visualisierung, Typ **Bar horizontal**
2. Horizontale Achse: beliebiges Feld mit Funktion
   **Count**
3. Vertikale Achse: `category` mit Funktion
   **Top values**, Number of values: `10`
4. Speichere als: `Top Produktkategorien`

### Aufgabe 1.5: Liniendiagramm -- Umsatz über Zeit

1. Neue Lens-Visualisierung, Typ **Line**
2. X-Achse: `order_date` (Date histogram, Auto)
3. Y-Achse: `taxful_total_price` mit Funktion **Sum**
4. Speichere als: `Umsatz über Zeit`

### Aufgabe 1.6: Kreisdiagramm -- Bestellungen nach Region

1. Neue Lens-Visualisierung, Typ **Pie**
2. Slice by: `geoip.continent_name`
   (Top values, Number of values: `7`)
3. Metrik: **Count**
4. Speichere als: `Bestellungen nach Region`

---

## Teil 2: Überblick-Dashboard für die Geschäftsführung

Erstelle ein Dashboard, das die wichtigsten Kennzahlen
auf einen Blick zeigt -- geeignet für ein
Geschäftsführungs-Meeting.

### Schritt 2.1: Dashboard erstellen

1. Navigiere zu **Analytics > Dashboard**
2. Klicke auf **Create dashboard**

### Schritt 2.2: KPI-Zeile aufbauen

Füge über **Add from library** die drei Metriken hinzu:

- `Gesamtumsatz`
- `Anzahl Bestellungen`
- `Durchschn. Bestellwert`

Ordne sie in einer **horizontalen Reihe** oben im
Dashboard an. Mache die Panels klein -- sie sollen
nur die Kennzahl anzeigen.

### Schritt 2.3: Diagramme hinzufügen

Füge die restlichen Visualisierungen hinzu:

- `Umsatz über Zeit`
- `Top Produktkategorien`
- `Bestellungen nach Region`

### Schritt 2.4: Layout anordnen

```
+---------------+---------------+----------------+
| Gesamtumsatz  | Anzahl Best.  | Durchschn. BW  |
+---------------+---------------+----------------+
| Umsatz über Zeit (Linie, volle Breite)         |
+------------------------+-----------------------+
| Top Produktkategorien  | Bestellungen nach     |
| (Balken)               | Region (Kreis)        |
+------------------------+-----------------------+
```

### Schritt 2.5: Markdown-Panel hinzufügen

Füge ein **Informationspanel** als Kontext hinzu:

1. Klicke auf **Create visualization**
2. Wähle den Typ **Text** (Markdown)
3. Gib folgenden Text ein:

```markdown
### E-Commerce Überblick
Datenquelle: Mustertech Online-Shop
Aktualisierung: Echtzeit
Kontakt: controlling@mustertech.de
```

4. Platziere das Panel oben links oder als
   schmale Spalte am linken Rand

### Schritt 2.6: Dashboard speichern

1. Klicke auf **Save**
2. Titel: `Überblick - Geschäftsführung`
3. Beschreibung: "KPIs und Trends für das
   Management-Meeting"

---

## Teil 3: Controls und Interaktivität

Mache das Überblick-Dashboard interaktiv, damit
Kolleginnen und Kollegen selbst filtern können.

### Aufgabe 3.1: Kategorie-Filter hinzufügen

1. Klicke auf **Edit** im Dashboard
2. Klicke auf **Controls** in der Toolbar
3. Klicke auf **Add control** im Controls-Panel
4. Konfiguriere:
   - Feld: `category`
   - Typ: **Options list**
   - Bezeichnung: `Kategorie`
5. Speichere

**Test:** Wähle "Women's Clothing" aus dem Dropdown.
Alle Visualisierungen sollten sich filtern.

### Aufgabe 3.2: Hersteller-Filter hinzufügen

1. Klicke auf **Add control** (im Controls-Panel)
2. Konfiguriere:
   - Feld: `manufacturer`
   - Typ: **Options list**
   - Bezeichnung: `Hersteller`

**Test:** Wähle gleichzeitig eine Kategorie und
einen Hersteller. Beobachte, wie die Kombination
die Daten eingrenzt.

### Aufgabe 3.3: Preisbereich-Filter hinzufügen

1. Klicke auf **Add control**
2. Konfiguriere:
   - Feld: `taxful_total_price`
   - Typ: **Range slider**
   - Bezeichnung: `Bestellwert`

**Test:** Stelle den Bereich auf 100-500 EUR ein
und beobachte die Veränderungen im Dashboard.

### Aufgabe 3.4: Cross-Filtering testen

1. Setze alle Controls zurück (Clear)
2. Klicke im Balkendiagramm auf den Balken
   "Women's Clothing"
3. Wähle **Filter for value** (Plus-Symbol)

**Beobachte:**

- Alle Metriken zeigen nur Werte für diese Kategorie
- Das Liniendiagramm zeigt den Umsatzverlauf nur
  für Women's Clothing
- Das Kreisdiagramm zeigt die regionale Verteilung
  nur für diese Kategorie
- In der Filterleiste erscheint ein neuer Filter

4. Entferne den Filter wieder über das **X** in
   der Filterleiste

### Aufgabe 3.5: Dashboard speichern

Speichere das Dashboard mit den Controls.

---

## Teil 4: Controlling-Dashboard

Erstelle ein zweites Dashboard speziell für das
Controlling -- mit Fokus auf finanzielle Kennzahlen,
Trends und Vergleiche.

### Schritt 4.1: Neues Dashboard erstellen

1. Navigiere zu **Analytics > Dashboard**
2. Klicke auf **Create dashboard**

### Schritt 4.2: KPI mit Trendvergleich (Vorwoche)

Erstelle eine Metrik, die den **Umsatz dieser Woche
mit der Vorwoche** vergleicht:

1. Klicke auf **Create visualization** und wähle
   **Lens** mit Typ **Metric**
2. Ziehe `taxful_total_price` in **Primary metric**
3. Ändere die Funktion auf **Sum**
4. Klicke auf **Add advanced** (oder **Add** unter
   der Metrik-Konfiguration)
5. Füge einen **Time shift** hinzu:
   - Wähle **Sum of taxful_total_price**
   - Klicke auf **Time shift** und gib `1w` ein
6. Konfiguriere die Metrik so, dass der
   **Vorwochen-Wert als Vergleich** angezeigt wird

**Erwartetes Ergebnis:** Die Metrik zeigt den
aktuellen Umsatz und darunter den prozentualen
Unterschied zur Vorwoche (z.B. "+12%" oder "-5%").

7. Speichere als: `Umsatz vs. Vorwoche`

### Schritt 4.3: Bestellanzahl mit Trendvergleich

Wiederhole das gleiche Prinzip für die Bestellanzahl:

1. Neue Lens-Metrik mit **Count**
2. Füge einen Time Shift von `1w` hinzu
3. Speichere als: `Bestellungen vs. Vorwoche`

### Schritt 4.4: Umsatz nach Kategorie (Balken)

Erstelle ein vertikales Balkendiagramm, das den
**Umsatz pro Kategorie** zeigt (nicht die Anzahl):

1. Neue Lens-Visualisierung, Typ **Bar vertical**
2. X-Achse: `category` (Top values, 8)
3. Y-Achse: `taxful_total_price` mit **Sum**
4. Sortierung: nach Metrik absteigend
5. Speichere als: `Umsatz nach Kategorie`

**Frage:** Welche Kategorie hat den höchsten Umsatz?
Ist das auch die Kategorie mit den meisten
Bestellungen (vgl. dein erstes Balkendiagramm)?

### Schritt 4.5: Brutto vs. Netto Vergleich

Erstelle ein Liniendiagramm mit **zwei Linien**,
das Brutto- und Nettoumsatz über die Zeit vergleicht:

1. Neue Lens-Visualisierung, Typ **Line**
2. X-Achse: `order_date` (Date histogram)
3. Erste Y-Achse: `taxful_total_price` mit **Sum**
   -- benenne sie "Brutto"
4. Klicke auf **Add layer** oder ziehe ein
   weiteres Feld auf die Y-Achse:
   `taxless_total_price` mit **Sum**
   -- benenne sie "Netto"
5. Speichere als: `Brutto vs. Netto`

**Erwartetes Ergebnis:** Zwei Linien, die den
Brutto- und Nettoumsatz im Zeitverlauf zeigen.
Die Differenz entspricht der Steuer.

### Schritt 4.6: Umsatzverteilung nach Land (Tabelle)

Erstelle eine Tabelle mit den **Top 15 Ländern
nach Umsatz**:

1. Neue Lens-Visualisierung, Typ **Table**
2. Spalten:

| Feld | Funktion | Anzeigename |
| :--- | :--- | :--- |
| `geoip.country_iso_code` | Top values (15) | Land |
| `taxful_total_price` | Sum | Umsatz |
| `taxful_total_price` | Count | Bestellungen |
| `taxful_total_price` | Average | Durchschn. BW |

3. Sortiere nach Umsatz absteigend
4. Speichere als: `Umsatz nach Land`

### Schritt 4.7: Dashboard zusammenstellen

Ordne die Visualisierungen im Controlling-Dashboard:

```
+-----------------------+-----------------------+
| Umsatz vs. Vorwoche   | Bestellungen vs. Vorw.|
| (Metrik mit Trend)    | (Metrik mit Trend)    |
+-----------------------+-----------------------+
| Umsatz nach Kategorie (Balken, volle Breite)  |
+------------------------------------------------+
| Brutto vs. Netto       | Umsatz nach Land      |
| (Liniendiagramm)       | (Tabelle)             |
+-----------------------+-----------------------+
```

### Schritt 4.8: Controls hinzufügen

Füge dem Controlling-Dashboard folgende Controls
hinzu:

1. **Kategorie** (Options list auf `category`)
2. **Land** (Options list auf
   `geoip.country_iso_code`)
3. **Bestellwert** (Range slider auf
   `taxful_total_price`)

### Schritt 4.9: Dashboard speichern

1. Titel: `Controlling - Umsatzanalyse`
2. Beschreibung: "Finanzielle Kennzahlen mit
   Trendvergleich und Länderanalyse"

---

## Teil 5: Produktmanagement-Dashboard

Erstelle ein drittes Dashboard für das
Produktmanagement -- mit Fokus auf Hersteller,
Rabatte und Warenkorbanalyse.

### Schritt 5.1: Neues Dashboard erstellen

1. **Analytics > Dashboard > Create dashboard**

### Schritt 5.2: Top-Hersteller nach Umsatz

Erstelle ein horizontales Balkendiagramm mit den
**umsatzstärksten Herstellern**:

1. Neue Lens-Visualisierung, Typ **Bar horizontal**
2. Vertikale Achse: `manufacturer`
   (Top values, 10)
3. Horizontale Achse: `taxful_total_price`
   mit **Sum**
4. Speichere als: `Top Hersteller`

### Schritt 5.3: Hersteller-Performance über Zeit

Erstelle ein Liniendiagramm, das den **Umsatz
der Top-5-Hersteller über die Zeit** vergleicht:

1. Neue Lens-Visualisierung, Typ **Line**
2. X-Achse: `order_date` (Date histogram)
3. Y-Achse: `taxful_total_price` mit **Sum**
4. Ziehe `manufacturer` auf **Break down by**
5. Klicke auf die Break-down-Konfiguration und
   setze **Number of values** auf `5`
6. Speichere als: `Hersteller-Trend`

### Schritt 5.4: Warenkorbgröße analysieren

Erstelle ein Balkendiagramm, das zeigt, wie viele
Artikel typischerweise pro Bestellung bestellt
werden:

1. Neue Lens-Visualisierung, Typ **Bar vertical**
2. X-Achse: `total_quantity` mit Funktion
   **Ranges**
3. Konfiguriere folgende Bereiche:
   - 1-1 (Einzelartikel)
   - 2-3
   - 4-5
   - 6+
4. Y-Achse: **Count**
5. Speichere als: `Warenkorbgröße`

> **Hinweis:** Falls Ranges nicht verfügbar ist,
> nutze `total_quantity` mit **Top values** (10).

### Schritt 5.5: Rabattanalyse -- Donut-Diagramm

Erstelle ein Donut-Diagramm, das die Verteilung
der Rabatte zeigt:

1. Neue Lens-Visualisierung, Typ **Donut**
2. Slice by: `products.discount_percentage`
   mit **Ranges**:
   - 0-0: "Kein Rabatt"
   - 1-10: "Bis 10%"
   - 11-20: "11-20%"
   - 21-100: "Über 20%"
3. Metrik: **Count**
4. Speichere als: `Rabattverteilung`

> **Hinweis:** Falls Ranges auf diesem Feld nicht
> funktioniert, nutze stattdessen **Top values**
> auf `products.discount_percentage`.

### Schritt 5.6: Wochentag-Analyse (Heatmap)

Erstelle eine Heatmap, die zeigt, an welchen
**Wochentagen** das höchste Bestellvolumen liegt:

1. Neue Lens-Visualisierung, Typ **Heat map**
2. X-Achse: `day_of_week` (Top values, 7)
3. Y-Achse: `category` (Top values, 6)
4. Metrik: **Count** (Farbskala)
5. Speichere als: `Bestellungen Wochentag x Kategorie`

**Erwartetes Ergebnis:** Eine farbige Matrix, die
zeigt, welche Kategorien an welchen Tagen besonders
gefragt sind. Dunklere Farben = mehr Bestellungen.

### Schritt 5.7: Geschlechterverteilung pro Kategorie

Erstelle ein gestapeltes Balkendiagramm, das die
**Bestellungen nach Kategorie, aufgeteilt nach
Geschlecht** zeigt:

1. Neue Lens-Visualisierung, Typ **Bar vertical
   stacked**
2. X-Achse: `category` (Top values, 8)
3. Y-Achse: **Count**
4. Ziehe `customer_gender` auf **Break down by**
5. Speichere als: `Kategorie nach Geschlecht`

### Schritt 5.8: Dashboard zusammenstellen

```
+---------------------------+---------------------+
| Top Hersteller (Balken)   | Rabattverteilung    |
|                           | (Donut)             |
+---------------------------+---------------------+
| Hersteller-Trend (Linie, volle Breite)          |
+---------------------------+---------------------+
| Warenkorbgröße            | Kategorie nach      |
| (Balken)                  | Geschlecht (Balken) |
+---------------------------+---------------------+
| Bestellungen Wochentag x Kategorie (Heatmap)    |
+-------------------------------------------------+
```

### Schritt 5.9: Controls hinzufügen

1. **Hersteller** (Options list auf `manufacturer`)
2. **Kategorie** (Options list auf `category`)
3. **Geschlecht** (Options list auf
   `customer_gender`)

### Schritt 5.10: Dashboard speichern

1. Titel: `Produktmanagement - Sortimentsanalyse`
2. Beschreibung: "Hersteller-Performance, Rabatte,
   Warenkörbe und Kundenstruktur"

---

## Teil 6: Fortgeschrittene Lens-Techniken

Erweitere die bestehenden Dashboards mit
fortgeschrittenen Visualisierungen.

### Aufgabe 6.1: Formel -- Steueranteil berechnen

Erstelle eine Metrik, die den **Steueranteil**
am Gesamtumsatz berechnet:

1. Neue Lens-Visualisierung, Typ **Metric**
2. Statt ein Feld zu ziehen, klicke auf
   **Primary metric** und wähle **Formula**
3. Gib folgende Formel ein:

```
1 - sum(taxless_total_price) / sum(taxful_total_price)
```

4. Formatiere die Ausgabe als **Percent**
   (unter Format in der Konfiguration)
5. Speichere als: `Steueranteil`
6. Füge die Metrik zum Controlling-Dashboard hinzu

### Aufgabe 6.2: Formel -- Umsatz pro Bestellung

Erstelle eine Metrik mit einer Formel für den
durchschnittlichen Umsatz pro Bestellung:

1. Neue Lens-Visualisierung, Typ **Metric**
2. Wähle **Formula** und gib ein:

```
sum(taxful_total_price) / count()
```

3. Formatiere als **Number** mit 2 Dezimalstellen
4. Speichere als: `Umsatz pro Bestellung (Formel)`

> **Frage:** Vergleiche das Ergebnis mit der
> Average-Metrik aus Aufgabe 1.3. Sind die Werte
> identisch? Warum (nicht)?

### Aufgabe 6.3: Referenzlinie im Umsatzverlauf

Füge dem Liniendiagramm "Umsatz über Zeit" eine
**Referenzlinie** für den Durchschnitt hinzu:

1. Öffne die Visualisierung `Umsatz über Zeit`
   zur Bearbeitung
2. Im rechten Konfigurationspanel, suche
   **Reference lines** (oder klicke auf das
   Layer-Menü)
3. Klicke auf **Add reference line**
4. Wähle den Typ **Static value** und berechne den
   durchschnittlichen Tagesumsatz (oder nutze
   **Average** als dynamische Referenzlinie)
5. Benenne die Linie "Tagesdurchschnitt"
6. Wähle eine gestrichelte Linie in einer
   auffälligen Farbe (z.B. Rot)
7. Speichere die Änderung

**Erwartetes Ergebnis:** Das Liniendiagramm zeigt
den Umsatzverlauf mit einer horizontalen
Durchschnittslinie -- sofort erkennbar, welche
Tage über- oder unterdurchschnittlich liefen.

### Aufgabe 6.4: Umsatz mit Vorwochenvergleich (Linie)

Erstelle ein Liniendiagramm, das den **aktuellen
Umsatz neben dem der Vorwoche** zeigt:

1. Neue Lens-Visualisierung, Typ **Line**
2. X-Achse: `order_date` (Date histogram, 1 day)
3. Y-Achse 1: `taxful_total_price` mit **Sum**
   -- benenne sie "Aktuelle Woche"
4. Klicke auf die Y-Achse und wähle **Add** oder
   **Duplicate**
5. Für die zweite Linie: Aktiviere **Time shift**
   und gib `1w` ein
   -- benenne sie "Vorwoche"
6. Speichere als: `Umsatzvergleich Woche`
7. Füge die Visualisierung zum
   Controlling-Dashboard hinzu

### Aufgabe 6.5: Top-Kunden-Tabelle

Erstelle eine detaillierte Tabelle der
**wertvollsten Kunden**:

1. Neue Lens-Visualisierung, Typ **Table**
2. Konfiguriere die Spalten:

| Feld | Funktion | Anzeigename |
| :--- | :--- | :--- |
| `customer_full_name` | Top values (15) | Kunde |
| `taxful_total_price` | Sum | Gesamtumsatz |
| `taxful_total_price` | Count | Bestellungen |
| `taxful_total_price` | Average | Durchschn. BW |
| `total_quantity` | Sum | Artikel gesamt |

3. Sortiere nach Gesamtumsatz absteigend
4. Speichere als: `Top Kunden`
5. Füge die Tabelle zum Controlling-Dashboard hinzu

---

## Teil 7: Dashboard-Drilldowns

Verbinde die drei Dashboards miteinander, sodass
Nutzer per Klick zwischen Überblick, Controlling
und Produktmanagement navigieren können.

### Aufgabe 7.1: Drilldown vom Überblick zum Controlling

1. Öffne das Dashboard `Überblick - Geschäftsführung`
   im Bearbeitungsmodus
2. Klicke auf die drei Punkte am Panel
   `Umsatz über Zeit`
3. Wähle **Create drilldown**
4. Wähle **Go to dashboard**
5. Ziel-Dashboard: `Controlling - Umsatzanalyse`
6. Speichere

**Test:** Klicke im Überblick-Dashboard auf einen
Datenpunkt im Liniendiagramm. Du solltest zum
Controlling-Dashboard navigiert werden.

### Aufgabe 7.2: Drilldown vom Überblick zum Produktmanagement

1. Klicke auf die drei Punkte am Panel
   `Top Produktkategorien`
2. **Create drilldown > Go to dashboard**
3. Ziel: `Produktmanagement - Sortimentsanalyse`

**Test:** Klicke im Balkendiagramm auf eine
Kategorie. Du solltest zum Produktmanagement-
Dashboard navigiert werden, gefiltert auf diese
Kategorie.

### Aufgabe 7.3: Navigation testen

Teste den kompletten Navigationsfluss:

1. Starte im `Überblick - Geschäftsführung`
2. Klicke auf "Women's Clothing" im Balkendiagramm
   -- du landest im Produktmanagement-Dashboard,
   gefiltert auf Women's Clothing
3. Gehe zurück (Browser-Zurück-Button)
4. Klicke auf einen Datenpunkt im Umsatzverlauf
   -- du landest im Controlling-Dashboard
5. Gehe zurück zum Überblick

> **Tipp:** Mit Drilldowns kannst du eine
> Dashboard-Hierarchie aufbauen: Überblick als
> Einstieg, Detail-Dashboards eine Ebene tiefer.

---

## Teil 8: Dashboard finalisieren und teilen

### Aufgabe 8.1: Dashboards im Vollbild prüfen

Öffne jedes der drei Dashboards im Vollbildmodus
(**Full screen** oder Taste `F`) und prüfe:

- [ ] Sind alle Panels sichtbar ohne zu scrollen?
- [ ] Sind die Titel aussagekräftig?
- [ ] Sind die Farben konsistent?
- [ ] Funktionieren die Controls?
- [ ] Funktioniert Cross-Filtering?

### Aufgabe 8.2: Dashboard-Link teilen

1. Öffne das Überblick-Dashboard
2. Klicke auf **Share** in der Toolbar
3. Wähle **Get link**
4. Kopiere den Link

> Dieser Link enthält den aktuellen Zeitfilter
> und alle gesetzten Filter. Kollegen sehen
> exakt die gleiche Ansicht.

### Aufgabe 8.3: PDF-Export

1. Klicke auf **Share**
2. Wähle **PDF Reports** (oder **PNG**)
3. Klicke auf **Generate PDF**
4. Warte, bis der Bericht erstellt ist
5. Lade das PDF herunter

> **Hinweis:** Der PDF-Export erfordert eine
> entsprechende Lizenz (Platinum oder höher).
> Falls nicht verfügbar, überspringe diese Aufgabe.

---

## Zusammenfassung

Du hast erfolgreich:

- [x] Grundlegende Visualisierungen erstellt
      (Metriken, Balken, Linien, Kreis)
- [x] Ein **Überblick-Dashboard** für die
      Geschäftsführung gebaut mit KPIs,
      Markdown-Panel und Controls
- [x] Ein **Controlling-Dashboard** mit
      Trendvergleichen (Time Shift), Brutto/Netto-
      Vergleich und Länder-Tabelle erstellt
- [x] Ein **Produktmanagement-Dashboard** mit
      Hersteller-Analyse, Heatmap,
      Geschlechterverteilung und Rabattanalyse gebaut
- [x] **Formeln** in Lens verwendet
      (Steueranteil, Umsatz pro Bestellung)
- [x] **Referenzlinien** und **Vorwochenvergleiche**
      konfiguriert
- [x] **Drilldowns** zwischen Dashboards
      eingerichtet
- [x] Dashboards **geteilt** (Link, PDF)

Du hast jetzt das Handwerkszeug, um eigenständig
komplexe Dashboards für verschiedene Stakeholder
und Fragestellungen in Kibana zu erstellen.

---

## Troubleshooting

### Visualisierung zeigt "No results found"

**Symptom:** Eine Visualisierung ist leer.

**Lösung:**

1. Prüfe den **Zeitfilter** -- ist
   "Last 7 days" eingestellt?
2. Prüfe den **Data View**
   (kibana_sample_data_ecommerce)
3. Prüfe die **Filterleiste** auf aktive Filter
4. Wechsle zu **Discover** und prüfe, ob dort
   Daten vorhanden sind

### Formel zeigt Fehler

**Symptom:** Die Formel in Lens wird rot
unterstrichen oder zeigt "Error".

**Lösung:**

1. Prüfe die Feldnamen -- sie müssen exakt
   stimmen (Groß-/Kleinschreibung beachten)
2. Prüfe die Klammern -- jede öffnende Klammer
   braucht eine schließende
3. Verwende die **Autovervollständigung** von
   Lens, um korrekte Feldnamen einzusetzen

### Time Shift zeigt keine Vergleichswerte

**Symptom:** Die Metrik mit Time Shift zeigt
keinen Trend-Pfeil oder keinen Vergleichswert.

**Lösung:**

1. Stelle sicher, dass der Zeitraum groß genug
   ist (bei `1w` Shift mindestens "Last 7 days")
2. Prüfe, ob im verschobenen Zeitraum Daten
   vorhanden sind (der eCommerce-Datensatz
   enthält Daten für die letzten Wochen)

### Drilldown funktioniert nicht

**Symptom:** Beim Klick auf ein Panel passiert
nichts oder es erscheint kein Drilldown-Menü.

**Lösung:**

1. Stelle sicher, dass das Dashboard **nicht** im
   Edit-Modus ist (Drilldowns funktionieren nur
   im View-Modus)
2. Prüfe, ob der Drilldown korrekt konfiguriert
   ist (Edit > Panel > Drei Punkte > Manage
   drilldowns)
3. Nicht alle Visualisierungstypen unterstützen
   Drilldowns auf einzelne Elemente

### Heatmap zeigt nur eine Farbe

**Symptom:** Die Heatmap ist einfarbig ohne
erkennbare Muster.

**Lösung:**

1. Prüfe, ob beide Achsen konfiguriert sind
   (X und Y brauchen jeweils ein Feld)
2. Erhöhe den Zeitraum auf "Last 30 days",
   um mehr Daten zu haben
3. Prüfe die Farbskala im rechten
   Konfigurationspanel

### Controls-Panel reagiert nicht

**Symptom:** Das Dropdown zeigt keine Werte.

**Lösung:**

1. Stelle sicher, dass das Dashboard im
   **Edit**-Modus ist, um Controls zu bearbeiten
2. Prüfe das konfigurierte Feld
3. Speichere das Dashboard und lade die Seite neu

---

## Bonus-Aufgaben

Falls du schneller fertig bist:

1. **Karten-Visualisierung:** Erstelle eine
   Maps-Visualisierung:
   - **Analytics > Maps > Create map**
   - Füge einen Layer hinzu: **Documents**
   - Wähle `kibana_sample_data_ecommerce`
   - Kibana nutzt `geoip.location` automatisch
   - Speichere und füge die Karte zum
     Überblick-Dashboard hinzu

2. **Gauge-Visualisierung:** Erstelle ein
   Gauge (Tachometer) für ein Umsatzziel:
   - Typ: **Gauge**
   - Metrik: Sum of `taxful_total_price`
   - Konfiguriere Zielbereiche (z.B. Rot < 50.000,
     Gelb 50.000-80.000, Grün > 80.000)
   - Füge es zum Controlling-Dashboard hinzu

3. **Treemap -- Umsatzhierarchie:** Erstelle
   eine Treemap, die den Umsatz hierarchisch
   nach Kontinent und Land zeigt:
   - Typ: **Treemap**
   - Erste Ebene: `geoip.continent_name`
   - Zweite Ebene: `geoip.country_iso_code`
   - Metrik: Sum of `taxful_total_price`

4. **Dashboard duplizieren:** Dupliziere das
   Überblick-Dashboard und erstelle eine
   "Europa-Analyse":
   - Füge einen festen Filter hinzu:
     `geoip.continent_name: "Europe"`
   - Passe den Titel an
   - Entferne oder ersetze das Kreisdiagramm
     durch eine Länder-Aufschlüsselung

5. **URL-Drilldown:** Konfiguriere einen
   URL-Drilldown auf dem Balkendiagramm
   "Top Produktkategorien":
   - **Create drilldown > Go to URL**
   - URL: Kibana Discover mit einem
     vorausgefüllten KQL-Filter
   - So können Nutzer direkt zu den
     Rohdaten einer Kategorie springen

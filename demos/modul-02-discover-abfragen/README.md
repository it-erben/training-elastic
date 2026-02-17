# Live-Demos: Modul 02 -- Discover & Abfragen

Das Discover-Interface in Kibana live zeigen, KQL
(Kibana Query Language) vorführen und gespeicherte
Suchen demonstrieren.

| Demo   | Thema                      | Dauer |
|:-------|:---------------------------|:------|
| Demo 1 | Discover Interface         | 5 Min |
| Demo 2 | KQL live vorführen         | 7 Min |
| Demo 3 | Saved Searches             | 3 Min |

## Voraussetzungen

- Die zentrale Instanz aus Modul 01 läuft bereits
- Falls nicht: `docker compose up -d` in diesem
  Verzeichnis ausführen

Kibana: <http://localhost:5601>

---

## Demo 1: Discover Interface live zeigen

### Schritt 1 -- Discover öffnen

1. Öffne Kibana: <http://localhost:5601>
2. Navigiere zu **Discover** (linke Navigation
   oder Hamburger-Menü --> **Analytics** -->
   **Discover**)

### Schritt 2 -- Data View auswählen

1. Stelle sicher, dass der Data View
   **kibana_sample_data_ecommerce** ausgewählt ist
2. Falls kein Data View existiert:
   **Management** --> **Data Views** -->
   **Create data view** -->
   Index pattern: `kibana_sample_data_ecommerce`

### Schritt 3 -- Zeitraum anpassen

1. Klicke auf den Zeitfilter oben rechts
2. Wähle **Last 7 days** oder einen passenden
   Zeitraum, in dem Daten vorhanden sind
3. Falls keine Daten angezeigt werden: den
   Zeitraum auf **Last 1 year** erweitern

> **Zeigen:** Das Histogramm oben zeigt die
> Verteilung der Dokumente über die Zeit. Darunter
> sieht man die einzelnen Dokumente als Tabelle.

### Schritt 4 -- Dokument aufklappen

1. Klicke auf den Pfeil links neben einem Dokument
2. Es öffnet sich die Detail-Ansicht mit allen
   Feldern

> **Zeigen:** Jedes Feld hat ein kleines Icon, das
> den Datentyp anzeigt (Text, Zahl, Datum, Geo).
> Über das Plus-Icon kann man einzelne Felder als
> Spalte hinzufügen.

### Schritt 5 -- Spalten konfigurieren

1. Füge folgende Felder als Spalten hinzu:
   - `customer_full_name`
   - `products.product_name`
   - `taxful_total_price`
   - `order_date`
2. Entferne die Standard-Spalte `_source`

> **Zeigen:** Jetzt sieht die Tabelle übersichtlich
> aus. Die Spaltenreihenfolge kann per Drag-and-Drop
> geändert werden.

### Schritt 6 -- Field Statistics zeigen

1. Klicke auf ein Feld in der linken Feldliste
   (z.B. `category`)
2. Es erscheint eine Schnellansicht mit den
   häufigsten Werten und deren Verteilung

> **Zeigen:** Die Field Statistics geben einen
> schnellen Überblick, ohne eine Abfrage schreiben
> zu müssen.

**Diskussionspunkte:**

- Wann nutzt man Discover vs. Dev Tools?
- Warum ist der Zeitfilter so wichtig?

---

## Demo 2: KQL live vorführen

KQL (Kibana Query Language) ist die Standard-
Abfragesprache in der Kibana-Oberfläche.

### Schritt 1 -- Einfache Textsuche

Gib in die Suchleiste ein:

```
Mary
```

> **Zeigen:** KQL durchsucht alle Felder nach
> "Mary". Die Treffer werden hervorgehoben.
> Die Autocomplete-Funktion schlägt bereits
> während der Eingabe Felder und Werte vor.

### Schritt 2 -- Feldbasierte Suche

```
customer_first_name: Mary
```

> **Zeigen:** Jetzt wird nur im Feld
> `customer_first_name` gesucht. Das ist
> präziser als die globale Suche.

### Schritt 3 -- Kombinierte Abfragen mit AND/OR

```
customer_first_name: Mary and taxful_total_price > 100
```

> **Zeigen:** Die Ergebnisse enthalten nur
> Bestellungen von Mary mit einem Gesamtbetrag
> über 100.

### Schritt 4 -- Wildcards

```
customer_first_name: Mar*
```

> **Zeigen:** Findet "Mary", "Margaret", "Maria"
> usw. Wildcards funktionieren nur mit dem
> Stern-Zeichen (`*`).

### Schritt 5 -- NOT-Abfrage

```
customer_first_name: Mary and not category: "Men's Clothing"
```

> **Zeigen:** Alle Bestellungen von Mary, aber
> ohne die Kategorie "Men's Clothing". Werte mit
> Leerzeichen müssen in Anführungszeichen stehen.

### Schritt 6 -- Verschachtelte Abfrage

```
customer_first_name: Mary and (category: "Women's Clothing" or category: "Women's Shoes")
```

> **Zeigen:** Klammern erlauben komplexe logische
> Verknüpfungen. Die Autocomplete-Funktion hilft
> bei den Feldnamen und Werten.

**Diskussionspunkte:**

- Was ist der Unterschied zwischen KQL und der
  Elasticsearch Query DSL (aus Modul 01)?
- Wann nutzt man KQL, wann die Query DSL?
- Was kann KQL nicht, was die Query DSL kann?

---

## Demo 3: Saved Searches

### Schritt 1 -- Suche speichern

1. Gib eine KQL-Abfrage ein, z.B.:

   ```
   taxful_total_price > 200
   ```

2. Klicke auf **Save** (Disketten-Icon oben)
3. Gib als Name ein:
   `Hochpreisige Bestellungen (>200)`
4. Klicke auf **Save**

### Schritt 2 -- Gespeicherte Suche laden

1. Klicke auf **Open** (Ordner-Icon oben)
2. Die gespeicherte Suche erscheint in der Liste
3. Klicke auf `Hochpreisige Bestellungen (>200)`

> **Zeigen:** Die Suche wird mit allen
> Einstellungen wiederhergestellt -- Abfrage,
> Spalten, Zeitfilter und Sortierung.

### Schritt 3 -- Saved Objects verwalten

1. Navigiere zu **Management** -->
   **Saved Objects**
2. Filtere nach Type: **search**
3. Die gespeicherte Suche ist hier sichtbar

> **Zeigen:** Saved Objects können exportiert und
> importiert werden (JSON). Das ist nützlich für
> die Übertragung zwischen Umgebungen.

**Diskussionspunkte:**

- Wer kann gespeicherte Suchen sehen?
  (Alle Kibana-Benutzer im selben Space)
- Wie kann man Suchen zwischen Umgebungen
  übertragen?

---

## Ergebnis

Nach dieser Demo:

- Die Teilnehmer kennen das Discover-Interface
- KQL-Syntax ist verstanden (Felder, Operatoren,
  Wildcards, Klammern)
- Das Konzept der Saved Searches ist klar
- Die Umgebung ist bereit für Modul 03

## Aufräumen

Die Instanz bleibt für Modul 03 aktiv.
Nicht herunterfahren!

# Übungen: E-Commerce-Analyse Mustertech GmbH

Diese Übungsserie begleitet dich durch die Schulung
"Elastic Stack für Analysten". Du lernst schrittweise, wie du mit Elasticsearch
und Kibana E-Commerce-Daten der fiktiven Mustertech GmbH (Online-Elektronikshop)
analysierst, visualisierst und in interaktiven Dashboards aufbereitest.

Die Übungen richten sich an Analysten aus Controlling und Produktmanagement --
Programmierkenntnisse sind nicht erforderlich.

## Voraussetzungen

- **Browser** -- Chrome oder Firefox (aktuelle Version)
- **URL zur Kibana-Instanz** -- wird vom Trainer bereitgestellt

> **Hinweis:** Du benötigst keine lokale Installation.
> Elasticsearch und Kibana laufen auf einer zentralen Instanz,
> die der Trainer für die Schulung bereitstellt.

## Architektur-Überblick

```
+-----------------------------------------------------+
|                  Schulungsumgebung                    |
+-----------------------------------------------------+
|                                                      |
|   +----------------------------------------------+   |
|   |            Elasticsearch-Cluster             |   |
|   |         (zentrale Instanz vom Trainer)        |   |
|   +----------------------------------------------+   |
|                        |                             |
|                        v                             |
|   +----------------------------------------------+   |
|   |                  Kibana                       |   |
|   |         (Web-Oberfläche für Analyse)          |   |
|   +----------------------------------------------+   |
|                        ^                             |
|                        |                             |
+------------------------+-----------------------------+
                         |
          +--------------+--------------+
          |              |              |
     +--------+     +--------+     +--------+
     |Browser |     |Browser |     |Browser |
     |Teiln. 1|     |Teiln. 2|     |Teiln. 3|
     +--------+     +--------+     +--------+
```

Alle Teilnehmer arbeiten über ihren Browser auf derselben Kibana-Instanz. Die
Beispieldaten stehen allen gemeinsam zur Verfügung.

## Module

Die Module bauen aufeinander auf. Bitte bearbeite sie in der angegebenen
Reihenfolge, da jedes Modul auf den Ergebnissen des vorherigen aufbaut.

### Übersicht

| Modul | Verzeichnis                             | Thema                                                    | Dauer   |
|:------|:----------------------------------------|:---------------------------------------------------------|:--------|
| 01    | `modul-01-einfuehrung-datenimport/`     | Kibana kennenlernen, Beispieldaten laden, Index erkunden | 30 Min. |
| 02    | `modul-02-discover-abfragen/`           | Daten suchen, filtern und mit KQL abfragen               | 45 Min. |
| 03    | `modul-03-visualisierungen-dashboards/` | Visualisierungen erstellen und Dashboard bauen           | 60 Min. |

**Gesamtdauer:** ca. 2 Stunden 15 Minuten (ohne Bonus-Aufgaben)

## Verzeichnisstruktur

```
assignments/
+-- README.md                                # Diese Datei
+-- modul-01-einfuehrung-datenimport/
|   +-- README.md                            # Übung Modul 01
+-- modul-02-discover-abfragen/
|   +-- README.md                            # Übung Modul 02
+-- modul-03-visualisierungen-dashboards/
    +-- README.md                            # Übung Modul 03
```

## Hilfe bei Problemen

### Kibana lädt nicht im Browser

**Symptom:** Die Kibana-URL zeigt eine leere Seite oder einen Verbindungsfehler.

**Lösung:**

1. Prüfe, ob du die korrekte URL vom Trainer verwendest
2. Stelle sicher, dass du mit dem richtigen Netzwerk verbunden bist (ggf. VPN)
3. Versuche, die Seite mit `Ctrl+Shift+R` (Hard Reload)
   neu zu laden
4. Teste mit einem anderen Browser (Chrome oder Firefox)

### Kibana reagiert langsam

**Symptom:** Die Oberfläche reagiert verzögert oder Visualisierungen laden
lange.

**Lösung:**

1. Schließe nicht benötigte Browser-Tabs
2. Wähle einen kleineren Zeitraum für deine Abfragen
3. Melde dich beim Trainer, falls das Problem anhält

### Beispieldaten fehlen

**Symptom:** Der Index `kibana_sample_data_ecommerce` ist nicht vorhanden oder
leer.

**Lösung:**

1. Gehe auf die Kibana-Startseite (Home-Symbol oben links)
2. Klicke auf **Try sample data**
3. Wähle **Sample eCommerce orders** und klicke **Add data**
4. Warte, bis der Import abgeschlossen ist

### Visualisierung zeigt "No results found"

**Symptom:** Eine Visualisierung oder Discover zeigt keine Daten an.

**Lösung:**

1. Prüfe den Zeitfilter oben rechts -- ist der richtige Zeitraum ausgewählt? Die
   Beispieldaten verwenden relative Zeiträume, wähle z.B. **Last 7 days**
2. Prüfe, ob aktive Filter die Ergebnisse einschränken
   (Filter-Leiste unter der Suchleiste)
3. Stelle sicher, dass der richtige Data View ausgewählt ist

### Browser-Kompatibilität

Kibana funktioniert am besten mit aktuellen Versionen von Chrome oder Firefox.
Falls du Darstellungsprobleme hast:

1. Aktualisiere deinen Browser auf die neueste Version
2. Deaktiviere Browser-Erweiterungen (z.B. Ad-Blocker), die Kibana
   beeinträchtigen könnten
3. Versuche den Inkognito-/Privat-Modus

# AGENTS

## Linting

Dieses Repo verwendet Linter:

- Markdown: `markdownlint-cli2` mit `--fix`, Line Length max 80
- YAML: `yamllint` (extends relaxed, line-length max 140)
- Links: `lychee` mit `--accept 429,200`, `--exclude http://localhost.*`,
  `--max-concurrency 4`, `--retry-wait-time 2`,
  `--timeout 20`, `--cache`

- Lasse nach jeder Änderung `pre-commit` laufen und behebe alle Änderungen
  selbstständig.

## Sprache

Alle Materialien dieser Schulung sind auf Deutsch zu formulieren bis auf Code,
der immer Englisch ist.

## Format

Alle Folien sind im Marp-Format zu erstellen und in "slides" abzulegen, wobei
jedes Modul ein eigenes Unterverzeichnis erhält und die Folien selbst in einer
Datei "slides.md" im Modulverzeichnis abgelegt werden.

## Thema

Die Schulung in diesem Repository ist "Elastic Stack für Analysten".

### Beschreibung

Der Elastic Stack (Elasticsearch, Kibana, Logstash, Beats) ist eine
weit verbreitete Plattform für Suche, Analyse und Visualisierung
von Daten. Diese Schulung richtet sich an Analysten aus Controlling
und Produktmanagement, die lernen möchten, wie sie mit Kibana Daten
effektiv durchsuchen, analysieren und in aussagekräftigen Dashboards
visualisieren können.

Das Seminar "Elastic Stack für Analysten" vermittelt:

- Grundlegendes Verständnis von Suchmaschinen und dem Elastic Stack
- Wie Daten in Elasticsearch importiert und indiziert werden
- Unterschiede zwischen Elasticsearch und OpenSearch
- Effektive Nutzung des Kibana Discover Interface
- Erstellung aussagekräftiger Visualisierungen
- Aufbau interaktiver Dashboards für Geschäftsanalysen

### Zielgruppe

Analysten aus Controlling und Produktmanagement. Die Teilnehmer sind
keine Entwickler - der Fokus liegt auf der Nutzung von Kibana als
Analyse-Werkzeug, nicht auf technischer Administration.

### Durchgängiges Szenario

Alle Module verwenden ein E-Commerce-Szenario der fiktiven
"Mustertech GmbH" (Online-Shop für Elektronikprodukte). Die Teilnehmer
analysieren Bestelldaten, Umsätze und Kundenverhalten.

### Infrastruktur

Die Schulung verwendet eine zentrale Elasticsearch/Kibana-Instanz,
die vom Trainer bereitgestellt wird. Die Teilnehmer benötigen nur
einen Browser.

## Modulplan

- Einführung & Datenimport
  - Allgemeines zu Suchmaschinen
  - Elasticsearch Grundlagen
  - Zusammenspiel des Elastic Stack
  - Unterschiede zwischen Elasticsearch und OpenSearch
  - Datenimport und Indizierung von Daten
  - Mappings und Schemafreiheit
- Discover & Abfragen
  - Kibana Discover Interface
  - Daten durchsuchen und filtern
  - Kibana Query Language (KQL)
  - Zeitfilter und Zeitreihen
  - Spalten konfigurieren und Daten exportieren
- Visualisierungen & Dashboards
  - Visualisierungstypen in Kibana
  - Diagramme erstellen (Balken, Linien, Kreis, Tabellen)
  - Metriken und Aggregationen
  - Dashboards zusammenstellen
  - Filter und Interaktivität in Dashboards

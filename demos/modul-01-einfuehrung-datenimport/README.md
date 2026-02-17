# Live-Demos: Modul 01 -- Einführung & Datenimport

Elasticsearch und Kibana mit Docker Compose starten,
die REST API erkunden und verstehen, wie Daten in
Elasticsearch gespeichert und indiziert werden.

| Demo   | Thema                      | Dauer |
|:-------|:---------------------------|:------|
| Demo 1 | Elasticsearch REST API     | 5 Min |
| Demo 2 | Mapping erkunden           | 5 Min |
| Demo 3 | Invertierter Index         | 5 Min |

## Voraussetzungen

- Docker / Podman (Container-Runtime)

## Setup

```bash
# 1. Elasticsearch + Kibana starten
docker compose up -d

# 2. Warten bis Setup abgeschlossen ist (~60 s)
docker compose logs -f demo-setup
# -> "Beispieldaten erfolgreich geladen." abwarten,
#    dann Ctrl+C
```

Kibana: <http://localhost:5601>

Elasticsearch: <http://localhost:9200>

> **Hinweis:** Die zentrale Instanz bleibt den
> gesamten Schulungstag aktiv. Am Ende des Tages
> wird aufgeräumt.

---

## Demo 1: Elasticsearch REST API erkunden

Die REST API ist die Grundlage für alle
Interaktionen mit Elasticsearch -- auch Kibana
nutzt sie intern.

### Schritt 1 -- Dev Tools öffnen

1. Öffne Kibana: <http://localhost:5601>
2. Navigiere zu **Management** -->
   **Dev Tools** (oder über die Suchleiste)

### Schritt 2 -- Cluster-Health prüfen

```
GET _cluster/health
```

> **Zeigen:** Der Status ist `green` (Single-Node
> mit replizierten Shards). Erkläre die Felder
> `status`, `number_of_nodes` und
> `active_primary_shards`.

### Schritt 3 -- Indizes auflisten

```
GET _cat/indices?v
```

> **Zeigen:** Der Index
> `kibana_sample_data_ecommerce` wurde durch den
> Setup-Container automatisch angelegt. Das `v`
> sorgt für Header-Zeilen (verbose).

### Schritt 4 -- Dokumente durchsuchen

```
GET kibana_sample_data_ecommerce/_search
{
  "query": {
    "match": {
      "customer_first_name": "Mary"
    }
  }
}
```

> **Zeigen:** Die Antwort enthält `hits.total.value`
> (Anzahl Treffer) und `hits.hits` (die eigentlichen
> Dokumente). Jedes Dokument hat `_id`, `_source`
> und `_score`.

**Diskussionspunkte:**

- Was bedeutet der `_score`-Wert?
- Warum ist die REST API so zentral für
  Elasticsearch?
- Welche HTTP-Methoden werden verwendet
  (GET, POST, PUT, DELETE)?

---

## Demo 2: Mapping erkunden

Das Mapping definiert die Feldtypen eines Index --
vergleichbar mit einem Datenbank-Schema.

### Schritt 1 -- Mapping abrufen

```
GET kibana_sample_data_ecommerce/_mapping
```

### Schritt 2 -- Feldtypen analysieren

Wichtige Felder zeigen und erklären:

| Feld                          | Typ         | Bedeutung                   |
|:------------------------------|:------------|:----------------------------|
| `customer_first_name`         | `text`      | Volltextsuche möglich       |
| `customer_first_name.keyword` | `keyword`   | Exakte Suche, Aggregationen |
| `order_date`                  | `date`      | Zeitbasierte Abfragen       |
| `taxful_total_price`          | `float`     | Numerische Aggregationen    |
| `geoip.location`              | `geo_point` | Kartenvisualisierungen      |

> **Zeigen:** Viele Textfelder haben ein Subfeld
> `.keyword` -- das ist das sogenannte
> Multi-Field-Mapping. Das `text`-Feld wird
> analysiert (tokenisiert), das `keyword`-Feld
> bleibt unverändert.

**Diskussionspunkte:**

- Warum braucht man beide Varianten (`text` und
  `keyword`)?
- Was passiert, wenn man ein `keyword`-Feld mit
  Volltextsuche abfragt?

---

## Demo 3: Invertierter Index erklären

Der invertierte Index ist das Herzstück von
Elasticsearch -- er macht die schnelle
Volltextsuche möglich.

### Schritt 1 -- Text analysieren lassen

```
POST _analyze
{
  "analyzer": "standard",
  "text": "Mary Bailey bought 2 products"
}
```

> **Zeigen:** Der Standard-Analyzer zerlegt den
> Text in Tokens: `mary`, `bailey`, `bought`, `2`,
> `products`. Alles wird kleingeschrieben
> (Lowercasing).

### Schritt 2 -- Keyword-Analyzer vergleichen

```
POST _analyze
{
  "analyzer": "keyword",
  "text": "Mary Bailey bought 2 products"
}
```

> **Zeigen:** Der Keyword-Analyzer verändert den
> Text nicht -- er bleibt als ein einziger Token
> erhalten. Deshalb eignet sich `keyword` nur für
> exakte Suchen.

### Schritt 3 -- Invertierter Index skizzieren

Skizziere an der Tafel oder im Chat:

```text
Invertierter Index (vereinfacht):
---------------------------------
Token     --> Dokument-IDs
---------------------------------
mary      --> [1, 5, 12, 34]
bailey    --> [1, 34]
bought    --> [1, 5, 7, 12, 34]
products  --> [1, 2, 5, 7, 12, 34]
```

> **Zeigen:** Bei einer Suche nach "Mary" schaut
> Elasticsearch im invertierten Index nach dem
> Token `mary` und findet sofort die passenden
> Dokument-IDs -- ohne jeden Datensatz einzeln
> durchsuchen zu müssen.

**Diskussionspunkte:**

- Wie unterscheidet sich das von einer
  relationalen Datenbank (Full Table Scan)?
- Warum ist Elasticsearch so schnell bei
  Volltextsuchen?
- Was macht der `german`-Analyzer anders als
  der `standard`-Analyzer?

---

## Ergebnis

Nach dieser Demo:

- Elasticsearch und Kibana laufen auf
  <http://localhost:9200> und <http://localhost:5601>
- Die eCommerce-Beispieldaten sind geladen
- Die Teilnehmer kennen Dev Tools, die REST API,
  Mappings und den invertierten Index
- Die Umgebung ist bereit für Modul 02

## Aufräumen

Die Instanz bleibt für die folgenden Module aktiv.
Erst am Ende des Schulungstags:

```bash
docker compose down -v
```

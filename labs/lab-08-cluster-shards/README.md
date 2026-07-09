# Lab 08: Cluster & Shards

## Übungsziel

Am Ende dieser Übung hast du:

- Den 3-Node-Cluster der Tag-3-Umgebung gestartet und erkundet
- Node-Rollen, Attribute und die Shard-Verteilung eines Index analysiert
- Einen Node-Ausfall simuliert und die automatische Recovery beobachtet
- Mapping-Optimierungen (keyword, enabled, filter-Kontext) live verglichen
- (Bonus) Shards per Allocation Filtering gezielt auf Nodes gesteuert

**Dauer:** ca. 30 Minuten

---

## Teil 0: Tag-3-Umgebung starten

Heute arbeiten wir mit einem echten 3-Node-Cluster inklusive Security und
TLS. Dafür muss zuerst die Umgebung von Tag 2 gestoppt werden.

### Schritt 0.1: Tag-2-Umgebung stoppen

Öffne ein Terminal im Kursrepository und führe aus:

```bash
cd environment/day2
docker compose down
```

**Erwartetes Ergebnis:** Alle Container der Tag-2-Umgebung werden gestoppt
und entfernt.

### Schritt 0.2: Tag-3-Cluster starten

```bash
cd ../day3
docker compose up -d --wait
```

**Erwartetes Ergebnis:** Nach einigen Minuten sind alle Container gestartet:
`es01`, `es02`, `es03` und `kibana`.

> **Tipp:** Der erste Start dauert 3 bis 5 Minuten: Ein Setup-Container
> erzeugt zunächst die TLS-Zertifikate und setzt die Passwörter. Der Befehl
> kehrt erst zurück, wenn alle Healthchecks grün sind. Nutze die Wartezeit,
> um Teil 1 schon einmal zu überfliegen.

### Schritt 0.3: Erste Anmeldung in Kibana

1. Öffne <http://localhost:5601> im Browser
2. Melde dich an mit Benutzer `elastic` und Passwort `changeme`
3. Navigiere zu **Management > Dev Tools**

Ab jetzt gilt: Anders als an den Vortagen ist Security **aktiv**. Wenn du
direkt per Terminal auf Elasticsearch zugreifen willst, brauchst du
Zugangsdaten und musst das selbstsignierte Zertifikat akzeptieren:

```bash
curl -k -u elastic:changeme https://localhost:9200/
```

**Erwartetes Ergebnis:** Eine JSON-Antwort mit
`"cluster_name" : "training-cluster"`.

---

## Teil 1: Cluster erkunden

Alle folgenden Befehle führst du in **Kibana Dev Tools** aus.

### Schritt 1.1: Nodes und Rollen anzeigen

Die `_cat`-APIs zeigen standardmäßig sehr viele Spalten. Mit `h=` wählst du
gezielt aus, mit `s=` sortierst du und `?v` blendet die Kopfzeile ein:

```
GET _cat/nodes?v&h=name,node.role,master,heap.percent,disk.used_percent&s=name
```

**Erwartetes Ergebnis:** Drei Zeilen: `es01`, `es02`, `es03`. Die Spalte
`node.role` zeigt Buchstaben-Kürzel: `d` = data, `i` = ingest, `m` = master
(-eligible). Genau ein Node trägt in der Spalte `master` einen Stern (`*`):
der aktuell gewählte Master.

**Aufgabe:** Welcher Node hat als einziger die Rolle `i` (ingest)? Welcher
Node ist aktuell Master? Notiere dir den Master, das brauchst du in
Teil 2.

> **Tipp:** Mit `GET _cat/nodes?help` siehst du alle verfügbaren Spalten
> dieser API. Das funktioniert bei jeder `_cat`-API.

### Schritt 1.2: Node-Attribute ansehen

Unsere Nodes tragen Custom-Attribute (`zone`, `temp`), die in der
`elasticsearch.yml` gesetzt wurden:

```
GET _cat/nodeattrs?v&h=node,attr,value&s=node
```

**Erwartetes Ergebnis:** Neben internen Attributen (`ml.*`,
`xpack.installed`, ...) findest du pro Node die Einträge `zone` und `temp`:
`es01` hat `zone=a` / `temp=hot`, `es02` und `es03` haben `zone=b` /
`temp=warm`.

### Schritt 1.3: Cluster-Gesundheit prüfen

```
GET _cluster/health
```

**Erwartetes Ergebnis:** `"status": "green"`, `"number_of_nodes": 3`,
`"number_of_data_nodes": 3`.

### Schritt 1.4: Index mit 3 Primaries und 1 Replica anlegen

Wir legen den Kundenindex von Mustertech an, diesmal mit expliziter
Shard-Konfiguration:

```
PUT kunden
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1
  }
}
```

Danach ein paar Dokumente:

```
POST kunden/_bulk
{ "index": { "_id": "1" } }
{ "name": "Lena Fischer", "stadt": "Köln", "kundenstatus": "premium" }
{ "index": { "_id": "2" } }
{ "name": "Jonas Weber", "stadt": "München", "kundenstatus": "standard" }
{ "index": { "_id": "3" } }
{ "name": "Aylin Kaya", "stadt": "Hamburg", "kundenstatus": "premium" }
```

**Erwartetes Ergebnis:** `"errors": false` in der Bulk-Antwort.

### Schritt 1.5: Shard-Verteilung analysieren

```
GET _cat/shards/kunden?v&h=index,shard,prirep,state,node&s=shard
```

**Erwartetes Ergebnis:** Sechs Zeilen: drei Primaries (`p`) und drei
Replicas (`r`), alle im Zustand `STARTED`, verteilt über alle drei Nodes.

**Aufgabe:** Prüfe für jede Shard-Nummer (0, 1, 2): Liegen Primary und
Replica wirklich auf *unterschiedlichen* Nodes? Warum erzwingt
Elasticsearch das?

---

## Teil 2: Failover - Wir lassen einen Node ausfallen

Jetzt testen wir, was der Cluster verspricht: Ein Node darf ausfallen,
ohne dass Daten verloren gehen.

### Schritt 2.1: es02 stoppen

Führe im Terminal (im Verzeichnis `environment/day3`) aus:

```bash
docker compose stop es02
```

### Schritt 2.2: Reaktion des Clusters beobachten

Wechsle sofort zurück in die Dev Tools:

```
GET _cluster/health
```

**Erwartetes Ergebnis:** `"status": "yellow"`, `"number_of_nodes": 2` und
ein Wert größer 0 bei `"unassigned_shards"`. Alle Primaries sind noch da
(sonst wäre der Status rot), aber einige Shard-Kopien fehlen.

Sieh dir an, welche Shards betroffen sind:

```
GET _cat/shards/kunden?v&h=index,shard,prirep,state,node&s=shard
```

**Aufgabe:** Welche Shards stehen auf `UNASSIGNED`? Falls auf `es02` auch
Primaries lagen: Siehst du, dass deren Replicas auf den anderen Nodes zu
Primaries befördert wurden?

### Schritt 2.3: Den Grund erfragen - allocation/explain

```
GET _cluster/allocation/explain
```

Ohne Body erklärt die API den ersten unzugewiesenen Shard, den sie findet.

**Erwartetes Ergebnis:** Eine Antwort mit `"unassigned_info"` und dem Grund
`"reason": "NODE_LEFT"`: Der Node, der diesen Shard hielt, hat den
Cluster verlassen.

> **Tipp:** Elasticsearch wartet standardmäßig 1 Minute
> (`index.unassigned.node_left.delayed_timeout`), bevor es fehlende
> Replicas auf den übrigen Nodes neu aufbaut - falls der Node nur kurz weg
> ist. Wenn du die Fehlermeldung `unable to find any unassigned shards`
> bekommst, war der Cluster schneller als du: Die Replicas wurden bereits
> neu verteilt und der Status ist wieder green.

### Schritt 2.4: es02 wieder starten und Recovery beobachten

```bash
docker compose start es02
```

Beobachte in den Dev Tools, wie Shards zurückkopiert werden:

```
GET _cat/recovery?active_only=true&v&h=index,shard,type,stage,source_node,target_node
```

**Erwartetes Ergebnis:** Für kurze Zeit siehst du aktive Recovery-Vorgänge
mit `es02` als `target_node`. Bei unseren Mini-Indizes geht das sehr
schnell. Führe den Befehl daher direkt nach dem Start mehrfach aus.
Danach:

```
GET _cluster/health
```

**Erwartetes Ergebnis:** `"status": "green"`, `"number_of_nodes": 3`. Der
Cluster hat sich vollständig selbst geheilt.

### Schritt 2.5 (Bonus): Master-Ausfall und Neuwahl

Finde zuerst heraus, wer aktuell Master ist:

```
GET _cat/nodes?v&h=name,node.role,master&s=name
```

**Fall A - Master ist `es02` oder `es03`:** Stoppe genau diesen Node
(`docker compose stop es02` bzw. `es03`), führe den `_cat/nodes`-Befehl
erneut aus und beobachte, dass sofort ein anderer Node den Stern trägt.
Starte den Node danach wieder.

**Fall B - Master ist `es01`:** Achtung: `es01` ist unser einziger
Zugangspunkt (Port 9200 und Kibana hängen an ihm). Du kannst ihn trotzdem
stoppen: Kibana ist dann kurz nicht erreichbar. Warte etwa 30 Sekunden,
starte `es01` wieder (`docker compose start es01`), lade Kibana neu und
prüfe mit `_cat/nodes`: Der Stern ist zu `es02` oder `es03` gewandert.
Die beiden hatten mit 2 von 3 master-eligible Nodes das Quorum und haben
neu gewählt. `es01` ist als normales Cluster-Mitglied zurückgekehrt.

**Aufgabe:** Warum durften die zwei verbliebenen Nodes einen neuen Master
wählen? Was wäre bei einem Cluster mit nur zwei master-eligible Nodes
passiert?

---

## Teil 3: Mapping-Optimierung - Workshop

Mustertech hat seine Transaktionsdaten bisher mit Dynamic Mapping
indexiert: über 150 Felder pro Index. Wir vergleichen jetzt jeweils den
Original-Index mit einer optimierten Variante.

### Schritt 3.1: Demo-Daten einspielen

1. Wechsle im Terminal in das Verzeichnis `workshop-demo/` im
   Kursrepository
2. Öffne die Datei `.env` und stelle sicher, dass sie auf den
   Tag-3-Cluster zeigt:

```
ELASTIC_URL=https://localhost:9200
ELASTIC_USER=elastic
ELASTIC_PASSWORD=changeme
ELASTIC_TLS_VERIFY=false
```

3. Installiere die Abhängigkeiten und starte das Setup:

```bash
npm install
node setup.js
```

**Erwartetes Ergebnis:** Das Skript legt sechs Indizes an:
`demo-smarttransactions` und `demo-loyaltytransactions` (je 200
Dokumente) sowie `demo-generalstores` (50 Dokumente), jeweils
zusätzlich als `-optimized`-Variante mit bereinigtem Mapping.

Prüfe in den Dev Tools:

```
GET _cat/indices/demo-*?v&h=index,docs.count,store.size&s=index
```

> **Tipp:** Die folgenden Übungen findest du auch als fertige
> Befehlssammlung im Handout `files/devtools-uebungen.txt`. Kopiere den
> Inhalt komplett in die Dev Tools und arbeite Block für Block.

### Übung 3.2: text vs. keyword bei Aggregationen

Im Index `demo-generalstores` ist das Feld `category` als `text` gemappt.
Versuche, die Top-Kategorien zu ermitteln:

```
GET demo-generalstores/_search
{
  "size": 0,
  "aggs": {
    "kategorien": {
      "terms": { "field": "category" }
    }
  }
}
```

**Erwartetes Ergebnis:** Eine Fehlermeldung: `Fielddata is disabled on
[category] ...`. Aggregationen auf `text`-Feldern sind absichtlich
blockiert: Sie wären teuer und würden nur Token-Fragmente liefern.

Jetzt derselbe Aufruf auf dem optimierten Index, in dem `category` als
`keyword` gemappt ist:

```
GET demo-generalstores-optimized/_search
{
  "size": 0,
  "aggs": {
    "kategorien": {
      "terms": { "field": "category" }
    }
  }
}
```

**Erwartetes Ergebnis:** Saubere Buckets mit den Kategorienamen
(z. B. `Lebensmittel`, `Elektronik`) und Trefferzahlen.

**Aufgabe:** Welche Kategorie kommt am häufigsten vor? Was würde in einem
Kibana-Dashboard passieren, das auf dem Original-Index aufbaut?

### Übung 3.3: enabled: false - Felder raus, Daten bleiben

Im Original-Index sind die Kassenbon-Felder (`receipt.*`) indexiert:

```
GET demo-smarttransactions/_search
{
  "size": 1,
  "query": {
    "exists": { "field": "receipt.value.name" }
  }
}
```

**Erwartetes Ergebnis:** Treffer, das Feld existiert im Index.

Im optimierten Index ist `receipt` auf `enabled: false` gesetzt:

```
GET demo-smarttransactions-optimized/_search
{
  "size": 1,
  "query": {
    "exists": { "field": "receipt.value.name" }
  }
}
```

**Erwartetes Ergebnis:** 0 Treffer, das Feld ist nicht im Index.

Sind die Daten weg? Prüfe das Dokument direkt:

```
GET demo-smarttransactions-optimized/_doc/STX_000001
```

**Erwartetes Ergebnis:** Das komplette `receipt`-Objekt ist in `_source`
vorhanden: alle Kassenbon-Zeilen. Die Daten sind vollständig da, nur
durchsuchbar sind sie nicht mehr.

**Aufgabe:** Für welche Felder in deinen eigenen Projekten käme
`enabled: false` infrage? Kriterium: Die Anwendung braucht die Daten zum
Anzeigen, aber niemand sucht oder filtert danach.

### Übung 3.4: filter vs. must - Scoring-Kosten

Erst eine Bool-Query mit `must`:

```
GET demo-smarttransactions/_search
{
  "size": 3,
  "_source": ["id", "status", "basket_info.sum"],
  "query": {
    "bool": {
      "must": [
        { "term": { "status": "ok" } },
        { "range": { "basket_info.sum": { "gte": 5000 } } }
      ]
    }
  }
}
```

**Erwartetes Ergebnis:** Jeder Treffer hat einen `_score` größer als 0:
Elasticsearch hat für jede Transaktion eine "Relevanz" berechnet.

Jetzt dieselben Bedingungen im Filter-Kontext:

```
GET demo-smarttransactions/_search
{
  "size": 3,
  "_source": ["id", "status", "basket_info.sum"],
  "query": {
    "bool": {
      "filter": [
        { "term": { "status": "ok" } },
        { "range": { "basket_info.sum": { "gte": 5000 } } }
      ]
    }
  }
}
```

**Erwartetes Ergebnis:** `_score` ist überall `0.0`. Keine
Score-Berechnung, und das Ergebnis kann gecacht werden.

**Aufgabe:** Vergleiche die Trefferanzahl (`hits.total`) beider Abfragen:
Sie ist identisch. Füge anschließend in beide Abfragen `"profile": true`
auf oberster Ebene ein und vergleiche in der Antwort unter `profile` die
Query-Typen und Zeiten.

> **Tipp:** Kibana übersetzt KQL automatisch in Filter-Kontext. Aufpassen
> musst du nur, wenn du direkt gegen die API programmierst.

### Übung 3.5: Feldanzahl und Indexgröße vergleichen

Die Gesamtbilanz der Optimierungen:

```
GET _cat/indices/demo-*?v&h=index,docs.count,store.size&s=index
```

**Erwartetes Ergebnis:** Gleiche Dokumentanzahl, aber die
`-optimized`-Indizes sind deutlich kleiner, besonders
`demo-smarttransactions-optimized`.

Vergleiche auch die Mappings:

```
GET demo-smarttransactions/_mapping?filter_path=**.properties
```

```
GET demo-smarttransactions-optimized/_mapping?filter_path=**.properties
```

**Aufgabe:** Scrolle durch beide Mappings. Das Original hat über 150
Felder, das optimierte gut 100. Jedes Feld kostet Cluster State, Heap und
Indexierungszeit - bei jedem Dokument. Rechne hoch: Was bedeutet das bei
Millionen Transaktionen pro Tag?

**Bonus:** Sieh dir an, welche Werte das Feld `merchant.object` im
Original-Index hat:

```
GET demo-smarttransactions/_search
{
  "size": 0,
  "aggs": {
    "object_werte": {
      "terms": { "field": "merchant.object" }
    }
  }
}
```

**Erwartetes Ergebnis:** Immer derselbe Wert: `general.merchants`.
Danach filtert niemand, trotzdem pflegt Elasticsearch dafür Suchindex und
Doc Values. Im optimierten Mapping ist das Feld mit `index: false` und
`doc_values: false` stillgelegt.

---

## Teil 4 (Bonus): Allocation Filtering

Zum Abschluss steuern wir, **wo** die Shards des `kunden`-Index liegen
dürfen, und zwar über die Node-Attribute aus Teil 1.

### Schritt 4.1: Shards auf Zone a zwingen

```
PUT kunden/_settings
{
  "index.routing.allocation.require.zone": "a"
}
```

Beobachte die Shard-Verteilung (mehrfach ausführen):

```
GET _cat/shards/kunden?v&h=index,shard,prirep,state,node&s=shard
```

**Erwartetes Ergebnis:** Elasticsearch verschiebt Shard-Kopien nach
`es01`, dem einzigen Node in Zone a, bis dort von **jedem** Shard genau
eine Kopie liegt. Die jeweils zweite Kopie bleibt auf `es02`/`es03`
stehen: Sie verletzt zwar die Filter-Regel, darf aber nicht nach `es01`
umziehen, weil dort schon eine Kopie desselben Shards liegt. Der Cluster
bleibt **green**: Elasticsearch opfert niemals Redundanz, um eine
Filter-Regel zu erfüllen.

**Aufgabe:** Bestätige das mit der Explain-API. Sieh in der
`_cat/shards`-Ausgabe nach, welche Kopie von Shard 0 **nicht** auf `es01`
liegt - Primary (`p`) oder Replica (`r`) - und setze `primary`
entsprechend auf `true` oder `false`:

```
GET _cluster/allocation/explain
{
  "index": "kunden",
  "shard": 0,
  "primary": true
}
```

**Erwartetes Ergebnis:** `"can_remain_on_current_node": "no"` (die
Filter-Regel) und zugleich `"can_move_to_other_node": "no"`. In den
`deciders` siehst du beide Gründe: `es02`/`es03` scheitern an `filter`
(falsche Zone), `es01` an `same_shard` (hält bereits eine Kopie).

### Schritt 4.2: Regel wieder entfernen

```
PUT kunden/_settings
{
  "index.routing.allocation.require.zone": null
}
```

**Erwartetes Ergebnis:** Die Shards verteilen sich wieder gleichmäßig über
alle drei Nodes. Prüfe mit `_cat/shards` und `_cluster/health`.

> **Tipp:** Genau mit diesem Mechanismus musterst du in der Praxis Nodes
> aus: `cluster.routing.allocation.exclude._ip` setzen, warten bis alle
> Shards abgewandert sind, Node stoppen.

---

## Aufräumen (optional)

Wenn du die Demo-Indizes nicht mehr brauchst:

```bash
cd workshop-demo
node cleanup.js
```

---

## Zusammenfassung

Du hast erfolgreich:

- [x] Den 3-Node-Cluster gestartet und mit `_cat/nodes`, `_cat/nodeattrs`
      und `_cluster/health` erkundet
- [x] Einen Index mit 3 Primaries und 1 Replica angelegt und die
      Shard-Verteilung analysiert
- [x] Einen Node-Ausfall simuliert, den Grund per
      `_cluster/allocation/explain` erfragt und die Recovery beobachtet
- [x] Die Wirkung von `keyword`, `enabled: false` und Filter-Kontext an
      echten Vergleichsindizes gemessen
- [x] (Bonus) Shards per Allocation Filtering gesteuert

Der Cluster steht, übersteht Node-Ausfälle und die Mappings sitzen.
Weiter geht es in **Lab 09**: Ab jetzt verwaltet der Cluster seine
Indizes per ILM selbst.

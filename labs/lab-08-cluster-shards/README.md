# Lab 08: Cluster & Shards

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

> **Wenn die Dev Tools gleich beim ersten Befehl "502 Bad Gateway"
> melden:** Die Console merkt sich ihren Elasticsearch-Host im Browser.
> An Tag 1 und 2 lief Elasticsearch unter `http://elasticsearch:9200`, und
> weil Kibana an allen Tagen unter `localhost:5601` läuft, probiert die
> Console diesen alten Host weiter - der Tag-3-Cluster spricht aber nur
> noch HTTPS. Lösung: in der Console auf den Reiter **Config**, das Feld
> **Elasticsearch host** leeren und die Seite neu laden. Danach nutzt die
> Console wieder den in Kibana hinterlegten Host `https://es01:9200`.

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

# Lab 09: Index Lifecycle Management

## Übungsziel

Am Ende dieser Übung hast du:

- Eine ILM-Policy mit Hot-, Warm- und Delete-Phase erstellt
- Ein Index-Template mit Policy und Rollover-Alias verknüpft
- Einen Bootstrap-Index mit Write-Alias angelegt
- Einen automatischen Rollover live beobachtet
- Die Shard-Wanderung von Hot- auf Warm-Nodes verfolgt
- Die automatische Löschung eines Index miterlebt
- ILM-Zustände mit `_ilm/explain` diagnostiziert

**Dauer:** ca. 25 Minuten

**Umgebung:** 3-Node-Cluster aus `environment/day3`. Alle Befehle führst du
in den **Kibana Dev Tools** aus (<http://localhost:5601>, Benutzer `elastic`,
Passwort `changeme`).

**Workaround in diesem Lab:** In Produktion dauern ILM-Übergänge Tage bis
Monate. Wir verkürzen das Prüfintervall auf 10 Sekunden und lassen den
Rollover schon bei 100 Dokumenten auslösen. So siehst du den kompletten
Lebenszyklus in wenigen Minuten.

> **Tipp:** Alle Befehle dieses Labs findest du auch als Copy-Paste-Vorlagen
> im Ordner `files/`.

---

## Teil 1: Poll-Intervall und ILM-Policy

### Schritt 1.1: Poll-Intervall verkürzen

ILM prüft standardmäßig nur alle **10 Minuten**, ob eine Phase gewechselt
werden muss. Für das Lab stellen wir auf 10 Sekunden:

```
PUT _cluster/settings
{
  "persistent": {
    "indices.lifecycle.poll_interval": "10s"
  }
}
```

**Erwartetes Ergebnis:** `"acknowledged": true`. In der Antwort erscheint
das Setting unter `persistent`.

> **Tipp:** Das machen wir nur für das Training so. In Produktion bleibt der
> Default von 10 Minuten: Bei Phasen, die Tage dauern, spielt das keine
> Rolle, und häufigeres Prüfen kostet unnötig Ressourcen.

### Schritt 1.2: ILM-Policy anlegen

Jetzt legst du die Policy für die Mustertech-Transaktionsdaten an, mit den
verkürzten Grenzwerten von oben:

```
PUT _ilm/policy/transactions-policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_docs": 100
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "0ms",
        "actions": {
          "allocate": {
            "require": {
              "temp": "warm"
            }
          },
          "set_priority": {
            "priority": 50
          }
        }
      },
      "delete": {
        "min_age": "5m",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

Was die Policy bedeutet:

| Phase    | Auslöser                    | Aktionen                         |
| :------- | :-------------------------- | :------------------------------- |
| `hot`    | sofort                      | Rollover bei **100 Dokumenten**  |
| `warm`   | sofort nach dem Rollover    | Shards auf Nodes mit `temp=warm` |
| `delete` | **5 Minuten** nach Rollover | Index wird gelöscht              |

> **Achtung:** Die Delete-Phase läuft ab jetzt mit: 5 Minuten nach dem
> Rollover verschwindet der Index wieder. Das beobachten wir gezielt in
> Teil 3. Arbeite Teil 2 daher zügig durch, damit du die Warm-Phase noch
> siehst, bevor gelöscht wird.

### Schritt 1.3: Policy prüfen

```
GET _ilm/policy/transactions-policy
```

**Erwartetes Ergebnis:** Die Antwort zeigt deine drei Phasen. Beachte das
Feld `in_use_by`: Noch verwendet kein Index die Policy.

---

## Teil 2: Template, Bootstrap-Index und Rollover

### Schritt 2.1: Index-Template erstellen

Das Template verknüpft jeden neuen `transactions-*`-Index automatisch mit
der Policy und dem Rollover-Alias:

```
PUT _index_template/transactions-template
{
  "index_patterns": ["transactions-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "index.lifecycle.name": "transactions-policy",
      "index.lifecycle.rollover_alias": "transactions-live",
      "index.routing.allocation.require.temp": "hot"
    },
    "mappings": {
      "properties": {
        "created":        { "type": "date" },
        "status":         { "type": "keyword" },
        "payment_method": { "type": "keyword" },
        "amount":         { "type": "integer" }
      }
    }
  }
}
```

Zwei Details sind für dieses Lab wichtig:

- `index.routing.allocation.require.temp: hot` - neue Indizes starten auf
  dem Hot-Node (`es01`). So ist die spätere Wanderung auf die Warm-Nodes
  gut sichtbar.
- `number_of_replicas: 0` - wir haben nur **einen** Hot-Node; mit Replikas
  wäre der Index dauerhaft gelb.

### Schritt 2.2: Bootstrap-Index mit Write-Alias anlegen

Den ersten Index legst du einmalig von Hand an, inklusive Alias:

```
PUT transactions-000001
{
  "aliases": {
    "transactions-live": {
      "is_write_index": true
    }
  }
}
```

**Erwartetes Ergebnis:** `"acknowledged": true`. Prüfe gleich, wo der Index
liegt:

```
GET _cat/shards/transactions-*?v&h=index,shard,prirep,node,state
```

Der Shard sollte auf **es01** (dem Hot-Node) liegen.

### Schritt 2.3: Den ILM-Zustand ansehen

```
GET transactions-000001/_ilm/explain
```

**Erwartetes Ergebnis:** Der Index ist `"managed": true`, verwendet
`transactions-policy` und steht in `"phase": "hot"`. Das Feld `step` zeigt
`check-rollover-ready`: ILM wartet auf die Rollover-Bedingung.

### Schritt 2.4: Mehr als 100 Dokumente schreiben

Jetzt füttern wir den Alias mit 120 Test-Transaktionen: **immer über den
Alias, nie über den Index-Namen!**

**Variante A - Dev Tools:** Öffne die Datei `files/02-bulk-transactions.txt`
aus diesem Lab, kopiere den kompletten `_bulk`-Request in die Dev Tools und
führe ihn aus.

**Variante B - Terminal:** Kleine Schleife mit curl:

```bash
for i in $(seq 1 120); do
  curl -sk -u elastic:changeme \
    -X POST "https://localhost:9200/transactions-live/_doc" \
    -H 'Content-Type: application/json' \
    -d "{\"created\":\"2026-07-02T10:00:00Z\",\"status\":\"ok\",\"payment_method\":\"creditcard\",\"amount\":$((RANDOM % 500 + 1))}" \
    > /dev/null
done
echo "fertig"
```

**Erwartetes Ergebnis:** Prüfe die Dokumentenzahl:

```
GET _cat/indices/transactions-*?v&h=index,docs.count,store.size,health
```

`transactions-000001` enthält 120 Dokumente, damit ist die Rollover-Bedingung
(`max_docs: 100`) überschritten.

### Schritt 2.5: Den Rollover beobachten

Warte 10 bis 30 Sekunden (ILM prüft alle 10 Sekunden) und frage erneut ab:

```
GET _cat/indices/transactions-*?v&h=index,docs.count,store.size,health
```

**Erwartetes Ergebnis:** Es gibt jetzt **zwei** Indizes:

```
index                docs.count store.size health
transactions-000001         120     ...     green
transactions-000002           0     ...     green
```

Prüfe auch den Alias:

```
GET transactions-live/_alias
```

**Aufgabe:** Welcher der beiden Indizes hat `"is_write_index": true`?

> **Tipp:** Falls nach einer Minute noch kein Rollover passiert ist: Prüfe
> mit `GET transactions-000001/_ilm/explain`, ob ein Fehler angezeigt wird
> (Feld `step` = `ERROR`), und ob Schritt 1.1 (Poll-Intervall) wirklich
> ausgeführt wurde.

### Schritt 2.6: Warm-Phase und Shard-Wanderung

Der alte Index wechselt direkt nach dem Rollover in die Warm-Phase
(`min_age: 0ms`). Beobachte den Phasenwechsel:

```
GET transactions-000001/_ilm/explain
```

**Erwartetes Ergebnis:** `"phase": "warm"`. Eventuell musst du ein paar
Sekunden warten und erneut abfragen.

Jetzt der spannendste Teil: Wo liegen die Shards?

```
GET _cat/shards/transactions-*?v&h=index,shard,prirep,node,state
```

**Erwartetes Ergebnis:**

```
index                shard prirep node state
transactions-000001  0     p      es02 STARTED   <- auf einem Warm-Node!
transactions-000002  0     p      es01 STARTED   <- neuer Index auf dem Hot-Node
```

Die `allocate`-Aktion hat den Shard von `es01` (temp=hot) auf `es02` oder
`es03` (temp=warm) verschoben, genau wie in einer echten
Hot-Warm-Architektur.

**Aufgabe:** Notiere die Uhrzeit: In etwa 5 Minuten wird
`transactions-000001` gelöscht (Teil 3). Suche zwischendurch noch einmal
über den Alias und prüfe, dass alle 120 Dokumente weiterhin gefunden werden:

```
GET transactions-live/_search
{
  "size": 0,
  "query": { "match_all": {} }
}
```

---

## Teil 3: Delete-Phase und Fehlerdiagnose

Die Delete-Phase greift **5 Minuten nach dem Rollover**. Beobachte den
Countdown mit `_ilm/explain`:

```
GET transactions-000001/_ilm/explain
```

Interessante Felder in der Antwort:

| Feld    | Bedeutung                                |
| :------ | :--------------------------------------- |
| `phase` | Aktuelle Phase (`warm`, später `delete`) |
| `age`   | Alter des Index **seit dem Rollover**    |
| `step`  | Aktueller Arbeitsschritt                 |

Frage alle 30 Sekunden ab. Sobald `age` die 5 Minuten überschreitet und der
nächste Poll läuft:

```
GET _cat/indices/transactions-*?v&h=index,docs.count,health
```

**Erwartetes Ergebnis:** `transactions-000001` ist **verschwunden**, nur
`transactions-000002` (der aktuelle Write-Index) existiert noch. ILM hat
den Index samt seiner 120 Dokumente gelöscht, ohne dass jemand eingreifen
musste.

> **Tipp:** Die Wartezeit kannst du für Schritt 3.2 nutzen, oder schon
> einen Blick auf Teil 4 werfen.

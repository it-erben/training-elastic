# Lab 10: Fleet & Elastic Agent

## Übungsziel

Am Ende dieser Übung hast du:

- Fleet Server und einen Elastic Agent als Compose-Profil gestartet
- Beide Agents in der Fleet-UI als "Healthy" gesehen
- Agent Policies und das Enrollment-Token-Konzept in der UI nachvollzogen
- System-Metriken des Agents in Discover gefunden
- Die Inputs und Datasets der System-Integration untersucht
- (Bonus) Eine weitere Integration hinzugefügt und den zentralen
  Policy-Rollout beobachtet

**Dauer:** ca. 25 Minuten

---

## Voraussetzungen

- Die Tag-3-Umgebung (`environment/day3`) läuft: 3-Node-Cluster + Kibana
- Internetzugang: Kibana lädt Integrations-Pakete vom Elastic Package
  Registry

---

## Teil 1: Fleet starten und erkunden

### Schritt 1.1: Fleet-Profil starten

Starte die beiden Fleet-Container zusätzlich zur laufenden Umgebung:

```bash
cd environment/day3
docker compose --profile fleet up -d --wait
```

Das startet zwei neue Container:

- **fleet-server** - Elastic Agent im Fleet-Server-Modus (Port 8220)
- **agent** - ein normaler Elastic Agent mit dem Hostnamen
  `mustertech-agent-01`

> **Tipp:** Geduld! Der erste Start dauert einige Minuten: Kibana lädt
> zunächst die Packages `fleet_server` und `system` vom Elastic Package
> Registry, dann bootstrappt sich der Fleet Server und erst danach kann
> sich der Agent enrollen. `--wait` kehrt zurück, sobald alles healthy ist.

Prüfe den Zustand:

```bash
docker compose ps
```

**Erwartetes Ergebnis:** Zusätzlich zu `es01`--`es03` und `kibana` laufen
`fleet-server` (healthy) und `agent`.

> **Tipp:** Wenn der Fleet Server nicht healthy wird, hilft
> `docker compose logs fleet-server`. Weitere Hinweise stehen im
> Troubleshooting-Abschnitt von `environment/day3/README.md`.

### Schritt 1.2: Fleet-UI öffnen

1. Öffne Kibana: `http://localhost:5601` (Benutzer `elastic`,
   Passwort `changeme`)
2. Navigiere über das Hauptmenü zu **Management > Fleet**
3. Du landest auf dem Tab **Agents**

**Erwartetes Ergebnis:** Zwei Agents mit Status **Healthy**:

| Agent                                         | Policy                |
|:----------------------------------------------|:----------------------|
| `mustertech-agent-01`                         | Agent Policy Training |
| Fleet Server (generierter Container-Hostname) | Fleet Server Policy   |

**Aufgabe:** Notiere für `mustertech-agent-01` die Agent-Version und den
Zeitpunkt des letzten Check-ins (Spalte **Last activity**).

> **Tipp:** Der Fleet Server taucht selbst in der Agent-Liste auf: Er
> ist ein Elastic Agent im Sondermodus und wird genauso überwacht wie
> jeder andere Agent.

### Schritt 1.3: Agent Policies ansehen

1. Wechsle zum Tab **Agent policies**
2. Du siehst zwei Policies: **Fleet Server Policy** und
   **Agent Policy Training**
3. Öffne **Agent Policy Training** per Klick auf den Namen

**Erwartetes Ergebnis:** Die Policy enthält eine Integration: `system-1`
(Integration **System**). Sie wurde über `kibana.yml` vorkonfiguriert.
In der Praxis würdest du sie hier per Klick hinzufügen.

**Aufgabe:** Gehe zurück zur Policy-Liste. Wie viele Agents hängen an
welcher Policy? Kibana 9.3 zeigt die Zahl in der Spalte
**Unprivileged / Privileged** im Format `unprivilegiert / privilegiert
(gesamt)` - für beide Policies also `1 / 0 (1)`. Auf der Policy-Detailseite
steht sie zusätzlich oben als **1 agent**.

> **Tipp:** Das ⚠️ neben der Zahl der **Agent Policy Training** ist nur ein
> Hinweis: Der Agent ist **unprivilegiert** enrollt (der Container-Agent
> läuft ohne dedizierten `elastic-agent`-Benutzer), während die
> System-Integration teils Root-Rechte nutzen könnte. Fürs Lab ist das ohne
> Belang, die System-Metriken fließen trotzdem. Die **Fleet Server Policy**
> zeigt das ⚠️ nicht.

Öffne anschließend kurz die **Fleet Server Policy**: Sie enthält nur die
Integration `fleet_server-1`, mehr braucht ein Fleet Server nicht.

### Schritt 1.4: Enrollment-Tokens verstehen

1. Wechsle zum Tab **Enrollment tokens**
2. Du siehst mindestens zwei Tokens, je einen pro Policy
3. Klicke bei einem Token auf das Augen-Symbol, um das Secret einzublenden

**Erwartetes Ergebnis:** Jedes Token ist genau einer Policy zugeordnet.
Ein Agent, der sich mit einem Token enrollt, landet automatisch in der
zugehörigen Policy.

So hat sich unser Agent angemeldet: Der Container bekam die Variable
`FLEET_TOKEN_POLICY_NAME=Agent Policy Training`. Daraufhin hat er sich
das passende Token automatisch geholt und beim Fleet Server enrollt.

> **Tipp:** In der Praxis nutzt du den Button **Add agent** (Tab Agents):
> Fleet zeigt dir dort den fertigen Install-Befehl inklusive
> Enrollment-Token für jedes Betriebssystem.

---

## Teil 2: Daten prüfen

### Schritt 2.1: Metriken in Discover finden

Die System-Integration sammelt bereits Metriken des Agent-Containers.

1. Navigiere zu **Analytics > Discover**
2. Wähle oben links den Data View **metrics-\*** (wurde von Fleet
   automatisch angelegt)
3. Stelle den Zeitfilter auf **Last 15 minutes**
4. Gib in die Suchleiste ein:

```
host.name: "mustertech-agent-01"
```

5. Füge die Spalten `data_stream.dataset` und `host.name` hinzu

**Erwartetes Ergebnis:** Dokumente mit Datasets wie `system.cpu`,
`system.memory`, `system.network` und `system.filesystem`. Das ist das
Namensschema `<typ>-<dataset>-<namespace>`, z. B. im Data Stream
`metrics-system.cpu-default`.

### Schritt 2.2: Eine CPU-Metrik im Detail

Verfeinere die Abfrage:

```
host.name: "mustertech-agent-01" AND data_stream.dataset: "system.cpu"
```

Klappe ein Dokument auf und suche das Feld `system.cpu.total.norm.pct`.

**Aufgabe:** Wie hoch ist die aktuelle CPU-Auslastung des Agent-Containers
(Wert zwischen 0 und 1)?

**Zusatzaufgabe:** Wechsle zum Data View **logs-\*** und prüfe, ob dort
Daten von `mustertech-agent-01` ankommen. Gut möglich, dass hier
nichts auftaucht: Im schlanken Agent-Container fehlen die klassischen
Logdateien (`/var/log/syslog` & Co.), die die System-Integration
einsammeln würde. Auch das ist ein Ergebnis - welche Logs ein Agent
liefert, hängt davon ab, was auf dem Host wirklich existiert.

### Schritt 2.3: Agent-Detailseite - welche Inputs laufen?

1. Gehe zurück zu **Management > Fleet > Agents**
2. Klicke auf `mustertech-agent-01`

Die Detailseite zeigt dir den Zustand des Agents aus Sicht von Fleet:

- Zugewiesene Policy und **Revision**
- Agent-Version und Host-Metadaten
- Die Integration `system-1` mit ihren **Inputs** und deren Status

**Aufgabe:** Welche Input-Typen laufen auf dem Agent? Du solltest
mindestens einen Metrik-Input (`system/metrics`) und Log-Inputs finden.

### Schritt 2.4: Die System-Integration in der Policy

1. Navigiere zu **Fleet > Agent policies > Agent Policy Training**
2. Klicke auf die Package Policy `system-1`
3. Du siehst die Konfiguration der Integration:
    - **Collect logs from System instances** - z. B. syslog, auth
    - **Collect metrics from System instances** - cpu, memory, network,
      filesystem, ...

**Aufgabe:** Welche Metrik-Datasets sind aktiviert? Klappe die Sektion auf
und sieh dir an, welche Schalter Fleet dir pro Dataset anbietet.

Verlasse die Ansicht ohne zu speichern (**Cancel**).

> **Tipp:** Genau hier liegt der Unterschied zu Tag 2: Statt YAML-Dateien
> auf jedem Host zu editieren, konfigurierst du die Datensammlung zentral
> in der Policy. Alle zugehörigen Agents ziehen die Änderung automatisch.

---

## Teil 3 (Bonus): Eine weitere Integration ausrollen

Der Betrieb möchte zusätzlich Docker-Metriken sehen. Wir erweitern die
Policy und beobachten, wie der Agent die Änderung übernimmt - ohne SSH,
ohne Neustart.

### Schritt 3.1: Docker-Integration hinzufügen

1. Öffne **Fleet > Agent policies > Agent Policy Training**
2. Klicke auf **Add integration**
3. Suche im Katalog nach **Docker** und öffne die Integration
4. Klicke auf **Add Docker**
5. Lass die Standardeinstellungen unverändert und speichere
   (**Save and continue** > **Save and deploy changes**)

**Erwartetes Ergebnis:** Die Policy enthält jetzt zwei Integrationen:
`system-1` und `docker-1`.

### Schritt 3.2: Rollout beobachten

1. Wechsle zum Tab **Agents**
2. Beobachte `mustertech-agent-01`: Beim nächsten Check-in übernimmt er
   die neue Policy. Die **Revision** der Policy zählt hoch, der Agent
   zeigt kurz den Status **Updating**

**Erwartetes Ergebnis:** Der Agent läuft mit der neuen Policy-Revision.
Die Konfigurationsänderung hat den Host erreicht, ohne dass du ihn
angefasst hast.

### Schritt 3.3: Kommen Daten an?

Prüfe in **Discover** (Data View **metrics-\***):

```
data_stream.dataset: docker.*
```

> **Tipp:** In unserer Schulungsumgebung hat der Agent-Container keinen
> Zugriff auf den Docker-Socket (`/var/run/docker.sock`). Der
> Docker-Input kann daher Fehler melden und der Agent als **Unhealthy**
> erscheinen. Das ist hier erwartbar: Der Lerneffekt dieses Teils ist der
> zentrale Rollout-Mechanismus, nicht die Docker-Daten selbst. Auf einem
> echten Docker-Host mit Socket-Zugriff würden die Metriken sofort fließen.

### Schritt 3.4: Integration wieder entfernen

1. Öffne **Fleet > Agent policies > Agent Policy Training**
2. Öffne das Aktionsmenü (...) neben `docker-1` und wähle
   **Delete integration**
3. Bestätige die Änderung

**Erwartetes Ergebnis:** Die Revision zählt erneut hoch, der Agent
übernimmt die bereinigte Policy und kehrt zu **Healthy** zurück.

---

## Abschluss: Aufräumen

Wenn du die Umgebung nicht mehr brauchst, stoppst du alles inklusive der
Fleet-Container:

```bash
cd environment/day3
docker compose --profile fleet down
```

> **Tipp:** Das `--profile fleet` ist wichtig: Ein einfaches
> `docker compose down` würde `fleet-server` und `agent` nicht mit
> entfernen. Alternativ setzt `./reset.sh` die komplette Umgebung
> inklusive Daten, Zertifikaten und Fleet-Zustand zurück.

---

## Zusammenfassung

Du hast erfolgreich:

- [x] Fleet Server und Elastic Agent per Compose-Profil gestartet
- [x] Beide Agents in der Fleet-UI als "Healthy" gesehen
- [x] Agent Policies und Enrollment-Tokens in der UI nachvollzogen
- [x] System-Metriken des Agents in Discover analysiert
- [x] Die Inputs und Datasets der System-Integration untersucht
- [x] (Bonus) Eine Integration zentral ausgerollt und wieder entfernt

**Geschafft!** Damit endet der dreitägige Kurs: Du kannst Daten
analysieren (Tag 1), Logs einsammeln (Tag 2) und die Plattform betreiben
(Tag 3). Die Mustertech GmbH ist in guten Händen.

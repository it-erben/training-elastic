# Vorbereitung für die Schulung

Bitte führe diese Schritte **vor Kursbeginn** durch (Dauer: ca. 30 Minuten,
davon der Großteil Download-Wartezeit). So stellen wir sicher, dass wir am
ersten Kurstag direkt loslegen können.

## 1. Docker installieren

- **Windows / macOS:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  installieren. Windows: beim Setup das **WSL2-Backend** wählen (Standard).
- **Linux:** [Docker Engine](https://docs.docker.com/engine/install/) plus
  Compose-Plugin v2 installieren.

## 2. Docker-Ressourcen einstellen

Docker Desktop → **Settings → Resources**:

| Einstellung | Mindestwert |
|:------------|:------------|
| Memory      | **8 GB**    |
| CPUs        | 4           |
| Disk        | 30 GB frei  |

**Nur Linux (native Docker Engine, nicht Docker Desktop):**

```bash
sudo sysctl -w vm.max_map_count=262144
```

Dauerhaft: `vm.max_map_count=262144` in `/etc/sysctl.conf` eintragen.
Das ist der häufigste Stolperstein - Elasticsearch startet sonst nicht.

## 3. Firmen-Laptop? Bitte prüfen

Falls du einen verwalteten Firmen-Laptop nutzt:

- Hast du lokale Admin-Rechte für die Docker-Installation?
- Erlaubt der Proxy/ZScaler Zugriff auf `docker.elastic.co` (Image-Registry)?
- Funktioniert `docker pull hello-world`?

Falls etwas davon scheitert: **bitte vorab beim Trainer melden** - für Tag 1
gibt es eine Browser-Fallback-Umgebung, für Tag 2/3 kannst du mit einem
Sitznachbarn zusammenarbeiten.

## 4. Repository holen und prepare.sh ausführen

```bash
git clone <repo-url>
cd elastic/environment
./prepare.sh
```

Das Skript prüft Docker, lädt alle benötigten Images (~5 GB - deshalb bitte
**nicht erst im Hotel-WLAN**), generiert die Übungsdaten und macht einen
Smoke-Test.

**Windows ohne Git Bash/WSL** (PowerShell-Äquivalent):

```powershell
docker pull docker.elastic.co/elasticsearch/elasticsearch:9.3.0
docker pull docker.elastic.co/kibana/kibana:9.3.0
docker pull docker.elastic.co/logstash/logstash:9.3.0
docker pull docker.elastic.co/beats/filebeat:9.3.0
docker pull docker.elastic.co/elastic-agent/elastic-agent:9.3.0
docker pull minio/minio:latest
docker pull node:22-alpine
# Beispiel-Logs mit frischen Timestamps erzeugen (aus dem Repo-Wurzelverzeichnis)
cd ..
docker run --rm -v "${PWD}:/repo" -w /repo node:22-alpine node tools/generate-logs/generate.js
cd environment/day1
docker compose up -d --wait
# http://localhost:5601 im Browser öffnen - Kibana sollte laden
docker compose down
```

## Fertig?

**Wenn `prepare.sh` mit "Bereit für den Kurs!" endet, bist du fertig
vorbereitet.** Bei Problemen: Ausgabe kopieren und an den Trainer schicken.

## Optional

- **Node.js** (LTS): nur für die Demo-Skripte in `workshop-demo/` - nice to
  have. Die Übungsdaten werden im Node-Container erzeugt (kein Host-Node nötig).
- Ein Editor mit YAML-Unterstützung (VS Code o.ä.) erleichtert die
  Konfigurationsübungen an Tag 2.

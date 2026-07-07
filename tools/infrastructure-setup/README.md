# Infrastructure-Setup (Fallback, eingefroren)

**Status: Fallback für Tag 1.** Die Schulung läuft seit der Umstellung auf
den s2004-Komplettkurs mit lokalen Docker-Compose-Umgebungen pro Teilnehmer
(siehe [`environment/`](../../environment/)). Dieses Setup (AKS via
Terraform und Helm-Chart mit Elasticsearch/Kibana pro Teilnehmer) bleibt
nur als Ausweichlösung für Teilnehmer erhalten, die auf ihrem Gerät kein
Docker betreiben dürfen - es deckt ausschließlich die Tag-1-Übungen ab
(Kibana-only, Browser-Zugriff).

- Nicht weiterentwickeln; nur `STACK_VERSION`/Image-Tags synchron zu
  `environment/*/.env` halten (aktuell 9.3.0).
- Nach dem nächsten Kursdurchlauf evaluieren, ob der Fallback je gebraucht
  wurde - andernfalls löschen.

## Inhalt

- `terraform/` - AKS-Cluster (Free Tier), NGINX Ingress, cert-manager,
  Helm-Release
- `helm/elastic-training/` - StatefulSet mit N Teilnehmer-Instanzen
  (Elasticsearch + Kibana pro Pod), Ingress unter
  `elastic-training.erben.tech/<n>`

# Workshop Demo Setup

## Voraussetzungen

- Node.js installiert
- Elastic Cloud Serverless Projekt angelegt
- API Key erstellt (in Kibana unter Stack Management > API Keys)

## Konfiguration

Kopiere `.env.example` nach `.env` und trage deine Werte ein:

```bash
cp .env.example .env
# Dann editieren:
# ELASTIC_URL=https://dein-projekt.es.eu-west-1.aws.elastic.cloud
# ELASTIC_API_KEY=dein-api-key
```

Die URL steht in der Elastic Cloud Console unter "Endpoints".

## Setup ausführen

```bash
npm install
node setup.js
```

Das Skript legt sechs Indizes an: `demo-smarttransactions`, `demo-loyaltytransactions` und `demo-generalstores`, jeweils einmal mit dem Original-Mapping samt aller Probleme und einmal als `-optimized`-Variante mit aufgeräumtem Mapping. In jeden Index kommen 200 realistische Testdokumente.

## Im Workshop zeigen

Nach dem Setup kannst du in Kibana Dev Tools folgende Befehle live vorführen:

```
# Feldanzahl vergleichen
GET demo-smarttransactions/_mapping
GET demo-smarttransactions-optimized/_mapping

# Index-Größe vergleichen
GET _cat/indices/demo-*?v&s=index

# Query mit Profiling: filter vs. must
GET demo-smarttransactions/_search
{
  "profile": true,
  "query": {
    "bool": {
      "must": [
        { "term": { "status": "ok" } },
        { "range": { "created": { "gte": "2026-01-01T00:00:00Z" } } }
      ]
    }
  }
}

GET demo-smarttransactions/_search
{
  "profile": true,
  "query": {
    "bool": {
      "filter": [
        { "term": { "status": "ok" } },
        { "range": { "created": { "gte": "2026-01-01T00:00:00Z" } } }
      ]
    }
  }
}

# Dokument direkt per ID abrufen (nach Indexierung sofort verfügbar)
GET demo-smarttransactions/_doc/STX_000001
```

## Aufräumen nach dem Workshop

```bash
node cleanup.js
```

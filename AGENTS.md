# Arbeitsregeln

Ton, Schreibweise und Commit-Regeln stehen in der Nutzer-Konfiguration
(`~/.claude/CLAUDE.md`, Abschnitte "Schreibweise in deutschen Texten" und
"Arbeitsregeln in Repos"). Hier steht nur, was in diesem Repo dazukommt oder
abweicht.

## Folien

Marp-Decks unter `slides/<NN-thema>/slides.md`. Lehrmaterial, das die
Pronomen- und Leseransprache-Regel aufhebt.

- **Geduzt.** Durchgängig "du", "dir", "dein". Nicht siezen, nicht ihrzen. Das
  Verhältnis liegt bei 293 zu 4 gegen Siezen.
- Jede Folie beginnt mit `#`. Dieses Repo nutzt H1 als Folientitel, nicht H2;
  im gesamten `slides/`-Baum stehen 580 H1 gegen 4 H2.
- Frontmatter: `header` ist der Modultitel selbst (`"Modul 02: Discover &
  Abfragen"`), `footer: "CC BY-NC-SA 4.0, Alexander Erben"`, `paginate: true`.
- Jedes Deck hat `# Lernziele` als zweite Folie ("Nach diesem Modul kannst
  du:") und schließt mit einer Zusammenfassung. Beide sind in allen dreizehn
  Decks vorhanden. Beim Erweitern mitziehen.
- Schriftgröße pro Folie über `<style scoped>section { font-size: 1.6em; }
  </style>` direkt über oder unter dem Folientrenner. Tabellen bekommen
  stattdessen `table { font-size: 0.85em; }`.
- Ein Blockzitat am Fuß der Folie trägt die Merkaussage: "Discover zeigt dir
  die Rohdaten - hier beginnst du jede Analyse." Höchstens eins pro Folie.
- Fett gesetzte Zwischenüberschriften innerhalb einer Folie leiten Listen ein:
  `**Typische Anwendungsfälle bei Mustertech GmbH:**`.
- Alle Beispiele spielen bei der fiktiven **Mustertech GmbH**, einem
  Online-Elektronikshop. Keine andere Beispielfirma einführen.
- Elemente der Kibana-Oberfläche fett und mit ihrer englischen Beschriftung
  (**Analytics > Discover**, **Last 7 days**). Die Oberfläche ist englisch,
  der Fließtext deutsch.
- Screenshots als `![h:450 center](images/name.png)` im `images/` des Decks.

## Lab-Anleitungen

Ein Lab ist genau eine `labs/lab-NN-thema/README.md`, Screenshots in
`images/`, mitgelieferte Dateien in `files/`.

- Geduzt wie die Folien.
- `## Übungsziel` steht am Anfang: "Am Ende dieser Übung hast du:" plus
  Ergebnisliste im Perfekt.
- Danach `## Teil N: ...` als fachlicher Abschnitt, darin `### Schritt N.M: ...`
  als einzelner Handgriff.
- Ein Schritt ist eine nummerierte Liste von Klicks oder Kommandos, jeder
  Eintrag eine Handlung.
- Nach jedem Schritt, dessen Ergebnis prüfbar ist, `**Erwartetes Ergebnis:**`
  mit dem, was auf dem Bildschirm zu sehen sein muss. Das ist das häufigste
  Element im Lab-Baum und der Anker, an dem Teilnehmer merken, dass sie
  falsch abgebogen sind.
- `**Aufgabe:**` markiert die Stelle, an der selbst etwas herausgefunden
  werden soll, statt einer Klickanweisung zu folgen.

## Vor dem Abschluss

- `pre-commit run --all-files` laufen lassen und alle Befunde beheben.
- Folien, die verändert wurden, mit `tools/render-slides.sh` rendern und
  ansehen. Die Ausgabe landet in `pdf/` und ist gitignoriert.

## Aufbau dieses Repos

Dreitägige Schulung zum Elastic Stack. Ein Motto je Tag: Tag 1 Daten
analysieren, Tag 2 Logs einsammeln, Tag 3 Plattform betreiben. Die Zuordnung
von Tag zu Inhalten steht in der Wurzel-`README.md`.

- `slides/01-...` bis `slides/13-...`: dreizehn Marp-Decks.
- `labs/lab-01-...` bis `labs/lab-11-...` plus `lab-03b`: zwölf Übungen.
- `environment/day1`, `day2`, `day3`: je ein `docker-compose.yml`, eine
  `README.md` und ein `reset.sh`. Jeder Teilnehmer betreibt den Stack lokal;
  es gibt keine zentrale Trainer-Instanz.
- `environment/VORBEREITUNG.md`: was vor dem Kurs zu tun ist, vor allem
  Images vorladen.
- `tools/`: `render-slides.sh` für lokale PDFs, `generate-logs` und
  `infrastructure-setup`.
- `workshop-demo/`: Node-Skripte, die die Demo-Indizes anlegen und
  aufräumen.

## Fallstricke dieses Repos

- **`kunden/` enthält echte Kundendaten und ist gitignoriert.** Darunter
  liegen Betriebslogs, Screenshots und Notizen eines realen Kunden. Nichts
  daraus in Folien, Labs oder Commits übernehmen, auch nicht anonymisiert
  paraphrasiert. Dasselbe gilt für `environment/data/bsd/`, wo nur
  `README.md` und `.gitkeep` versioniert sind.
- **Lab-Nummern und Folien-Nummern laufen ab Modul 04 auseinander.** Zu
  `slides/04-machine-learning` gibt es kein Lab, dafür `lab-04-maps` ohne
  eigenes Deck. Ab da liegt das Lab um eins bis zwei unter der Modulnummer.
  Nie von der Nummer auf die Zuordnung schließen. Die Tabelle in der
  Wurzel-`README.md` ist maßgeblich.
- **`lab-03b` bricht das Nummernschema.** Beim Einfügen weiterer Zwischenlabs
  denselben Buchstaben-Suffix verwenden, statt alles neu zu nummerieren.
- **`pdf/` ist gitignoriert.** Die PDFs baut die CI über `pdf-publisher`.
  Lokale Renderings nicht committen.
- **Die CI deployt auf `elastic-training`.** `.gitlab-ci.yml` setzt die
  Subdomain über den Input der `training-deploy`-Komponente. Ein Commit mit
  `feat:` oder `fix:` erzeugt einen Release-Tag und ein Deployment.
- **Die Kibana-Oberfläche ist englisch, das Material deutsch.** Bezeichner aus
  der Oberfläche unübersetzt lassen; ändert Elastic eine Beschriftung, stimmen
  Klickpfad und Screenshot nicht mehr überein und müssen zusammen
  aktualisiert werden.
- **Die CI läuft auf zwei Plattformen.** `.gitlab-ci.yml` bindet die
  GitLab-Komponenten ein, `.github/workflows/ci.yml` ruft `lint.yml`,
  `slides.yml`, `release.yml` und `pages.yml` aus
  `it-erben/ci`. Die PDFs gehen dort auf
  GitHub Pages, ein Deployment gibt es auf GitHub nicht.

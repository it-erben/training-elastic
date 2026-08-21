# Arbeitsregeln

## Ton

- Knapp. Sag, was zu sagen ist, dann Schluss. Kein Vorgeplänkel, keine
  Zusammenfassung des gerade Getanen, kein „gute Frage“, kein Wiederholen der
  Aufgabe.
- Keine Füll-Adjektive (robust, nahtlos, mächtig, umfassend, produktionsreif).
  Knapp sagen, was der Code tut, nicht wie gut er ist. Nicht paraphrasieren, was
  die nächsten Zeilen tun. Stattdessen das WARUM und WIE erklären, wenn das dem
  Verständnis wirklich hilft.
- Docs und READMEs: was es ist, wie man es nutzt, was es bereitstellt. Sonst
  nichts.
- Commit-Nachrichten: conventional-commit, Imperativ, möglichst einzeilig. Den
  Scope richtig wählen — Release-Tooling routet unter Umständen darüber. Breaking
  Changes bekommen ein `!` (`feat(api)!: …`) oder einen `BREAKING CHANGE:`-Footer.
  Betreffzeile ≤ 72 Zeichen, Imperativ („add“, „fix“, nicht „added“, „fixes“).
  Body auf 72 Zeichen umbrechen.
- Kleine, fokussierte Commits bevorzugen. Release-Tooling leitet Versionssprünge
  und Changelog oft aus den Commit-Betreffzeilen ab.
- Keine Ticket-Nummern in Code, Commits oder Docs.
- Kommentare erklären das *Warum*, nicht das *Was*. Code-Kommentare benennen die
  Absicht oder eine Einschränkung, die der Code nicht zeigen kann. Kommentare
  löschen, die den Code nur wiederholen.
- Kommentare und Docs immer als Ganzes betrachten. Nie nur anhängen. Im Kontext
  prüfen und auf den faktischen Stand bringen. Im Zweifel im Code recherchieren.
  Veraltete und aus dem Kontext gefallene Verweise entfernen, ebenso frühere
  Beobachtungen, Schilderungen von Situationen, die zu einer früheren Änderung
  führten, Maschinennamen oder -adressen sowie jede Vermutung über die
  nachgelagerte Nutzung dieses Repos und seiner Artefakte — abgesehen von
  gültigen, aktuellen Beispielen.
- Auf ein anderes Repository oder Projekt nur verweisen, wenn dessen Zustand der
  unmittelbare Grund für die Änderung ist (ein Dependency-Bump, ein eingespielter
  Fix, ein an eine veröffentlichte Version gebundener API-Vertrag). Kontext für
  Reviewer, Dank oder Querverweise gehören in den PR-Thread oder ein Issue, nicht
  in den Commit.
- Deklarative Fakten schreiben. Keine Personalpronomen („ich“, „wir“, „du“).
  Keine Leseransprache: kein „beachte, dass…“, „wie man sieht…“, „wir haben uns
  entschieden…“, „das sollte helfen…“. Die Regel gilt für Dokumentation, die
  ein Artefakt beschreibt. Ausgenommen sind Folien und Lab-Anleitungen, siehe
  unten.
- Nicht erzählen. Keine Historie, was zuerst versucht wurde, was scheiterte oder
  welche Alternativen erwogen wurden.
- Keine Füll-Verben ohne Konkretes. „Aufräumen“, „verbessern“, „refactoren“
  allein sagen nichts; entweder die tatsächliche Änderung benennen oder die Zeile
  weglassen.
- Keine Checklisten, keine „Summary“-/„Test plan“-Abschnitte, keine
  Marketing-Sprache, keine Emojis.

## Folien

Marp-Decks unter `slides/<NN-thema>/slides.md`. Lehrmaterial, das die
Pronomen- und Leseransprache-Regel aufhebt.

- **Geduzt.** Durchgängig „du“, „dir“, „dein“. Nicht siezen, nicht ihrzen. Das
  Verhältnis liegt bei 293 zu 4 gegen Siezen.
- Jede Folie beginnt mit `#`. Dieses Repo nutzt H1 als Folientitel, nicht H2;
  im gesamten `slides/`-Baum stehen 580 H1 gegen 4 H2.
- Frontmatter: `header` ist der Modultitel selbst (`"Modul 02: Discover &
  Abfragen"`), `footer: "CC BY-NC-SA 4.0, Alexander Erben"`, `paginate: true`.
- Jedes Deck hat `# Lernziele` als zweite Folie („Nach diesem Modul kannst
  du:“) und schließt mit einer Zusammenfassung. Beide sind in allen dreizehn
  Decks vorhanden — beim Erweitern mitziehen.
- Schriftgröße pro Folie über `<style scoped>section { font-size: 1.6em; }
  </style>` direkt über oder unter dem Folientrenner. Tabellen bekommen
  stattdessen `table { font-size: 0.85em; }`.
- Ein Blockzitat am Fuß der Folie trägt die Merkaussage: „Discover zeigt dir
  die Rohdaten - hier beginnst du jede Analyse.“ Höchstens eins pro Folie.
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
- `## Übungsziel` steht am Anfang: „Am Ende dieser Übung hast du:“ plus
  Ergebnisliste im Perfekt.
- Danach `## Teil N: …` als fachlicher Abschnitt, darin `### Schritt N.M: …`
  als einzelner Handgriff.
- Ein Schritt ist eine nummerierte Liste von Klicks oder Kommandos, jeder
  Eintrag eine Handlung.
- Nach jedem Schritt, dessen Ergebnis prüfbar ist, `**Erwartetes Ergebnis:**`
  mit dem, was auf dem Bildschirm zu sehen sein muss. Das ist das häufigste
  Element im Lab-Baum und der Anker, an dem Teilnehmer merken, dass sie
  falsch abgebogen sind.
- `**Aufgabe:**` markiert die Stelle, an der selbst etwas herausgefunden
  werden soll, statt einer Klickanweisung zu folgen.
- Knapp auf Satzebene gilt weiterhin: keine Füll-Adjektive, kein Marketing,
  keine Zusammenfassung des Abschnitts darüber.

## Vor dem Abschluss

- Lint, Tests und Build des Projekts für alles Berührte ausführen.
- `pre-commit run --all-files` laufen lassen und alle Befunde beheben.
- Folien, die verändert wurden, mit `tools/render-slides.sh` rendern und
  ansehen. Die Ausgabe landet in `pdf/` und ist gitignoriert.
- Nicht „fertig“ behaupten, ohne die Prüfung ausgeführt zu haben. Belege vor
  Behauptungen.
- Alle TODO-Marker entfernen, die du in deiner Sitzung hinzugefügt hast, und
  nacharbeiten — oder dem Nutzer sagen, dass ein Follow-up nötig ist. Alle Marker
  und Verweise auf deine eigene Aufgabenliste oder historische Arbeitsschritte
  (P2, P3a, Item 1, Task A usw.) samt ihrer Erzählung entfernen. Wenn wirklich
  etwas offen bleibt, dem Nutzer außerhalb von Code, Docs, Markdown, Kommentaren,
  PR-Beschreibungen, Commit-Nachrichten oder allem anderen in diesem Repo und
  seiner angeschlossenen Pipeline Bescheid geben.

## Aufbau dieses Repos

Dreitägige Schulung zum Elastic Stack. Ein Motto je Tag: Tag 1 Daten
analysieren, Tag 2 Logs einsammeln, Tag 3 Plattform betreiben. Die Zuordnung
von Tag zu Inhalten steht in der Wurzel-`README.md`.

- `slides/01-…` bis `slides/13-…` — dreizehn Marp-Decks.
- `labs/lab-01-…` bis `labs/lab-11-…` plus `lab-03b` — zwölf Übungen.
- `environment/day1`, `day2`, `day3` — je ein `docker-compose.yml`, eine
  `README.md` und ein `reset.sh`. Jeder Teilnehmer betreibt den Stack lokal;
  es gibt keine zentrale Trainer-Instanz.
- `environment/VORBEREITUNG.md` — was vor dem Kurs zu tun ist, vor allem
  Images vorladen.
- `tools/` — `render-slides.sh` für lokale PDFs, `generate-logs` und
  `infrastructure-setup`.
- `workshop-demo/` — Node-Skripte, die die Demo-Indizes anlegen und
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
  Nie von der Nummer auf die Zuordnung schließen — die Tabelle in der
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

# Table Widget

Staffbase-Widget zum Einbetten und Bearbeiten von Tabellen.

Die Werkzeugleiste des Editors besteht aus dem Button **Speichern** und den
Tabs **Schrift**, **Ausrichtung**, **Zellen**, **Bilder** und **Daten**. Der
gewählte Tab bleibt beim Wechsel der Zellauswahl bestehen.

Der Umschalter **Versalien aufheben** (Tab *Schrift*) setzt auf den markierten
Text — ohne Textmarkierung auf den Inhalt der ausgewählten Zellen — die Klasse
`text-lowercase`, die die globale Versalien-Regel des Hosts außer Kraft setzt.
Im Editor wird der so ausgezeichnete Text geriffelt orange unterstrichen; im
Frontend erscheint nur die Klasse. „Formatierung löschen“ entfernt die
Auszeichnung mit.

Dieses Repository enthält nur Quellcode und das gebaute Bundle. Es ist **nicht
eigenständig baubar** — Toolchain und geteilter Code liegen im Meta-Repo:

**https://github.com/ps-mhp/man-staffbase-cms-extensions**

## Entwicklung

```bash
git clone https://github.com/ps-mhp/man-staffbase-cms-extensions.git
cd man-staffbase-cms-extensions
npm install
scripts/sync.sh table-widget
```

Der Quellcode liegt danach unter `src/widgets/table-widget/`.

```bash
npm run build -- --env widget=table-widget
npm test -- src/widgets/table-widget
scripts/release.sh table-widget
scripts/install.sh table-widget
```

## Auslieferung

Das Bundle wird pro Versionstag über jsDelivr ausgeliefert:

```
https://cdn.jsdelivr.net/gh/ps-mhp/man-staffbase-table-widget@<version>/dist/table-widget.js
```

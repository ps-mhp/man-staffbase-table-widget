# Table Widget

Staffbase-Widget zum Einbetten und Bearbeiten von Tabellen.

Der Editor läuft im gemeinsamen Rahmen von `@man/config-ui` (Kopf mit
Schließen, Status, Vorschau-Umschalter, Rückgängig, Hilfe, Abbrechen und
Übernehmen). Darin: die Tabs **Schrift**, **Ausrichtung**, **Zellen**,
**Bilder** und **Daten** über dem Gitter und rechts das Panel **Tabelle** für
erste Sortierung, sichtbare Zeilen, Export und „Bilder anpassen“. Der gewählte
Tab bleibt beim Wechsel der Zellauswahl bestehen.

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

Die Styles stehen als SCSS unter `src/styles/`: `tokens`/`mixins` als gemeinsame
Grundlage, dazu je ein Stylesheet für Werkzeugleiste (`ribbon`), Editor
(`table-editor`), veröffentlichte Tabelle (`table-widget`) und Bilddeckelung
(`image-fit`/`image-no-fit`); Panel und Rahmen kommen mit Tailwind aus
`@man/config-ui`. Jede
Komponente importiert ihr Stylesheet als String und rendert es selbst als
`<style>`.

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

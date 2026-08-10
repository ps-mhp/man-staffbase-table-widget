# Table Widget

Staffbase-Widget zum Einbetten und Bearbeiten von Tabellen.

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

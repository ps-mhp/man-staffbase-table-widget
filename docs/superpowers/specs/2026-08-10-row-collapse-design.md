# Zeilen einklappen statt vertikal scrollen

## Problem

Das Widget begrenzt seinen Scroll-Wrapper auf `maxHeight: 70vh` und stellt ihn
auf `overflow: auto`. Eine lange Tabelle bekommt dadurch eine eigene vertikale
Bildlaufleiste mitten in der Seite. Das ist auf einer Staffbase-Seite fremd:
Der Leser scrollt die Seite, trifft auf einen zweiten Scrollbereich und muss
raten, welches Rad gerade welchen Inhalt bewegt. Auf Mobilgeräten fängt der
innere Bereich Wischgesten ab.

Stattdessen soll die Tabelle nach einer festgelegten Zahl von Zeilen enden und
darunter einen Schalter zeigen, der die restlichen Zeilen einblendet.

## Ziel

- Kein vertikaler Scroll mehr innerhalb des Widgets.
- Standardmäßig fünf Datenzeilen, danach ein Button „Weitere N Zeilen
  einblenden".
- Der Button klappt wieder ein und heißt dann „Weniger Zeilen anzeigen".
- Die Grenze ist pro Tabelle im Editor einstellbar.

Horizontaler Scroll bleibt: breite Tabellen brauchen ihn, und er kollidiert
nicht mit der Seite, weil die Seite selbst nicht horizontal scrollt.

## Datenmodell

`TableModel` bekommt ein Feld:

```ts
/** Datenzeilen vor dem Einklappen; 0 schaltet das Einklappen ab. */
visibleRows: number;
```

Standard ist `5`. Der Wert zählt **Datenzeilen**, die Kopfzeile ist nie
betroffen. `0` bedeutet „nie einklappen"; damit bleibt die alte Darstellung für
jeden erreichbar, der sie will.

Beim Einlesen gilt derselbe Defaultsatz wie bei `fitImages`: fehlt das Feld,
greift `5`. Negative Werte und Nicht-Zahlen fallen auf den Standard zurück,
Kommazahlen werden abgeschnitten. Geschrieben wird das Feld nur, wenn es vom
Standard abweicht — sonst würde jede simple Tabelle die kompakte
`string[][]`-Form verlieren, die `tabledata` sonst behält.

## Modul `src/row-collapse.ts`

Reine Rechenlogik ohne React, damit sie ohne DOM prüfbar ist.

```ts
export const DEFAULT_VISIBLE_ROWS = 5;

/** Normalisiert einen gespeicherten Wert auf eine brauchbare Grenze. */
export function clampVisibleRows(value: unknown): number;

/** Die tatsächlich zu rendernde Zeilenfolge. */
export function visibleRowOrder(
  bodyOrder: number[],
  limit: number,
  expanded: boolean,
): number[];

/** Wie viele Zeilen der Button freigeben würde. */
export function hiddenRowCount(bodyOrder: number[], limit: number): number;

/** Beschriftung des Buttons. */
export function collapseToggleLabel(hidden: number, expanded: boolean): string;

/**
 * Kürzt einen Zeilenverbund an der Schnittkante, damit er nicht in den
 * ausgeblendeten Bereich ragt.
 */
export function clampRowSpan(
  rowSpan: number,
  displayIndex: number,
  visibleCount: number,
): number;
```

`visibleRowOrder` gibt bei `expanded` oder `limit === 0` die Eingabe unverändert
zurück. Das hält die Fallunterscheidung an einer Stelle statt im JSX.

`clampRowSpan` ist nötig, weil eine über mehrere Zeilen verbundene Zelle sonst
in Zeilen hineinragt, die gar nicht gerendert werden — der Browser zeichnet die
Zelle dann über den Tabellenrand hinaus. Die Zelle endet daher bei der letzten
sichtbaren Zeile; die Grenze bleibt exakt bei der eingestellten Zahl.

Die Beschriftung nennt die Zahl der verborgenen Zeilen („Weitere 12 Zeilen
einblenden"), weil ein nacktes „Mehr anzeigen" verschweigt, ob dahinter drei
oder dreihundert Zeilen stecken. Der Singular wird gesondert gebildet.

## Widget

Der Scroll-Wrapper verliert `maxHeight: 70vh`. Ohne Höhenbegrenzung wächst er
mit seinem Inhalt, und `overflow: auto` löst vertikal nie mehr aus — horizontal
dagegen weiterhin.

Die sticky Kopfzeile (`position: sticky; top: 0`) verliert damit ihre Wirkung,
weil der Wrapper vertikal nicht mehr scrollt. Sie wird entfernt: eine Regel, die
nichts mehr tut, ist eine Falle für den Nächsten, der sich fragt, warum sie da
ist. Die sticky **erste Spalte** (`left: 0`) bleibt, sie gehört zum horizontalen
Scroll.

Der Button steht **außerhalb** des Scroll-Wrappers, direkt darunter. Läge er
darin, würde er beim Querscrollen einer breiten Tabelle aus dem Bild wandern.
Das Widget gibt deshalb künftig einen äußeren Container zurück, der Wrapper und
Button enthält.

Der Button erscheint genau dann, wenn die Tabelle mehr Datenzeilen hat als die
Grenze erlaubt — unabhängig davon, ob gerade ein- oder ausgeklappt ist. Bei
einer Tabelle mit drei Zeilen und Grenze fünf erscheint er also nie, im
ausgeklappten Zustand einer langen Tabelle dagegen als „Weniger Zeilen
anzeigen". Bei `visibleRows: 0` fehlt er immer.
Er trägt `aria-expanded` und `aria-controls` auf den `tbody`, damit
Screenreader den Zusammenhang kennen, und `data-testid="table-rows-toggle"`.

Der Aufklappzustand lebt in `useState` im Widget, nicht im Modell: Er ist eine
Betrachtungsentscheidung des Lesers, kein Inhalt der Tabelle, und darf beim
Speichern nichts hinterlassen.

Sortieren und Einklappen greifen sauber ineinander, weil beide auf
`bodyOrder` arbeiten: erst sortieren, dann schneiden. Wer eine eingeklappte
Tabelle sortiert, sieht die fünf Zeilen, die nach der neuen Sortierung oben
stehen — was der Erwartung entspricht.

## Editor

In der Werkzeug-Gruppe, neben dem Schalter „Bilder anpassen", kommt ein
Zahlenfeld „Sichtbare Zeilen" (`min=0`, `data-testid="toolbar-visible-rows"`).
`0` blendet alle Zeilen ein; ein Hinweis im `title` sagt das.

Das Editor-Grid selbst klappt **nicht** ein. Es ist eine Bearbeitungsfläche:
Zeilen zu verstecken, die man gleich bearbeiten will, wäre Selbstzweck. Das
Grid behält seinen eigenen Scrollbereich.

## Tests

**`src/row-collapse.test.ts`** — Normalisieren der Grenze (fehlend, negativ,
Kommazahl, `0`), Schneiden der Zeilenfolge, Zählen der verborgenen Zeilen,
Singular und Plural der Beschriftung, Kürzen des Zeilenverbunds an der Kante
und dessen Unversehrtheit im ausgeklappten Zustand.

**`src/table-widget.test.tsx`** — bei mehr Zeilen als erlaubt werden nur fünf
gerendert; der Button blendet die restlichen ein und wieder aus; bei kurzen
Tabellen fehlt er; bei `visibleRows: 0` fehlt er ebenfalls und alle Zeilen
stehen da; der Scroll-Wrapper trägt keine `maxHeight` mehr; ein
zeilenübergreifender Verbund reicht nicht über die Schnittkante hinaus.

**`src/table-model.test.ts`** — Standard beim Anlegen, Übernahme aus JSON,
Rückfall auf den Standard bei Unsinn, und dass der Standardwert die kompakte
Serialisierung nicht aufbricht.

**`src/table-editor.test.tsx`** — das Zahlenfeld zeigt den Wert und meldet
Änderungen; das Grid rendert unabhängig davon alle Zeilen.

## Bewusst nicht enthalten

- Kein schrittweises Nachladen in Fünferblöcken. Ein Klick, alles da — mehr
  verlangt niemand von einer Tabelle auf einer Intranetseite.
- Kein Verlauf über der letzten sichtbaren Zeile. Er verspricht „hier geht es
  weiter", was der Button schon sagt, und interagiert schlecht mit den
  Zellhintergründen.
- Keine Begrenzung im Editor-Grid.

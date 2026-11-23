/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  CLIPBOARD_ATTRIBUTE,
  applyFill,
  blockToHtml,
  blockToText,
  clearCells,
  copyBlock,
  fillExtension,
  pasteCells,
  pasteTarget,
  readClipboard,
  unionRange,
} from "./cell-clipboard";
import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
import { TableModel } from "./table-model";

const model = (data: string[][], formats: TableModel["formats"] = {}): TableModel => ({
  data,
  merges: [],
  formats,
  sort: null,
  fitImages: true,
  visibleRows: DEFAULT_VISIBLE_ROWS,
  exportMode: "off",
});

const grid = (): TableModel =>
  model(
    [
      ["", "Q1", "Q2", "Q3"],
      ["Umsatz", "m<sup>2</sup>", "200", ""],
      ["Kosten", "50", "60", ""],
      ["Saldo", "", "", ""],
    ],
    { "1,1": { bold: true }, "2,2": { color: "#e40045" } },
  );

const range = (top: number, left: number, bottom: number, right: number) => ({ top, left, bottom, right });

describe("Kopieren", () => {
  it("nimmt Werte und Formate eines Bereichs", () => {
    expect(copyBlock(grid(), range(1, 1, 2, 2))).toEqual({
      values: [
        ["m<sup>2</sup>", "200"],
        ["50", "60"],
      ],
      formats: [
        [{ bold: true }, {}],
        [{}, { color: "#e40045" }],
      ],
    });
  });

  it("schreibt Tabulator-Text für Excel und HTML mit den eigenen Daten", () => {
    const block = copyBlock(grid(), range(1, 0, 2, 1));
    expect(blockToText(block)).toBe("Umsatz\tm²\nKosten\t50");
    const html = blockToHtml(block);
    expect(html).toMatch(new RegExp(`^<table ${CLIPBOARD_ATTRIBUTE}="`));
    expect(html).toContain("<td>m<sup>2</sup></td>");
  });

  it("liest die eigenen Daten verlustfrei zurück", () => {
    const block = copyBlock(grid(), range(1, 1, 2, 2));
    expect(readClipboard(blockToHtml(block), "egal")).toEqual(block);
  });
});

describe("Einfügen lesen", () => {
  it("nimmt aus fremdem HTML (Excel) nur den Inhalt, bereinigt", () => {
    const html = '<table><tr><td style="color:red"><b>A</b></td><td>B<img src="javascript:x"></td></tr></table>';
    expect(readClipboard(html, "A\tB")).toEqual({ values: [["A", "B"]], formats: null });
  });

  it("nimmt Tabulator-Text und maskiert spitze Klammern", () => {
    expect(readClipboard("", "a<b\tc\n1\t2\n")).toEqual({ values: [["a&lt;b", "c"], ["1", "2"]], formats: null });
  });

  it("lässt bei den eigenen Daten nur bekannte Formate durch", () => {
    const html = `<table ${CLIPBOARD_ATTRIBUTE}="${JSON.stringify({
      values: [["<img src=x onerror=alert(1)>ok"]],
      formats: [[{ bold: true, color: "url(x)", align: "middle", fontSize: 14, evil: 1 }]],
    }).replace(/"/g, "&quot;")}"></table>`;
    expect(readClipboard(html, "")).toEqual({ values: [["ok"]], formats: [[{ bold: true, fontSize: 14 }]] });
  });

  it("meldet nichts, wenn nichts Brauchbares dabei ist", () => {
    expect(readClipboard("", "")).toBeNull();
  });
});

describe("Einfügen schreiben", () => {
  it("fügt ab der Ecke ein und übernimmt die eigenen Formate", () => {
    const source = copyBlock(grid(), range(1, 1, 1, 2));
    const { model: next, range: pasted } = pasteCells(grid(), range(3, 1, 3, 1), source);
    expect(pasted).toEqual(range(3, 1, 3, 2));
    expect(next.data[3]).toEqual(["Saldo", "m<sup>2</sup>", "200", ""]);
    expect(next.formats["3,1"]).toEqual({ bold: true });
  });

  it("lässt fremden Inhalt die Formate der Zielzellen behalten", () => {
    const { model: next } = pasteCells(grid(), range(2, 2, 2, 2), { values: [["99"]], formats: null });
    expect(next.data[2][2]).toBe("99");
    expect(next.formats["2,2"]).toEqual({ color: "#e40045" });
  });

  it("wiederholt einen Block, der in ein größeres Ziel ganz passt", () => {
    const block = { values: [["x"]], formats: null };
    expect(pasteTarget(range(1, 1, 3, 2), block)).toEqual(range(1, 1, 3, 2));
    const { model: next } = pasteCells(grid(), range(1, 1, 3, 2), block);
    expect(next.data.slice(1).map((row) => row.slice(1, 3))).toEqual([
      ["x", "x"],
      ["x", "x"],
      ["x", "x"],
    ]);
  });

  it("fügt einen Block, der nicht aufgeht, nur einmal ein", () => {
    expect(pasteTarget(range(0, 0, 2, 2), { values: [["a", "b"]], formats: null })).toEqual(range(0, 0, 0, 1));
  });

  it("lässt die Tabelle wachsen, wenn der Block über den Rand reicht", () => {
    const { model: next } = pasteCells(grid(), range(3, 3, 3, 3), { values: [["a", "b"], ["c", "d"]], formats: null });
    expect(next.data).toHaveLength(5);
    expect(next.data[0]).toHaveLength(5);
    expect(next.data[4][4]).toBe("d");
  });

  it("leert beim Ausschneiden nur die Werte", () => {
    const next = clearCells(grid(), range(1, 1, 2, 2));
    expect(next.data[1]).toEqual(["Umsatz", "", "", ""]);
    expect(next.formats).toEqual(grid().formats);
  });
});

describe("Ausfüllkästchen", () => {
  const source = range(1, 1, 2, 1);

  it("erweitert in die Richtung, in die man weiter zieht", () => {
    expect(fillExtension(source, 2, 1)).toBeNull();
    expect(fillExtension(source, 3, 1)).toEqual(range(3, 1, 3, 1));
    expect(fillExtension(source, 0, 1)).toEqual(range(0, 1, 0, 1));
    expect(fillExtension(source, 2, 3)).toEqual(range(1, 2, 2, 3));
    // Zwei Spalten nach rechts wiegen mehr als eine Zeile nach unten.
    expect(fillExtension(source, 3, 3)).toEqual(range(1, 2, 2, 3));
  });

  it("schreibt das Muster der Quelle fort und überschreibt Werte und Formate", () => {
    const next = applyFill(grid(), range(1, 1, 2, 1), range(1, 2, 2, 3));
    expect(next.data[1].slice(1)).toEqual(["m<sup>2</sup>", "m<sup>2</sup>", "m<sup>2</sup>"]);
    expect(next.data[2].slice(1)).toEqual(["50", "50", "50"]);
    expect(next.formats["1,3"]).toEqual({ bold: true });
    expect(next.formats["2,2"]).toBeUndefined();
  });

  it("füllt auch nach oben im Muster der Quelle", () => {
    const next = applyFill(grid(), range(2, 1, 3, 1), range(0, 1, 1, 1));
    expect(next.data.map((row) => row[1])).toEqual(["50", "", "50", ""]);
  });

  it("markiert danach Quelle und Erweiterung", () => {
    expect(unionRange(range(1, 1, 2, 1), range(3, 1, 5, 1))).toEqual(range(1, 1, 5, 1));
  });
});

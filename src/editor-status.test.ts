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

import { tableChangesStatus } from "./editor-status";
import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
import { TableModel, insertRow, mergeCells, setFormat, setVisibleRows } from "./table-model";
import { updateCell } from "./grid-operations";

const saved: TableModel = {
  data: [
    ["", "Q1", "Q2"],
    ["Umsatz", "100", "200"],
    ["Kosten", "50", "60"],
  ],
  merges: [],
  formats: {},
  sort: null,
  fitImages: true,
  visibleRows: DEFAULT_VISIBLE_ROWS,
  exportMode: "off",
};

const withCell = (model: TableModel, row: number, col: number, value: string): TableModel => ({
  ...model,
  data: updateCell(model.data, row, col, value),
});

describe("tableChangesStatus", () => {
  it("sagt nichts, solange sich nichts unterscheidet", () => {
    expect(tableChangesStatus({ ...saved }, saved)).toBeUndefined();
  });

  it("zählt eine geänderte Zelle", () => {
    expect(tableChangesStatus(withCell(saved, 1, 1, "110"), saved)).toBe("1 Zelle geändert");
  });

  it("zählt Inhalt und Format zusammen, jede Zelle einmal", () => {
    const text = withCell(withCell(saved, 1, 1, "110"), 2, 2, "65");
    const draft = setFormat(text, [[1, 1], [0, 1]], { bold: true });

    expect(tableChangesStatus(draft, saved)).toBe("3 Zellen geändert");
  });

  it("nennt eingefügte Zeilen eine Änderung der Struktur", () => {
    expect(tableChangesStatus(insertRow(saved, 1), saved)).toBe("Struktur geändert");
  });

  it("nennt verbundene Zellen eine Änderung der Struktur", () => {
    const draft = mergeCells(saved, { top: 1, left: 1, bottom: 1, right: 2 });

    expect(tableChangesStatus(draft, saved)).toBe("Struktur geändert");
  });

  it("nennt Einstellungen der ganzen Tabelle für sich", () => {
    expect(tableChangesStatus(setVisibleRows(saved, 0), saved)).toBe("Einstellungen geändert");
    expect(tableChangesStatus({ ...saved, sort: { col: 1, dir: "desc" } }, saved)).toBe(
      "Einstellungen geändert",
    );
    expect(tableChangesStatus({ ...saved, exportMode: "all" }, saved)).toBe("Einstellungen geändert");
    expect(tableChangesStatus({ ...saved, fitImages: false }, saved)).toBe("Einstellungen geändert");
  });

  it("reiht Zellen und Einstellungen aneinander", () => {
    const draft = setVisibleRows(withCell(saved, 1, 1, "110"), 0);

    expect(tableChangesStatus(draft, saved)).toBe("1 Zelle geändert · Einstellungen geändert");
  });

  it("übersieht ein Format nicht, das nur ein leeres Feld trägt", () => {
    // Ein gelöschtes Feld darf nicht als Änderung zählen: `setFormat` lässt
    // `undefined` stehen, geschrieben wird es aber nicht.
    const formatted = setFormat(saved, [[1, 1]], { bold: true });
    const draft = { ...formatted, formats: { "1,1": { bold: true, color: undefined } } };

    expect(tableChangesStatus(draft, formatted)).toBeUndefined();
  });
});

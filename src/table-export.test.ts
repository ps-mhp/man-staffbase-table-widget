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

import { importXlsx } from "./table-import";
import { TableModel, parseTableModel } from "./table-model";
import { ExportGrid, buildExportGrid, csvField, parseNumber, toCsv, toXlsx } from "./table-export";

const model = (data: string[][], extra: Partial<TableModel> = {}): TableModel => ({
  ...parseTableModel(JSON.stringify(data)),
  ...extra,
});
const texts = (grid: ExportGrid) => grid.rows.map((row) => row.map((cell) => cell.text));
const data = [["", "A"], ["x", "1"], ["y", "2"]];

describe("buildExportGrid", () => {
  it("keeps the header and follows the given row order", () => {
    const grid = buildExportGrid({ model: model(data), rowOrder: [2, 1], selected: null });
    expect(texts(grid)).toEqual([["", "A"], ["y", "2"], ["x", "1"]]);
  });

  it("filters to the selection; an empty selection exports everything", () => {
    expect(texts(buildExportGrid({ model: model(data), rowOrder: [1, 2], selected: new Set([2]) }))).toEqual([
      ["", "A"],
      ["y", "2"],
    ]);
    expect(texts(buildExportGrid({ model: model(data), rowOrder: [1, 2], selected: new Set() }))).toHaveLength(3);
  });

  it("strips markup from cells", () => {
    const grid = buildExportGrid({ model: model([["", "m<sup>2</sup>"]]), rowOrder: [], selected: null });
    expect(texts(grid)).toEqual([["", "m²"]]);
  });

  it("keeps a merge whose rows are all exported in order, else fills it", () => {
    const m = model([["", "A"], ["x", "1"], ["", "2"], ["z", "3"]], {
      merges: [{ row: 1, col: 0, rowSpan: 2, colSpan: 1 }],
    });
    const kept = buildExportGrid({ model: m, rowOrder: [1, 2, 3], selected: null });
    expect(kept.merges).toEqual([{ row: 1, col: 0, rowSpan: 2, colSpan: 1 }]);
    const broken = buildExportGrid({ model: m, rowOrder: [3, 2, 1], selected: null });
    expect(broken.merges).toEqual([]);
    expect(texts(broken).map((row) => row[0])).toEqual(["", "z", "x", "x"]);
  });
});

describe("parseNumber", () => {
  it.each([
    ["1.234,5", 1234.5, "#,##0.0"],
    ["1,234.5", 1234.5, "#,##0.0"],
    ["-12,50", -12.5, "0.00"],
    ["−3", -3, "0"],
    ["12 %", 0.12, "0%"],
    ["7,5%", 0.075, "0.0%"],
    ["42", 42, "0"],
    ["0,5", 0.5, "0.0"],
    ["1 234 567", 1234567, "#,##0"],
  ])("reads %s as a number", (text, value, format) => {
    const parsed = parseNumber(text);
    expect(parsed?.value).toBeCloseTo(value);
    expect(parsed?.format).toBe(format);
  });

  it.each(["007", "1.234", "1,234", "12 kg", "", "1.2.3", "-", "%"])("keeps %p as text", (text) => {
    expect(parseNumber(text)).toBeNull();
  });
});

describe("CSV", () => {
  it("quotes, guards formulas but not negative numbers", () => {
    expect(csvField('a;"b"')).toBe('"a;""b"""');
    expect(csvField("line\nbreak")).toBe('"line\nbreak"');
    expect(csvField("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvField("@user")).toBe("'@user");
    expect(csvField("-12,5")).toBe("-12,5");
  });

  it("writes BOM, semicolons and CRLF", () => {
    const grid = buildExportGrid({ model: model([["", "A"], ["x", "1"]]), rowOrder: [1], selected: null });
    expect(toCsv(grid)).toBe("\uFEFF;A\r\nx;1\r\n");
  });
});

describe("toXlsx", () => {
  it("round-trips values, merges and formats through importXlsx", async () => {
    const m = model([["", "Q1", "Q2"], ["Umsatz", "1.234,5", "x"], ["Kosten", "50", "y"]], {
      merges: [{ row: 0, col: 1, rowSpan: 1, colSpan: 2 }],
      formats: {
        "1,2": { bold: true, italic: true, underline: true, strikethrough: true, color: "#e40045", background: "#eaedf3", align: "right", valign: "top", fontSize: 18 },
      },
    });
    const back = await importXlsx(await toXlsx(buildExportGrid({ model: m, rowOrder: [1, 2], selected: null })));
    expect(back.data[0][1]).toBe("Q1");
    expect(back.data[1][0]).toBe("Umsatz");
    expect(back.data[1][2]).toBe("x");
    expect(back.data[2][1]).toBe("50");
    expect(back.merges).toEqual([{ row: 0, col: 1, rowSpan: 1, colSpan: 2 }]);
    expect(back.formats["1,2"]).toEqual(expect.objectContaining(m.formats["1,2"]));
    expect(back.formats["0,1"]).toEqual(expect.objectContaining({ bold: true, background: "#f8f8f8" }));
  });

  it("writes recognised numbers as numbers and leaves the header as text", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const m = model([["", "2024"], ["Umsatz", "1.234,5"], ["Code", "007"]]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await toXlsx(buildExportGrid({ model: m, rowOrder: [1, 2], selected: null })));
    const sheet = workbook.worksheets[0];
    expect(sheet.name).toBe("Tabelle");
    expect(sheet.getCell("B1").value).toBe("2024");
    expect(sheet.getCell("B2").value).toBe(1234.5);
    expect(sheet.getCell("B2").numFmt).toBe("#,##0.0");
    expect(sheet.getCell("B3").value).toBe("007");
    expect(sheet.views[0]).toEqual(expect.objectContaining({ state: "frozen", xSplit: 1, ySplit: 1 }));
  });
});

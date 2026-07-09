/*!
 * Copyright 2026, Staffbase SE and contributors.
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

import ExcelJS from "exceljs";
import { importCsv, importXlsx } from "./table-import";

describe("importCsv", () => {
  it("parses a simple comma-separated table", () => {
    const model = importCsv("a,b,c\n1,2,3");
    expect(model.data).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
    expect(model.merges).toEqual([]);
    expect(model.formats).toEqual({});
  });

  it("auto-detects the semicolon delimiter", () => {
    const model = importCsv("a;b;c\n1;2;3");
    expect(model.data[0]).toEqual(["a", "b", "c"]);
  });

  it("handles quoted fields with embedded delimiters and quotes", () => {
    const model = importCsv('"Hello, World","She said ""hi"""\nx,y');
    expect(model.data[0]).toEqual(["Hello, World", 'She said "hi"']);
  });

  it("handles newlines inside quoted fields", () => {
    const model = importCsv('"line1\nline2",b\nc,d');
    expect(model.data).toEqual([
      ["line1\nline2", "b"],
      ["c", "d"],
    ]);
  });

  it("pads ragged rows to a rectangle", () => {
    const model = importCsv("a,b,c\n1");
    expect(model.data).toEqual([
      ["a", "b", "c"],
      ["1", "", ""],
    ]);
  });
});

describe("importXlsx", () => {
  const buildWorkbook = async (
    build: (ws: ExcelJS.Worksheet) => void,
  ): Promise<ArrayBuffer> => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");
    build(ws);
    return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  };

  it("imports plain cell values", async () => {
    const buffer = await buildWorkbook((ws) => {
      ws.getCell("A1").value = "Header";
      ws.getCell("B1").value = "Wert";
      ws.getCell("A2").value = "Zeile";
      ws.getCell("B2").value = 42;
    });
    const model = await importXlsx(buffer);
    expect(model.data[0]).toEqual(["Header", "Wert"]);
    expect(model.data[1]).toEqual(["Zeile", "42"]);
  });

  it("imports merged cells", async () => {
    const buffer = await buildWorkbook((ws) => {
      ws.getCell("A1").value = "Merged";
      ws.mergeCells("A1:C1");
    });
    const model = await importXlsx(buffer);
    expect(model.merges).toContainEqual({ row: 0, col: 0, rowSpan: 1, colSpan: 3 });
  });

  it("imports bold/italic and font colour", async () => {
    const buffer = await buildWorkbook((ws) => {
      const cell = ws.getCell("A1");
      cell.value = "Styled";
      cell.font = { bold: true, italic: true, color: { argb: "FFFF0000" } };
    });
    const model = await importXlsx(buffer);
    expect(model.formats["0,0"]).toMatchObject({ bold: true, italic: true, color: "#ff0000" });
  });

  it("imports a solid fill as a background colour", async () => {
    const buffer = await buildWorkbook((ws) => {
      const cell = ws.getCell("A1");
      cell.value = "Filled";
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    });
    const model = await importXlsx(buffer);
    expect(model.formats["0,0"]).toMatchObject({ background: "#ffff00" });
  });

  it("imports superscript rich text as <sup> markup", async () => {
    const buffer = await buildWorkbook((ws) => {
      ws.getCell("A1").value = {
        richText: [
          { text: "m" },
          { text: "2", font: { vertAlign: "superscript" } },
        ],
      };
    });
    const model = await importXlsx(buffer);
    expect(model.data[0][0]).toBe("m<sup>2</sup>");
  });
});

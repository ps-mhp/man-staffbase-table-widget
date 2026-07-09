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
import { TableModel, Merge, CellFormat, TextAlign, formatKey } from "./table-model";

/**
 * Imports a user-provided spreadsheet file into a {@link TableModel}.
 * `.csv` is parsed locally; `.xlsx`/`.xls` are parsed with ExcelJS, which is
 * loaded lazily (dynamic import) so it never weighs down the widget bundle
 * that renders on live pages. XLSX import preserves merged cells, per-cell
 * formatting (bold/italic/underline/strike/colour/fill/size/alignment) and
 * super-/sub-script runs.
 */
export async function importTableFile(file: File): Promise<TableModel> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    return importCsv(await file.text());
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return importXlsx(await file.arrayBuffer());
  }
  throw new Error(`Nicht unterstütztes Dateiformat: ${file.name}`);
}

const emptyModel = (data: string[][]): TableModel => ({
  data: data.length > 0 ? data : [[""]],
  merges: [],
  formats: {},
  sort: null,
});

/** Pads every row to the widest row length so the grid stays rectangular. */
const rectangular = (rows: string[][]): string[][] => {
  const cols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return rows.map((row) => {
    const next = [...row];
    while (next.length < cols) next.push("");
    return next;
  });
};

/**
 * Parses CSV text into a model. Handles quoted fields (with embedded commas,
 * newlines and doubled quotes) and auto-detects `,` vs `;` as the delimiter
 * from the first line (German exports often use `;`).
 */
export function importCsv(text: string): TableModel {
  const normalized = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
  if (normalized === "") return emptyModel([[""]]);

  const firstLine = normalized.split("\n")[0];
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  rows.push(row);

  return emptyModel(rectangular(rows));
}

/** Converts an ExcelJS ARGB string (e.g. `FFFF0000`) to `#RRGGBB`. */
const argbToHex = (argb: string | undefined): string | undefined => {
  if (!argb || argb.length < 6) return undefined;
  const rgb = argb.length === 8 ? argb.slice(2) : argb;
  return `#${rgb.toLowerCase()}`;
};

/** Column letters (`A`, `AB`, ...) to a zero-based index. */
const columnToIndex = (letters: string): number => {
  let index = 0;
  for (const ch of letters.toUpperCase()) {
    index = index * 26 + (ch.charCodeAt(0) - 64);
  }
  return index - 1;
};

/** Parses an ExcelJS merge range (e.g. `B2:C3`) into a model {@link Merge}. */
const parseMergeRange = (range: string): Merge | null => {
  const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i.exec(range);
  if (!match) return null;
  const [, c1, r1, c2, r2] = match;
  const top = Math.min(Number(r1), Number(r2)) - 1;
  const bottom = Math.max(Number(r1), Number(r2)) - 1;
  const left = Math.min(columnToIndex(c1), columnToIndex(c2));
  const right = Math.max(columnToIndex(c1), columnToIndex(c2));
  const rowSpan = bottom - top + 1;
  const colSpan = right - left + 1;
  if (rowSpan <= 1 && colSpan <= 1) return null;
  return { row: top, col: left, rowSpan, colSpan };
};

const escapeText = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Converts an ExcelJS cell value to a model cell string. Rich-text runs with
 * a superscript/subscript vertical alignment become `<sup>`/`<sub>` markup;
 * everything else is plain (escaped) text.
 */
const cellToString = (cell: ExcelJS.Cell): string => {
  const value = cell.value as unknown;
  if (value && typeof value === "object" && "richText" in value) {
    const runs = (value as ExcelJS.CellRichTextValue).richText;
    return runs
      .map((run) => {
        const text = escapeText(run.text ?? "");
        const vertAlign = run.font?.vertAlign;
        if (vertAlign === "superscript") return `<sup>${text}</sup>`;
        if (vertAlign === "subscript") return `<sub>${text}</sub>`;
        return text;
      })
      .join("");
  }
  return cell.text ?? "";
};

/** Extracts the per-cell {@link CellFormat} from an ExcelJS cell. */
const cellToFormat = (cell: ExcelJS.Cell): CellFormat | null => {
  const format: CellFormat = {};
  const font = cell.font;
  if (font) {
    if (font.bold) format.bold = true;
    if (font.italic) format.italic = true;
    if (font.underline) format.underline = true;
    if (font.strike) format.strikethrough = true;
    if (typeof font.size === "number") format.fontSize = font.size;
    const color = argbToHex(font.color?.argb);
    if (color) format.color = color;
  }
  const align = cell.alignment?.horizontal;
  if (align === "left" || align === "center" || align === "right") {
    format.align = align as TextAlign;
  }
  const fill = cell.fill;
  if (fill && fill.type === "pattern" && fill.pattern === "solid") {
    const background = argbToHex(fill.fgColor?.argb);
    if (background) format.background = background;
  }
  return Object.keys(format).length > 0 ? format : null;
};

/** Imports the first worksheet of an XLSX/XLS file into a model. */
export async function importXlsx(buffer: ArrayBuffer): Promise<TableModel> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return emptyModel([[""]]);

  const merges = (worksheet.model.merges ?? [])
    .map(parseMergeRange)
    .filter((m): m is Merge => m !== null);

  // Grid dimensions: cover both the populated cells and any merge extents.
  let rowCount = worksheet.rowCount;
  let colCount = worksheet.columnCount;
  for (const merge of merges) {
    rowCount = Math.max(rowCount, merge.row + merge.rowSpan);
    colCount = Math.max(colCount, merge.col + merge.colSpan);
  }
  rowCount = Math.max(rowCount, 1);
  colCount = Math.max(colCount, 1);

  const data: string[][] = [];
  const formats: Record<string, CellFormat> = {};

  for (let r = 0; r < rowCount; r++) {
    const row: string[] = [];
    for (let c = 0; c < colCount; c++) {
      const cell = worksheet.getRow(r + 1).getCell(c + 1);
      row.push(cellToString(cell));
      const format = cellToFormat(cell);
      if (format) formats[formatKey(r, c)] = format;
    }
    data.push(row);
  }

  return { data: rectangular(data), merges, formats, sort: null };
}

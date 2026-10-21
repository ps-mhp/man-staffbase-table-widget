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

import ExcelJS from "exceljs";
import { cellToPlain } from "./cell-text";
import { CellFormat, Merge, TableModel, cellFormat } from "./table-model";

/**
 * Download of the published table as .xlsx or .csv. The XLSX side mirrors
 * `importXlsx` in `table-import.ts`, so a downloaded file imports back into
 * the editor with its values, merges and cell formats intact.
 */

export interface ExportRequest {
  model: TableModel;
  /** Original indexes of the body rows in display order (sorted, collapsed rows included). */
  rowOrder: number[];
  /** Picked body rows; `null` or empty exports every row. */
  selected: ReadonlySet<number> | null;
}
export interface ExportCell {
  text: string;
  format: CellFormat;
}
export interface ExportGrid {
  rows: ExportCell[][];
  /** Merges kept in the export, with `row` relative to {@link ExportGrid.rows}. */
  merges: Merge[];
}

const mergeAround = (model: TableModel, row: number, col: number): Merge | undefined =>
  model.merges.find((m) => row >= m.row && row < m.row + m.rowSpan && col >= m.col && col < m.col + m.colSpan);

/**
 * Header plus the requested body rows as plain text with their formats. A
 * merge survives only if all its rows are exported in a row and in order;
 * otherwise every cell it covered carries the anchor's value.
 */
export function buildExportGrid({ model, rowOrder, selected }: ExportRequest): ExportGrid {
  const filter = selected && selected.size > 0 ? selected : null;
  const sourceRows = [0, ...rowOrder.filter((r) => r !== 0 && (!filter || filter.has(r)))];
  const cols = model.data[0]?.length ?? 0;
  const rows = sourceRows.map((r) =>
    Array.from({ length: cols }, (_, c) => {
      const merge = mergeAround(model, r, c);
      const row = merge ? merge.row : r;
      const col = merge ? merge.col : c;
      return { text: cellToPlain(model.data[row]?.[col] ?? ""), format: cellFormat(model, row, col) };
    }),
  );
  const merges = model.merges.flatMap((m) => {
    const start = sourceRows.indexOf(m.row);
    if (start < 0) return [];
    for (let k = 1; k < m.rowSpan; k++) if (sourceRows[start + k] !== m.row + k) return [];
    return [{ ...m, row: start }];
  });
  return { rows, merges };
}

export interface ParsedNumber {
  value: number;
  /** Excel number format keeping the grouping and decimals of the text. */
  format: string;
}

// `1.234` or `1,234`: thousand or decimal? Unknowable, so it stays text.
const AMBIGUOUS = /^\d{1,3}[.,]\d{3}$/;
const NUMBER_SHAPES: { pattern: RegExp; grouped: boolean }[] = [
  { pattern: /^(\d+)$/, grouped: false },
  { pattern: /^(\d{1,3}(?:[. \u00A0\u202F]\d{3})+)(?:,(\d+))?$/, grouped: true },
  { pattern: /^(\d+),(\d+)$/, grouped: false },
  { pattern: /^(\d{1,3}(?:,\d{3})+)(?:\.(\d+))?$/, grouped: true },
  { pattern: /^(\d+)\.(\d+)$/, grouped: false },
];

/**
 * Reads a German or English formatted number (`1.234,5`, `1,234.5`, `-12 %`).
 * Anything doubtful — leading zeros, ambiguous grouping, units, more digits
 * than a double holds — returns `null` and stays text.
 */
export function parseNumber(text: string): ParsedNumber | null {
  let rest = text.trim();
  const percent = /\s*%$/.test(rest);
  if (percent) rest = rest.replace(/\s*%$/, "");
  let sign = 1;
  if (/^[+\-\u2212]/.test(rest)) {
    if (rest[0] !== "+") sign = -1;
    rest = rest.slice(1);
  }
  if (!rest || AMBIGUOUS.test(rest)) return null;
  for (const { pattern, grouped } of NUMBER_SHAPES) {
    const match = pattern.exec(rest);
    if (!match) continue;
    const digits = match[1].replace(/\D/g, "");
    const fraction = match[2] ?? "";
    if ((digits.length > 1 && digits[0] === "0") || digits.length + fraction.length > 15) return null;
    const value = (sign * Number(fraction ? `${digits}.${fraction}` : digits)) / (percent ? 100 : 1);
    const format = (grouped ? "#,##0" : "0") + (fraction ? `.${"0".repeat(fraction.length)}` : "") + (percent ? "%" : "");
    return { value, format };
  }
  return null;
}

/** One CSV field: RFC 4180 quoting; text a spreadsheet would run as a formula gets a leading `'`. */
export function csvField(text: string): string {
  const guarded = /^[=+\-@\t\r]/.test(text) && parseNumber(text) === null ? `'${text}` : text;
  return /[;"\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

/** CSV as German Excel opens it by double-click: UTF-8 BOM, `;`, CRLF. */
export const toCsv = (grid: ExportGrid): string =>
  "\uFEFF" + grid.rows.map((row) => row.map((cell) => csvField(cell.text)).join(";") + "\r\n").join("");

export const CSV_MIME = "text/csv;charset=utf-8";
export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const HEAD_FILL = "FFF8F8F8";
const HEAD_RULE = "FFCBD3DC";

/** `#rgb`/`#rrggbb` to ExcelJS ARGB; other colour notations are left out. */
const argb = (color: string | undefined): string | undefined => {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color?.trim() ?? "");
  if (!match) return undefined;
  const hex = match[1].length === 3 ? Array.from(match[1], (ch) => ch + ch).join("") : match[1];
  return `FF${hex.toUpperCase()}`;
};

const fontOf = (format: CellFormat, head: boolean): Partial<ExcelJS.Font> => {
  const font: Partial<ExcelJS.Font> = {};
  if (head || format.bold) font.bold = true;
  if (format.italic) font.italic = true;
  if (format.underline) font.underline = true;
  if (format.strikethrough) font.strike = true;
  if (typeof format.fontSize === "number") font.size = format.fontSize;
  const color = argb(format.color);
  if (color) font.color = { argb: color };
  return font;
};

/** XLSX with one sheet "Tabelle": numbers as numbers, formats, merges, frozen header and first column. */
export async function toXlsx(grid: ExportGrid): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tabelle", { views: [{ state: "frozen", xSplit: 1, ySplit: 1 }] });
  const widths: number[] = [];
  const spanned = (r: number, c: number) =>
    grid.merges.some((m) => m.colSpan > 1 && r >= m.row && r < m.row + m.rowSpan && c >= m.col && c < m.col + m.colSpan);

  grid.rows.forEach((row, r) =>
    row.forEach(({ text, format }, c) => {
      const head = r === 0;
      const cell = sheet.getCell(r + 1, c + 1);
      const number = head ? null : parseNumber(text);
      cell.value = number ? number.value : text;
      if (number) cell.numFmt = number.format;
      const font = fontOf(format, head);
      if (Object.keys(font).length > 0) cell.font = font;
      cell.alignment = {
        horizontal: format.align ?? (c === 0 ? "left" : "center"),
        vertical: format.valign ?? "middle",
      };
      const fill = argb(format.background) ?? (head ? HEAD_FILL : undefined);
      if (fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      if (head) cell.border = { bottom: { style: "medium", color: { argb: HEAD_RULE } } };
      if (!spanned(r, c)) widths[c] = Math.max(widths[c] ?? 0, text.length);
    }),
  );
  for (const m of grid.merges) sheet.mergeCells(m.row + 1, m.col + 1, m.row + m.rowSpan, m.col + m.colSpan);
  (grid.rows[0] ?? []).forEach((_, c) => {
    sheet.getColumn(c + 1).width = Math.min(60, Math.max(8, (widths[c] ?? 0) + 2));
  });
  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}

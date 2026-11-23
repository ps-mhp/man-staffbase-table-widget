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

/**
 * Zellen kopieren, ausschneiden und einfügen wie in Excel – und das
 * Ausfüllkästchen, das einen Bereich über Nachbarzellen fortschreibt.
 *
 * In die Zwischenablage gehen zwei Fassungen:
 *
 * - `text/plain` als Tabulator-Text – so nehmen Excel, Numbers und Sheets
 *   die Zellen an; Elemente stehen dort für ihre Bedeutung.
 * - `text/html` als `<table>` mit dem gespeicherten Markup jeder Zelle. Am
 *   `<table>` hängen Werte und Formate als JSON: fügt man in eine Tabelle
 *   dieses Widgets ein, kommen Formatierung, Bilder und Elemente mit.
 *
 * Beim Einfügen gilt: eigenes JSON vor fremdem HTML (Excel, Sheets, Word)
 * vor Tabulator-Text. Alles geht durch {@link sanitizeRichText}; Formate
 * nur mit bekannten Schlüsseln und Werten.
 */

import { cellToPlain } from "./cell-text";
import { sanitizeRichText } from "./rich-text";
import { parsePastedText, pasteBlock } from "./grid-operations";
import { CellFormat, CellRange, TableModel, formatKey } from "./table-model";

/** Trägt am kopierten `<table>` Werte und Formate als JSON. */
export const CLIPBOARD_ATTRIBUTE = "data-man-table-cells";

export interface CellBlock {
  /** Gespeichertes Markup je Zelle, Zeile für Zeile. */
  values: string[][];
  /**
   * Formate je Zelle (`{}` = keins), oder `null`, wenn die Quelle keine
   * kennt – dann behalten die Zielzellen ihre eigenen.
   */
  formats: CellFormat[][] | null;
}

const rowsOf = (range: CellRange): number => range.bottom - range.top + 1;
const colsOf = (range: CellRange): number => range.right - range.left + 1;

/** Der Inhalt eines Bereichs, Zelle für Zelle. */
export function copyBlock(model: TableModel, range: CellRange): CellBlock {
  const values: string[][] = [];
  const formats: CellFormat[][] = [];
  for (let row = range.top; row <= range.bottom; row++) {
    const valueRow: string[] = [];
    const formatRow: CellFormat[] = [];
    for (let col = range.left; col <= range.right; col++) {
      valueRow.push(model.data[row]?.[col] ?? "");
      formatRow.push({ ...(model.formats[formatKey(row, col)] ?? {}) });
    }
    values.push(valueRow);
    formats.push(formatRow);
  }
  return { values, formats };
}

/** Tabulator-Text: Tabulatoren und Umbrüche in Zellen würden das Raster zerbrechen. */
export function blockToText(block: CellBlock): string {
  return block.values.map((row) => row.map((cell) => cellToPlain(cell).replace(/[\t\r\n]+/g, " ")).join("\t")).join("\n");
}

const escapeAttribute = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function blockToHtml(block: CellBlock): string {
  const rows = block.values
    .map((row) => `<tr>${row.map((cell) => `<td>${sanitizeRichText(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<table ${CLIPBOARD_ATTRIBUTE}="${escapeAttribute(JSON.stringify(block))}">${rows}</table>`;
}

const ALIGN = new Set(["left", "center", "right"]);
const VALIGN = new Set(["top", "middle", "bottom"]);
const COLOR = /^#[0-9a-f]{3,8}$|^rgba?\([\d\s.,%]+\)$/i;

/** Nur bekannte Schlüssel mit passenden Werten – die Zwischenablage ist fremder Inhalt. */
function readFormat(raw: unknown): CellFormat {
  if (typeof raw !== "object" || raw === null) return {};
  const source = raw as Record<string, unknown>;
  const format: CellFormat = {};
  for (const key of ["bold", "italic", "underline", "strikethrough"] as const) {
    if (source[key] === true) format[key] = true;
  }
  if (typeof source.align === "string" && ALIGN.has(source.align)) format.align = source.align as CellFormat["align"];
  if (typeof source.valign === "string" && VALIGN.has(source.valign)) format.valign = source.valign as CellFormat["valign"];
  if (typeof source.color === "string" && COLOR.test(source.color)) format.color = source.color;
  if (typeof source.background === "string" && COLOR.test(source.background)) format.background = source.background;
  if (typeof source.fontSize === "number" && source.fontSize >= 6 && source.fontSize <= 96) format.fontSize = source.fontSize;
  return format;
}

const isGrid = (value: unknown): value is unknown[][] =>
  Array.isArray(value) && value.length > 0 && value.every((row) => Array.isArray(row));

/** Aus einer Tabelle dieses Widgets: Werte und Formate aus dem JSON am `<table>`. */
function readOwnBlock(table: Element): CellBlock | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(table.getAttribute(CLIPBOARD_ATTRIBUTE) ?? "");
  } catch {
    return null;
  }
  const source = parsed as { values?: unknown; formats?: unknown };
  if (!isGrid(source.values)) return null;
  const values = source.values.map((row) => row.map((cell) => sanitizeRichText(typeof cell === "string" ? cell : "")));
  const formats = isGrid(source.formats) ? values.map((row, r) => row.map((_cell, c) => readFormat((source.formats as unknown[][])[r]?.[c]))) : null;
  return { values, formats };
}

/** Aus Excel, Sheets oder Word: der Inhalt jeder Zelle, Formatierung bleibt am Ziel. */
function readForeignTable(table: Element): CellBlock | null {
  const values = Array.from(table.querySelectorAll("tr"))
    .map((row) => Array.from(row.querySelectorAll("td, th")).map((cell) => sanitizeRichText(cell.innerHTML).trim()))
    .filter((row) => row.length > 0);
  return values.length > 0 ? { values, formats: null } : null;
}

const escapeText = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Liest, was eingefügt werden soll; `null`, wenn nichts Brauchbares dabei ist. */
export function readClipboard(html: string, text: string): CellBlock | null {
  if (html.includes("<table")) {
    const table = new DOMParser().parseFromString(html, "text/html").querySelector("table");
    if (table !== null) {
      const block = table.hasAttribute(CLIPBOARD_ATTRIBUTE) ? readOwnBlock(table) : readForeignTable(table);
      if (block !== null) return block;
    }
  }
  if (text === "") return null;
  return { values: parsePastedText(text).map((row) => row.map(escapeText)), formats: null };
}

/**
 * Wohin ein Block kommt: einmal ab der oberen linken Ecke des Ziels – oder,
 * wie in Excel, so oft wiederholt, wie er in ein größeres Ziel ganz passt.
 */
export function pasteTarget(target: CellRange, block: CellBlock): CellRange {
  const rows = block.values.length;
  const cols = Math.max(...block.values.map((row) => row.length));
  const fits = rowsOf(target) % rows === 0 && colsOf(target) % cols === 0;
  const tile = fits && (rowsOf(target) > rows || colsOf(target) > cols);
  return tile
    ? target
    : { top: target.top, left: target.left, bottom: target.top + rows - 1, right: target.left + cols - 1 };
}

/** Schreibt Werte (und, falls bekannt, Formate) des Blocks wiederholt in `range`. */
function writeTiled(model: TableModel, range: CellRange, block: CellBlock): TableModel {
  const rows = block.values.length;
  const tiled: string[][] = [];
  for (let r = 0; r < rowsOf(range); r++) {
    const source = block.values[r % rows];
    tiled.push(Array.from({ length: colsOf(range) }, (_v, c) => source[c % source.length] ?? ""));
  }
  const data = pasteBlock(model.data, range.top, range.left, tiled);
  if (block.formats === null) return { ...model, data };

  const formats = { ...model.formats };
  for (let r = 0; r < rowsOf(range); r++) {
    const sourceRow = block.formats[r % rows];
    for (let c = 0; c < colsOf(range); c++) {
      const format = sourceRow[c % sourceRow.length] ?? {};
      const key = formatKey(range.top + r, range.left + c);
      if (Object.keys(format).length > 0) formats[key] = { ...format };
      else delete formats[key];
    }
  }
  return { ...model, data, formats };
}

/** Fügt ein; die Tabelle wächst, wenn der Block über den Rand reicht. */
export function pasteCells(model: TableModel, target: CellRange, block: CellBlock): { model: TableModel; range: CellRange } {
  const range = pasteTarget(target, block);
  return { model: writeTiled(model, range, block), range };
}

/** Leert die Zellen (Ausschneiden); ihre Formate bleiben. */
export function clearCells(model: TableModel, range: CellRange): TableModel {
  const data = model.data.map((row, r) =>
    r < range.top || r > range.bottom ? row : row.map((cell, c) => (c < range.left || c > range.right ? cell : "")),
  );
  return { ...model, data };
}

/**
 * Wohin das Ausfüllkästchen gezogen ist: der Bereich neben der Quelle bis
 * zur Zelle unter dem Mauszeiger, in der Richtung, in der man sich weiter
 * entfernt hat. `null`, solange der Zeiger in der Quelle steht.
 */
export function fillExtension(source: CellRange, row: number, col: number): CellRange | null {
  const down = row - source.bottom;
  const up = source.top - row;
  const right = col - source.right;
  const left = source.left - col;
  const vertical = Math.max(down, up, 0);
  const horizontal = Math.max(right, left, 0);
  if (vertical === 0 && horizontal === 0) return null;
  if (vertical >= horizontal) {
    return down > 0
      ? { top: source.bottom + 1, bottom: row, left: source.left, right: source.right }
      : { top: row, bottom: source.top - 1, left: source.left, right: source.right };
  }
  return right > 0
    ? { top: source.top, bottom: source.bottom, left: source.right + 1, right: col }
    : { top: source.top, bottom: source.bottom, left: col, right: source.left - 1 };
}

const modulo = (value: number, size: number): number => ((value % size) + size) % size;

/**
 * Schreibt die Quelle in die Erweiterung fort – Werte und Formate, im Muster
 * der Quelle, auch nach oben und links. Überschreibt, was dort stand.
 */
export function applyFill(model: TableModel, source: CellRange, extension: CellRange): TableModel {
  const block = copyBlock(model, source);
  const rows = rowsOf(source);
  const cols = colsOf(source);
  const data = model.data.map((row) => [...row]);
  const formats = { ...model.formats };
  for (let row = extension.top; row <= extension.bottom; row++) {
    for (let col = extension.left; col <= extension.right; col++) {
      if (data[row] === undefined || col >= data[row].length) continue;
      const r = modulo(row - source.top, rows);
      const c = modulo(col - source.left, cols);
      data[row][col] = block.values[r][c];
      const format = block.formats?.[r][c] ?? {};
      const key = formatKey(row, col);
      if (Object.keys(format).length > 0) formats[key] = { ...format };
      else delete formats[key];
    }
  }
  return { ...model, data, formats };
}

/** Die Hülle aus Quelle und Erweiterung – die Markierung nach dem Ausfüllen. */
export const unionRange = (a: CellRange, b: CellRange): CellRange => ({
  top: Math.min(a.top, b.top),
  left: Math.min(a.left, b.left),
  bottom: Math.max(a.bottom, b.bottom),
  right: Math.max(a.right, b.right),
});

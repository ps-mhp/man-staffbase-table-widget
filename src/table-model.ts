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

import { TableData, parseTableData } from "./table-json";

/**
 * A merged cell region. `(row, col)` is the anchor (top-left) cell that is
 * actually rendered; every other cell inside the `rowSpan` x `colSpan`
 * rectangle is "covered" and skipped on render.
 */
export interface Merge {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}

export type TextAlign = "left" | "center" | "right";

/** Per-cell text formatting. All properties optional / additive. */
export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: TextAlign;
  color?: string;
  background?: string;
  fontSize?: number;
}

export interface SortSpec {
  col: number;
  dir: "asc" | "desc";
}

/**
 * Rich table model that supersedes the plain `string[][]`. The value grid
 * (`data`) stays a rectangular 2D array; merges, formats and a preset sort
 * are layered on top. `formats` is keyed by `"row,col"`.
 */
export interface TableModel {
  data: TableData;
  merges: Merge[];
  formats: Record<string, CellFormat>;
  sort: SortSpec | null;
}

export const formatKey = (row: number, col: number): string => `${row},${col}`;

const clampMergesToGrid = (merges: Merge[], rows: number, cols: number): Merge[] =>
  merges
    .map((m) => ({
      row: m.row,
      col: m.col,
      rowSpan: Math.min(m.rowSpan, rows - m.row),
      colSpan: Math.min(m.colSpan, cols - m.col),
    }))
    .filter(
      (m) =>
        m.row >= 0 &&
        m.col >= 0 &&
        m.row < rows &&
        m.col < cols &&
        m.rowSpan >= 1 &&
        m.colSpan >= 1 &&
        (m.rowSpan > 1 || m.colSpan > 1),
    );

const isValidMerge = (m: unknown): m is Merge =>
  typeof m === "object" &&
  m !== null &&
  typeof (m as Merge).row === "number" &&
  typeof (m as Merge).col === "number" &&
  typeof (m as Merge).rowSpan === "number" &&
  typeof (m as Merge).colSpan === "number";

/**
 * Parses the widget's `tabledata` attribute into a {@link TableModel}.
 *
 * Backward compatible: a legacy JSON **array** (`string[][]`) is read as a
 * model with no merges/formats and no preset sort, so existing widget
 * instances render exactly as before. A JSON **object** is read as the full
 * model. Any malformed part falls back to a safe default.
 */
export function parseTableModel(raw: string | undefined | null): TableModel {
  const empty = (data: TableData): TableModel => ({
    data,
    merges: [],
    formats: {},
    sort: null,
  });

  if (!raw) return empty(parseTableData(raw));

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return empty(parseTableData(raw));
  }

  // Legacy format: a bare 2D array.
  if (Array.isArray(parsed)) {
    return empty(parseTableData(raw));
  }

  if (typeof parsed !== "object" || parsed === null) {
    return empty(parseTableData(undefined));
  }

  const obj = parsed as Record<string, unknown>;
  const data = parseTableData(JSON.stringify(obj.data ?? []));
  const rows = data.length;
  const cols = data[0]?.length ?? 0;

  const merges = clampMergesToGrid(
    Array.isArray(obj.merges) ? obj.merges.filter(isValidMerge) : [],
    rows,
    cols,
  );

  const formats: Record<string, CellFormat> = {};
  if (obj.formats && typeof obj.formats === "object") {
    for (const [key, value] of Object.entries(obj.formats as Record<string, unknown>)) {
      if (value && typeof value === "object") {
        formats[key] = value as CellFormat;
      }
    }
  }

  let sort: SortSpec | null = null;
  const rawSort = obj.sort as Partial<SortSpec> | null | undefined;
  if (
    rawSort &&
    typeof rawSort.col === "number" &&
    rawSort.col >= 0 &&
    rawSort.col < cols &&
    (rawSort.dir === "asc" || rawSort.dir === "desc")
  ) {
    sort = { col: rawSort.col, dir: rawSort.dir };
  }

  return { data, merges, formats, sort };
}

/**
 * Serializes a model back to the JSON string stored in `tabledata`. To keep
 * the attribute small and diff-friendly, a model with no merges, no formats
 * and no preset sort is written back in the legacy `string[][]` shape.
 */
export function serializeTableModel(model: TableModel): string {
  const hasMerges = model.merges.length > 0;
  const hasFormats = Object.keys(model.formats).length > 0;
  const hasSort = model.sort !== null;

  if (!hasMerges && !hasFormats && !hasSort) {
    return JSON.stringify(model.data);
  }
  return JSON.stringify({
    data: model.data,
    merges: model.merges,
    formats: model.formats,
    sort: model.sort,
  });
}

/** The merge whose anchor is exactly `(row, col)`, if any. */
export function mergeAt(model: TableModel, row: number, col: number): Merge | undefined {
  return model.merges.find((m) => m.row === row && m.col === col);
}

/** True if `(row, col)` is covered by a merge but is not its anchor. */
export function isCovered(model: TableModel, row: number, col: number): boolean {
  return model.merges.some(
    (m) =>
      !(m.row === row && m.col === col) &&
      row >= m.row &&
      row < m.row + m.rowSpan &&
      col >= m.col &&
      col < m.col + m.colSpan,
  );
}

const shiftFormatsRow = (
  formats: Record<string, CellFormat>,
  at: number,
  delta: number,
): Record<string, CellFormat> => {
  const next: Record<string, CellFormat> = {};
  for (const [key, fmt] of Object.entries(formats)) {
    const [r, c] = key.split(",").map(Number);
    if (delta < 0 && r === at) continue; // deleted row's formats dropped
    const nr = r >= at ? r + delta : r;
    next[formatKey(nr, c)] = fmt;
  }
  return next;
};

const shiftFormatsCol = (
  formats: Record<string, CellFormat>,
  at: number,
  delta: number,
): Record<string, CellFormat> => {
  const next: Record<string, CellFormat> = {};
  for (const [key, fmt] of Object.entries(formats)) {
    const [r, c] = key.split(",").map(Number);
    if (delta < 0 && c === at) continue;
    const nc = c >= at ? c + delta : c;
    next[formatKey(r, nc)] = fmt;
  }
  return next;
};

/**
 * Inserts a blank row so that the new row ends up at index `at` (everything
 * at `at` and below shifts down). Merges that span across the insertion point
 * grow; merges entirely below it move down. Header row (0) stays row 0.
 */
export function insertRow(model: TableModel, at: number): TableModel {
  const cols = model.data[0]?.length ?? 1;
  const index = Math.max(1, Math.min(at, model.data.length));
  const data = [...model.data];
  data.splice(index, 0, new Array(cols).fill(""));

  const merges = model.merges.map((m) => {
    if (index <= m.row) return { ...m, row: m.row + 1 };
    if (index <= m.row + m.rowSpan - 1) return { ...m, rowSpan: m.rowSpan + 1 };
    return m;
  });

  return { ...model, data, merges, formats: shiftFormatsRow(model.formats, index, 1) };
}

/**
 * Inserts a blank column so that the new column ends up at index `at`.
 * Header column (0) stays column 0.
 */
export function insertColumn(model: TableModel, at: number): TableModel {
  const index = Math.max(1, Math.min(at, model.data[0]?.length ?? 1));
  const data = model.data.map((row) => {
    const next = [...row];
    next.splice(index, 0, "");
    return next;
  });

  const merges = model.merges.map((m) => {
    if (index <= m.col) return { ...m, col: m.col + 1 };
    if (index <= m.col + m.colSpan - 1) return { ...m, colSpan: m.colSpan + 1 };
    return m;
  });

  return { ...model, data, merges, formats: shiftFormatsCol(model.formats, index, 1) };
}

/** Removes row `at`. The header row (0) and the last remaining row are kept. */
export function deleteRow(model: TableModel, at: number): TableModel {
  if (at <= 0 || model.data.length <= 1) return model;
  const data = model.data.filter((_, r) => r !== at);

  const rows = data.length;
  const cols = data[0]?.length ?? 0;
  const merges = clampMergesToGrid(
    model.merges
      .map((m) => {
        if (at < m.row) return { ...m, row: m.row - 1 };
        if (at <= m.row + m.rowSpan - 1) return { ...m, rowSpan: m.rowSpan - 1 };
        return m;
      })
      .filter((m) => m.rowSpan >= 1),
    rows,
    cols,
  );

  return { ...model, data, merges, formats: shiftFormatsRow(model.formats, at, -1) };
}

/** Removes column `at`. The header column (0) and the last column are kept. */
export function deleteColumn(model: TableModel, at: number): TableModel {
  const cols0 = model.data[0]?.length ?? 0;
  if (at <= 0 || cols0 <= 1) return model;
  const data = model.data.map((row) => row.filter((_, c) => c !== at));

  const rows = data.length;
  const cols = data[0]?.length ?? 0;
  const merges = clampMergesToGrid(
    model.merges
      .map((m) => {
        if (at < m.col) return { ...m, col: m.col - 1 };
        if (at <= m.col + m.colSpan - 1) return { ...m, colSpan: m.colSpan - 1 };
        return m;
      })
      .filter((m) => m.colSpan >= 1),
    rows,
    cols,
  );

  return { ...model, data, merges, formats: shiftFormatsCol(model.formats, at, -1) };
}

export interface CellRange {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export const normalizeRange = (a: [number, number], b: [number, number]): CellRange => ({
  top: Math.min(a[0], b[0]),
  left: Math.min(a[1], b[1]),
  bottom: Math.max(a[0], b[0]),
  right: Math.max(a[1], b[1]),
});

const mergesIntersect = (m: Merge, range: CellRange): boolean =>
  m.row <= range.bottom &&
  m.row + m.rowSpan - 1 >= range.top &&
  m.col <= range.right &&
  m.col + m.colSpan - 1 >= range.left;

/**
 * Merges every cell in `range` into a single spanning cell anchored at the
 * range's top-left. Any pre-existing merges intersecting the range are
 * dropped first. A 1x1 range is a no-op.
 */
export function mergeCells(model: TableModel, range: CellRange): TableModel {
  const rowSpan = range.bottom - range.top + 1;
  const colSpan = range.right - range.left + 1;
  if (rowSpan <= 1 && colSpan <= 1) return model;

  const merges = model.merges.filter((m) => !mergesIntersect(m, range));
  merges.push({ row: range.top, col: range.left, rowSpan, colSpan });
  return { ...model, merges };
}

/** Splits the merge covering `(row, col)` back into individual cells. */
export function unmergeCells(model: TableModel, row: number, col: number): TableModel {
  const merges = model.merges.filter(
    (m) =>
      !(
        row >= m.row &&
        row < m.row + m.rowSpan &&
        col >= m.col &&
        col < m.col + m.colSpan
      ),
  );
  if (merges.length === model.merges.length) return model;
  return { ...model, merges };
}

const cleanFormat = (fmt: CellFormat): CellFormat | null => {
  const next: CellFormat = {};
  if (fmt.bold) next.bold = true;
  if (fmt.italic) next.italic = true;
  if (fmt.underline) next.underline = true;
  if (fmt.strikethrough) next.strikethrough = true;
  if (fmt.align && fmt.align !== "left") next.align = fmt.align;
  if (fmt.color) next.color = fmt.color;
  if (fmt.background) next.background = fmt.background;
  if (typeof fmt.fontSize === "number") next.fontSize = fmt.fontSize;
  return Object.keys(next).length > 0 ? next : null;
};

/**
 * Applies a formatting `patch` to every given cell, shallow-merged onto any
 * existing format. Passing a property as `undefined` clears it. Cells whose
 * resulting format is empty are removed from the map.
 */
export function setFormat(
  model: TableModel,
  cells: Array<[number, number]>,
  patch: CellFormat,
): TableModel {
  const formats = { ...model.formats };
  for (const [row, col] of cells) {
    const key = formatKey(row, col);
    const merged: CellFormat = { ...formats[key], ...patch };
    const cleaned = cleanFormat(merged);
    if (cleaned) {
      formats[key] = cleaned;
    } else {
      delete formats[key];
    }
  }
  return { ...model, formats };
}

/** Sets (or clears with `null`) the preset sort applied by the widget. */
export function setSort(model: TableModel, sort: SortSpec | null): TableModel {
  return { ...model, sort };
}

export const cellFormat = (model: TableModel, row: number, col: number): CellFormat =>
  model.formats[formatKey(row, col)] ?? {};

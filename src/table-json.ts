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

/**
 * Table data model: a plain 2D array of strings.
 * Row 0 is treated as the header row, column 0 as the header column.
 */
export type TableData = string[][];

/**
 * Sensible starting point for a brand new widget instance: a corner cell,
 * two header columns/rows and two empty data rows.
 */
export const DEFAULT_TABLE_DATA: TableData = [
  ["", "Spalte 1", "Spalte 2"],
  ["Zeile 1", "", ""],
  ["Zeile 2", "", ""],
];

/**
 * Parses and normalizes table JSON coming from the widget's config attribute.
 * Falls back to {@link DEFAULT_TABLE_DATA} for any malformed input (invalid
 * JSON, wrong shape, empty value) so the widget/editor never crash on bad
 * data. Ragged rows are padded with empty strings so every row ends up with
 * the same number of columns.
 */
export function parseTableData(raw: string | undefined | null): TableData {
  if (!raw) return DEFAULT_TABLE_DATA;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_TABLE_DATA;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_TABLE_DATA;

  const rows = parsed.filter((row): row is unknown[] => Array.isArray(row));
  if (rows.length === 0) return DEFAULT_TABLE_DATA;

  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (columnCount === 0) return DEFAULT_TABLE_DATA;

  return rows.map((row) =>
    Array.from({ length: columnCount }, (_, i) => {
      const cell = row[i];
      return cell === undefined || cell === null ? "" : String(cell);
    }),
  );
}

/**
 * Serializes table data back into the JSON string stored in the widget's
 * config attribute.
 */
export function serializeTableData(data: TableData): string {
  return JSON.stringify(data);
}

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

import { TableData } from "./table-json";

/**
 * Pure, framework-agnostic mutations for the grid editor. Kept separate from
 * the React component so they can be unit tested without rendering anything.
 *
 * Row 0 and column 0 are the "frozen" header row/column of the widget and can
 * never be removed - all remove functions no-op when asked to remove them
 * (or when it would leave the table without any row/column at all).
 */

export function updateCell(
  data: TableData,
  rowIndex: number,
  colIndex: number,
  value: string,
): TableData {
  return data.map((row, r) =>
    r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row,
  );
}

export function addRow(data: TableData): TableData {
  const colCount = data[0]?.length ?? 1;
  return [...data, new Array(colCount).fill("")];
}

export function removeRow(data: TableData, rowIndex: number): TableData {
  if (rowIndex === 0 || data.length <= 1) return data;
  return data.filter((_, r) => r !== rowIndex);
}

export function addColumn(data: TableData): TableData {
  return data.map((row) => [...row, ""]);
}

export function removeColumn(data: TableData, colIndex: number): TableData {
  const colCount = data[0]?.length ?? 0;
  if (colIndex === 0 || colCount <= 1) return data;
  return data.map((row) => row.filter((_, c) => c !== colIndex));
}

/**
 * Parses text as it comes out of `ClipboardEvent.clipboardData` when a user
 * copies a range of cells from a spreadsheet application (tab-separated
 * cells, newline-separated rows).
 */
export function parsePastedText(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  // Spreadsheet copy operations usually add one trailing newline; drop the
  // resulting empty trailing line so it doesn't paste as an extra blank row.
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  return lines.map((line) => line.split("\t"));
}

/**
 * Writes a rectangular block of values into `data`, starting at
 * (startRow, startCol). Grows the table with empty cells if the block
 * doesn't fit within the current bounds.
 */
export function pasteBlock(
  data: TableData,
  startRow: number,
  startCol: number,
  block: string[][],
): TableData {
  if (block.length === 0) return data;

  const blockCols = block.reduce((max, row) => Math.max(max, row.length), 0);
  const neededRows = startRow + block.length;
  const neededCols = startCol + blockCols;
  const colCount = Math.max(data[0]?.length ?? 0, neededCols);

  const widened: TableData = data.map((row) => {
    const next = [...row];
    while (next.length < colCount) next.push("");
    return next;
  });
  while (widened.length < neededRows) {
    widened.push(new Array(colCount).fill(""));
  }

  const result = widened.map((row) => [...row]);
  block.forEach((blockRow, i) => {
    blockRow.forEach((value, j) => {
      result[startRow + i][startCol + j] = value;
    });
  });

  return result;
}

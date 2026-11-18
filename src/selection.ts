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
 * Die Markierung im Gitter als reine Rechnung: welche Zellen sie umfasst und
 * wie sie auf ein kleiner gewordenes Gitter passt.
 */

import { CellRange } from "./table-model";

export const cellsInRange = (range: CellRange): Array<[number, number]> => {
  const cells: Array<[number, number]> = [];
  for (let r = range.top; r <= range.bottom; r++) {
    for (let c = range.left; c <= range.right; c++) {
      cells.push([r, c]);
    }
  }
  return cells;
};

/**
 * The cells of several (possibly overlapping) selected ranges, in selection
 * order: range by range, and row-major inside each range. Duplicates are
 * dropped, so a cell keeps the position of its *first* selection — that order
 * is what makes "the first marked image" well-defined.
 */
export const cellsInRanges = (ranges: ReadonlyArray<CellRange>): Array<[number, number]> => {
  const seen = new Set<string>();
  const cells: Array<[number, number]> = [];
  for (const range of ranges) {
    for (const [row, col] of cellsInRange(range)) {
      const key = `${row},${col}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push([row, col]);
    }
  }
  return cells;
};

const fits = (range: CellRange, rows: number, cols: number): boolean =>
  range.bottom < rows && range.right < cols;

/**
 * Schneidet jede Markierung auf ein Gitter aus `rows` × `cols` Zellen zu.
 *
 * Nötig, seit der Rahmen Rückgängig kennt: ein Schritt zurück nimmt etwa eine
 * eben eingefügte Zeile weg, während sie noch markiert ist. Ohne Zuschnitt
 * zeigten Formatieren und Löschen danach auf Zellen, die es nicht gibt.
 * Bereiche, die ganz außerhalb liegen, entfallen. Passt alles, kommt dieselbe
 * Liste zurück.
 */
export function clampRanges(ranges: CellRange[], rows: number, cols: number): CellRange[] {
  if (ranges.every((range) => fits(range, rows, cols))) return ranges;
  return ranges
    .filter((range) => range.top < rows && range.left < cols)
    .map((range) => ({
      top: range.top,
      left: range.left,
      bottom: Math.min(range.bottom, rows - 1),
      right: Math.min(range.right, cols - 1),
    }));
}

/**
 * Spaltenbuchstaben wie in Excel: 0 → A, 25 → Z, 26 → AA. Sie stehen über
 * dem Gitter und in der Spaltenwahl der ersten Sortierung.
 */
export function columnLetters(col: number): string {
  const letter = String.fromCharCode(65 + (col % 26));
  return col < 26 ? letter : `${columnLetters(Math.floor(col / 26) - 1)}${letter}`;
}

/**
 * Der Name einer Zelle wie in Excel, etwa „B3“ für Zeile 2, Spalte 1
 * (beide ab 0). Er steht im Titel der Mediathek-Leiste: die Leiste deckt den
 * Inspektor zu, und ohne Namen wüsste niemand mehr, wohin das Bild geht.
 */
export const cellName = (row: number, col: number): string => `${columnLetters(col)}${row + 1}`;

/** „B2“ für eine Zelle, „B2:B4“ für einen Bereich – wie in der Statuszeile. */
export function rangeName(range: CellRange): string {
  const start = cellName(range.top, range.left);
  const single = range.top === range.bottom && range.left === range.right;
  return single ? start : `${start}:${cellName(range.bottom, range.right)}`;
}

/**
 * Die Spalten, die eine Markierung von oben bis unten umfasst, und die
 * Zeilen, die sie von links bis rechts umfasst. Ihre Buchstaben und Nummern
 * am Rand des Gitters zeigen das.
 */
export function fullLines(ranges: ReadonlyArray<CellRange>, rows: number, cols: number): { rows: Set<number>; cols: Set<number> } {
  const full = { rows: new Set<number>(), cols: new Set<number>() };
  for (const range of ranges) {
    if (range.top === 0 && range.bottom === rows - 1) {
      for (let c = range.left; c <= range.right; c++) full.cols.add(c);
    }
    if (range.left === 0 && range.right === cols - 1) {
      for (let r = range.top; r <= range.bottom; r++) full.rows.add(r);
    }
  }
  return full;
}

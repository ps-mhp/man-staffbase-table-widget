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
 * Tastatur im Gitter wie in Excel: welche Taste was bedeutet und wohin die
 * aktive Zelle wandert. Reine Logik, ohne DOM – der Editor führt aus.
 *
 * Gilt nur, solange keine Zelle bearbeitet wird; in der bearbeiteten Zelle
 * gehören die Tasten dem Text (bis auf Enter, Tab und Esc, siehe
 * `editable-cell.tsx`).
 */

import { CellRange, TableModel } from "./table-model";

export type Direction = "up" | "down" | "left" | "right";

export type GridKeyAction =
  /** Pfeil, Tab, Enter: aktive Zelle bewegen; `extend` (Umschalt) zieht die Markierung auf, `jump` (⌘/Strg) springt zum Rand. */
  | { type: "move"; dir: Direction; extend: boolean; jump: boolean }
  /** Pos1 / ⌘Pos1: an den Zeilenanfang bzw. nach A1. */
  | { type: "home"; toStart: boolean }
  /** Entf, ⌫: Inhalte der markierten Zellen leeren. */
  | { type: "clear" }
  /** F2: aktive Zelle bearbeiten, Cursor ans Ende. */
  | { type: "edit" }
  /** Ein Zeichen getippt: aktive Zelle mit diesem Zeichen neu beginnen. */
  | { type: "type"; text: string }
  | { type: "selectAll" }
  /** Umschalt+Leertaste / Strg+Leertaste. */
  | { type: "selectRow" }
  | { type: "selectColumn" }
  | { type: "format"; key: "bold" | "italic" | "underline" }
  | { type: "copy" }
  | { type: "cut" }
  | { type: "paste" }
  /** ⌘D / ⌘R: nach unten bzw. rechts ausfüllen. */
  | { type: "fill"; dir: "down" | "right" };

export interface KeyLike {
  key: string;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

const ARROWS: Readonly<Record<string, Direction>> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** Was eine Taste im Gitter bedeutet, oder `null`, wenn sie dem Rahmen oder Browser bleibt. */
export function gridKeyAction(event: KeyLike): GridKeyAction | null {
  const mod = event.metaKey || event.ctrlKey;
  const arrow = ARROWS[event.key];
  if (arrow !== undefined && !event.altKey) return { type: "move", dir: arrow, extend: event.shiftKey, jump: mod };
  if (event.altKey) return null;

  if (mod) {
    switch (event.key.toLowerCase()) {
      case "a":
        return event.shiftKey ? null : { type: "selectAll" };
      case "b":
        return { type: "format", key: "bold" };
      case "i":
        return { type: "format", key: "italic" };
      case "u":
        return { type: "format", key: "underline" };
      case "c":
        return event.shiftKey ? null : { type: "copy" };
      case "x":
        return event.shiftKey ? null : { type: "cut" };
      case "v":
        return event.shiftKey ? null : { type: "paste" };
      case "d":
        return { type: "fill", dir: "down" };
      case "r":
        return { type: "fill", dir: "right" };
      case "home":
        return { type: "home", toStart: true };
      case " ":
        return event.ctrlKey ? { type: "selectColumn" } : null;
      default:
        return null;
    }
  }

  switch (event.key) {
    case "Tab":
      return { type: "move", dir: event.shiftKey ? "left" : "right", extend: false, jump: false };
    case "Enter":
      return { type: "move", dir: event.shiftKey ? "up" : "down", extend: false, jump: false };
    case "Home":
      return { type: "home", toStart: false };
    case "Delete":
    case "Backspace":
      return { type: "clear" };
    case "F2":
      return { type: "edit" };
    case " ":
      if (event.shiftKey) return { type: "selectRow" };
      return { type: "type", text: " " };
    default:
      // Ein druckbares Zeichen (auch Umlaute); Namen wie „Escape“ sind länger.
      return [...event.key].length === 1 ? { type: "type", text: event.key } : null;
  }
}

/** Die verbundene Zelle, in der (row, col) liegt, oder die Zelle selbst. */
export function cellArea(model: TableModel, row: number, col: number): CellRange {
  const merge = model.merges.find((m) => row >= m.row && row < m.row + m.rowSpan && col >= m.col && col < m.col + m.colSpan);
  return merge
    ? { top: merge.row, left: merge.col, bottom: merge.row + merge.rowSpan - 1, right: merge.col + merge.colSpan - 1 }
    : { top: row, left: col, bottom: row, right: col };
}

const clamp = (value: number, max: number): number => Math.max(0, Math.min(max, value));

/**
 * Die Nachbarzelle in einer Richtung – über verbundene Zellen hinweg, am Rand
 * bleibt sie stehen. `jump` springt bis zum Rand der Tabelle.
 */
export function moveCell(model: TableModel, [row, col]: [number, number], dir: Direction, jump: boolean): [number, number] {
  const rows = model.data.length;
  const cols = model.data[0]?.length ?? 0;
  const area = cellArea(model, row, col);
  let next: [number, number];
  if (jump) {
    next = {
      up: [0, col],
      down: [rows - 1, col],
      left: [row, 0],
      right: [row, cols - 1],
    }[dir] as [number, number];
  } else {
    next = {
      up: [area.top - 1, col],
      down: [area.bottom + 1, col],
      left: [row, area.left - 1],
      right: [row, area.right + 1],
    }[dir] as [number, number];
  }
  const clamped: [number, number] = [clamp(next[0], rows - 1), clamp(next[1], cols - 1)];
  const target = cellArea(model, clamped[0], clamped[1]);
  return [target.top, target.left];
}

/**
 * Was ⌘D / ⌘R füllt: aus der ersten Zeile (Spalte) der Markierung in den
 * Rest – oder, bei nur einer Zeile (Spalte), aus der Zeile darüber (Spalte
 * links daneben) in die Markierung. `null`, wenn es nichts zu füllen gibt.
 */
export function fillFromEdge(range: CellRange, dir: "down" | "right"): { source: CellRange; extension: CellRange } | null {
  if (dir === "down") {
    if (range.bottom > range.top) {
      return { source: { ...range, bottom: range.top }, extension: { ...range, top: range.top + 1 } };
    }
    if (range.top === 0) return null;
    return { source: { ...range, top: range.top - 1, bottom: range.top - 1 }, extension: range };
  }
  if (range.right > range.left) {
    return { source: { ...range, right: range.left }, extension: { ...range, left: range.left + 1 } };
  }
  if (range.left === 0) return null;
  return { source: { ...range, left: range.left - 1, right: range.left - 1 }, extension: range };
}

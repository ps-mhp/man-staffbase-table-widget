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
 * Was die Statuszeile unter dem Gitter sagt: links der Stand („4 Zeilen ·
 * 3 Spalten · Auswahl B2:B4“), rechts ein Hinweis, der zur Lage passt.
 */

import { CellRange } from "./table-model";
import { rangeName } from "./selection";

const count = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/** Größe der Tabelle und, falls etwas markiert ist, die Bereiche in Markierreihenfolge. */
export function gridStatusText(rows: number, cols: number, ranges: ReadonlyArray<CellRange>): string {
  const parts = [count(rows, "Zeile", "Zeilen"), count(cols, "Spalte", "Spalten")];
  if (ranges.length > 0) parts.push(`Auswahl ${ranges.map(rangeName).join(", ")}`);
  return parts.join(" · ");
}

export interface GridHintState {
  editing: boolean;
  painterActive: boolean;
}

/**
 * Der Hinweis rechts: beim Schreiben, wie man herauskommt; mit dem
 * Format-Pinsel, was er erwartet; sonst, welche Zellen Überschriften sind –
 * die veröffentlichte Tabelle zeigt Zeile 1 als Kopfzeile und Spalte A als
 * Zeilentitel.
 */
export function gridHint({ editing, painterActive }: GridHintState): string {
  if (editing) return "Esc beendet die Eingabe";
  if (painterActive) return "Format-Pinsel: Zielzellen markieren";
  return "Zeile 1 und Spalte A sind Überschriften · Doppelklick bearbeitet eine Zelle";
}

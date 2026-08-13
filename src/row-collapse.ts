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
 * Cutting a long table down to a handful of rows, with a button underneath
 * that reveals the rest.
 *
 * This replaces the widget's own vertical scrollbar. A scroll area nested in
 * a page that itself scrolls is a trap: the reader cannot tell which of the
 * two the wheel is about to move, and on a touch device the inner area
 * swallows the swipe that was meant for the page.
 *
 * Everything here is plain arithmetic on row indices so it can be checked
 * without a DOM.
 */

/** Data rows shown before the table collapses. */
export const DEFAULT_VISIBLE_ROWS = 5;

/**
 * Normalizes a stored limit. Anything that is not a usable row count falls
 * back to the default, so a hand-edited attribute cannot leave a table
 * showing nothing at all. `0` survives — it is the deliberate "never
 * collapse" setting, not a mistake.
 */
export function clampVisibleRows(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return DEFAULT_VISIBLE_ROWS;
  }
  return Math.floor(value);
}

/** Whether the limit hides anything at all for a table of this length. */
export function collapses(rowCount: number, limit: number): boolean {
  return limit > 0 && rowCount > limit;
}

/**
 * The rows to actually render, in display order.
 *
 * Takes the already sorted order and cuts it, rather than cutting the raw
 * data: sorting a collapsed table then shows the rows that sorting moved to
 * the top, which is what anyone clicking a column header expects.
 */
export function visibleRowOrder(
  bodyOrder: readonly number[],
  limit: number,
  expanded: boolean,
): number[] {
  if (expanded || !collapses(bodyOrder.length, limit)) return [...bodyOrder];
  return bodyOrder.slice(0, limit);
}

/** How many rows the button would reveal. */
export function hiddenRowCount(rowCount: number, limit: number): number {
  return collapses(rowCount, limit) ? rowCount - limit : 0;
}

/**
 * Label for the toggle. It names the number of hidden rows because a bare
 * "show more" hides whether three or three hundred rows follow.
 */
export function collapseToggleLabel(hidden: number, expanded: boolean): string {
  if (expanded) return "Weniger Zeilen anzeigen";
  return hidden === 1 ? "Weitere Zeile einblenden" : `Weitere ${hidden} Zeilen einblenden`;
}

/**
 * Shortens a row-spanning cell at the cut.
 *
 * Without this a cell spanning three rows placed in the last visible row
 * would reach into rows that were never rendered, and the browser draws it
 * past the end of the table.
 */
export function clampRowSpan(
  rowSpan: number,
  displayIndex: number,
  visibleCount: number,
): number {
  return Math.max(1, Math.min(rowSpan, visibleCount - displayIndex));
}

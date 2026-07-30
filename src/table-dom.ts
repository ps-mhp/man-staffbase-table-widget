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

import { CellFormat, Merge, TableModel, TextAlign, VerticalAlign, formatKey } from "./table-model";
import { sanitizeRichText } from "./rich-text";

/**
 * The table as **child content** of the widget element, mirroring how
 * Staffbase's own widgets store their content: an `Accordion` keeps its panels
 * as child nodes marked with `data-title` / `data-content`, and those nodes
 * come back translated from `POST /api/translations`.
 *
 * The split is deliberate and follows what that endpoint provably does:
 *  - **Text nodes get translated.** So every cell's text lives as element
 *    content, which is the entire point of this representation.
 *  - **Attributes are never translated** — an observed response left a
 *    `tabledata` attribute full of Spanish prose untouched while translating
 *    its sibling text. So everything that must survive verbatim (cell
 *    coordinates, spans, formatting) is carried in attributes.
 *
 * Attribute values here therefore contain no `"`, `<`, `>` or `&`: the same
 * response decoded `&quot;` without re-escaping it, which is what truncated
 * the JSON attribute in the first place. Coordinates are digits and commas,
 * spans are integers, and formatting rides on inline `style` — a form the
 * pipeline demonstrably passes through unchanged (`style="position: relative;"`
 * survived intact).
 */

/** Marks the slot container. Matches the `data-*` convention above. */
export const SLOT_ATTRIBUTE = "data-table";
export const SLOT_SELECTOR = `[${SLOT_ATTRIBUTE}]`;

/** `row,col` of a cell, so merges never make the position ambiguous. */
const CELL_ATTRIBUTE = "data-cell";
/**
 * Marks a cell that a merge covers. Such a cell is not rendered by the widget,
 * but its text must still travel: unmerging brings it back, so dropping it here
 * would silently lose content that the attribute form keeps. The slot table is
 * hidden, so carrying the extra cells costs nothing visually.
 */
const COVERED_ATTRIBUTE = "data-covered";
const SORT_ATTRIBUTE = "data-sort";

const ALIGNS = new Set<string>(["left", "center", "right"]);
const VALIGNS = new Set<string>(["top", "middle", "bottom"]);

/** `rgb(1, 2, 3)` — what the DOM hands back for a colour we wrote as hex. */
const RGB = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/;

const toHex = (value: string): string => {
  const match = RGB.exec(value.trim());
  if (!match) return value.trim();
  const hex = match
    .slice(1, 4)
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("");
  return `#${hex}`;
};

/** Inline CSS for a cell. Semicolon-separated, never quoted. */
const formatToCss = (format: CellFormat): string => {
  const parts: string[] = [];
  if (format.bold) parts.push("font-weight:bold");
  if (format.italic) parts.push("font-style:italic");
  const decorations = [
    format.underline ? "underline" : "",
    format.strikethrough ? "line-through" : "",
  ]
    .filter(Boolean)
    .join(" ");
  if (decorations) parts.push(`text-decoration:${decorations}`);
  if (format.align) parts.push(`text-align:${format.align}`);
  if (format.valign) parts.push(`vertical-align:${format.valign}`);
  if (format.color) parts.push(`color:${format.color}`);
  if (format.background) parts.push(`background-color:${format.background}`);
  if (typeof format.fontSize === "number") parts.push(`font-size:${format.fontSize}px`);
  return parts.join(";");
};

/** Reads a {@link CellFormat} back out of a cell's computed inline style. */
const cssToFormat = (cell: HTMLElement): CellFormat => {
  const style = cell.style;
  const format: CellFormat = {};
  if (style.fontWeight === "bold" || style.fontWeight === "700") format.bold = true;
  if (style.fontStyle === "italic") format.italic = true;
  const decoration = style.textDecoration || style.textDecorationLine || "";
  if (decoration.includes("underline")) format.underline = true;
  if (decoration.includes("line-through")) format.strikethrough = true;
  if (ALIGNS.has(style.textAlign)) format.align = style.textAlign as TextAlign;
  if (VALIGNS.has(style.verticalAlign)) format.valign = style.verticalAlign as VerticalAlign;
  if (style.color) format.color = toHex(style.color);
  const background = style.backgroundColor || style.background;
  if (background) format.background = toHex(background);
  const size = /^(\d+(?:\.\d+)?)px$/.exec(style.fontSize ?? "");
  if (size) format.fontSize = Math.round(Number(size[1]));
  return format;
};

const hasFormat = (format: CellFormat): boolean => Object.keys(format).length > 0;

/**
 * Renders the model as the widget's translatable child content.
 *
 * The container is hidden: the widget renders its real, styled table into the
 * container the SDK hands to `renderBlock`, so an unhidden copy would show the
 * table twice. `display:none` costs nothing here — the translation service
 * reads HTML, not layout, so hidden text is translated just the same.
 */
export function tableModelToSlotMarkup(model: TableModel): string {
  const { data, merges, formats, sort } = model;
  const covered = new Set<string>();
  for (const merge of merges) {
    for (let r = merge.row; r < merge.row + merge.rowSpan; r++) {
      for (let c = merge.col; c < merge.col + merge.colSpan; c++) {
        if (r !== merge.row || c !== merge.col) covered.add(formatKey(r, c));
      }
    }
  }
  const mergeAtCell = new Map(merges.map((m) => [formatKey(m.row, m.col), m]));

  const rows = data
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) => {
          const isCovered = covered.has(formatKey(rowIndex, colIndex));
          const tag = rowIndex === 0 || colIndex === 0 ? "th" : "td";
          const merge = mergeAtCell.get(formatKey(rowIndex, colIndex));
          const attrs = [`${CELL_ATTRIBUTE}="${rowIndex},${colIndex}"`];
          if (isCovered) attrs.push(COVERED_ATTRIBUTE);
          if (merge && merge.colSpan > 1) attrs.push(`colspan="${merge.colSpan}"`);
          if (merge && merge.rowSpan > 1) attrs.push(`rowspan="${merge.rowSpan}"`);
          const css = formatToCss(formats[formatKey(rowIndex, colIndex)] ?? {});
          if (css) attrs.push(`style="${css}"`);
          return `<${tag} ${attrs.join(" ")}>${sanitizeRichText(value)}</${tag}>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const sortAttr = sort ? ` ${SORT_ATTRIBUTE}="${sort.col},${sort.dir}"` : "";
  return (
    `<div ${SLOT_ATTRIBUTE} aria-hidden="true" style="display:none">` +
    `<table${sortAttr}>${rows}</table>` +
    `</div>`
  );
}

/**
 * Reads a model back out of slot markup, or `null` when there is none or it
 * carries no usable grid. Tolerant by design: after a translation round-trip
 * the markup has been re-serialized by a foreign tool, so anything unexpected
 * is skipped rather than treated as a hard error.
 */
export function parseSlotMarkup(markup: string | null | undefined): TableModel | null {
  if (!markup || !markup.includes(CELL_ATTRIBUTE)) return null;
  const doc = new DOMParser().parseFromString(`<body>${markup}</body>`, "text/html");
  const table = doc.querySelector("table");
  if (!table) return null;

  interface ParsedCell {
    row: number;
    col: number;
    value: string;
    rowSpan: number;
    colSpan: number;
    format: CellFormat;
  }

  const cells: ParsedCell[] = [];
  table.querySelectorAll<HTMLElement>(`[${CELL_ATTRIBUTE}]`).forEach((cell) => {
    const coords = /^(\d+),(\d+)$/.exec(cell.getAttribute(CELL_ATTRIBUTE)?.trim() ?? "");
    if (!coords) return;
    const span = (name: string): number => {
      const value = Number(cell.getAttribute(name) ?? "1");
      return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
    };
    cells.push({
      row: Number(coords[1]),
      col: Number(coords[2]),
      value: sanitizeRichText(cell.innerHTML),
      rowSpan: span("rowspan"),
      colSpan: span("colspan"),
      format: cssToFormat(cell),
    });
  });
  if (cells.length === 0) return null;

  const rowCount = Math.max(...cells.map((c) => c.row + c.rowSpan));
  const colCount = Math.max(...cells.map((c) => c.col + c.colSpan));
  const data = Array.from({ length: rowCount }, () => new Array<string>(colCount).fill(""));
  const merges: Merge[] = [];
  const formats: Record<string, CellFormat> = {};

  for (const cell of cells) {
    if (cell.row >= rowCount || cell.col >= colCount) continue;
    data[cell.row][cell.col] = cell.value;
    if (cell.rowSpan > 1 || cell.colSpan > 1) {
      merges.push({
        row: cell.row,
        col: cell.col,
        rowSpan: cell.rowSpan,
        colSpan: cell.colSpan,
      });
    }
    if (hasFormat(cell.format)) formats[formatKey(cell.row, cell.col)] = cell.format;
  }

  const rawSort = /^(\d+),(asc|desc)$/.exec(table.getAttribute(SORT_ATTRIBUTE)?.trim() ?? "");
  const sort =
    rawSort && Number(rawSort[1]) < colCount
      ? { col: Number(rawSort[1]), dir: rawSort[2] as "asc" | "desc" }
      : null;

  return { data, merges, formats, sort };
}

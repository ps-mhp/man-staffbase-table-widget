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

import { TableModel, formatKey } from "./table-model";
import { TableData } from "./table-json";
import { richTextToPlain, sanitizeRichText } from "./rich-text";

/**
 * The wire format for the table's *own* translation request.
 *
 * `POST /api/translations` translates text nodes and leaves attributes alone —
 * observed, and the reason the table cannot simply ride along in `tabledata`.
 * So the table is sent as a real HTML table whose cells carry their grid
 * coordinates in an attribute: the text travels where the service will touch
 * it, the coordinates travel where it will not.
 *
 * A `<table>` rather than a flat list of paragraphs on purpose — row and
 * column context measurably helps a machine translation disambiguate short
 * header labels, and it is the same shape the service already receives when it
 * translates an ordinary article table.
 */

/** Marks the container, so the translated string can be found in any response shape. */
export const TABLE_MARKER = "data-tw-table";
/** `row,col` of a cell — the only thing that maps a translation back. */
export const CELL_ATTRIBUTE = "data-cell";

/**
 * Renders the model's cell values as the translatable document.
 *
 * Every cell is emitted, including empty ones and those hidden behind a merge:
 * the grid must stay rectangular for the service to read it as a table, and a
 * merge-covered cell's text is real content that comes back when the author
 * unmerges. Cell values are already sanitized rich text (see `rich-text.ts`),
 * so they are embedded verbatim.
 */
export function tableModelToTranslatableHtml(model: TableModel): string {
  const rows = model.data
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) => {
          const tag = rowIndex === 0 ? "th" : "td";
          const coordinate = formatKey(rowIndex, colIndex);
          return `<${tag} ${CELL_ATTRIBUTE}="${coordinate}">${value}</${tag}>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<div ${TABLE_MARKER}="1"><table><tbody>${rows}</tbody></table></div>`;
}

/** True when a string looks like a response to {@link tableModelToTranslatableHtml}. */
export const isTranslatedTableHtml = (html: string): boolean => html.includes(CELL_ATTRIBUTE);

/**
 * Reads the translated cells back out, keyed by `"row,col"`.
 *
 * Values are put through {@link sanitizeRichText} again rather than trusted:
 * the string has been through a third-party service that is free to return any
 * markup it likes, and it ends up in the widget's `dangerouslySetInnerHTML`.
 */
export function readTranslatedCells(html: string): Map<string, string> {
  const cells = new Map<string, string>();
  if (!isTranslatedTableHtml(html)) return cells;
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  doc.body.querySelectorAll(`[${CELL_ATTRIBUTE}]`).forEach((element) => {
    const key = element.getAttribute(CELL_ATTRIBUTE);
    if (key === null || cells.has(key)) return;
    cells.set(key, sanitizeRichText(element.innerHTML));
  });
  return cells;
}

/**
 * Returns `model` with every cell the translation covered replaced.
 *
 * Only `data` changes — merges, formats and the preset sort are keyed by
 * coordinates and stay valid, which is exactly why the coordinates are carried
 * through the round trip.
 *
 * A cell is kept in the source language when the translation has nothing for
 * its coordinate, or when it dropped a non-empty cell to nothing. Both mean
 * the service lost content rather than translated it, and a source-language
 * cell is always better than an empty one.
 */
export function applyTranslatedCells(
  model: TableModel,
  cells: ReadonlyMap<string, string>,
): TableModel {
  if (cells.size === 0) return model;

  const data: TableData = model.data.map((row, rowIndex) =>
    row.map((value, colIndex) => {
      const translated = cells.get(formatKey(rowIndex, colIndex));
      if (translated === undefined) return value;
      const lostContent =
        richTextToPlain(translated).trim() === "" && richTextToPlain(value).trim() !== "";
      return lostContent ? value : translated;
    }),
  );

  return { ...model, data };
}

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

import { TableModel } from "./table-model";
import { sanitizeRichText } from "./rich-text";
import { cellHasImage } from "./cell-image";
import { stripLowercaseMarks } from "./lowercase-mark";

/**
 * Resetting a table back to unformatted content. Formatting lives in two
 * places — the per-cell {@link CellFormat} entries of the model and the
 * markup inside a cell's value — so a reset that only cleared one of them
 * would leave the table looking half-formatted.
 *
 * The main use is diagnostic: when a table renders unexpectedly, clearing
 * its formatting says whether the cause is stored in the table at all.
 */

/**
 * How much of a cell's formatting a reset removes.
 *
 * - `"text"` — cell formats (bold, colours, alignment, font size) and the
 *   inline `<sup>`/`<sub>` markup. Images are left alone.
 * - `"images"` — the stored pixel width of every inline image, so it falls
 *   back to its intrinsic size. Text and cell formats are left alone.
 * - `"all"` — both.
 */
export type ClearScope = "all" | "text" | "images";

const parseBody = (html: string): HTMLElement =>
  new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;

/**
 * Drops inline text markup from a cell while keeping its images and line
 * breaks: `<sup>`/`<sub>` and the `text-lowercase` mark are unwrapped rather
 * than deleted, so the characters they carried survive as plain text.
 */
export function stripTextMarkup(html: string | null | undefined): string {
  const value = stripLowercaseMarks(sanitizeRichText(html));
  if (!value || !/<(sup|sub)\b/i.test(value)) return value;

  const body = parseBody(value);
  body.querySelectorAll("sup, sub").forEach((el) => {
    el.replaceWith(...Array.from(el.childNodes));
  });
  return sanitizeRichText(body.innerHTML);
}

/**
 * Removes the explicit width from every image in a cell, leaving it to
 * render at its intrinsic size. The `src` is untouched — the picture stays,
 * only its sizing is reset.
 */
export function stripImageWidths(html: string | null | undefined): string {
  const value = sanitizeRichText(html);
  if (!cellHasImage(value)) return value;

  const body = parseBody(value);
  body.querySelectorAll("img").forEach((img) => {
    img.removeAttribute("width");
    img.style.removeProperty("width");
    if (img.getAttribute("style") === "") img.removeAttribute("style");
  });
  return sanitizeRichText(body.innerHTML);
}

/** The cell markup a reset of the given scope produces. */
export function clearCellFormatting(html: string | null | undefined, scope: ClearScope): string {
  const withoutText = scope === "images" ? sanitizeRichText(html) : stripTextMarkup(html);
  return scope === "text" ? withoutText : stripImageWidths(withoutText);
}

/**
 * Clears formatting from the given cells. An empty `cells` list means the
 * whole table, which is what an invocation without a selection passes.
 */
export function clearFormatting(
  model: TableModel,
  cells: ReadonlyArray<readonly [number, number]>,
  scope: ClearScope,
): TableModel {
  const targeted = cells.length > 0;
  const affects = (row: number, col: number): boolean =>
    !targeted || cells.some(([r, c]) => r === row && c === col);

  const data = model.data.map((row, rowIndex) =>
    row.map((value, colIndex) =>
      affects(rowIndex, colIndex) ? clearCellFormatting(value, scope) : value,
    ),
  );

  // Cell formats are text formatting, so an image-only reset keeps them.
  if (scope === "images") return { ...model, data };

  const formats = targeted
    ? Object.fromEntries(
        Object.entries(model.formats).filter(([key]) => {
          const [row, col] = key.split(",").map(Number);
          return !affects(row, col);
        }),
      )
    : {};

  return { ...model, data, formats };
}

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

import {
  ExportedContent,
  ExportedImage,
  markdownTable,
  registerContentExport,
} from "@shared/content-export/register-content-export";
import { cellText } from "./cell-text";
import { parseTableModel } from "./table-model";

/**
 * Export of the table widget for the PPT Engine (see `@shared/content-export`):
 * every row of the stored model — also those collapsed behind "show more" —
 * as a Markdown table, inline images as `![alt](src)`. Runs without DOM.
 */

/** Plain text of a stored cell; images are appended to `images` and become `![alt](src)`. */
export function cellToMarkdown(cell: string, images: ExportedImage[]): string {
  return cellText(cell, (src, alt) => {
    images.push(alt ? { src, alt } : { src });
    return `![${alt}](${src})`;
  });
}

export function exportTable(attributes: Readonly<Record<string, string>>): ExportedContent | null {
  const raw = attributes.tabledata;
  if (!raw) return null;
  const model = parseTableModel(raw);
  const images: ExportedImage[] = [];
  const rows = model.data.map((row) => row.map((cell) => cellToMarkdown(cell, images)));
  if (rows.every((row) => row.every((cell) => !cell))) return null;
  const title = (attributes["widget-title"] ?? "").replace(/\s+/g, " ").trim();
  const table = markdownTable(rows);
  return { markdown: title ? `**${title}**\n\n${table}` : table, images };
}

registerContentExport("table-widget", exportTable);

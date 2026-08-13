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

import { TranslationProvider } from "@shared/translation/carriers";
import { parseTableModel, encodeTableAttribute } from "./table-model";
import {
  applyTranslatedCells,
  isTranslatedTableHtml,
  readTranslatedCells,
  tableModelToTranslatableHtml,
} from "./translation-payload";

/**
 * How this widget's content travels through Staffbase's content translation.
 *
 * The model lives in the `tabledata` attribute, because attributes are the only
 * storage the widget SDK offers, and `POST /api/translations` translates text
 * nodes while leaving attributes alone. The shared registry sends the cell text
 * as its own request alongside the editor's and writes the result back into the
 * attribute before the editor ever sees the response.
 */
export const tableTranslationProvider: TranslationProvider = {
  id: "table-widget",
  label: "Tabellen-Widget",
  ref: { tagName: "table-widget", attribute: "tabledata" },

  toTranslatable: (stored) => {
    // An empty attribute value causes the widget to render its built-in default
    // placeholder table (3×3 with German headers). That table is not authored
    // content, so translating it would push machine-translated boilerplate into
    // the article. Skip it entirely.
    if (!stored) return null;
    const model = parseTableModel(stored);
    // Unreachable today: parseTableModel substitutes DEFAULT_TABLE_DATA for an
    // empty data array, so a parsed model always has rows. Kept as a safety net
    // in case that fallback ever becomes conditional.
    if (model.data.length === 0) return null;
    return tableModelToTranslatableHtml(model);
  },

  fromTranslated: (html, stored) =>
    encodeTableAttribute(applyTranslatedCells(parseTableModel(stored), readTranslatedCells(html))),

  acceptsTranslated: isTranslatedTableHtml,
};

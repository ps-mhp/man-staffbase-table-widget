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

import { collectStrings } from "./json-strings";
import { TableModel } from "./table-model";
import {
  applyTranslatedCells,
  isTranslatedTableHtml,
  readTranslatedCells,
  tableModelToTranslatableHtml,
} from "./translation-payload";

/**
 * The table's own call to Staffbase's content translation.
 *
 * Same endpoint and same body shape the editor uses — this is a *second*
 * request alongside the editor's own, carrying only the table's cell text (see
 * `translation-payload.ts`). It runs while the config dialog / editor is open
 * inside Staffbase, so the ambient session cookie authenticates it and no
 * token handling happens here.
 */

/** Default same-origin path, matching the editor's own request. */
export const TRANSLATIONS_PATH = "/api/translations";

/**
 * Marks this bundle's own requests so the interceptor lets them straight
 * through instead of recursing into itself. A request header rather than a
 * URL parameter: the header never reaches the server's routing, and it shows
 * up in the network panel, which is the difference between diagnosing this on
 * a dev tenant and guessing.
 */
export const SELF_REQUEST_HEADER = "X-Table-Widget-Translation";

export class TranslationApiError extends Error {
  public constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "TranslationApiError";
  }
}

export interface TranslationClientOptions {
  /** Endpoint path. Defaults to {@link TRANSLATIONS_PATH}. */
  readonly path?: string;
  /** Injectable `fetch` (defaults to the global). */
  readonly fetchImpl?: typeof fetch;
}

export interface TranslateTableInput {
  readonly model: TableModel;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
}

/**
 * Picks the translated document out of a response body of unknown shape:
 * the first string leaf that still carries the cell markers.
 *
 * @returns the string, or `null` when the response contains nothing usable —
 * which the caller must treat as "leave the table alone", never as an empty
 * translation.
 */
export function extractTranslatedHtml(body: unknown): string | null {
  return collectStrings(body).find(isTranslatedTableHtml) ?? null;
}

/**
 * Translates a table's cell values and returns the model with them replaced.
 *
 * Everything the translation did not cover keeps its source-language value, so
 * a partial or unexpected response degrades to a partially translated table
 * rather than a broken one.
 *
 * @throws {TranslationApiError} on transport failure, a non-2xx status, or a
 * response that carries no translated table.
 */
export async function translateTableModel(
  { model, sourceLanguage, targetLanguage }: TranslateTableInput,
  { path = TRANSLATIONS_PATH, fetchImpl }: TranslationClientOptions = {},
): Promise<TableModel> {
  const doFetch = fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  let response: Response;
  try {
    response = await doFetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        [SELF_REQUEST_HEADER]: "1",
      },
      body: JSON.stringify({
        sourceLanguage,
        targetLanguage,
        contents: { value: tableModelToTranslatableHtml(model) },
      }),
    });
  } catch (error) {
    throw new TranslationApiError(
      error instanceof Error ? error.message : "Netzwerkfehler bei der Übersetzungsanfrage.",
    );
  }

  if (!response.ok) {
    throw new TranslationApiError(
      `Übersetzungsanfrage fehlgeschlagen (HTTP ${response.status}).`,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new TranslationApiError("Übersetzungsantwort war kein JSON.");
  }

  const html = extractTranslatedHtml(body);
  if (html === null) {
    throw new TranslationApiError("Übersetzungsantwort enthielt keine Tabelle.");
  }

  return applyTranslatedCells(model, readTranslatedCells(html));
}

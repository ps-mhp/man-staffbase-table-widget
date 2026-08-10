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

/**
 * Locating and rewriting the widget inside a **content document**, the block
 * format the new editor (Content Designer, `/studio/content/page/…`) stores a
 * page in.
 *
 * The classic editor keeps a page as one HTML string with the widget's own
 * element in it, which is what `widget-html.ts` handles. The new editor keeps a
 * tree of blocks instead, and the widget is a `customBlock` whose attributes
 * live in JSON rather than in markup:
 *
 * ```json
 * "95edb914-…": {
 *   "type": "customBlock",
 *   "config": { "settings": { "content": { "selectedBlock": {
 *     "customElementName": "table-widget",
 *     "url": "https://cdn.jsdelivr.net/…/man.table-widget.js",
 *     "properties": { "tabledata": "b64:…" }
 *   } } } }
 * }
 * ```
 *
 * The host renders that to `<table-widget tabledata="b64:…">` on the published
 * page, so rendering needs nothing from this module. Translation does: the
 * editor's `POST /api/translations` for such a page carries this JSON (content
 * type `application/vnd.staffbase.translations.content_document.v1+json`)
 * instead of article HTML, the service translates the text blocks and hands the
 * `customBlock` back verbatim — table still in the source language.
 *
 * Addressed by **path** rather than by traversal order: the block's own id is
 * part of the path, and the response echoes the document unchanged apart from
 * the translated text, so a table is written back exactly where it came from or
 * not at all.
 */

/** The `customElementName` this widget registers under. */
const CUSTOM_ELEMENT_NAME = "table-widget";

/** Keys from a `customBlock` node down to its attribute bag. */
const PROPERTIES_PATH = ["config", "settings", "content", "selectedBlock", "properties"] as const;

const TABLEDATA = "tabledata";

/** Object keys / array indices from the body root down to a value. */
export type JsonPath = readonly (string | number)[];

/** One `table-widget` custom block found in a content document. */
export interface ContentDocumentTable {
  /** Path to the block's `tabledata` value, whether or not it is set. */
  readonly path: JsonPath;
  /** Its current value, or `null` when the block carries no `tabledata`. */
  readonly tabledata: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Cheap pre-check so the common case (a request that is not a content
 * document, or one without this widget) costs nothing beyond a substring scan.
 *
 * Deliberately loose — it only decides whether the body is worth parsing, and
 * {@link findContentDocumentTables} is what actually confirms a match.
 */
export const containsContentDocumentWidget = (json: string): boolean =>
  json.includes("customElementName") && json.includes(CUSTOM_ELEMENT_NAME);

/** The attribute bag of a `customBlock` node that hosts this widget, if it is one. */
const propertiesOf = (node: Record<string, unknown>): Record<string, unknown> | null => {
  if (node.type !== "customBlock") return null;

  let cursor: unknown = node;
  for (const key of PROPERTIES_PATH) {
    if (!isRecord(cursor)) return null;
    if (key === "properties" && cursor.customElementName !== CUSTOM_ELEMENT_NAME) return null;
    cursor = cursor[key];
  }
  return isRecord(cursor) ? cursor : null;
};

/** Every `table-widget` custom block in `body`, in traversal order. */
export function findContentDocumentTables(body: unknown): ContentDocumentTable[] {
  const found: ContentDocumentTable[] = [];

  const visit = (node: unknown, path: JsonPath): void => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, [...path, index]));
      return;
    }
    if (!isRecord(node)) return;

    const properties = propertiesOf(node);
    if (properties !== null) {
      const value = properties[TABLEDATA];
      found.push({
        path: [...path, ...PROPERTIES_PATH, TABLEDATA],
        tabledata: typeof value === "string" ? value : null,
      });
      // A custom block never nests another one, and descending into it would
      // only risk matching its own payload twice.
      return;
    }

    Object.entries(node).forEach(([key, item]) => visit(item, [...path, key]));
  };

  visit(body, []);
  return found;
}

const pathKey = (path: JsonPath): string => JSON.stringify(path);

/**
 * Returns a copy of `body` with the `tabledata` of the blocks at the given
 * paths replaced.
 *
 * Nothing is created that was not there: a path that does not resolve to a
 * `table-widget` custom block in `body` is skipped, which is what makes it safe
 * to apply paths taken from the *request* to the *response*. The caller learns
 * how many were actually written and can leave the response untouched when the
 * two documents did not line up.
 */
export function withContentDocumentTables(
  body: unknown,
  values: ReadonlyMap<string, string>,
): { readonly body: unknown; readonly applied: number } {
  let applied = 0;

  const visit = (node: unknown, path: JsonPath): unknown => {
    if (Array.isArray(node)) return node.map((item, index) => visit(item, [...path, index]));
    if (!isRecord(node)) return node;

    const properties = propertiesOf(node);
    if (properties !== null) {
      const next = values.get(pathKey([...path, ...PROPERTIES_PATH, TABLEDATA]));
      if (next === undefined) return node;
      applied += 1;
      return setDeep(node, PROPERTIES_PATH, TABLEDATA, next);
    }

    return Object.fromEntries(
      Object.entries(node).map(([key, item]) => [key, visit(item, [...path, key])]),
    );
  };

  return { body: visit(body, []), applied };
}

/**
 * Immutable write of `node[…keys][leaf] = value`. Every object along the way is
 * copied, so the caller's document is never mutated — the host still holds a
 * reference to it while its own request is in flight.
 */
const setDeep = (
  node: Record<string, unknown>,
  keys: readonly string[],
  leaf: string,
  value: string,
): Record<string, unknown> => {
  if (keys.length === 0) return { ...node, [leaf]: value };
  const [head, ...rest] = keys;
  const child = node[head];
  if (!isRecord(child)) return node;
  return { ...node, [head]: setDeep(child, rest, leaf, value) };
};

/** Keys the paths of `tables`, for {@link withContentDocumentTables}. */
export const tablePathKey = (table: ContentDocumentTable): string => pathKey(table.path);

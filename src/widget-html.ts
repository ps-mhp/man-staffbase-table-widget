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
 * Locating and rewriting `<table-widget>` elements inside a **serialized HTML
 * string**, i.e. article content on its way through the translation API.
 *
 * Deliberately string-level rather than DOM-level: the strings handled here
 * are whole article bodies belonging to the host, and round-tripping one
 * through `DOMParser` + `innerHTML` would silently renormalize markup the host
 * cares about (self-closing forms, attribute order, entity choices) far beyond
 * the one attribute this widget owns. Only the widget's own opening tag is
 * touched; every other byte of the document is passed through unchanged.
 */

const WIDGET_TAG = "table-widget";
const TABLEDATA = "tabledata";

/**
 * One attribute: a name, optionally followed by a quoted or bare value.
 * Spelled out rather than using `[^>]*` because an unquoted `>` inside a
 * *quoted* value is legal HTML and does occur — the legacy raw-JSON
 * `tabledata` contained whatever the author typed into a cell.
 */
const ATTRIBUTE = String.raw`\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?`;

const openingTagPattern = (): RegExp =>
  new RegExp(String.raw`<${WIDGET_TAG}((?:${ATTRIBUTE})*)\s*/?>`, "gi");

const tabledataAttributePattern = (): RegExp =>
  new RegExp(String.raw`\s+${TABLEDATA}\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)`, "gi");

/** A `<table-widget …>` opening tag found in an HTML string. */
export interface WidgetTag {
  /** The matched opening tag, verbatim. */
  readonly source: string;
  /** Its attribute section, verbatim (leading whitespace included). */
  readonly attributes: string;
  /** Offset of `<` within the searched string. */
  readonly start: number;
  /** Offset just past `>` within the searched string. */
  readonly end: number;
  /** Entity-decoded `tabledata` value, or `null` when the attribute is absent. */
  readonly tabledata: string | null;
}

/**
 * Reads one attribute out of a raw attribute string, entity-decoded.
 *
 * Parsed in a document without a browsing context on purpose: custom elements
 * do not upgrade there, so reading an attribute can never run this widget's own
 * constructor as a side effect.
 */
const readAttribute = (attributes: string, name: string): string | null => {
  const doc = document.implementation.createHTMLDocument("");
  doc.body.innerHTML = `<${WIDGET_TAG}${attributes}></${WIDGET_TAG}>`;
  return doc.body.firstElementChild?.getAttribute(name) ?? null;
};

/** Cheap pre-check so the common case (no widget in the content) costs nothing. */
export const containsWidget = (html: string): boolean =>
  html.toLowerCase().includes(`<${WIDGET_TAG}`);

/** Every `<table-widget>` opening tag in `html`, in document order. */
export function findWidgetTags(html: string): WidgetTag[] {
  if (!containsWidget(html)) return [];
  const tags: WidgetTag[] = [];
  const pattern = openingTagPattern();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const attributes = match[1] ?? "";
    tags.push({
      source: match[0],
      attributes,
      start: match.index,
      end: match.index + match[0].length,
      tabledata: readAttribute(attributes, TABLEDATA),
    });
  }
  return tags;
}

/**
 * Rebuilds an opening tag with `tabledata` set to `value`.
 *
 * The attribute section is taken from `tag` — normally the tag as it appeared
 * in the *source* content, not in the translated response, because the
 * response's copy may already have been mangled by the translation service
 * (that is the whole reason this module exists). `value` is written unescaped
 * and must therefore be an encoded payload (`b64:…`), whose alphabet contains
 * nothing an HTML attribute needs escaped.
 */
export function withTabledata(tag: WidgetTag, value: string): string {
  const withoutTabledata = tag.attributes.replace(tabledataAttributePattern(), "");
  return `<${WIDGET_TAG}${withoutTabledata} ${TABLEDATA}="${value}">`;
}

/**
 * Replaces the opening tags found by {@link findWidgetTags} with the given
 * strings, right to left so earlier offsets stay valid. A `null` entry leaves
 * that tag untouched.
 *
 * @throws never — a length mismatch is a programming error and is reported by
 * returning `html` unchanged, since a broken article body would cost an author
 * their content.
 */
export function replaceWidgetTags(
  html: string,
  tags: readonly WidgetTag[],
  replacements: ReadonlyArray<string | null>,
): string {
  if (tags.length !== replacements.length) return html;
  let out = html;
  for (let index = tags.length - 1; index >= 0; index -= 1) {
    const replacement = replacements[index];
    if (replacement === null) continue;
    const tag = tags[index];
    out = out.slice(0, tag.start) + replacement + out.slice(tag.end);
  }
  return out;
}

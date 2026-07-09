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
 * A cell value may contain a *very* limited amount of inline markup so that
 * individual characters can be super-/sub-scripted (e.g. `m<sup>2</sup>`).
 * Only `<sup>` and `<sub>` are allowed; everything else is treated as plain
 * text. This module is the single trusted place that turns arbitrary
 * strings (author input, contenteditable `innerHTML`, spreadsheet imports)
 * into safe markup, so the widget can render cells via `innerHTML` without
 * any XSS risk.
 */

const ALLOWED_TAGS = new Set(["SUP", "SUB"]);
/** Void/inline tags that map directly to a line break. */
const BREAK_TAGS = new Set(["BR"]);
/**
 * Block-level tags that browsers insert into a contenteditable when the user
 * presses Enter. Each begins a new visual line, so we emit a `<br>` before
 * their content (except when nothing has been emitted yet).
 */
const BLOCK_TAGS = new Set(["DIV", "P"]);

const escapeText = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const serializeChildren = (node: Node): string => {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3 /* TEXT_NODE */) {
      out += escapeText(child.textContent ?? "");
    } else if (child.nodeType === 1 /* ELEMENT_NODE */) {
      const el = child as HTMLElement;
      if (BREAK_TAGS.has(el.tagName)) {
        out += "<br>";
      } else if (ALLOWED_TAGS.has(el.tagName)) {
        const tag = el.tagName.toLowerCase();
        out += `<${tag}>${serializeChildren(el)}</${tag}>`;
      } else if (BLOCK_TAGS.has(el.tagName)) {
        // A block element starts a new line: emit a break before its content
        // unless it's the very first thing (leading blank line is dropped).
        if (out !== "" && !out.endsWith("<br>")) out += "<br>";
        out += serializeChildren(el);
      } else {
        // Disallowed tag: drop the tag itself but keep its (sanitized) text.
        out += serializeChildren(el);
      }
    }
  });
  return out;
};

/**
 * Sanitizes a cell string into safe inline markup: escapes all text and
 * keeps only `<sup>`/`<sub>` tags. Plain text (no tags) is returned escaped
 * and otherwise unchanged, so legacy string cells are unaffected.
 */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";
  // Fast path for plain strings with no markup and no entities to decode.
  if (!input.includes("<") && !input.includes("&")) return input;
  const doc = new DOMParser().parseFromString(`<body>${input}</body>`, "text/html");
  return serializeChildren(doc.body);
}

/**
 * Strips all markup, returning the plain text content of a cell. Used for
 * sorting and any comparison that should ignore super-/sub-script markup.
 */
export function richTextToPlain(input: string | null | undefined): string {
  if (!input) return "";
  if (!input.includes("<") && !input.includes("&")) return input;
  const doc = new DOMParser().parseFromString(`<body>${input}</body>`, "text/html");
  return doc.body.textContent ?? "";
}

/** True if the cell string carries any inline markup. */
export const hasRichText = (input: string | null | undefined): boolean =>
  !!input && input.includes("<");

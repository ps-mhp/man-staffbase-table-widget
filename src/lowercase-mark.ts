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
 * Setting and clearing the `text-lowercase` mark on part of a cell.
 *
 * The mark is inline markup, but the editor thinks in *character ranges*: the
 * author selects "the third to the seventh letter", not "this span". So every
 * function here takes plain-text offsets, and the markup is rebuilt from a
 * per-character flag array rather than patched in place. That makes the tricky
 * cases — a range that half-overlaps an existing mark, or that spans a
 * superscript — fall out of the same code path as the simple ones, and it
 * keeps the whole module testable without a live selection.
 *
 * Offsets count the same characters `richTextToPlain` returns: `<br>` and
 * `<img>` contribute none.
 */

import { LOWERCASE_CLASS, sanitizeRichText } from "./rich-text";

const parseBody = (html: string): HTMLElement =>
  new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;

const escapeText = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const textNodes = (root: Node): Text[] => {
  const out: Text[] = [];
  const visit = (node: Node): void => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) out.push(child as Text);
      else if (child.nodeType === 1) visit(child);
    });
  };
  visit(root);
  return out;
};

/** One flag per plain-text character: is it inside a marked element? */
export function markedFlags(html: string): boolean[] {
  const body = parseBody(sanitizeRichText(html));
  const flags: boolean[] = [];
  textNodes(body).forEach((node) => {
    const marked = !!node.parentElement?.closest(`.${LOWERCASE_CLASS}`);
    for (let i = 0; i < node.data.length; i++) flags.push(marked);
  });
  return flags;
}

/** The cell's markup with every mark removed, text and other tags intact. */
export function stripLowercaseMarks(html: string): string {
  const value = sanitizeRichText(html);
  if (!value.includes(LOWERCASE_CLASS)) return value;

  const body = parseBody(value);
  body.querySelectorAll(`.${LOWERCASE_CLASS}`).forEach((el) => {
    if (el.tagName === "SPAN") el.replaceWith(...Array.from(el.childNodes));
    else el.removeAttribute("class");
  });
  return sanitizeRichText(body.innerHTML);
}

/** Re-emits `html` (which must be free of marks) with `flags` applied. */
function applyFlags(html: string, flags: boolean[]): string {
  const body = parseBody(html);
  let offset = 0;

  const emit = (node: Node): string => {
    let out = "";
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        const text = (child as Text).data;
        let run = "";
        let runMarked = flags[offset] ?? false;
        for (let i = 0; i < text.length; i++) {
          const marked = flags[offset + i] ?? false;
          if (marked !== runMarked) {
            out += wrap(run, runMarked);
            run = "";
            runMarked = marked;
          }
          run += text[i];
        }
        out += wrap(run, runMarked);
        offset += text.length;
        return;
      }
      const el = child as HTMLElement;
      if (el.tagName === "BR" || el.tagName === "IMG") {
        out += el.outerHTML;
        return;
      }
      // Only <sup>/<sub> can reach this point; a fully marked one carries the
      // class itself instead of wrapping a span inside it, which keeps the
      // markup as short as the editor's own output.
      const tag = el.tagName.toLowerCase();
      const start = offset;
      const inner = emit(el);
      const length = offset - start;
      const allMarked = length > 0 && flags.slice(start, offset).every(Boolean);
      if (allMarked) {
        out += `<${tag} class="${LOWERCASE_CLASS}">${stripWrappers(inner)}</${tag}>`;
      } else {
        out += `<${tag}>${inner}</${tag}>`;
      }
    });
    return out;
  };

  const wrap = (text: string, marked: boolean): string =>
    text === "" ? "" : marked ? `<span class="${LOWERCASE_CLASS}">${escapeText(text)}</span>` : escapeText(text);

  const stripWrappers = (inner: string): string =>
    inner.split(`<span class="${LOWERCASE_CLASS}">`).join("").split("</span>").join("");

  const result = emit(body);
  // Adjacent runs are emitted per text node, so a mark spanning two of them
  // arrives as two spans. Joining them keeps the stored markup canonical, so
  // equal formatting always yields an equal string.
  return result.split(`</span><span class="${LOWERCASE_CLASS}">`).join("");
}

const withFlags = (html: string, from: number, to: number, marked: boolean): string => {
  const value = sanitizeRichText(html);
  const flags = markedFlags(value);
  if (to <= from) return value;
  for (let i = Math.max(0, from); i < Math.min(flags.length, to); i++) flags[i] = marked;
  return applyFlags(stripLowercaseMarks(value), flags);
};

/** Marks `[from, to)`. An empty range is a no-op. */
export function markLowercase(html: string, from: number, to: number): string {
  return withFlags(html, from, to, true);
}

/** Clears the mark on `[from, to)`, keeping it outside that range. */
export function unmarkLowercase(html: string, from: number, to: number): string {
  return withFlags(html, from, to, false);
}

/** True when every character in `[from, to)` is marked; false for an empty range. */
export function hasLowercaseMark(html: string, from: number, to: number): boolean {
  if (to <= from) return false;
  const flags = markedFlags(html);
  return flags.slice(from, to).length > 0 && flags.slice(from, to).every(Boolean);
}

/**
 * The current selection as plain-text offsets inside `root`, or `null` when
 * there is none or it lies elsewhere. This is the only place that touches the
 * live selection; everything above works on strings.
 */
export function selectionOffsets(root: HTMLElement): { from: number; to: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;

  const before = range.cloneRange();
  before.selectNodeContents(root);
  before.setEnd(range.startContainer, range.startOffset);
  const from = before.toString().length;
  return { from, to: from + range.toString().length };
}

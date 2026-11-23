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
 * Text of a stored cell without markup. Cells are sanitized on save: escaped text
 * plus `<sup>`, `<sub>`, `<img>` and catalog elements only. Shared by the PPT
 * content export and the table download; runs without DOM.
 */

import { normalizeIconId } from "@shared/icons/icon-id";
import { ICON_ATTRIBUTE, ICON_FALLBACK_TEXT, ICON_UNLABELED_ATTRIBUTE, LEGACY_ELEMENT_ATTRIBUTE } from "@shared/icons/icon-markup";

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻",
};
const SUBSCRIPT: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋",
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[body.toLowerCase()] ?? match;
  });
}

const attribute = (tag: string, name: string): string | undefined => {
  const match = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag);
  return match ? decodeEntities(match[2] ?? match[3] ?? "") : undefined;
};

const mapChars = (text: string, table: Record<string, string>) =>
  Array.from(text, (char) => table[char] ?? char).join("");

/** Ohne DOM-Arbeit: steht überhaupt ein Icon (oder altes Element) in der Zelle? */
export const cellHasElement = (html: string | null | undefined): boolean =>
  !!html && (html.includes(ICON_ATTRIBUTE) || html.includes(LEGACY_ELEMENT_ATTRIBUTE));

/**
 * Ein Icon steht im Text für seine Bedeutung („Diesel“),
 * ohne Bedeutung als „■“ – die Farbe trägt im Export nichts.
 */
function elementText(tag: string): string {
  if (normalizeIconId(attribute(tag, ICON_ATTRIBUTE) ?? attribute(tag, LEGACY_ELEMENT_ATTRIBUTE)) === null) return "";
  const unlabeled = attribute(tag, ICON_UNLABELED_ATTRIBUTE) !== undefined;
  return (unlabeled ? "" : (attribute(tag, "aria-label") ?? "").trim()) || ICON_FALLBACK_TEXT;
}

/** Walks a stored cell; `image` decides what an `<img>` becomes. */
export function cellText(cell: string, image: (src: string, alt: string) => string): string {
  let out = "";
  let mode: "sup" | "sub" | null = null;
  for (const part of cell.split(/(<[^>]*>)/)) {
    if (!part) continue;
    if (part.startsWith("<")) {
      const tag = /^<\/?\s*([a-z]+)/i.exec(part)?.[1]?.toLowerCase();
      const closing = part.startsWith("</");
      if (tag === "sup" || tag === "sub") mode = closing ? null : tag;
      else if (tag === "img") {
        const src = attribute(part, "src");
        if (src) out += ` ${image(src, attribute(part, "alt") ?? "")} `;
      } else if (tag === "span" && !closing) out += elementText(part);
      else if (tag === "br") out += " ";
      continue;
    }
    const text = decodeEntities(part);
    out += mode === "sup" ? mapChars(text, SUPERSCRIPT) : mode === "sub" ? mapChars(text, SUBSCRIPT) : text;
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Plain text of a stored cell; images become their alt text. */
export const cellToPlain = (cell: string): string => cellText(cell, (_src, alt) => alt);

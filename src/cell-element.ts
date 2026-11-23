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
 * Elemente aus dem Element Explorer in den Zellen: einfügen, auflisten,
 * benennen, entfernen und über die ganze Tabelle hinweg zählen. Farbe und
 * Größe tragen sie nicht selbst – die kommen aus der Formatierung des Texts. Wie `cell-image.ts` gehen alle Ergebnisse durch
 * {@link sanitizeRichText}; hier wird nur gebaut, nie vertraut.
 *
 * Ein Element ist über seine Stelle in der Zelle bestimmt: das n-te
 * `[data-man-el]` in Dokumentreihenfolge, genau wie es der Editor im DOM
 * der Zelle sieht.
 */

import { iconById } from "@shared/icons/catalog";
import { ICON_ATTRIBUTE, InlineIcon as InlineElement, LEGACY_ELEMENT_ATTRIBUTE, hasMeaning, iconMarkup, readIcon as readElement } from "@shared/icons/icon-markup";

import { cellHasElement } from "./cell-text";
import { sanitizeRichText } from "./rich-text";
import { TableData } from "./table-json";

export type ElementPatch = Partial<Pick<InlineElement, "label">>;

/** Eine Stelle in der Tabelle: Zelle und Nummer des Elements darin. */
export interface ElementAddress {
  row: number;
  col: number;
  index: number;
}

const SELECTOR = `[${ICON_ATTRIBUTE}],[${LEGACY_ELEMENT_ATTRIBUTE}]`;

/** Das Markup; ohne Bedeutung nennt es den Namen des Icons. */
const elementMarkup = (element: InlineElement): string => iconMarkup(element, iconById(element.id)?.name ?? "Icon");

// Liegt in cell-text.ts: das Seitenbündel (Übersetzung) braucht es ohne den Icon-Katalog.
export { cellHasElement } from "./cell-text";

const parseBody = (html: string): HTMLElement => new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;

/** Die Elemente einer Zelle in Dokumentreihenfolge. */
export function listCellElements(html: string | null | undefined): InlineElement[] {
  if (!cellHasElement(html)) return [];
  return Array.from(parseBody(sanitizeRichText(html)).querySelectorAll(SELECTOR))
    .map(readElement)
    .filter((element): element is InlineElement => element !== null);
}

/** Hängt das Element ans Ende der Zelle – wie ein eingefügtes Bild. */
export function appendElement(html: string | null | undefined, element: InlineElement): string {
  return sanitizeRichText(`${html ?? ""}${elementMarkup(element)}`);
}

/** Schreibt jedes Element der Zelle neu, das `change` mit einem neuen Stand beantwortet. */
function rewriteElements(
  html: string | null | undefined,
  change: (element: InlineElement, index: number) => InlineElement | null | "remove",
): string {
  if (!cellHasElement(html)) return sanitizeRichText(html);
  const body = parseBody(sanitizeRichText(html));
  Array.from(body.querySelectorAll(SELECTOR)).forEach((node, index) => {
    const element = readElement(node);
    if (element === null) return;
    const next = change(element, index);
    if (next === "remove") node.remove();
    else if (next !== null) node.outerHTML = elementMarkup(next);
  });
  return sanitizeRichText(body.innerHTML);
}

export function updateCellElement(html: string | null | undefined, index: number, patch: ElementPatch): string {
  return rewriteElements(html, (element, at) => (at === index ? { ...element, ...patch } : null));
}

export function removeCellElement(html: string | null | undefined, index: number): string {
  return rewriteElements(html, (_element, at) => (at === index ? "remove" : null));
}

/** Das Element an einer Stelle, oder `null`, wenn es dort keins (mehr) gibt. */
export function elementAt(data: TableData, address: ElementAddress): InlineElement | null {
  return listCellElements(data[address.row]?.[address.col])[address.index] ?? null;
}

/** Alle Elemente der Tabelle, in Lesereihenfolge. */
export function tableElements(data: TableData): InlineElement[] {
  return data.flatMap((row) => row.flatMap((cell) => listCellElements(cell)));
}

/** Wie viele Elemente keine Bedeutung tragen. */
export const countWithoutMeaning = (elements: readonly InlineElement[]): number =>
  elements.filter((element) => !hasMeaning(element)).length;

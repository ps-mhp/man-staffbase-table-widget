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
 * ändern, entfernen – und über die ganze Tabelle hinweg zählen und
 * umfärben. Wie `cell-image.ts` gehen alle Ergebnisse durch
 * {@link sanitizeRichText}; hier wird nur gebaut, nie vertraut.
 *
 * Ein Element ist über seine Stelle in der Zelle bestimmt: das n-te
 * `[data-man-el]` in Dokumentreihenfolge, genau wie es der Editor im DOM
 * der Zelle sieht.
 */

import { ELEMENT_ATTRIBUTE, InlineElement, elementMarkup, hasMeaning, isBrandColor, readElement } from "@man/config-ui/elements/catalog";

import { sanitizeRichText } from "./rich-text";
import { TableData } from "./table-json";

export type ElementPatch = Partial<Pick<InlineElement, "color" | "label" | "size">>;

/** Eine Stelle in der Tabelle: Zelle und Nummer des Elements darin. */
export interface ElementAddress {
  row: number;
  col: number;
  index: number;
}

const SELECTOR = `[${ELEMENT_ATTRIBUTE}]`;

/** Ohne DOM-Arbeit: steht überhaupt ein Element in der Zelle? */
export const cellHasElement = (html: string | null | undefined): boolean => !!html && html.includes(ELEMENT_ATTRIBUTE);

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

/** Gleiche Elemente: dieselbe Form in derselben Farbe. */
const same = (a: InlineElement, b: Pick<InlineElement, "id" | "color">): boolean => a.id === b.id && a.color === b.color;

/** Das Element an einer Stelle, oder `null`, wenn es dort keins (mehr) gibt. */
export function elementAt(data: TableData, address: ElementAddress): InlineElement | null {
  return listCellElements(data[address.row]?.[address.col])[address.index] ?? null;
}

const mapCells = (data: TableData, fn: (html: string) => string): TableData =>
  data.map((row) => row.map((cell) => (cellHasElement(cell) ? fn(cell) : cell)));

/** Ändert alle Elemente der Tabelle mit derselben Form und Farbe wie `like`. */
export function updateMatchingElements(data: TableData, like: Pick<InlineElement, "id" | "color">, patch: ElementPatch): TableData {
  return mapCells(data, (cell) => rewriteElements(cell, (element) => (same(element, like) ? { ...element, ...patch } : null)));
}

/** Alle Elemente der Tabelle, in Lesereihenfolge. */
export function tableElements(data: TableData): InlineElement[] {
  return data.flatMap((row) => row.flatMap((cell) => listCellElements(cell)));
}

export const countMatching = (elements: readonly InlineElement[], like: Pick<InlineElement, "id" | "color">): number =>
  elements.filter((element) => same(element, like)).length;

/** Je Farbe die erste vergebene Bedeutung – als Vorschlag für das nächste Element dieser Farbe. */
export function meaningsByColor(elements: readonly InlineElement[]): Record<string, string> {
  const meanings: Record<string, string> = {};
  elements.forEach((element) => {
    if (hasMeaning(element) && meanings[element.color] === undefined) meanings[element.color] = element.label.trim();
  });
  return meanings;
}

/** Die eigenen Farben (nicht CI) der Tabelle, jede einmal. */
export function ownColors(elements: readonly InlineElement[]): string[] {
  return [...new Set(elements.map((element) => element.color))].filter((color) => !isBrandColor(color));
}

/** Wie viele Elemente keine Bedeutung tragen. */
export const countWithoutMeaning = (elements: readonly InlineElement[]): number =>
  elements.filter((element) => !hasMeaning(element)).length;

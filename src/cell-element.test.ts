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

import { InlineElement, elementMarkup } from "@man/config-ui/elements/catalog";

import {
  appendElement,
  countMatching,
  countWithoutMeaning,
  elementAt,
  listCellElements,
  meaningsByColor,
  ownColors,
  removeCellElement,
  tableElements,
  updateCellElement,
  updateMatchingElements,
} from "./cell-element";

const red: InlineElement = { id: "kasten", color: "#e40045", label: "Diesel", size: "text" };
const blue: InlineElement = { id: "kasten", color: "#3875b2", label: "eTruck", size: "text" };
const green: InlineElement = { id: "kasten", color: "#12ab34", label: "", size: "text" };
const m = elementMarkup;

const table = (): string[][] => [
  ["Baureihe", "Diesel", "eTruck"],
  ["TGL", m(red), "–"],
  ["TGM", m(red), `(${m(blue)})`],
  ["Legende", `${m(red)} = Diesel ${m(blue)} = eTruck`, m(green)],
];

describe("Elemente in Zellen", () => {
  it("hängt ein Element ans Ende der Zelle", () => {
    expect(appendElement("TGX (", red)).toBe(`TGX (${m(red)}`);
    expect(appendElement("", red)).toBe(m(red));
  });

  it("listet die Elemente einer Zelle in Reihenfolge", () => {
    expect(listCellElements(`${m(red)} = Diesel ${m(blue)}`)).toEqual([red, blue]);
    expect(listCellElements("nur Text")).toEqual([]);
  });

  it("ändert und entfernt genau das n-te Element", () => {
    const cell = `${m(red)}/${m(red)}`;
    expect(updateCellElement(cell, 1, { color: "#303c49", label: "Gas" })).toBe(`${m(red)}/${m({ ...red, color: "#303c49", label: "Gas" })}`);
    expect(removeCellElement(cell, 0)).toBe(`/${m(red)}`);
  });

  it("findet ein Element über Zeile, Spalte und Stelle", () => {
    expect(elementAt(table(), { row: 3, col: 1, index: 1 })).toEqual(blue);
    expect(elementAt(table(), { row: 3, col: 1, index: 5 })).toBeNull();
    expect(elementAt(table(), { row: 9, col: 0, index: 0 })).toBeNull();
  });

  it("färbt alle gleichen Elemente der Tabelle um und lässt andere stehen", () => {
    const next = updateMatchingElements(table(), red, { color: "#303c49" });
    const elements = tableElements(next);
    expect(countMatching(elements, red)).toBe(0);
    expect(countMatching(elements, { id: "kasten", color: "#303c49" })).toBe(3);
    expect(countMatching(elements, blue)).toBe(2);
    expect(next[0]).toEqual(table()[0]);
  });

  it("sammelt Bedeutungen je Farbe, eigene Farben und Elemente ohne Bedeutung", () => {
    const elements = tableElements(table());
    expect(meaningsByColor(elements)).toEqual({ "#e40045": "Diesel", "#3875b2": "eTruck" });
    expect(ownColors(elements)).toEqual(["#12ab34"]);
    expect(countWithoutMeaning(elements)).toBe(1);
  });
});

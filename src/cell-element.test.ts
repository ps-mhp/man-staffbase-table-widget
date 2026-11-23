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

import { iconById } from "@shared/icons/catalog";
import { InlineIcon as InlineElement, iconMarkup } from "@shared/icons/icon-markup";

import {
  appendElement,
  countWithoutMeaning,
  elementAt,
  listCellElements,
  removeCellElement,
  tableElements,
  updateCellElement,
} from "./cell-element";

const diesel: InlineElement = { id: "shape/kasten", label: "Diesel" };
const etruck: InlineElement = { id: "craft/gaspump-electric", label: "eTruck" };
const blank: InlineElement = { id: "shape/kasten", label: "" };
const m = (element: InlineElement): string => iconMarkup(element, iconById(element.id)?.name ?? "Icon");

const table = (): string[][] => [
  ["Baureihe", "Diesel"],
  ["TGL", m(diesel)],
  ["TGM", `(<span style="color:#3875b2">${m(etruck)}</span>)`],
  ["Legende", `${m(diesel)} = Diesel ${m(blank)}`],
];

describe("Elemente in Zellen", () => {
  it("hängt ein Element ans Ende der Zelle", () => {
    expect(appendElement("TGX (", diesel)).toBe(`TGX (${m(diesel)}`);
  });

  it("listet die Elemente einer Zelle, auch in farbigem Text", () => {
    expect(listCellElements(table()[2][1])).toEqual([etruck]);
    expect(listCellElements("nur Text")).toEqual([]);
  });

  it("benennt und entfernt genau das n-te Element", () => {
    const cell = `${m(diesel)}/${m(diesel)}`;
    expect(updateCellElement(cell, 1, { label: "Gas" })).toBe(`${m(diesel)}/${m({ id: "shape/kasten", label: "Gas" })}`);
    expect(removeCellElement(cell, 0)).toBe(`/${m(diesel)}`);
  });

  it("findet ein Element über Zeile, Spalte und Stelle", () => {
    expect(elementAt(table(), { row: 3, col: 1, index: 1 })).toEqual(blank);
    expect(elementAt(table(), { row: 3, col: 1, index: 5 })).toBeNull();
  });

  it("zählt Elemente ohne Bedeutung", () => {
    expect(countWithoutMeaning(tableElements(table()))).toBe(1);
  });
});

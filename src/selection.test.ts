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

import { cellsInRange, cellsInRanges, clampRanges } from "./selection";

describe("cellsInRange", () => {
  it("lists the cells row by row", () => {
    expect(cellsInRange({ top: 0, left: 1, bottom: 1, right: 2 })).toEqual([
      [0, 1],
      [0, 2],
      [1, 1],
      [1, 2],
    ]);
  });
});

describe("cellsInRanges", () => {
  it("keeps the order of selection and drops duplicates", () => {
    const ranges = [
      { top: 1, left: 1, bottom: 1, right: 1 },
      { top: 0, left: 0, bottom: 1, right: 1 },
    ];

    expect(cellsInRanges(ranges)).toEqual([
      [1, 1],
      [0, 0],
      [0, 1],
      [1, 0],
    ]);
  });
});

describe("clampRanges", () => {
  // Rückgängig im Rahmen kann Zeilen und Spalten unter einer Markierung
  // wegnehmen; die Markierung darf danach nicht ins Leere zeigen.
  it("kürzt Bereiche auf das Gitter", () => {
    expect(clampRanges([{ top: 1, left: 0, bottom: 4, right: 5 }], 3, 2)).toEqual([
      { top: 1, left: 0, bottom: 2, right: 1 },
    ]);
  });

  it("verwirft Bereiche, die ganz außerhalb liegen", () => {
    expect(
      clampRanges(
        [
          { top: 0, left: 0, bottom: 0, right: 0 },
          { top: 5, left: 0, bottom: 6, right: 0 },
          { top: 0, left: 3, bottom: 0, right: 3 },
        ],
        3,
        2,
      ),
    ).toEqual([{ top: 0, left: 0, bottom: 0, right: 0 }]);
  });

  it("gibt dieselbe Liste zurück, wenn alles passt", () => {
    const ranges = [{ top: 0, left: 0, bottom: 1, right: 1 }];

    expect(clampRanges(ranges, 3, 3)).toBe(ranges);
  });
});

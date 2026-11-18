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

import { cellName, cellsInRange, cellsInRanges, clampRanges, columnLetters, fullLines, rangeName } from "./selection";

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

describe("cellName", () => {
  it("nennt Zellen wie Excel", () => {
    expect(cellName(0, 0)).toBe("A1");
    expect(cellName(2, 1)).toBe("B3");
    expect(cellName(9, 25)).toBe("Z10");
    expect(cellName(0, 26)).toBe("AA1");
    expect(cellName(0, 27)).toBe("AB1");
    expect(cellName(0, 52)).toBe("BA1");
  });
});

describe("columnLetters", () => {
  it("zählt Spalten wie Excel", () => {
    expect([0, 1, 25, 26, 51].map(columnLetters)).toEqual(["A", "B", "Z", "AA", "AZ"]);
  });
});

describe("rangeName", () => {
  it("nennt eine Zelle beim Namen und einen Bereich von Ecke zu Ecke", () => {
    expect(rangeName({ top: 1, left: 1, bottom: 1, right: 1 })).toBe("B2");
    expect(rangeName({ top: 1, left: 1, bottom: 3, right: 1 })).toBe("B2:B4");
  });
});

describe("fullLines", () => {
  it("findet ganz markierte Spalten und Zeilen", () => {
    const full = fullLines(
      [
        { top: 0, left: 1, bottom: 2, right: 2 },
        { top: 1, left: 0, bottom: 1, right: 2 },
      ],
      3,
      3,
    );

    expect(Array.from(full.cols)).toEqual([1, 2]);
    expect(Array.from(full.rows)).toEqual([1]);
  });

  it("findet nichts in einem Bereich mitten im Gitter", () => {
    const full = fullLines([{ top: 1, left: 1, bottom: 1, right: 1 }], 3, 3);

    expect(full.cols.size + full.rows.size).toBe(0);
  });
});

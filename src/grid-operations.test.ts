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

import {
  updateCell,
  addRow,
  removeRow,
  addColumn,
  removeColumn,
  parsePastedText,
  pasteBlock,
} from "./grid-operations";
import { TableData } from "./table-json";

describe("grid-operations", () => {
  const sample: TableData = [
    ["", "A", "B"],
    ["1", "a1", "b1"],
    ["2", "a2", "b2"],
  ];

  describe("updateCell", () => {
    it("updates the targeted cell only", () => {
      const result = updateCell(sample, 1, 1, "changed");
      expect(result[1][1]).toBe("changed");
      expect(result[0]).toEqual(sample[0]);
      expect(result[2]).toEqual(sample[2]);
      expect(result[1][0]).toBe("1");
      expect(result[1][2]).toBe("b1");
    });

    it("does not mutate the original data", () => {
      const original = [["a"]];
      updateCell(original, 0, 0, "z");
      expect(original[0][0]).toBe("a");
    });
  });

  describe("addRow", () => {
    it("appends an empty row matching the column count", () => {
      const result = addRow(sample);
      expect(result.length).toBe(4);
      expect(result[3]).toEqual(["", "", ""]);
    });

    it("handles an empty table gracefully", () => {
      const result = addRow([]);
      expect(result).toEqual([[""]]);
    });
  });

  describe("removeRow", () => {
    it("removes the given non-header row", () => {
      const result = removeRow(sample, 1);
      expect(result.length).toBe(2);
      expect(result).toEqual([sample[0], sample[2]]);
    });

    it("refuses to remove the header row (index 0)", () => {
      const result = removeRow(sample, 0);
      expect(result).toEqual(sample);
    });

    it("refuses to remove the last remaining row", () => {
      const single: TableData = [["only"]];
      const result = removeRow(single, 0);
      expect(result).toEqual(single);
    });
  });

  describe("addColumn", () => {
    it("appends an empty cell to every row", () => {
      const result = addColumn(sample);
      expect(result[0]).toEqual(["", "A", "B", ""]);
      expect(result[1]).toEqual(["1", "a1", "b1", ""]);
    });
  });

  describe("removeColumn", () => {
    it("removes the given non-header column", () => {
      const result = removeColumn(sample, 1);
      expect(result[0]).toEqual(["", "B"]);
      expect(result[1]).toEqual(["1", "b1"]);
    });

    it("refuses to remove the header column (index 0)", () => {
      const result = removeColumn(sample, 0);
      expect(result).toEqual(sample);
    });

    it("refuses to remove the last remaining column", () => {
      const single: TableData = [["only"], ["x"]];
      const result = removeColumn(single, 0);
      expect(result).toEqual(single);
    });
  });

  describe("parsePastedText", () => {
    it("splits tab-separated cells and newline-separated rows", () => {
      const result = parsePastedText("a\tb\tc\n1\t2\t3");
      expect(result).toEqual([
        ["a", "b", "c"],
        ["1", "2", "3"],
      ]);
    });

    it("handles Windows-style line endings", () => {
      const result = parsePastedText("a\tb\r\n1\t2");
      expect(result).toEqual([
        ["a", "b"],
        ["1", "2"],
      ]);
    });

    it("drops a single trailing empty line from spreadsheet copy", () => {
      const result = parsePastedText("a\tb\n1\t2\n");
      expect(result).toEqual([
        ["a", "b"],
        ["1", "2"],
      ]);
    });

    it("handles a single cell with no separators", () => {
      const result = parsePastedText("hello");
      expect(result).toEqual([["hello"]]);
    });
  });

  describe("pasteBlock", () => {
    it("writes values into the existing bounds", () => {
      const result = pasteBlock(sample, 1, 1, [
        ["x1", "y1"],
        ["x2", "y2"],
      ]);
      expect(result[1]).toEqual(["1", "x1", "y1"]);
      expect(result[2]).toEqual(["2", "x2", "y2"]);
      expect(result[0]).toEqual(sample[0]);
    });

    it("grows the table when the block exceeds current bounds", () => {
      const result = pasteBlock(sample, 2, 2, [
        ["z1", "z2"],
        ["z3", "z4"],
      ]);
      expect(result.length).toBe(4);
      expect(result[0].length).toBe(4);
      expect(result[2]).toEqual(["2", "a2", "z1", "z2"]);
      expect(result[3]).toEqual(["", "", "z3", "z4"]);
    });

    it("returns data unchanged for an empty block", () => {
      const result = pasteBlock(sample, 0, 0, []);
      expect(result).toEqual(sample);
    });

    it("does not mutate the original data", () => {
      const original: TableData = [["a", "b"]];
      pasteBlock(original, 0, 0, [["z", "z"]]);
      expect(original).toEqual([["a", "b"]]);
    });
  });
});

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

import { DEFAULT_TABLE_DATA, parseTableData, serializeTableData } from "./table-json";

describe("parseTableData", () => {
  it("returns the default table for undefined/null/empty input", () => {
    expect(parseTableData(undefined)).toEqual(DEFAULT_TABLE_DATA);
    expect(parseTableData(null)).toEqual(DEFAULT_TABLE_DATA);
    expect(parseTableData("")).toEqual(DEFAULT_TABLE_DATA);
  });

  it("returns the default table for invalid JSON", () => {
    expect(parseTableData("{not json")).toEqual(DEFAULT_TABLE_DATA);
  });

  it("returns the default table for JSON that is not an array", () => {
    expect(parseTableData(JSON.stringify({ a: 1 }))).toEqual(DEFAULT_TABLE_DATA);
    expect(parseTableData(JSON.stringify("just a string"))).toEqual(DEFAULT_TABLE_DATA);
  });

  it("returns the default table for an empty array", () => {
    expect(parseTableData(JSON.stringify([]))).toEqual(DEFAULT_TABLE_DATA);
  });

  it("parses a well-formed rectangular table", () => {
    const input = [
      ["", "A", "B"],
      ["1", "a1", "b1"],
    ];
    expect(parseTableData(JSON.stringify(input))).toEqual(input);
  });

  it("pads ragged rows with empty strings to the longest row", () => {
    const input = [["", "A", "B"], ["1", "a1"], ["2"]];
    expect(parseTableData(JSON.stringify(input))).toEqual([
      ["", "A", "B"],
      ["1", "a1", ""],
      ["2", "", ""],
    ]);
  });

  it("coerces non-string cell values to strings", () => {
    const input = [
      [0, "A"],
      [1, true],
    ];
    expect(parseTableData(JSON.stringify(input))).toEqual([
      ["0", "A"],
      ["1", "true"],
    ]);
  });

  it("treats null/undefined cells as empty strings", () => {
    const input = [["", "A"], [null, "x"]];
    expect(parseTableData(JSON.stringify(input))).toEqual([
      ["", "A"],
      ["", "x"],
    ]);
  });

  it("ignores non-array rows mixed into the top-level array", () => {
    const input = [["", "A"], "not a row", ["1", "a1"]];
    expect(parseTableData(JSON.stringify(input))).toEqual([
      ["", "A"],
      ["1", "a1"],
    ]);
  });
});

describe("serializeTableData", () => {
  it("round-trips through parseTableData", () => {
    const data = [
      ["", "A", "B"],
      ["1", "a1", "b1"],
    ];
    expect(parseTableData(serializeTableData(data))).toEqual(data);
  });
});

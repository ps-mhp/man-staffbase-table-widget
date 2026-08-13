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

import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";

import {
  TableModel,
  parseTableModel,
  serializeTableModel,
  encodeTableAttribute,
  insertRow,
  insertColumn,
  deleteRow,
  deleteColumn,
  mergeCells,
  unmergeCells,
  isCovered,
  mergeAt,
  setFormat,
  setSort,
  setFitImages,
  setVisibleRows,
  cellFormat,
  normalizeRange,
} from "./table-model";

const model = (data: string[][], overrides: Partial<TableModel> = {}): TableModel => ({
  data,
  merges: [],
  formats: {},
  sort: null,
  fitImages: true,
  visibleRows: DEFAULT_VISIBLE_ROWS,
  ...overrides,
});

describe("parseTableModel", () => {
  it("reads a legacy string[][] JSON array as a model without merges/formats/sort", () => {
    const result = parseTableModel(JSON.stringify([["", "A"], ["R", "1"]]));
    expect(result.data).toEqual([["", "A"], ["R", "1"]]);
    expect(result.merges).toEqual([]);
    expect(result.formats).toEqual({});
    expect(result.sort).toBeNull();
  });

  it("reads the full object model", () => {
    const raw = JSON.stringify({
      data: [["", "A", "B"], ["R", "1", "2"]],
      merges: [{ row: 0, col: 1, rowSpan: 1, colSpan: 2 }],
      formats: { "0,1": { bold: true } },
      sort: { col: 1, dir: "asc" },
    });
    const result = parseTableModel(raw);
    expect(result.merges).toEqual([{ row: 0, col: 1, rowSpan: 1, colSpan: 2 }]);
    expect(result.formats["0,1"]).toEqual({ bold: true });
    expect(result.sort).toEqual({ col: 1, dir: "asc" });
  });

  it("falls back to default table for malformed JSON", () => {
    const result = parseTableModel("not json");
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.merges).toEqual([]);
  });

  it("drops merges that fall outside the grid bounds", () => {
    const raw = JSON.stringify({
      data: [["", "A"], ["R", "1"]],
      merges: [{ row: 5, col: 5, rowSpan: 2, colSpan: 2 }],
    });
    expect(parseTableModel(raw).merges).toEqual([]);
  });
});

describe("serializeTableModel", () => {
  it("writes legacy array shape when there are no merges/formats/sort", () => {
    const raw = serializeTableModel(model([["", "A"], ["R", "1"]]));
    expect(JSON.parse(raw)).toEqual([["", "A"], ["R", "1"]]);
  });

  it("writes object shape when merges exist and round-trips", () => {
    const m = model([["", "A", "B"], ["R", "1", "2"]], {
      merges: [{ row: 0, col: 1, rowSpan: 1, colSpan: 2 }],
    });
    const roundTripped = parseTableModel(serializeTableModel(m));
    expect(roundTripped.merges).toEqual(m.merges);
  });
});

describe("fitImages", () => {
  it("defaults to on for a legacy array", () => {
    expect(parseTableModel(JSON.stringify([["", "A"]])).fitImages).toBe(true);
  });

  it("defaults to on for an object model that predates the option", () => {
    const raw = JSON.stringify({ data: [["", "A"]], merges: [], formats: {}, sort: null });
    expect(parseTableModel(raw).fitImages).toBe(true);
  });

  it("defaults to on for missing and malformed input", () => {
    expect(parseTableModel(undefined).fitImages).toBe(true);
    expect(parseTableModel("not json").fitImages).toBe(true);
  });

  it("reads only an explicit false as off", () => {
    const off = JSON.stringify({ data: [["", "A"]], fitImages: false });
    expect(parseTableModel(off).fitImages).toBe(false);
    const bogus = JSON.stringify({ data: [["", "A"]], fitImages: "nope" });
    expect(parseTableModel(bogus).fitImages).toBe(true);
  });

  it("keeps the compact array shape while the option is on", () => {
    const raw = serializeTableModel(model([["", "A"]], { fitImages: true }));
    expect(JSON.parse(raw)).toEqual([["", "A"]]);
  });

  it("writes the object shape once the option is off and round-trips", () => {
    const raw = serializeTableModel(model([["", "A"]], { fitImages: false }));
    expect(JSON.parse(raw)).toMatchObject({ fitImages: false });
    expect(parseTableModel(raw).fitImages).toBe(false);
  });

  it("survives an encode/decode through the attribute payload", () => {
    const off = parseTableModel(encodeTableAttribute(model([["", "A"]], { fitImages: false })));
    expect(off.fitImages).toBe(false);
    const on = parseTableModel(encodeTableAttribute(model([["", "A"]], { fitImages: true })));
    expect(on.fitImages).toBe(true);
  });

  it("is toggled by setFitImages without touching anything else", () => {
    const m = model([["", "A"]], { sort: { col: 0, dir: "asc" } });
    const off = setFitImages(m, false);
    expect(off.fitImages).toBe(false);
    expect(off.sort).toEqual(m.sort);
    expect(off.data).toEqual(m.data);
    expect(setFitImages(off, true).fitImages).toBe(true);
  });

  it("survives the operations that rebuild the model", () => {
    const m = model([["", "A"], ["R", "1"]], { fitImages: false });
    expect(insertRow(m, 1).fitImages).toBe(false);
    expect(insertColumn(m, 1).fitImages).toBe(false);
    expect(deleteRow(m, 1).fitImages).toBe(false);
    expect(setSort(m, { col: 0, dir: "asc" }).fitImages).toBe(false);
  });
});

describe("isCovered / mergeAt", () => {
  const m = model([["", "A", "B"], ["R", "1", "2"]], {
    merges: [{ row: 0, col: 1, rowSpan: 1, colSpan: 2 }],
  });

  it("reports covered cells but not the anchor", () => {
    expect(isCovered(m, 0, 1)).toBe(false); // anchor
    expect(isCovered(m, 0, 2)).toBe(true); // covered
    expect(isCovered(m, 1, 1)).toBe(false);
  });

  it("finds the merge at its anchor only", () => {
    expect(mergeAt(m, 0, 1)).toBeDefined();
    expect(mergeAt(m, 0, 2)).toBeUndefined();
  });
});

describe("insertRow", () => {
  it("moves a merge down when inserting above it", () => {
    const m = model([["", "A"], ["R1", "1"], ["R2", "2"]], {
      merges: [{ row: 2, col: 0, rowSpan: 1, colSpan: 2 }],
    });
    const result = insertRow(m, 1);
    expect(result.data.length).toBe(4);
    expect(result.merges[0].row).toBe(3);
  });

  it("grows a merge when inserting inside its vertical span", () => {
    const m = model([["", "A"], ["R1", "1"], ["R2", "2"]], {
      merges: [{ row: 1, col: 0, rowSpan: 2, colSpan: 1 }],
    });
    const result = insertRow(m, 2);
    expect(result.merges[0]).toEqual({ row: 1, col: 0, rowSpan: 3, colSpan: 1 });
  });

  it("never inserts above the header row", () => {
    const m = model([["", "A"], ["R", "1"]]);
    const result = insertRow(m, 0);
    expect(result.data[0]).toEqual(["", "A"]);
    expect(result.data.length).toBe(3);
  });
});

describe("deleteRow", () => {
  it("keeps the header row", () => {
    const m = model([["", "A"], ["R", "1"]]);
    expect(deleteRow(m, 0)).toBe(m);
  });

  it("shifts a merge up when deleting above it", () => {
    const m = model([["", "A"], ["R1", "1"], ["R2", "2"]], {
      merges: [{ row: 2, col: 0, rowSpan: 1, colSpan: 2 }],
    });
    const result = deleteRow(m, 1);
    expect(result.merges[0].row).toBe(1);
  });

  it("shrinks a merge when deleting a row inside its span", () => {
    const m = model([["", "A"], ["R1", "1"], ["R2", "2"], ["R3", "3"]], {
      merges: [{ row: 1, col: 0, rowSpan: 3, colSpan: 1 }],
    });
    const result = deleteRow(m, 2);
    expect(result.merges[0].rowSpan).toBe(2);
  });
});

describe("insertColumn / deleteColumn", () => {
  it("grows a merge when inserting inside its horizontal span", () => {
    const m = model([["", "A", "B"], ["R", "1", "2"]], {
      merges: [{ row: 0, col: 1, rowSpan: 1, colSpan: 2 }],
    });
    const result = insertColumn(m, 2);
    expect(result.merges[0].colSpan).toBe(3);
  });

  it("keeps the header column on delete", () => {
    const m = model([["", "A"], ["R", "1"]]);
    expect(deleteColumn(m, 0)).toBe(m);
  });
});

describe("mergeCells / unmergeCells", () => {
  it("creates a spanning merge for a range", () => {
    const m = model([["", "A", "B"], ["R", "1", "2"]]);
    const result = mergeCells(m, normalizeRange([0, 1], [1, 2]));
    expect(result.merges).toEqual([{ row: 0, col: 1, rowSpan: 2, colSpan: 2 }]);
  });

  it("is a no-op for a single cell", () => {
    const m = model([["", "A"], ["R", "1"]]);
    expect(mergeCells(m, normalizeRange([1, 1], [1, 1]))).toBe(m);
  });

  it("replaces intersecting merges", () => {
    const m = model([["", "A", "B"], ["R", "1", "2"], ["S", "3", "4"]], {
      merges: [{ row: 0, col: 1, rowSpan: 1, colSpan: 2 }],
    });
    const result = mergeCells(m, normalizeRange([0, 1], [2, 2]));
    expect(result.merges).toEqual([{ row: 0, col: 1, rowSpan: 3, colSpan: 2 }]);
  });

  it("unmerges a merge that covers a cell", () => {
    const m = model([["", "A", "B"], ["R", "1", "2"]], {
      merges: [{ row: 0, col: 1, rowSpan: 1, colSpan: 2 }],
    });
    expect(unmergeCells(m, 0, 2).merges).toEqual([]);
  });
});

describe("setFormat / cellFormat", () => {
  it("applies a format to multiple cells", () => {
    const m = model([["", "A"], ["R", "1"]]);
    const result = setFormat(m, [[1, 1], [0, 1]], { bold: true });
    expect(cellFormat(result, 1, 1)).toEqual({ bold: true });
    expect(cellFormat(result, 0, 1)).toEqual({ bold: true });
  });

  it("merges patches and removes emptied formats", () => {
    const m = model([["", "A"], ["R", "1"]], { formats: { "1,1": { bold: true } } });
    const withItalic = setFormat(m, [[1, 1]], { italic: true });
    expect(cellFormat(withItalic, 1, 1)).toEqual({ bold: true, italic: true });

    const cleared = setFormat(withItalic, [[1, 1]], { bold: false, italic: false });
    expect(cellFormat(cleared, 1, 1)).toEqual({});
    expect(cleared.formats["1,1"]).toBeUndefined();
  });

  it("stores every vertical alignment, including 'middle'", () => {
    const m = model([["", "A"], ["R", "1"]]);
    for (const valign of ["top", "middle", "bottom"] as const) {
      expect(cellFormat(setFormat(m, [[1, 1]], { valign }), 1, 1)).toEqual({ valign });
    }
    const cleared = setFormat(setFormat(m, [[1, 1]], { valign: "middle" }), [[1, 1]], {
      valign: undefined,
    });
    expect(cellFormat(cleared, 1, 1)).toEqual({});
  });

  it("shifts formats when a row is inserted", () => {
    const m = model([["", "A"], ["R", "1"]], { formats: { "1,1": { bold: true } } });
    const result = insertRow(m, 1);
    expect(cellFormat(result, 2, 1)).toEqual({ bold: true });
    expect(cellFormat(result, 1, 1)).toEqual({});
  });
});

describe("setSort", () => {
  it("sets and clears the preset sort", () => {
    const m = model([["", "A"], ["R", "1"]]);
    expect(setSort(m, { col: 1, dir: "desc" }).sort).toEqual({ col: 1, dir: "desc" });
    expect(setSort(m, null).sort).toBeNull();
  });
});

describe("encoded attribute payloads", () => {
  it("round-trips a full model through the attribute form", () => {
    const source = model([["", 'Spalte "1"'], ["Zeile 1", "Auto"]], {
      merges: [{ row: 0, col: 0, rowSpan: 2, colSpan: 1 }],
      formats: { "0,1": { bold: true } },
      sort: { col: 1, dir: "asc" },
    });

    const attribute = encodeTableAttribute(source);

    expect(attribute.startsWith("b64:")).toBe(true);
    expect(parseTableModel(attribute)).toEqual(source);
  });

  it("still reads the legacy raw-JSON forms", () => {
    expect(parseTableModel('[["","A"],["R","1"]]').data).toEqual([["", "A"], ["R", "1"]]);
    expect(parseTableModel('{"data":[["","A"]],"merges":[],"formats":{},"sort":null}').data).toEqual([
      ["", "A"],
    ]);
  });

  it("falls back to the default table for a corrupt payload", () => {
    // A marker with unusable content is broken data, not legacy JSON — it must
    // not be re-read as a table of the literal string.
    expect(parseTableModel("b64:not base64!!").data).toEqual(parseTableModel(undefined).data);
  });
});

describe("visibleRows", () => {
  it("defaults to five data rows", () => {
    expect(parseTableModel(undefined).visibleRows).toBe(DEFAULT_VISIBLE_ROWS);
    expect(parseTableModel(JSON.stringify([["", "A"]])).visibleRows).toBe(DEFAULT_VISIBLE_ROWS);
  });

  it("reads an explicit limit, including the zero that shows everything", () => {
    const three = JSON.stringify({ data: [["", "A"]], visibleRows: 3 });
    expect(parseTableModel(three).visibleRows).toBe(3);
    const all = JSON.stringify({ data: [["", "A"]], visibleRows: 0 });
    expect(parseTableModel(all).visibleRows).toBe(0);
  });

  it("falls back to the default for an unusable limit", () => {
    const bogus = JSON.stringify({ data: [["", "A"]], visibleRows: -2 });
    expect(parseTableModel(bogus).visibleRows).toBe(DEFAULT_VISIBLE_ROWS);
  });

  it("keeps the compact array shape at the default", () => {
    const raw = serializeTableModel(model([["", "A"]], { visibleRows: DEFAULT_VISIBLE_ROWS }));
    expect(JSON.parse(raw)).toEqual([["", "A"]]);
  });

  it("writes and round-trips a custom limit", () => {
    const raw = serializeTableModel(model([["", "A"]], { visibleRows: 3 }));
    expect(JSON.parse(raw)).toMatchObject({ visibleRows: 3 });
    expect(parseTableModel(raw).visibleRows).toBe(3);
  });

  it("survives an encode/decode through the attribute payload", () => {
    const m = parseTableModel(encodeTableAttribute(model([["", "A"]], { visibleRows: 0 })));
    expect(m.visibleRows).toBe(0);
  });

  it("is set by setVisibleRows without touching anything else", () => {
    const m = model([["", "A"]], { sort: { col: 0, dir: "asc" } });
    const limited = setVisibleRows(m, 2);

    expect(limited.visibleRows).toBe(2);
    expect(limited.sort).toEqual(m.sort);
    expect(limited.data).toEqual(m.data);
  });

  it("normalizes a nonsensical limit rather than storing it", () => {
    expect(setVisibleRows(model([["", "A"]]), -1).visibleRows).toBe(DEFAULT_VISIBLE_ROWS);
    expect(setVisibleRows(model([["", "A"]]), 4.7).visibleRows).toBe(4);
  });
});

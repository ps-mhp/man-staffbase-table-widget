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
  TableModel,
  parseTableModel,
  readTableModel,
  serializeTableModel,
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
  cellFormat,
  normalizeRange,
} from "./table-model";
import { decodeTablePayload, encodeTablePayload } from "./table-payload";
import { DEFAULT_TABLE_DATA } from "./table-json";

const model = (data: string[][], overrides: Partial<TableModel> = {}): TableModel => ({
  data,
  merges: [],
  formats: {},
  sort: null,
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

describe("readTableModel", () => {
  const grid = JSON.stringify([["", "A"], ["R", "1"]]);

  it("reports 'empty' for a widget that was never configured", () => {
    expect(readTableModel(undefined).status).toBe("empty");
    expect(readTableModel("").status).toBe("empty");
    expect(readTableModel("   ").status).toBe("empty");
  });

  it("reports 'ok' for encoded, legacy array and legacy object values", () => {
    expect(readTableModel(encodeTablePayload(grid)).status).toBe("ok");
    expect(readTableModel(grid).status).toBe("ok");
    expect(readTableModel(JSON.stringify({ data: [["", "A"]] })).status).toBe("ok");
  });

  it("reports 'unreadable' for a value truncated at its first quote", () => {
    // The exact value a translated article delivered.
    const result = readTableModel("{");
    expect(result.status).toBe("unreadable");
    expect(result.model.data).toEqual(DEFAULT_TABLE_DATA);
  });

  it("reports 'unreadable' for other broken shapes", () => {
    expect(readTableModel("not json").status).toBe("unreadable");
    expect(readTableModel("5").status).toBe("unreadable");
    expect(readTableModel("[]").status).toBe("unreadable");
    expect(readTableModel(JSON.stringify({ merges: [] })).status).toBe("unreadable");
    expect(readTableModel("b64:not base64!!").status).toBe("unreadable");
  });
});

describe("serializeTableModel", () => {
  it("writes legacy array shape when there are no merges/formats/sort", () => {
    const raw = serializeTableModel(model([["", "A"], ["R", "1"]]));
    expect(JSON.parse(decodeTablePayload(raw)!)).toEqual([["", "A"], ["R", "1"]]);
  });

  it("stores an opaque base64 payload, never raw JSON", () => {
    const raw = serializeTableModel(model([["", 'A "quoted" head'], ["R", "1"]]));
    // The quote-terminated attribute is exactly how translated articles lost
    // their tables, so the stored value must not contain any of these.
    expect(raw).not.toMatch(/["'<>&]/);
    expect(parseTableModel(raw).data[0][1]).toBe('A "quoted" head');
  });

  it("writes object shape when merges exist and round-trips", () => {
    const m = model([["", "A", "B"], ["R", "1", "2"]], {
      merges: [{ row: 0, col: 1, rowSpan: 1, colSpan: 2 }],
    });
    const roundTripped = parseTableModel(serializeTableModel(m));
    expect(roundTripped.merges).toEqual(m.merges);
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

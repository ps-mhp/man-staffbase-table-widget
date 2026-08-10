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
  clearCellFormatting,
  clearFormatting,
  stripImageWidths,
  stripTextMarkup,
} from "./clear-format";
import { TableModel } from "./table-model";

const model = (data: string[][], extra: Partial<TableModel> = {}): TableModel => ({
  data,
  merges: [],
  formats: {},
  sort: null,
  fitImages: true,
  ...extra,
});

const IMG = '<img src="https://x.com/a.png" style="width:200px">';

describe("stripTextMarkup", () => {
  it("unwraps sup and sub, keeping their characters", () => {
    expect(stripTextMarkup("m<sup>2</sup> und H<sub>2</sub>O")).toBe("m2 und H2O");
  });

  it("keeps images and line breaks", () => {
    const out = stripTextMarkup(`A<br><sup>1</sup>${IMG}`);
    expect(out).toContain("<br>");
    expect(out).toContain('src="https://x.com/a.png"');
    expect(out).toContain("width:200px");
    expect(out).not.toContain("<sup>");
  });

  it("leaves plain text untouched", () => {
    expect(stripTextMarkup("nur Text")).toBe("nur Text");
    expect(stripTextMarkup("")).toBe("");
    expect(stripTextMarkup(undefined)).toBe("");
  });
});

describe("stripImageWidths", () => {
  it("drops the stored width but keeps the image", () => {
    const out = stripImageWidths(IMG);
    expect(out).toContain('src="https://x.com/a.png"');
    expect(out).not.toContain("width:200px");
  });

  it("drops a width attribute as well", () => {
    expect(stripImageWidths('<img src="/a.png" width="300">')).not.toContain("300");
  });

  it("keeps text and its markup", () => {
    const out = stripImageWidths(`H<sub>2</sub>O ${IMG}`);
    expect(out).toContain("<sub>2</sub>");
    expect(out).not.toContain("width:200px");
  });

  it("is a no-op for a cell without images", () => {
    expect(stripImageWidths("nur Text")).toBe("nur Text");
  });
});

describe("clearCellFormatting", () => {
  it("removes text markup and image widths for 'all'", () => {
    const out = clearCellFormatting(`m<sup>2</sup>${IMG}`, "all");
    expect(out).not.toContain("<sup>");
    expect(out).not.toContain("width:200px");
    expect(out).toContain('src="https://x.com/a.png"');
  });

  it("keeps image widths for 'text'", () => {
    const out = clearCellFormatting(`m<sup>2</sup>${IMG}`, "text");
    expect(out).not.toContain("<sup>");
    expect(out).toContain("width:200px");
  });

  it("keeps text markup for 'images'", () => {
    const out = clearCellFormatting(`m<sup>2</sup>${IMG}`, "images");
    expect(out).toContain("<sup>2</sup>");
    expect(out).not.toContain("width:200px");
  });
});

describe("clearFormatting", () => {
  const sample = (): TableModel =>
    model([["", `A<sup>1</sup>`], ["R", `B<sub>2</sub>${IMG}`]], {
      formats: { "0,1": { bold: true }, "1,1": { color: "#f00" } },
    });

  it("clears the whole table when no cells are given", () => {
    const next = clearFormatting(sample(), [], "all");

    expect(next.formats).toEqual({});
    expect(next.data[0][1]).toBe("A1");
    expect(next.data[1][1]).toContain("B2");
    expect(next.data[1][1]).not.toContain("width:200px");
  });

  it("clears only the listed cells", () => {
    const next = clearFormatting(sample(), [[1, 1]], "all");

    expect(next.formats).toEqual({ "0,1": { bold: true } });
    expect(next.data[0][1]).toBe("A<sup>1</sup>");
    expect(next.data[1][1]).not.toContain("<sub>");
  });

  it("keeps cell formats when only images are reset", () => {
    const next = clearFormatting(sample(), [], "images");

    expect(next.formats).toEqual(sample().formats);
    expect(next.data[0][1]).toBe("A<sup>1</sup>");
    expect(next.data[1][1]).not.toContain("width:200px");
  });

  it("keeps image widths when only text is reset", () => {
    const next = clearFormatting(sample(), [], "text");

    expect(next.formats).toEqual({});
    expect(next.data[1][1]).toContain("width:200px");
    expect(next.data[1][1]).not.toContain("<sub>");
  });

  it("leaves the grid shape, merges and options alone", () => {
    const source = model([["", "A"], ["R", "B"]], {
      merges: [{ row: 0, col: 0, rowSpan: 2, colSpan: 1 }],
      sort: { col: 1, dir: "asc" },
      fitImages: false,
    });
    const next = clearFormatting(source, [], "all");

    expect(next.data).toHaveLength(2);
    expect(next.merges).toEqual(source.merges);
    expect(next.sort).toEqual(source.sort);
    expect(next.fitImages).toBe(false);
  });
});

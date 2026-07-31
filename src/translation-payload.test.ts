import { TableModel } from "./table-model";
import {
  CELL_ATTRIBUTE,
  applyTranslatedCells,
  readTranslatedCells,
  tableModelToTranslatableHtml,
} from "./translation-payload";

const model = (data: string[][], extra: Partial<TableModel> = {}): TableModel => ({
  data,
  merges: [],
  formats: {},
  sort: null,
  ...extra,
});

describe("tableModelToTranslatableHtml", () => {
  it("emits every cell with its coordinate, header row as th", () => {
    const html = tableModelToTranslatableHtml(model([["", "Spalte 1"], ["Zeile 1", "Auto"]]));

    expect(html).toContain(`<th ${CELL_ATTRIBUTE}="0,1">Spalte 1</th>`);
    expect(html).toContain(`<td ${CELL_ATTRIBUTE}="1,1">Auto</td>`);
    // Empty cells travel too, so the service reads a rectangular table.
    expect(html).toContain(`<th ${CELL_ATTRIBUTE}="0,0"></th>`);
  });

  it("keeps a cell's inline markup intact", () => {
    const html = tableModelToTranslatableHtml(model([["m<sup>2</sup>"]]));
    expect(html).toContain("m<sup>2</sup>");
  });
});

describe("readTranslatedCells", () => {
  it("reads cells back keyed by coordinate", () => {
    const cells = readTranslatedCells(
      `<div><table><tr><th ${CELL_ATTRIBUTE}="0,1">Column 1</th><td ${CELL_ATTRIBUTE}="1,1">Car</td></tr></table></div>`,
    );

    expect(cells.get("0,1")).toBe("Column 1");
    expect(cells.get("1,1")).toBe("Car");
  });

  it("sanitizes whatever the service returned", () => {
    const cells = readTranslatedCells(
      `<table><tr><td ${CELL_ATTRIBUTE}="0,0"><b onclick="steal()">Bold</b> m<sup>2</sup><img src="javascript:alert(1)"></td></tr></table>`,
    );
    // Disallowed tag dropped (text kept), unsafe image source dropped entirely,
    // `<sup>` kept — see `rich-text.ts`.
    expect(cells.get("0,0")).toBe("Bold m<sup>2</sup>");
  });

  it("returns nothing for a string that is not a translated table", () => {
    expect(readTranslatedCells("<p>hello</p>").size).toBe(0);
  });
});

describe("applyTranslatedCells", () => {
  it("replaces covered cells and keeps merges, formats and sort", () => {
    const source = model([["", "Spalte 1"], ["Zeile 1", "Auto"]], {
      merges: [{ row: 0, col: 0, rowSpan: 1, colSpan: 2 }],
      formats: { "1,1": { bold: true } },
      sort: { col: 1, dir: "asc" },
    });

    const next = applyTranslatedCells(source, new Map([["1,1", "Car"]]));

    expect(next.data).toEqual([["", "Spalte 1"], ["Zeile 1", "Car"]]);
    expect(next.merges).toBe(source.merges);
    expect(next.formats).toBe(source.formats);
    expect(next.sort).toBe(source.sort);
  });

  it("keeps the source value when the translation emptied a non-empty cell", () => {
    const next = applyTranslatedCells(model([["Auto"]]), new Map([["0,0", "  "]]));
    expect(next.data).toEqual([["Auto"]]);
  });

  it("keeps the source value for coordinates the translation did not cover", () => {
    const next = applyTranslatedCells(model([["Auto", "Haus"]]), new Map([["0,0", "Car"]]));
    expect(next.data).toEqual([["Car", "Haus"]]);
  });

  it("returns the same model when there is nothing to apply", () => {
    const source = model([["Auto"]]);
    expect(applyTranslatedCells(source, new Map())).toBe(source);
  });
});

describe("round trip", () => {
  it("survives a service that only rewrites the text nodes", () => {
    const source = model([["", "Spalte 1"], ["Zeile 1", "Auto"]]);
    const sent = tableModelToTranslatableHtml(source);
    const returned = sent.replace(">Spalte 1<", ">Column 1<").replace(">Auto<", ">Car<");

    expect(applyTranslatedCells(source, readTranslatedCells(returned)).data).toEqual([
      ["", "Column 1"],
      ["Zeile 1", "Car"],
    ]);
  });
});

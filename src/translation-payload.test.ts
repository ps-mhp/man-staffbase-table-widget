import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
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
  fitImages: true,
  visibleRows: DEFAULT_VISIBLE_ROWS,
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

  it("carries the image-fit option into the translated model", () => {
    const source = model([["", "Spalte 1"], ["Zeile 1", "Auto"]], { fitImages: false });

    expect(applyTranslatedCells(source, new Map([["1,1", "Car"]])).fitImages).toBe(false);
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

// ── translateTableModel ──────────────────────────────────────────────────────
// The transport layer (headers, HTTP status, network errors) is exercised in
// @shared/translation/client.test.ts. These cases cover the table-specific
// bridge: that the right HTML is built, sent, and the returned cells are
// applied back to the model.

jest.mock("@shared/translation/client", () => ({
  ...jest.requireActual("@shared/translation/client"),
  translateHtml: jest.fn(),
}));

import { translateHtml } from "@shared/translation/client";
import { acceptsTranslatedTable, translateTableModel } from "./translation-payload";

const fullModel = (): TableModel => ({
  data: [["", "Spalte 1"], ["Zeile 1", "Auto"]],
  merges: [],
  formats: {},
  sort: null,
  fitImages: true,
  visibleRows: DEFAULT_VISIBLE_ROWS,
});

const translatedHtml =
  `<div data-tw-table="1"><table><tbody>` +
  `<tr><th ${CELL_ATTRIBUTE}="0,0"></th><th ${CELL_ATTRIBUTE}="0,1">Column 1</th></tr>` +
  `<tr><td ${CELL_ATTRIBUTE}="1,0">Row 1</td><td ${CELL_ATTRIBUTE}="1,1">Car</td></tr>` +
  `</tbody></table></div>`;

describe("translateTableModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sends table HTML and returns the model with translated cells", async () => {
    (translateHtml as jest.Mock).mockResolvedValue(translatedHtml);

    const result = await translateTableModel({
      model: fullModel(),
      sourceLanguage: "de_DE",
      targetLanguage: "en_US",
    });

    expect(result.data).toEqual([["", "Column 1"], ["Row 1", "Car"]]);

    const [{ html, sourceLanguage, targetLanguage }, { accepts }] =
      (translateHtml as jest.Mock).mock.calls[0];
    expect(html).toContain(`${CELL_ATTRIBUTE}="1,1"`);
    expect(sourceLanguage).toBe("de_DE");
    expect(targetLanguage).toBe("en_US");
    expect(accepts).toBe(acceptsTranslatedTable);
  });

  it("keeps source-language cells for coordinates the service did not cover", async () => {
    const partial =
      `<div data-tw-table="1"><table><tbody>` +
      `<tr><th ${CELL_ATTRIBUTE}="0,0"></th><th ${CELL_ATTRIBUTE}="0,1">Column 1</th></tr>` +
      `<tr><td ${CELL_ATTRIBUTE}="1,0">Row 1</td></tr>` +
      `</tbody></table></div>`;
    (translateHtml as jest.Mock).mockResolvedValue(partial);

    const result = await translateTableModel({
      model: fullModel(),
      sourceLanguage: "de_DE",
      targetLanguage: "en_US",
    });

    // 1,1 was not in the response → kept in source language
    expect(result.data[1][1]).toBe("Auto");
    expect(result.data[0][1]).toBe("Column 1");
  });
});

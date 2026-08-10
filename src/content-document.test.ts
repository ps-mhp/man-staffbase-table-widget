import {
  containsContentDocumentWidget,
  findContentDocumentTables,
  tablePathKey,
  withContentDocumentTables,
} from "./content-document";

/**
 * A block tree in the shape the Content Designer actually sends, reduced to
 * what this module reads. Taken from a real
 * `POST /api/translations` body of a page in `/studio/content/page/…`.
 */
const customBlock = (
  tabledata: string | null,
  customElementName = "table-widget",
): Record<string, unknown> => ({
  type: "customBlock",
  config: {
    settings: {
      content: {
        selectedBlock: {
          customElementName,
          name: "Table Widget",
          url: "https://cdn.jsdelivr.net/gh/ps-mhp/man-staffbase-table-widget@1.4.0/dist/table-widget.js",
          properties: tabledata === null ? {} : { tabledata },
          version: "1.0.0",
        },
      },
    },
  },
});

const document_ = (blocks: Record<string, unknown>): Record<string, unknown> => ({
  sourceLanguage: "en_US",
  targetLanguage: "de_DE",
  document: { content: Object.keys(blocks), blocks },
});

const WIDGET_BLOCK_ID = "95edb914-821f-445a-92c7-be185b579c3c";

const body = (tabledata: string | null = "b64:AAA"): Record<string, unknown> =>
  document_({
    "08a81a63": { type: "section", children: ["d77cc37e"] },
    d77cc37e: { type: "container", children: [WIDGET_BLOCK_ID] },
    [WIDGET_BLOCK_ID]: customBlock(tabledata),
  });

describe("containsContentDocumentWidget", () => {
  it("recognises a body carrying the widget", () => {
    expect(containsContentDocumentWidget(JSON.stringify(body()))).toBe(true);
  });

  it("ignores a body without it", () => {
    expect(containsContentDocumentWidget(JSON.stringify(document_({})))).toBe(false);
  });

  it("ignores an article-HTML body", () => {
    expect(
      containsContentDocumentWidget(
        JSON.stringify({ contents: { value: '<table-widget tabledata="b64:AAA"></table-widget>' } }),
      ),
    ).toBe(false);
  });
});

describe("findContentDocumentTables", () => {
  it("finds the widget's block and its current value", () => {
    const tables = findContentDocumentTables(body("b64:AAA"));

    expect(tables).toHaveLength(1);
    expect(tables[0].tabledata).toBe("b64:AAA");
    expect(tables[0].path).toEqual([
      "document",
      "blocks",
      WIDGET_BLOCK_ID,
      "config",
      "settings",
      "content",
      "selectedBlock",
      "properties",
      "tabledata",
    ]);
  });

  it("reports a block whose tabledata is missing, so it is never invented", () => {
    const tables = findContentDocumentTables(body(null));

    expect(tables).toHaveLength(1);
    expect(tables[0].tabledata).toBeNull();
  });

  it("ignores custom blocks belonging to another widget", () => {
    const other = document_({ a: customBlock("b64:AAA", "chart-widget") });

    expect(findContentDocumentTables(other)).toEqual([]);
  });

  it("finds several blocks in traversal order", () => {
    const two = document_({
      first: customBlock("b64:AAA"),
      middle: { type: "text", content: "…" },
      second: customBlock("b64:BBB"),
    });

    expect(findContentDocumentTables(two).map((table) => table.tabledata)).toEqual([
      "b64:AAA",
      "b64:BBB",
    ]);
  });

  it("returns nothing for a body that is not a content document", () => {
    expect(findContentDocumentTables({ contents: { value: "<p>Hallo</p>" } })).toEqual([]);
    expect(findContentDocumentTables("just a string")).toEqual([]);
  });
});

describe("withContentDocumentTables", () => {
  it("writes the value into the block it was taken from", () => {
    const source = body("b64:AAA");
    const [table] = findContentDocumentTables(source);

    const { body: next, applied } = withContentDocumentTables(
      source,
      new Map([[tablePathKey(table), "b64:TRANSLATED"]]),
    );

    expect(applied).toBe(1);
    expect(findContentDocumentTables(next)[0].tabledata).toBe("b64:TRANSLATED");
  });

  it("leaves the caller's document untouched", () => {
    const source = body("b64:AAA");
    const [table] = findContentDocumentTables(source);

    withContentDocumentTables(source, new Map([[tablePathKey(table), "b64:TRANSLATED"]]));

    expect(findContentDocumentTables(source)[0].tabledata).toBe("b64:AAA");
  });

  it("keeps every other part of the document as it was", () => {
    const source = body("b64:AAA");
    const [table] = findContentDocumentTables(source);

    const { body: next } = withContentDocumentTables(
      source,
      new Map([[tablePathKey(table), "b64:TRANSLATED"]]),
    );

    const document = (next as { document: { content: string[]; blocks: Record<string, unknown> } })
      .document;
    expect(document.content).toEqual(Object.keys(document.blocks));
    expect(document.blocks["08a81a63"]).toEqual({ type: "section", children: ["d77cc37e"] });
  });

  it("skips a path the response does not have, rather than creating it", () => {
    const { body: next, applied } = withContentDocumentTables(
      body("b64:AAA"),
      new Map([[JSON.stringify(["document", "blocks", "gone", "x"]), "b64:TRANSLATED"]]),
    );

    expect(applied).toBe(0);
    expect(findContentDocumentTables(next)[0].tabledata).toBe("b64:AAA");
  });

  it("writes only the blocks it was given", () => {
    const two = document_({ first: customBlock("b64:AAA"), second: customBlock("b64:BBB") });
    const [, second] = findContentDocumentTables(two);

    const { body: next, applied } = withContentDocumentTables(
      two,
      new Map([[tablePathKey(second), "b64:TRANSLATED"]]),
    );

    expect(applied).toBe(1);
    expect(findContentDocumentTables(next).map((table) => table.tabledata)).toEqual([
      "b64:AAA",
      "b64:TRANSLATED",
    ]);
  });
});

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

import { SLOT_ATTRIBUTE, parseSlotMarkup, tableModelToSlotMarkup } from "./table-dom";
import { TableModel } from "./table-model";

const model = (data: string[][], overrides: Partial<TableModel> = {}): TableModel => ({
  data,
  merges: [],
  formats: {},
  sort: null,
  ...overrides,
});

/** Mimics the translation service: rewrite text nodes, leave attributes alone. */
const translateTextNodes = (markup: string, dictionary: Record<string, string>): string => {
  const doc = new DOMParser().parseFromString(`<body>${markup}</body>`, "text/html");
  const walk = (node: Node): void => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        const text = child.textContent ?? "";
        if (dictionary[text]) child.textContent = dictionary[text];
      } else {
        walk(child);
      }
    });
  };
  walk(doc.body);
  return doc.body.innerHTML;
};

describe("tableModelToSlotMarkup", () => {
  it("marks the container and hides it so the rendered table is not duplicated", () => {
    const markup = tableModelToSlotMarkup(model([["", "A"], ["R", "1"]]));
    expect(markup).toContain(SLOT_ATTRIBUTE);
    expect(markup).toContain("display:none");
  });

  it("puts cell text into text nodes, not attributes", () => {
    const markup = tableModelToSlotMarkup(model([["", "Criterio"], ["Consumo", "100"]]));
    const doc = new DOMParser().parseFromString(`<body>${markup}</body>`, "text/html");
    expect(doc.body.textContent).toContain("Criterio");
    expect(doc.body.textContent).toContain("Consumo");
  });

  it("keeps every attribute value free of characters the pipeline mangles", () => {
    const markup = tableModelToSlotMarkup(
      model([["", "A"], ["R", "1"]], {
        merges: [{ row: 0, col: 0, rowSpan: 2, colSpan: 1 }],
        formats: { "1,1": { bold: true, color: "#303c49", background: "#08fdab", fontSize: 11 } },
        sort: { col: 1, dir: "asc" },
      }),
    );
    // Attribute values must contain no entity-encodable characters — the
    // translation response decoded `&quot;` without re-escaping it.
    const attributeValues = Array.from(markup.matchAll(/=(?:"([^"]*)"|([^\s>]+))/g)).map(
      (match) => match[1] ?? match[2],
    );
    for (const value of attributeValues) {
      expect(value).not.toMatch(/[<>&"]/);
    }
  });
});

describe("parseSlotMarkup", () => {
  it("returns null when there is no slot markup", () => {
    expect(parseSlotMarkup(undefined)).toBeNull();
    expect(parseSlotMarkup("")).toBeNull();
    expect(parseSlotMarkup("<div>plain content</div>")).toBeNull();
  });

  it("round-trips values, merges, formats and sort", () => {
    const original = model([["", "A", "B"], ["R", "1", "2"]], {
      merges: [{ row: 0, col: 1, rowSpan: 1, colSpan: 2 }],
      formats: {
        "1,1": { bold: true, italic: true, align: "center", fontSize: 11 },
        "1,2": { color: "#303c49", background: "#08fdab", valign: "middle" },
      },
      sort: { col: 1, dir: "desc" },
    });

    const parsed = parseSlotMarkup(tableModelToSlotMarkup(original))!;

    expect(parsed.data).toEqual(original.data);
    expect(parsed.merges).toEqual(original.merges);
    expect(parsed.formats["1,1"]).toEqual(original.formats["1,1"]);
    expect(parsed.formats["1,2"]).toEqual(original.formats["1,2"]);
    expect(parsed.sort).toEqual(original.sort);
  });

  it("round-trips rich text and inline images", () => {
    const original = model([
      ["", "Fläche"],
      ["Wert", '12 m<sup>2</sup> <img src="https://cdn.example.com/a.png" alt="a" style="width:320px;height:auto;max-width:100%">'],
    ]);
    const parsed = parseSlotMarkup(tableModelToSlotMarkup(original))!;
    expect(parsed.data[1][1]).toContain("<sup>2</sup>");
    expect(parsed.data[1][1]).toContain("https://cdn.example.com/a.png");
  });

  it("picks up translated cell text while structure and formatting survive", () => {
    const original = model([["", "Criterio"], ["Consumo", "Igual"]], {
      merges: [{ row: 0, col: 0, rowSpan: 2, colSpan: 1 }],
      formats: { "1,1": { bold: true, background: "#08fdab" } },
      sort: { col: 1, dir: "asc" },
    });
    const translated = translateTextNodes(tableModelToSlotMarkup(original), {
      Criterio: "Kriterium",
      Consumo: "Verbrauch",
      Igual: "Gleich",
    });

    const parsed = parseSlotMarkup(translated)!;

    expect(parsed.data).toEqual([["", "Kriterium"], ["Verbrauch", "Gleich"]]);
    expect(parsed.merges).toEqual(original.merges);
    expect(parsed.formats["1,1"]).toEqual({ bold: true, background: "#08fdab" });
    expect(parsed.sort).toEqual({ col: 1, dir: "asc" });
  });

  it("skips cells whose coordinates were destroyed instead of failing", () => {
    const markup =
      `<div ${SLOT_ATTRIBUTE}><table>` +
      `<tr><th data-cell=0,0>A</th><th data-cell=broken>B</th></tr>` +
      `</table></div>`;
    const parsed = parseSlotMarkup(markup)!;
    expect(parsed.data).toEqual([["A"]]);
  });
});

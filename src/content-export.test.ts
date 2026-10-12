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

import { encodePayload } from "@shared/payload";
import { cellToMarkdown, exportTable } from "./content-export";

describe("table-widget content export", () => {
  it("registers itself under the element name", () => {
    expect(globalThis.__MAN_CONTENT_EXPORT__?.version).toBe(1);
    expect(globalThis.__MAN_CONTENT_EXPORT__?.exporters["table-widget"]).toBe(exportTable);
  });

  it("exports every row of a b64 model as a Markdown table with title", () => {
    const model = {
      data: [
        ["", "FN", "FM"],
        ["Breite", "2,3 m", "2,5 m"],
        ["Fläche", "4 m<sup>2</sup>", "CO<sub>2</sub> &amp; mehr"],
      ],
      merges: [],
      formats: {},
      sort: null,
      fitImages: true,
      visibleRows: 1,
    };
    const result = exportTable({ tabledata: encodePayload(JSON.stringify(model)), "widget-title": "Maße" });
    expect(result).toEqual({
      markdown: [
        "**Maße**",
        "",
        "|  | FN | FM |",
        "| --- | --- | --- |",
        "| Breite | 2,3 m | 2,5 m |",
        "| Fläche | 4 m² | CO₂ & mehr |",
      ].join("\n"),
      images: [],
    });
  });

  it("reads legacy JSON arrays and escapes pipes", () => {
    expect(exportTable({ tabledata: '[["a|b","c"],["1","2"]]' })?.markdown).toBe(
      "| a\\|b | c |\n| --- | --- |\n| 1 | 2 |",
    );
  });

  it("returns inline images in reading order", () => {
    const images: { src: string; alt?: string }[] = [];
    expect(
      cellToMarkdown('Kabine <img src="/api/media/secure/x.png" alt="FN &quot;schmal&quot;" style="width:80px">', images),
    ).toBe('Kabine ![FN "schmal"](/api/media/secure/x.png)');
    expect(images).toEqual([{ src: "/api/media/secure/x.png", alt: 'FN "schmal"' }]);
  });

  it("has nothing to export without data", () => {
    expect(exportTable({})).toBeNull();
    expect(exportTable({ tabledata: '[["",""]]' })).toBeNull();
  });
});

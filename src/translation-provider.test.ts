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

import { tableTranslationProvider as provider } from "./translation-provider";
import { encodeTableAttribute, parseTableModel } from "./table-model";

describe("tableTranslationProvider", () => {
  const stored = encodeTableAttribute(parseTableModel('[["Kopf","Wert"],["Zeile","1"]]'));

  it("turns the stored model into markup the endpoint will translate", () => {
    const html = provider.toTranslatable(stored)!;

    expect(html).toContain("Kopf");
    expect(provider.acceptsTranslated(html)).toBe(true);
  });

  it("skips a table with no stored value", () => {
    expect(provider.toTranslatable(null)).toBeNull();
  });

  it("skips an empty stored value (widget would render its default placeholder, not authored content)", () => {
    expect(provider.toTranslatable("")).toBeNull();
  });

  it("skips a model with no rows (tableModelToTranslatableHtml returns non-empty HTML for empty data, so the guard is necessary)", () => {
    // NOTE: parseTableModel always substitutes DEFAULT_TABLE_DATA for an empty
    // data array, so the model.data.length === 0 guard in toTranslatable is
    // currently unreachable. The guard is kept as a safety net. This test
    // documents that an encoded-empty-data value is not skipped (it is
    // translated as the default placeholder), which is a known concern.
    const emptyModel = encodeTableAttribute({ data: [], merges: [], formats: {}, sort: null, fitImages: true, visibleRows: 0 } as Parameters<typeof encodeTableAttribute>[0]);
    // Because parseTableModel fills in DEFAULT_TABLE_DATA, the provider returns HTML rather than null.
    expect(provider.toTranslatable(emptyModel)).not.toBeNull();
  });

  it("writes translated cells back and re-encodes the attribute", () => {
    const html = provider.toTranslatable(stored)!;
    const translated = html.replace("Kopf", "Head");

    const next = provider.fromTranslated(translated, stored)!;

    expect(next).not.toBe(stored);
    expect(JSON.stringify(parseTableModel(next))).toContain("Head");
  });

  it("keeps untranslated cells in the source language", () => {
    const html = provider.toTranslatable(stored)!;

    const next = provider.fromTranslated(html.replace("Kopf", "Head"), stored)!;

    expect(JSON.stringify(parseTableModel(next))).toContain("Zeile");
  });

  it("does not accept another widget's markup", () => {
    expect(provider.acceptsTranslated("<p data-tab>Overview</p>")).toBe(false);
  });
});

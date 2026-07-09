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

import { sanitizeRichText, richTextToPlain, hasRichText } from "./rich-text";

describe("sanitizeRichText", () => {
  it("escapes ampersands in plain text", () => {
    expect(sanitizeRichText("Hello & Goodbye")).toBe("Hello &amp; Goodbye");
  });

  it("plain text without markup is returned unchanged", () => {
    expect(sanitizeRichText("279kW(380PS)")).toBe("279kW(380PS)");
  });

  it("keeps sup and sub tags", () => {
    expect(sanitizeRichText("m<sup>2</sup>")).toBe("m<sup>2</sup>");
    expect(sanitizeRichText("H<sub>2</sub>O")).toBe("H<sub>2</sub>O");
  });

  it("keeps <br> line breaks", () => {
    expect(sanitizeRichText("line1<br>line2")).toBe("line1<br>line2");
    expect(sanitizeRichText("line1<br/>line2")).toBe("line1<br>line2");
  });

  it("converts browser-inserted block elements into <br> breaks", () => {
    expect(sanitizeRichText("line1<div>line2</div>")).toBe("line1<br>line2");
    expect(sanitizeRichText("<p>line1</p><p>line2</p>")).toBe("line1<br>line2");
    expect(sanitizeRichText("a<div>b</div><div>c</div>")).toBe("a<br>b<br>c");
  });

  it("strips disallowed tags but keeps their text", () => {
    expect(sanitizeRichText('<script>alert(1)</script>')).toBe("alert(1)");
    expect(sanitizeRichText('<b onclick="x">bold</b>')).toBe("bold");
    expect(sanitizeRichText('<img src=x onerror=alert(1)>')).toBe("");
  });

  it("drops attributes on allowed tags", () => {
    expect(sanitizeRichText('<sup style="x" onclick="y">2</sup>')).toBe("<sup>2</sup>");
  });

  it("returns empty string for nullish input", () => {
    expect(sanitizeRichText(null)).toBe("");
    expect(sanitizeRichText(undefined)).toBe("");
    expect(sanitizeRichText("")).toBe("");
  });
});

describe("richTextToPlain", () => {
  it("strips markup", () => {
    expect(richTextToPlain("m<sup>2</sup>")).toBe("m2");
    expect(richTextToPlain("plain")).toBe("plain");
  });
});

describe("hasRichText", () => {
  it("detects markup", () => {
    expect(hasRichText("m<sup>2</sup>")).toBe(true);
    expect(hasRichText("plain")).toBe(false);
    expect(hasRichText("")).toBe(false);
  });
});

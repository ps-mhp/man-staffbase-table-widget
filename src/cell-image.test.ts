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
  buildImageMarkup,
  clampImageWidth,
  cellHasImage,
  MIN_IMAGE_WIDTH,
  MAX_IMAGE_WIDTH,
} from "./cell-image";

describe("clampImageWidth", () => {
  it("rounds and clamps into the allowed range", () => {
    expect(clampImageWidth(200.4)).toBe(200);
    expect(clampImageWidth(5)).toBe(MIN_IMAGE_WIDTH);
    expect(clampImageWidth(99999)).toBe(MAX_IMAGE_WIDTH);
  });
});

describe("buildImageMarkup", () => {
  it("builds sanitized markup for a safe https src", () => {
    expect(buildImageMarkup({ src: "https://cdn.example.com/a.png" })).toBe(
      '<img src="https://cdn.example.com/a.png" alt="" style="height:auto;max-width:100%">',
    );
  });

  it("includes a clamped width when provided", () => {
    expect(buildImageMarkup({ src: "https://x.com/a.png", width: 320 })).toBe(
      '<img src="https://x.com/a.png" alt="" style="width:320px;height:auto;max-width:100%">',
    );
    expect(buildImageMarkup({ src: "https://x.com/a.png", width: 1 })).toBe(
      `<img src="https://x.com/a.png" alt="" style="width:${MIN_IMAGE_WIDTH}px;height:auto;max-width:100%">`,
    );
  });

  it("escapes alt text", () => {
    expect(buildImageMarkup({ src: "https://x.com/a.png", alt: 'a "b" & c' })).toContain(
      'alt="a &quot;b&quot; &amp; c"',
    );
  });

  it("returns empty string for an unsafe src", () => {
    expect(buildImageMarkup({ src: "javascript:alert(1)" })).toBe("");
    expect(buildImageMarkup({ src: "data:image/png;base64,AAAA" })).toBe("");
  });
});

describe("cellHasImage", () => {
  it("detects an inline image", () => {
    expect(cellHasImage('<img src="https://x.com/a.png">')).toBe(true);
    expect(cellHasImage("just text")).toBe(false);
    expect(cellHasImage("")).toBe(false);
    expect(cellHasImage(null)).toBe(false);
  });
});

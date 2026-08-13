/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
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
  countCellImages,
  equalizedWidths,
  listCellImages,
  setCellImageWidths,
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
      '<img src="https://cdn.example.com/a.png" alt="" style="height:auto">',
    );
  });

  it("includes a clamped width when provided", () => {
    expect(buildImageMarkup({ src: "https://x.com/a.png", width: 320 })).toBe(
      '<img src="https://x.com/a.png" alt="" style="width:320px;height:auto">',
    );
    expect(buildImageMarkup({ src: "https://x.com/a.png", width: 1 })).toBe(
      `<img src="https://x.com/a.png" alt="" style="width:${MIN_IMAGE_WIDTH}px;height:auto">`,
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

describe("countCellImages", () => {
  it("counts the inline images of a cell", () => {
    expect(countCellImages(null)).toBe(0);
    expect(countCellImages("text")).toBe(0);
    expect(countCellImages('a<img src="https://x.com/a.png">b<IMG src="/b.png">')).toBe(2);
  });
});

describe("listCellImages", () => {
  it("lists images in document order with their explicit width", () => {
    const html =
      '<img src="https://x.com/a.png" style="width:120px;height:auto"> Text <img src="/b.png">';
    expect(listCellImages(html)).toEqual([
      { index: 0, src: "https://x.com/a.png", width: 120 },
      { index: 1, src: "/b.png", width: null },
    ]);
  });

  it("falls back to the width attribute and ignores non-pixel widths", () => {
    expect(listCellImages('<img src="/a.png" width="80">')[0].width).toBe(80);
    expect(listCellImages('<img src="/a.png" style="width:50%">')[0].width).toBeNull();
  });

  it("returns nothing for an image-free cell", () => {
    expect(listCellImages("plain")).toEqual([]);
  });
});

describe("setCellImageWidths", () => {
  it("sets each image's width by index and sanitizes the result", () => {
    const html = '<img src="https://x.com/a.png"> x <img src="/b.png" style="width:10px">';
    expect(setCellImageWidths(html, [200, 90])).toBe(
      '<img src="https://x.com/a.png" alt="" style="width:200px;height:auto">' +
        ' x <img src="/b.png" alt="" style="width:90px;height:auto">',
    );
  });

  it("leaves an image untouched when its width is undefined", () => {
    const html = '<img src="/a.png" style="width:33px"><img src="/b.png" style="width:44px">';
    expect(setCellImageWidths(html, [undefined, 44])).toContain("width:33px");
  });

  it("clamps to the allowed range", () => {
    expect(setCellImageWidths('<img src="/a.png">', [1])).toContain(`width:${MIN_IMAGE_WIDTH}px`);
  });

  it("passes an image-free cell through the sanitizer", () => {
    expect(setCellImageWidths("a < b", [200])).toBe("a &lt; b");
  });
});

describe("equalizedWidths", () => {
  const img = (width: number | null, natural: { width: number; height: number } | null) => ({
    width,
    natural,
  });

  it("gives every image the first one's width", () => {
    const widths = equalizedWidths("width", [
      img(300, { width: 600, height: 400 }),
      img(80, { width: 100, height: 500 }),
      img(null, { width: 100, height: 100 }),
    ]);
    expect(widths).toEqual([300, 300, 300]);
  });

  it("derives widths from each aspect ratio so all images share the first's height", () => {
    // Reference: 300px wide at 2:1 -> 150px high. Second image is 1:1, so it
    // needs to be 150px wide to be 150px high.
    const widths = equalizedWidths("height", [
      img(300, { width: 600, height: 300 }),
      img(40, { width: 200, height: 200 }),
      img(null, { width: 400, height: 100 }),
    ]);
    expect(widths).toEqual([300, 150, 600]);
  });

  it("uses the intrinsic width when the reference has no explicit one", () => {
    expect(equalizedWidths("width", [img(null, { width: 250, height: 100 }), img(50, null)])).toEqual([
      250, 250,
    ]);
  });

  it("leaves unmeasurable images alone", () => {
    expect(
      equalizedWidths("height", [img(200, { width: 200, height: 100 }), img(50, null)]),
    ).toEqual([200, undefined]);
  });

  it("changes nothing when the reference itself cannot be measured", () => {
    expect(equalizedWidths("height", [img(200, null), img(50, { width: 10, height: 10 })])).toEqual([
      undefined,
      undefined,
    ]);
    expect(equalizedWidths("width", [img(null, null), img(50, null)])).toEqual([
      undefined,
      undefined,
    ]);
  });

  it("returns nothing for an empty list", () => {
    expect(equalizedWidths("width", [])).toEqual([]);
  });
});

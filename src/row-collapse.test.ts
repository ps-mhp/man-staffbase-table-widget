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
  DEFAULT_VISIBLE_ROWS,
  clampRowSpan,
  clampVisibleRows,
  collapseToggleLabel,
  collapses,
  hiddenRowCount,
  visibleRowOrder,
} from "./row-collapse";

describe("clampVisibleRows", () => {
  it("keeps a usable limit", () => {
    expect(clampVisibleRows(5)).toBe(5);
    expect(clampVisibleRows(1)).toBe(1);
    expect(clampVisibleRows(100)).toBe(100);
  });

  it("keeps zero, which switches collapsing off", () => {
    expect(clampVisibleRows(0)).toBe(0);
  });

  it("truncates a fractional limit", () => {
    expect(clampVisibleRows(5.9)).toBe(5);
  });

  it("falls back to the default for anything unusable", () => {
    for (const value of [undefined, null, "5", -1, NaN, Infinity, {}]) {
      expect(clampVisibleRows(value)).toBe(DEFAULT_VISIBLE_ROWS);
    }
  });
});

describe("collapses", () => {
  it("only collapses when there is something to hide", () => {
    expect(collapses(6, 5)).toBe(true);
    expect(collapses(5, 5)).toBe(false);
    expect(collapses(3, 5)).toBe(false);
  });

  it("never collapses with a limit of zero", () => {
    expect(collapses(500, 0)).toBe(false);
  });
});

describe("visibleRowOrder", () => {
  const order = [0, 1, 2, 3, 4, 5, 6];

  it("cuts to the limit while collapsed", () => {
    expect(visibleRowOrder(order, 5, false)).toEqual([0, 1, 2, 3, 4]);
  });

  it("returns everything once expanded", () => {
    expect(visibleRowOrder(order, 5, true)).toEqual(order);
  });

  it("returns everything when the limit hides nothing", () => {
    expect(visibleRowOrder([0, 1], 5, false)).toEqual([0, 1]);
    expect(visibleRowOrder(order, 0, false)).toEqual(order);
  });

  it("cuts the sorted order, not the raw rows", () => {
    // Sorting a collapsed table has to reveal the rows sorting moved up.
    expect(visibleRowOrder([6, 5, 4, 3, 2, 1, 0], 3, false)).toEqual([6, 5, 4]);
  });

  it("copies rather than aliasing its input", () => {
    const input = [0, 1];
    expect(visibleRowOrder(input, 5, false)).not.toBe(input);
  });
});

describe("hiddenRowCount", () => {
  it("counts the rows behind the button", () => {
    expect(hiddenRowCount(17, 5)).toBe(12);
    expect(hiddenRowCount(6, 5)).toBe(1);
  });

  it("is zero when nothing is hidden", () => {
    expect(hiddenRowCount(5, 5)).toBe(0);
    expect(hiddenRowCount(500, 0)).toBe(0);
  });
});

describe("collapseToggleLabel", () => {
  it("names how many rows follow", () => {
    expect(collapseToggleLabel(12, false)).toBe("Weitere 12 Zeilen einblenden");
  });

  it("uses the singular for a single row", () => {
    expect(collapseToggleLabel(1, false)).toBe("Weitere Zeile einblenden");
  });

  it("offers the way back once expanded", () => {
    expect(collapseToggleLabel(12, true)).toBe("Weniger Zeilen anzeigen");
  });
});

describe("clampRowSpan", () => {
  it("leaves a span that fits", () => {
    expect(clampRowSpan(2, 0, 5)).toBe(2);
    expect(clampRowSpan(3, 2, 5)).toBe(3);
  });

  it("shortens a span that would reach past the cut", () => {
    expect(clampRowSpan(3, 4, 5)).toBe(1);
    expect(clampRowSpan(4, 3, 5)).toBe(2);
  });

  it("never drops below a single row", () => {
    expect(clampRowSpan(3, 5, 5)).toBe(1);
  });
});

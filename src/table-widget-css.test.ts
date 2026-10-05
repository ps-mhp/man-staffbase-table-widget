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

import css from "./styles/table-widget.scss";

/** The declarations of the first rule whose selector list is exactly `selector`. */
const rule = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  return match === null ? "" : match[1];
};

/** The declarations of every rule whose selector list contains `selector`. */
const declarationsFor = (selector: string): string =>
  Array.from(css.matchAll(/([^{}]+)\{([^}]*)\}/g))
    .filter(([, selectors]) => selectors.split(",").some((part) => part.trim() === selector))
    .map(([, , declarations]) => declarations)
    .join("\n");

// The Content Designer's typography base styles every `th` with
// `[data-c13y-region="root"] th { text-transform: none; font-family: head }`,
// specificity (0,1,1), the face with `!important`. A single class (0,1,0)
// loses to it: row titles in the condensed head face — seen on 29.09.2026,
// while the classic editor showed the table as designed. Since Craft the
// header row is set in the body face too (like Craft's table header), so both
// need the override.
describe("table stylesheet against the Content Designer's th rule", () => {
  // The designer sets the th face with `!important`, which only another
  // `!important` overrides.
  it.each([".table-widget .table-widget__cell--head", ".table-widget .table-widget__cell--rowhead"])(
    "keeps %s in the body face",
    (selector) => {
      expect(declarationsFor(selector)).toMatch(
        /font-family:\s*var\(--man-font-body, "?Man Europe"?, Arial, sans-serif\)\s*!important/,
      );
    },
  );
});

// Craft (the MAN Design System), see man-theme `docs/CRAFT-MIGRATION.md` E4
// and `analysis/craft/foundations-and-display.md` §2.17 (table header: Man
// Europe Bold 16px, mixed case).
describe("table stylesheet after Craft", () => {
  it("sets no capitals, no tracking and no retired font names", () => {
    expect(css).not.toMatch(/uppercase/i);
    expect(css).not.toMatch(/MANEurope/);
    const tracking = css.match(/letter-spacing:[^;]*/g) ?? [];
    expect(tracking.filter((declaration) => !/:\s*normal\b/.test(declaration))).toEqual([]);
  });

  it("sets the body cells like Craft's table cells: Regular 16px, 20px sides, hairline", () => {
    const cell = rule(".table-widget__cell");
    expect(cell).toMatch(/font-size:\s*16px/);
    expect(cell).toMatch(/font-weight:\s*400/);
    expect(cell).toMatch(/font-family:\s*var\(--man-font-body, "?Man Europe"?, Arial, sans-serif\)/);
    expect(cell).toMatch(/text-transform:\s*none/);
    expect(cell).toMatch(/color:\s*var\(--man-text, #303c49\)/);
    // 12px above and below around a 24px line make Craft's 48px row.
    expect(cell).toMatch(/padding:\s*var\(--man-space-3, 12px\) 20px/);
    expect(cell).toMatch(/border-bottom:\s*var\(--man-border-width, 1px\) solid var\(--man-border, #cbd3dc\)/);
  });

  it("sets the header row like Craft's table header: grey band, #161616, bold 16px, light 2px rule", () => {
    const head = rule(".table-widget__cell--head");
    expect(head).toMatch(/background:\s*var\(--man-surface-sunken, #f8f8f8\)/);
    expect(head).toMatch(/color:\s*#161616/);
    expect(head).toMatch(/font-weight:\s*var\(--man-weight-body-bold, 700\)/);
    expect(head).toMatch(
      /border-bottom:\s*var\(--man-border-width-strong, 2px\) solid var\(--man-border, #cbd3dc\)/,
    );
    expect(head).not.toMatch(/border-strong/);
    // Size, face and padding come from the cell rule it shares.
    expect(head).not.toMatch(/font-size|padding/);
  });

  it("marks the sortable header on hover like Craft, but draws no row hover", () => {
    expect(css).toMatch(
      /@media \(hover: hover\)\s*\{\s*\.table-widget__cell--head:hover\s*\{\s*background:\s*var\(--man-border, #cbd3dc\);\s*\}/,
    );
    expect(css).not.toMatch(/tr:hover|tbody[^{]*:hover|__cell:hover|__cell--rowhead:hover/);
  });

  it("keeps the old 16px sides on narrow screens, so a table gets no wider there", () => {
    expect(css).toMatch(
      /@media \(max-width: 767px\)\s*\{\s*\.table-widget__cell\s*\{\s*padding-inline:\s*var\(--man-space-4, 16px\);\s*\}/,
    );
  });

  it("sets the row titles bold at 700, not the retired 600", () => {
    expect(rule(".table-widget__cell--rowhead")).toMatch(/font-weight:\s*var\(--man-weight-body-bold, 700\)/);
    expect(css).not.toMatch(/font-weight:\s*(300|500|600)\b/);
  });

  it("draws the rows toggle as a Craft button with a real focus ring", () => {
    expect(rule(".table-widget__toggle")).toMatch(/height:\s*32px\s*!important/);
    expect(rule(".table-widget__toggle:focus-visible")).toMatch(
      /outline:\s*var\(--man-focus-width, 2px\) solid var\(--man-focus-color, #3875b2\)\s*!important/,
    );
  });
});

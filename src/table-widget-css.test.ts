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

// The Content Designer's typography base styles every `th` with
// `[data-c13y-region="root"] th { text-transform: none; font-family: head }`,
// specificity (0,1,1). A single class (0,1,0) loses to it: header row in mixed
// case, row titles in the condensed head face — seen on 29.09.2026, while the
// classic editor showed the table as designed.
describe("table stylesheet against the Content Designer's th rule", () => {
  it("keeps the header row uppercase with more than one class of weight", () => {
    expect(rule(".table-widget .table-widget__cell--head")).toMatch(/text-transform:\s*uppercase/);
  });

  // The designer sets the th face with `!important`, which only another
  // `!important` overrides.
  it("keeps the row titles in the body face", () => {
    expect(rule(".table-widget .table-widget__cell--rowhead")).toMatch(/font-family:[^;]*MANEurope Light[^;]*!important/);
  });
});

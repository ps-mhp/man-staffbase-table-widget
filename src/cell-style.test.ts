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

import { formatToStyle } from "./cell-style";

describe("formatToStyle", () => {
  it("lässt Icons im Text Fett und Kursiv folgen", () => {
    expect(formatToStyle({ bold: true, italic: true, strikethrough: true })).toEqual({
      fontWeight: "bold",
      fontStyle: "italic",
      textDecoration: "line-through",
      "--man-icon-transform": "skewX(-12deg)",
      "--man-icon-filter": "drop-shadow(0.035em 0 0 currentColor) drop-shadow(-0.035em 0 0 currentColor)",
    });
  });

  it("setzt ohne Format nichts", () => {
    expect(formatToStyle({})).toEqual({});
  });
});

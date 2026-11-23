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

import { cellToPlain } from "./cell-text";

describe("cellToPlain", () => {
  it("turns sup/sub into unicode and decodes entities", () => {
    expect(cellToPlain("m<sup>2</sup> &amp; H<sub>2</sub>O")).toBe("m² & H₂O");
  });

  it("replaces an image by its alt text and drops one without", () => {
    expect(cellToPlain('Logo <img src="a.png" alt="MAN"> <img src="b.png">')).toBe("Logo MAN");
  });

  it("schreibt ein Element als seine Bedeutung, ohne Bedeutung als ■", () => {
    const diesel = '<span data-man-el="kasten" style="color:#e40045" role="img" aria-label="Diesel" contenteditable="false"></span>';
    const blank = '<span data-man-el="kasten" data-man-unlabeled="" style="color:#3875b2" role="img" aria-label="Kasten" contenteditable="false"></span>';
    expect(cellToPlain(`(${diesel}/${blank}) = eingeschränkt`)).toBe("(Diesel/■) = eingeschränkt");
  });

  it("lässt unbekannte Elemente weg", () => {
    expect(cellToPlain('a<span data-man-el="nope" aria-label="X"></span>b')).toBe("ab");
  });
});

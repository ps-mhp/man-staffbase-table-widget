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
  hasLowercaseMark,
  markLowercase,
  markedFlags,
  selectionOffsets,
  stripLowercaseMarks,
  unmarkLowercase,
} from "./lowercase-mark";
import { LOWERCASE_CLASS } from "./rich-text";
import lowercaseMarkCss from "./styles/lowercase-mark.scss";

describe("lowercase-mark.scss", () => {
  it("styles the class the marker actually writes", () => {
    // Das Stylesheet kann die Klasse nicht importieren; dieser Test hält beide
    // Seiten deckungsgleich, falls sie umbenannt wird.
    expect(lowercaseMarkCss).toContain(`.${LOWERCASE_CLASS}`);
  });

  it("only paints inside the editor", () => {
    // Im veröffentlichten Widget trägt der Text nur die Klasse; gezeichnet wird
    // dort nichts.
    expect(lowercaseMarkCss).toContain(".table-editor ");
  });
});

describe("markLowercase", () => {
  it("wraps the requested character range", () => {
    expect(markLowercase("Hallo Welt", 6, 10)).toBe('Hallo <span class="text-lowercase">Welt</span>');
  });

  it("wraps the whole cell when given its full range", () => {
    expect(markLowercase("Hallo", 0, 5)).toBe('<span class="text-lowercase">Hallo</span>');
  });

  it("does nothing for an empty range", () => {
    expect(markLowercase("Hallo", 2, 2)).toBe("Hallo");
  });

  it("merges with an adjacent existing mark", () => {
    expect(markLowercase('<span class="text-lowercase">Ha</span>llo', 2, 5)).toBe(
      '<span class="text-lowercase">Hallo</span>',
    );
  });

  it("marks across existing sup markup without losing it", () => {
    expect(markLowercase("m<sup>2</sup>x", 0, 3)).toBe(
      '<span class="text-lowercase">m</span><sup class="text-lowercase">2</sup><span class="text-lowercase">x</span>',
    );
  });

  it("keeps images and breaks untouched", () => {
    const html = 'a<br>b<img src="https://x/y.png" alt="" style="height:auto">';
    expect(markLowercase(html, 0, 1)).toBe(
      '<span class="text-lowercase">a</span><br>b<img src="https://x/y.png" alt="" style="height:auto">',
    );
  });

  it("escapes text it re-emits", () => {
    expect(markLowercase("a&amp;b", 0, 3)).toBe('<span class="text-lowercase">a&amp;b</span>');
  });
});

describe("unmarkLowercase", () => {
  it("removes a mark that covers exactly the range", () => {
    expect(unmarkLowercase('<span class="text-lowercase">Hallo</span>', 0, 5)).toBe("Hallo");
  });

  it("keeps the part of a mark outside the range", () => {
    expect(unmarkLowercase('<span class="text-lowercase">Hallo</span>', 0, 2)).toBe(
      'Ha<span class="text-lowercase">llo</span>',
    );
  });

  it("takes the class off sup without dropping the tag", () => {
    expect(unmarkLowercase('m<sup class="text-lowercase">2</sup>', 1, 2)).toBe("m<sup>2</sup>");
  });
});

describe("hasLowercaseMark", () => {
  it("is true only when every character in the range is marked", () => {
    const html = 'Ha<span class="text-lowercase">llo</span>';
    expect(hasLowercaseMark(html, 2, 5)).toBe(true);
    expect(hasLowercaseMark(html, 3, 4)).toBe(true);
    expect(hasLowercaseMark(html, 1, 5)).toBe(false);
  });

  it("is false for an empty range", () => {
    expect(hasLowercaseMark('<span class="text-lowercase">a</span>', 1, 1)).toBe(false);
  });
});

describe("markedFlags", () => {
  it("reports one flag per plain-text character", () => {
    expect(markedFlags('a<span class="text-lowercase">bc</span>')).toEqual([false, true, true]);
  });
});

describe("stripLowercaseMarks", () => {
  it("unwraps marked spans and unmarks sup", () => {
    expect(stripLowercaseMarks('<span class="text-lowercase">a</span><sup class="text-lowercase">b</sup>')).toBe(
      "a<sup>b</sup>",
    );
  });
});

describe("selectionOffsets", () => {
  it("reads the selected range as plain-text offsets", () => {
    const root = document.createElement("div");
    root.innerHTML = "Hallo <sup>Welt</sup>";
    document.body.appendChild(root);

    const range = document.createRange();
    range.setStart(root.firstChild as Text, 2);
    range.setEnd(root.lastChild?.firstChild as Text, 2);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(selectionOffsets(root)).toEqual({ from: 2, to: 8 });
    root.remove();
  });

  it("returns null when the selection is outside the element", () => {
    const root = document.createElement("div");
    root.textContent = "abc";
    document.body.appendChild(root);
    window.getSelection()?.removeAllRanges();
    expect(selectionOffsets(root)).toBeNull();
    root.remove();
  });
});

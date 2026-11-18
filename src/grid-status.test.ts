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

import { gridHint, gridStatusText } from "./grid-status";

describe("gridStatusText", () => {
  it("nennt Zeilen und Spalten, ohne Markierung nichts weiter", () => {
    expect(gridStatusText(6, 4, [])).toBe("6 Zeilen · 4 Spalten");
    expect(gridStatusText(1, 1, [])).toBe("1 Zeile · 1 Spalte");
  });

  it("nennt die Markierung wie Excel, mehrere Bereiche in ihrer Reihenfolge", () => {
    expect(gridStatusText(6, 4, [{ top: 1, left: 1, bottom: 3, right: 1 }])).toBe("6 Zeilen · 4 Spalten · Auswahl B2:B4");
    expect(
      gridStatusText(6, 4, [
        { top: 1, left: 1, bottom: 1, right: 1 },
        { top: 0, left: 3, bottom: 5, right: 3 },
      ]),
    ).toBe("6 Zeilen · 4 Spalten · Auswahl B2, D1:D6");
  });
});

describe("gridHint", () => {
  it("passt den Hinweis an die Lage an", () => {
    expect(gridHint({ editing: false, painterActive: false })).toMatch(/^Zeile 1 und Spalte A sind Überschriften/);
    expect(gridHint({ editing: false, painterActive: true })).toBe("Format-Pinsel: Zielzellen markieren");
    expect(gridHint({ editing: true, painterActive: true })).toBe("Esc beendet die Eingabe");
  });
});

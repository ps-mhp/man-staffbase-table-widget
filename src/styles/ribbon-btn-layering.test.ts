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

import css from "./ribbon.scss";

// `RibbonButton` (`../toolbar/controls.tsx`) rendert seit der Umstellung auf
// die Primitive `Button` Knöpfe, die *gleichzeitig* `.tw-rb__btn` (dieses
// Stylesheet, statisch gebündelt) und `man-ed-button`/`--ghost`
// (Redaktionsebene, asynchron nachgeladen) tragen. Ohne die Sperre unten
// stritten zwei gleich-spezifische Regelsätze um dieselben Eigenschaften
// (Fläche, Rahmen, Fokusring, Deckkraft im disabled-Zustand) — wer gewinnt,
// hinge nur an der zufälligen Ladereihenfolge der beiden Stylesheets.
describe("ribbon.scss: .tw-rb__btn layering vs. man-ed-button", () => {
  // Der unbewachte Grundblock trägt nur noch den Rasterplatz (Breite,
  // Abstände, Cursor, Typografie, Übergänge) — der matcht exakt einmal, weil
  // Selektoren wie `.tw-rb__btn--active` oder `.tw-rb__btn:not(...)` nach
  // "btn" nicht sofort eine `{` haben.
  const unguardedBlock = css.match(/\.tw-rb__btn\s*\{([^}]*)\}/);

  it("finds the unguarded grid-placement rule at all", () => {
    expect(unguardedBlock).not.toBeNull();
  });

  it("keeps grid-placement declarations for both kinds of buttons", () => {
    const body = unguardedBlock![1];
    expect(body).toMatch(/min-width/);
    expect(body).toMatch(/padding/);
    expect(body).toMatch(/gap/);
  });

  it("does not let the unguarded rule paint a surface, border, focus ring or disabled opacity", () => {
    // Genau diese vier Eigenschaften kollidieren mit der Ghost-Variante der
    // Primitive. Geprüft wird gezielt der Deklarationsanfang (`name:`), damit
    // `transition: background …` (eine Eigenschafts-Liste, keine Kollision)
    // die Zusicherung nicht fälschlich scheitern lässt.
    const body = unguardedBlock![1];
    expect(body).not.toMatch(/(^|\s)background\s*:/);
    expect(body).not.toMatch(/(^|\s)border(-color)?\s*:/);
    expect(body).not.toMatch(/(^|\s)box-shadow\s*:/);
    expect(body).not.toMatch(/(^|\s)opacity\s*:/);
  });

  it("scopes the surface/border/focus/disabled appearance to buttons without the layer's class", () => {
    // Genau diese Selektor-Sperre hält die Optik von `man-ed-button`-Knöpfen
    // fern, ohne die Klasse `.tw-rb__btn` zu entfernen — die brauchen die
    // beiden rohen Knöpfe in `tab-images.tsx` weiterhin unverändert.
    expect(css).toContain(".tw-rb__btn:not(.man-ed-button)");
  });

  it("still paints the active state for buttons carrying man-ed-button", () => {
    // `--active` markiert einen Editor-Zustand (z. B. „Fett" aktiv), den die
    // Primitive selbst nicht kennt — der muss unabhängig von `man-ed-button`
    // weitergelten, sonst verschwindet die Zustandsanzeige der Ribbon-Knöpfe.
    expect(css).toMatch(/\.tw-rb__btn--active\s*,/);
  });
});

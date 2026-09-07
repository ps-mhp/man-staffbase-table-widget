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
// (Redaktionsebene, asynchron nachgeladen) tragen. Der Grundblock (Breite,
// Rasterplatz) muss deshalb für Knöpfe *ohne* `man-ed-button` gelten, ohne in
// die Optik (Fläche, Rahmen, Fokusring, Deckkraft im disabled-Zustand)
// hineinzuregieren, die dort allein die Ghost-Variante der Primitive
// zeichnet.
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

  // Der frühere Test hier ("gives the active-state rule higher specificity…")
  // prüfte den Doppelklassen-Stich `.tw-rb__btn.tw-rb__btn--active`, der die
  // Spezifität absichtlich über die von `.man-ed-button--ghost` hob, weil
  // beide Regelsätze dieselben drei Eigenschaften (Fläche, Rahmen, Text) am
  // selben Element setzten und die Ladereihenfolge der beiden Stylesheets
  // zufällig war (siehe Bericht Aufgabe 12, Bündel C, Befund C1). Seit
  // `button.scss` den gedrückten Zustand selbst über `[aria-pressed="true"]`
  // zeichnet, setzt **nur noch eine Seite** diese Eigenschaften — der Stich
  // in `ribbon.scss` ist entfallen, der Test damit gegenstandslos: gemessen,
  // nicht angenommen (`npx jest` lief nach dem Entfernen des Stichs rot
  // gegen genau diesen Test, siehe Bericht).
});

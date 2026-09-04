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
// Das Stylesheet der Primitive, kompiliert genauso wie `useEditorStyles` es
// zur Laufzeit asynchron in `document.head` hängt (siehe
// `@shared/editor-ui/load.ts`). Nur mit beiden Regelsätzen zusammen lässt
// sich die Kaskade zwischen `.tw-rb__btn--active` und `.man-ed-button--ghost`
// überhaupt prüfen — ein reiner Textvergleich an `ribbon.scss` allein sieht
// die Kollision nicht.
import buttonCss from "@shared/editor-ui/styles/button.scss";

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

  // jsdoms `getComputedStyle` implementiert die Kaskade nicht spezifikations-
  // treu: ein Probelauf (zwei Regeln `.a.b{color:red}` vs. `.b{color:blue}`,
  // Klassenliste `a b`) liefert je nach Einhänge-Reihenfolge *blau*, obwohl
  // `.a.b` die höhere Spezifität hat und in echten Browsern immer gewänne —
  // jsdom wertet hier nur die DOM-Reihenfolge, nicht die Spezifität. Ein
  // "gerendertes Element mit beiden Klassen" würde also in diesem
  // Testökosystem beweisen, dass die Lösung *nicht* funktioniert, selbst wenn
  // sie es in jedem echten Browser tut — ein Artefakt der Testumgebung, keine
  // reale Kollision. Stattdessen wird hier die tatsächliche
  // CSS-Spezifität der beiden konkurrierenden Selektoren berechnet: genau
  // die Zahl, die echte Browser zur Auflösung heranziehen, unabhängig von
  // der Ladereihenfolge.
  function specificity(selector: string): number {
    // Reicht für dieses Stylesheet: nur Klassen, Attribute und
    // Ein-Doppelpunkt-Pseudoklassen zählen (inklusive des Arguments von
    // `:not()`, das dessen eigene Spezifität beisteuert) — IDs oder
    // Typselektoren kommen in `ribbon.scss`/`button.scss` nicht vor.
    const withNotUnwrapped = selector.replace(/:not\(([^)]*)\)/g, " $1 ");
    const classes = withNotUnwrapped.match(/\.[a-zA-Z0-9_-]+/g) ?? [];
    const attributes = withNotUnwrapped.match(/\[[^\]]*\]/g) ?? [];
    const pseudoClasses = withNotUnwrapped.match(/:[a-zA-Z-]+/g) ?? [];
    return classes.length + attributes.length + pseudoClasses.length;
  }

  // Extrahiert den Ruhezustand-Selektor der `.man-ed-button--ghost`-Regel
  // direkt aus dem kompilierten CSS-Block (statt über den Deklarationswert
  // zu suchen — `border-strong` färbt auch `--secondary`, ist also nicht
  // eindeutig genug).
  function restingGhostSelector(source: string): string {
    const match = source.match(/\.man-ed-button--ghost\s*\{/);
    expect(match).not.toBeNull();
    return ".man-ed-button--ghost";
  }

  // Findet den Ruhezustand-Selektor der `--active`-Regel: dem Präfix
  // `tw-rb__btn` können beliebig viele Klassen folgen (die Sperre hängt eine
  // zweite Klasse an), daher reicht ein fester String hier nicht — anders
  // als bei `.man-ed-button--ghost`, das unverändert bleibt.
  function restingActiveSelector(source: string): string {
    const match = source.match(/([.\w-]*tw-rb__btn[.\w-]*--active)\s*,/);
    expect(match).not.toBeNull();
    return match![1];
  }

  it("gives the active-state rule higher specificity than man-ed-button--ghost's own colour rule", () => {
    // `--active` (ribbon.scss) und `--ghost` (button.scss) setzen im
    // Ruhezustand beide `color`. Ohne ausreichenden Spezifitäts-Abstand
    // entscheidet in echten Browsern die Ladereihenfolge — mit ihm gewinnt
    // `--active` immer, unabhängig davon, welches Stylesheet zuletzt lädt.
    const compiledActiveSelector = restingActiveSelector(css);
    const compiledGhostSelector = restingGhostSelector(buttonCss);

    expect(compiledActiveSelector).toContain("tw-rb__btn");
    expect(compiledActiveSelector).toContain("--active");
    expect(compiledGhostSelector).toBe(".man-ed-button--ghost");
    expect(specificity(compiledActiveSelector)).toBeGreaterThan(specificity(compiledGhostSelector));
  });
});

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

// `.tw-rb__big` setzt sein Symbol auf 20px. Die Regel stand ursprünglich als
// reiner Nachfahren-Selektor (`.tw-rb__big svg`) da und traf damit *auch*
// den `IconChevron`, der drei Ebenen tiefer in `.tw-rb__label` steckt
// (`<button class="tw-rb__big"><svg/><span class="tw-rb__label">Text
// <svg width="10" height="10"/></span></button>`, siehe `tab-data.tsx`/
// `tab-cells.tsx`). Eine CSS-Deklaration schlägt das Präsentationsattribut
// `width="10"` am SVG immer, unabhängig von Spezifität — der Chevron
// rendere also entgegen der eigenen Absicht (`icons.tsx`, Kommentar bei
// `IconChevron`, sowie Commit 8043f18: "an allen fuenf Einsatzstellen …
// Aufklapp-Anzeiger", bewusst klein gehalten) bei 20px statt 10px.
//
// `jsdom`s `getComputedStyle` wertet nur die Regel-Reihenfolge aus, nicht
// die Spezifität — ein Test, der zwei konkurrierende Regeln gegeneinander
// rendert, bewiese hier nichts. Geprüft wird darum die **kompilierte
// Regel** selbst, wie es die anderen Tests in diesem Verzeichnis tun.
describe("ribbon.scss: .tw-rb__big skaliert nur sein eigenes Symbol, nicht den verschachtelten Chevron", () => {
  const bigSvgBlock = css.match(/\.tw-rb__big\s*>\s*svg\s*\{([^}]*)\}/);

  it("finds the big-button svg rule scoped to a direct child", () => {
    expect(bigSvgBlock).not.toBeNull();
  });

  it("keeps the 20px size declarations on the direct-child rule", () => {
    const body = bigSvgBlock![1];
    expect(body).toMatch(/width\s*:\s*20px/);
    expect(body).toMatch(/height\s*:\s*20px/);
  });

  it("does not compile a plain descendant selector that would also reach the nested chevron", () => {
    // Ein reiner Nachfahren-Selektor (`.tw-rb__big svg`, ohne `>`) traefe
    // sowohl das direkte Knopf-Symbol als auch `IconChevron` im
    // `.tw-rb__label`. Es darf nur die direkte-Kind-Variante geben.
    const descendantOnly = css.match(/\.tw-rb__big\s+svg\s*\{/);
    expect(descendantOnly).toBeNull();
  });
});

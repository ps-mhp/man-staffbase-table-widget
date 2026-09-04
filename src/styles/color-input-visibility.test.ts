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

// `.tw-rb__color-input` versteckt das native `<input type="color">`
// (`../toolbar/controls.tsx`, `ColorButton`) absichtlich **nicht** mit
// `display: none`: in manchen Browsern nimmt `display: none` dem darunter
// liegenden nativen Farbdialog die Möglichkeit, sich überhaupt zu öffnen —
// ein per Skript ausgelöster Klick auf ein unsichtbares, aber `display`-
// entferntes Element bliebe wirkungslos. Stattdessen bleibt das Feld im
// Layout (`position: absolute`, `width`/`height: 1px`) und wird nur über
// `opacity: 0` und `pointer-events: none` unsichtbar bzw. unklickbar
// gemacht. Siehe der Kommentar an der Regel selbst in `ribbon.scss`.
describe("ribbon.scss: der native Farbwähler bleibt bedienbar", () => {
  const block = css.match(/\.tw-rb__color-input\s*\{([^}]*)\}/);

  it("findet die Regel für das native Farbfeld", () => {
    expect(block).not.toBeNull();
  });

  it("versteckt das Farbfeld nicht mit display:none", () => {
    const body = block![1];
    expect(body).not.toMatch(/display\s*:\s*none/);
  });
});

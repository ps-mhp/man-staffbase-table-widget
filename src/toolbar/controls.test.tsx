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

import * as React from "react";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";

import buttonCss from "@shared/editor-ui/styles/button.scss";
import ribbonCss from "../styles/ribbon.scss";
import { RibbonButton } from "./controls";

describe("RibbonButton", () => {
  it("marks an active toggle as pressed", () => {
    render(
      <RibbonButton testId="t" title="Fett" active onClick={jest.fn()}>
        B
      </RibbonButton>,
    );
    expect(screen.getByTestId("t")).toHaveAttribute("aria-pressed", "true");
  });

  it("marks an inactive toggle as not pressed", () => {
    render(
      <RibbonButton testId="t" title="Fett" active={false} onClick={jest.fn()}>
        B
      </RibbonButton>,
    );
    expect(screen.getByTestId("t")).toHaveAttribute("aria-pressed", "false");
  });

  // Ein einfacher Auslöser (kein `active`-Prop) ist kein Umschalter — das
  // Attribut muss ganz fehlen statt fälschlich "false" anzukündigen.
  it("omits aria-pressed for a plain trigger", () => {
    render(
      <RibbonButton testId="t" title="Hochstellen" onClick={jest.fn()}>
        x
      </RibbonButton>,
    );
    expect(screen.getByTestId("t")).not.toHaveAttribute("aria-pressed");
  });

  // Ein Klick auf einen Ribbon-Knopf darf der gerade bearbeiteten Zelle nicht
  // den Fokus (und damit die Textauswahl) nehmen — sonst formatiert "Fett"
  // ins Leere. Siehe Kommentar bei `onMouseDown` in controls.tsx.
  it("prevents the default mousedown so the editing cell keeps its selection", () => {
    render(
      <RibbonButton testId="t" title="Fett" onClick={jest.fn()}>
        B
      </RibbonButton>,
    );
    const event = createEvent.mouseDown(screen.getByTestId("t"));
    fireEvent(screen.getByTestId("t"), event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("keeps both title and aria-label set for the tooltip and the accessible name", () => {
    render(
      <RibbonButton testId="t" title="Fett" onClick={jest.fn()}>
        B
      </RibbonButton>,
    );
    const button = screen.getByTestId("t");
    expect(button).toHaveAttribute("title", "Fett");
    expect(button).toHaveAttribute("aria-label", "Fett");
  });
});

// Befund C1 (Aufgabe 12, Bündel C), Nacharbeit: `ribbon.scss` stach früher
// mit einem Doppelklassen-Selektor (`.tw-rb__btn.tw-rb__btn--active`) gegen
// die Ebene, weil beide Regelsätze dieselben drei Eigenschaften am selben
// Element setzten und die Ladereihenfolge der beiden Stylesheets zufällig
// war (`ribbon.scss` lokal als `<style>`-Block, `button.scss` asynchron in
// `document.head`, siehe `useEditorStyles`). Seit `button.scss` den
// gedrückten Zustand selbst über `[aria-pressed="true"]` zeichnet, ist der
// Stich entfallen (siehe `ribbon.scss`, Kommentar an der ehemaligen
// `--active`-Regel). Dieser Test misst, dass der aktive Zustand danach
// *wirklich* noch sichtbar ist — und zwar unabhängig davon, welches der
// beiden Stylesheets zuerst im `document.head`/`<style>`-Block landet: ohne
// den Stich gibt es keine zweite Regel mehr, die um dieselben Eigenschaften
// konkurriert, also darf die Reihenfolge keinen Unterschied mehr machen.
describe("RibbonButton: active state stays visible without the specificity stitch", () => {
  const ACCENT_SURFACE = "var(--man-editor-accent-surface, #fde7ee)";
  const PRIMARY = "var(--man-editor-primary, #e40045)";

  function renderActiveButton(loadOrder: "ribbon-first" | "button-first"): HTMLElement {
    const first = document.createElement("style");
    const second = document.createElement("style");
    if (loadOrder === "ribbon-first") {
      first.textContent = ribbonCss;
      second.textContent = buttonCss;
    } else {
      first.textContent = buttonCss;
      second.textContent = ribbonCss;
    }
    document.head.appendChild(first);
    document.head.appendChild(second);

    render(
      <RibbonButton testId="t" title="Fett" active onClick={jest.fn()}>
        B
      </RibbonButton>,
    );
    return screen.getByTestId("t");
  }

  afterEach(() => {
    document.head.querySelectorAll("style").forEach((el) => el.remove());
  });

  it("paints the accent surface/text when ribbon.scss loads before button.scss", () => {
    const button = renderActiveButton("ribbon-first");
    const computed = getComputedStyle(button);
    expect(computed.backgroundColor).toBe(ACCENT_SURFACE);
    expect(computed.color).toBe(PRIMARY);
  });

  it("paints the accent surface/text when button.scss loads before ribbon.scss (the reversed, once-random order)", () => {
    const button = renderActiveButton("button-first");
    const computed = getComputedStyle(button);
    expect(computed.backgroundColor).toBe(ACCENT_SURFACE);
    expect(computed.color).toBe(PRIMARY);
  });
});

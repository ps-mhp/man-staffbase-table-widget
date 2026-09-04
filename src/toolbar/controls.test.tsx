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

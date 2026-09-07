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
import { render, screen } from "@testing-library/react";

import ribbonCss from "../styles/ribbon.scss";
import { DataTab, DataTabProps } from "./tab-data";

// Aufgabe 13a: Der Knopf "Format kopieren" zeigte seinen aktiven Zustand
// bisher nur über eine inline gesetzte Staffbase-blaue Farbe an — der
// Hilfstechnik meldete er nichts. Diese Tests belegen den Wechsel auf
// `aria-pressed` (den Weg, den `RibbonButton` bereits für "Fett" & Co. geht)
// und dass am gerenderten Knopf keine Staffbase-blaue Farbe mehr steht,
// sondern die MAN-Akzentfarbe aus `ribbon.scss`.
function baseProps(overrides: Partial<DataTabProps>): DataTabProps {
  return {
    hasSelection: true,
    painterActive: false,
    onSortAsc: jest.fn(),
    onSortDesc: jest.fn(),
    onClearSort: jest.fn(),
    onCopyFormat: jest.fn(),
    onUpload: jest.fn(),
    visibleRows: 0,
    onChangeVisibleRows: jest.fn(),
    onClearFormatting: jest.fn(),
    hasClearTarget: false,
    ...overrides,
  };
}

describe("DataTab: painter button reports its active state to assistive technology", () => {
  beforeEach(() => {
    const style = document.createElement("style");
    style.textContent = ribbonCss;
    document.head.appendChild(style);
  });

  afterEach(() => {
    document.head.querySelectorAll("style").forEach((el) => el.remove());
  });

  it("sets aria-pressed=false while the painter is idle", () => {
    render(<DataTab {...baseProps({ painterActive: false })} />);
    expect(screen.getByTestId("toolbar-painter")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("sets aria-pressed=true while the painter is armed", () => {
    render(<DataTab {...baseProps({ painterActive: true })} />);
    expect(screen.getByTestId("toolbar-painter")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("paints the MAN accent, not Staffbase blue, once armed", () => {
    render(<DataTab {...baseProps({ painterActive: true })} />);
    const computed = getComputedStyle(screen.getByTestId("toolbar-painter"));
    // "var(--man-editor-…, …)": jsdom löst die Referenz nicht auf, hält aber
    // den vollen Wert inklusive Fallback fest — genau das reicht, um
    // Staffbase-Blau (`#0a63b0`) auszuschließen und die MAN-Akzentfarbe
    // (`primary`, `#e40045`) zu belegen.
    //
    // Grenze dieses Tests (bereits an mehreren Stellen im Projekt
    // festgehalten, siehe `button.scss:23`): jsdoms `getComputedStyle` wertet
    // die **Reihenfolge** der Regeln im Stylesheet aus, nicht ihre
    // Spezifität. Hier gewinnt `[aria-pressed="true"]` nur, weil es als
    // einziger Regelsatz überhaupt `color` an diesem Element setzt — es gibt
    // keine konkurrierende Regel gleicher Spezifität, gegen die jsdom falsch
    // entscheiden könnte. Würde `ribbon.scss` künftig umsortiert oder käme
    // eine zweite, konkurrierende Regel hinzu, bliebe dieser Test grün, auch
    // wenn die Kaskade in einem echten Browser bräche. Er beweist also nur,
    // dass die Regel **greift**, nicht, dass sie sich gegen Konkurrenz
    // **durchsetzt**.
    expect(computed.color).toBe("var(--man-editor-primary, #e40045)");
    expect(computed.color).not.toContain("0a63b0");
  });
});

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
import { fireEvent, render, screen } from "@testing-library/react";

import { RibbonShell } from "./ribbon-shell";

const tabs = [
  { id: "a", label: "Alpha", render: () => <button data-testid="in-alpha">A</button> },
  { id: "b", label: "Beta", render: () => <button data-testid="in-beta">B</button> },
];

// Drei Reiter, damit ein Umlauf ("letzter -> erster") sich nicht mit einem
// gewöhnlichen Einzelschritt verwechseln lässt (bei nur zwei Reitern wären
// beide Fälle dieselbe Taste).
const threeTabs = [
  { id: "a", label: "Alpha", render: () => <button data-testid="in-alpha">A</button> },
  { id: "b", label: "Beta", render: () => <button data-testid="in-beta">B</button> },
  { id: "c", label: "Gamma", render: () => <button data-testid="in-gamma">C</button> },
];

function Harness({
  tabList = tabs,
  onSave,
  onClose,
  dirty,
  onOpenHelp,
}: {
  tabList?: typeof tabs;
  onSave?: () => void;
  onClose?: () => void;
  dirty?: boolean;
  onOpenHelp?: () => void;
}): React.ReactElement {
  const [active, setActive] = React.useState(tabList[0].id);
  return (
    <RibbonShell
      tabs={tabList}
      activeTab={active}
      onSelectTab={setActive}
      onSave={onSave}
      onClose={onClose}
      dirty={dirty}
      onOpenHelp={onOpenHelp}
    />
  );
}

describe("RibbonShell", () => {
  it("shows only the active tab's panel", () => {
    render(<Harness />);
    expect(screen.getByTestId("in-alpha")).toBeInTheDocument();
    expect(screen.queryByTestId("in-beta")).not.toBeInTheDocument();
  });

  it("switches panels when another tab is clicked", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("tab", { name: "Beta" }));
    expect(screen.getByTestId("in-beta")).toBeInTheDocument();
    expect(screen.queryByTestId("in-alpha")).not.toBeInTheDocument();
  });

  it("marks the active tab for assistive technology", () => {
    render(<Harness />);
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveAttribute("aria-selected", "false");
  });

  it("points aria-controls at the panel it describes", () => {
    render(<Harness />);
    const alphaTab = screen.getByRole("tab", { name: "Alpha" });
    const panel = screen.getByTestId("toolbar-panel");
    expect(alphaTab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", alphaTab.id);
  });

  it("moves between tabs with the arrow keys and wraps around", () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "Alpha" }), { key: "ArrowRight" });
    expect(screen.getByTestId("in-beta")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Beta" }), { key: "ArrowRight" });
    expect(screen.getByTestId("in-alpha")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Alpha" }), { key: "ArrowLeft" });
    expect(screen.getByTestId("in-beta")).toBeInTheDocument();
  });

  // Zwei Reiter reichen nicht: dort ist "ein Schritt weiter" dieselbe Taste
  // wie "Umlauf zum ersten". Drei Reiter trennen beide Fälle eindeutig.
  it("wraps from the last tab back to the first with ArrowRight", () => {
    render(<Harness tabList={threeTabs} />);
    // Erst auf den letzten Reiter wechseln, sonst prüft der Pfeil nur den
    // gewöhnlichen Einzelschritt ab dem Startreiter.
    fireEvent.click(screen.getByRole("tab", { name: "Gamma" }));
    fireEvent.keyDown(screen.getByRole("tab", { name: "Gamma" }), { key: "ArrowRight" });
    expect(screen.getByTestId("in-alpha")).toBeInTheDocument();
  });

  it("wraps from the first tab back to the last with ArrowLeft", () => {
    render(<Harness tabList={threeTabs} />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "Alpha" }), { key: "ArrowLeft" });
    expect(screen.getByTestId("in-gamma")).toBeInTheDocument();
  });

  it("shows the save button above the tabs and calls back", () => {
    const onSave = jest.fn();
    render(<Harness onSave={onSave} />);
    fireEvent.click(screen.getByTestId("toolbar-done"));
    expect(onSave).toHaveBeenCalled();
  });

  it("closes through its own callback, not the save one", () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    render(<Harness onSave={onSave} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("toolbar-close"));
    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("notes unsaved edits only while there are any", () => {
    const { rerender } = render(<Harness onSave={jest.fn()} />);
    expect(screen.queryByTestId("toolbar-dirty")).not.toBeInTheDocument();
    rerender(<Harness onSave={jest.fn()} dirty />);
    expect(screen.getByTestId("toolbar-dirty")).toBeInTheDocument();
  });

  it("omits the control bar when no callback is given", () => {
    render(<Harness />);
    expect(screen.queryByTestId("toolbar-done")).not.toBeInTheDocument();
    expect(screen.queryByTestId("toolbar-close")).not.toBeInTheDocument();
  });

  // Ein falscher, aber gültiger Katalogname (etwa "close" statt "reset")
  // faellt durch kein anderes Netz: `Icon` rendert nur eine leere Huelle,
  // das sichtbare Glyph kommt aus dem CSS, und `data-testid` prueft nur das
  // Klickverhalten, nicht das Symbol selbst.
  it("renders the close button with the close catalog glyph", () => {
    render(<Harness onSave={jest.fn()} onClose={jest.fn()} onOpenHelp={jest.fn()} />);
    const glyph = screen.getByTestId("toolbar-close").querySelector("[data-icon]");
    expect(glyph).toHaveAttribute("data-icon", "close");
  });

  it("renders the help button with the info catalog glyph", () => {
    render(<Harness onSave={jest.fn()} onClose={jest.fn()} onOpenHelp={jest.fn()} />);
    const glyph = screen.getByTestId("toolbar-help").querySelector("[data-icon]");
    expect(glyph).toHaveAttribute("data-icon", "info");
  });
});

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

/**
 * Die Reiter und Werkzeugleisten des Editors, für sich: was jeder Reiter
 * zeigt und wie er heißt. Was die Werkzeuge an der Tabelle tun, prüft
 * `table-editor.test.tsx`.
 */

import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { TableToolbar, TableToolbarProps } from "./table-toolbar";

const props = (overrides: Partial<TableToolbarProps> = {}): TableToolbarProps => ({
  hasSelection: true,
  activeFormat: {},
  painterActive: false,
  insert: { row: false, col: false },
  onToggle: jest.fn(),
  onAlign: jest.fn(),
  onVerticalAlign: jest.fn(),
  onColor: jest.fn(),
  onClearColor: jest.fn(),
  onBackground: jest.fn(),
  onClearBackground: jest.fn(),
  onFontSize: jest.fn(),
  onFontSizeStep: jest.fn(),
  onSuperscript: jest.fn(),
  onSubscript: jest.fn(),
  tab: "font",
  onTabChange: jest.fn(),
  elementsToolbar: (
    <div role="toolbar" aria-label="Elemente">
      <button type="button">MAN Rot</button>
    </div>
  ),
  onInsertRowAbove: jest.fn(),
  onInsertRowBelow: jest.fn(),
  onInsertColLeft: jest.fn(),
  onInsertColRight: jest.fn(),
  onDeleteRows: jest.fn(),
  onDeleteCols: jest.fn(),
  onMerge: jest.fn(),
  onUnmerge: jest.fn(),
  canUnmerge: false,
  onCopyFormat: jest.fn(),
  onUpload: jest.fn(),
  onInsertImage: jest.fn(),
  hasSelectedImages: false,
  canEqualizeImages: false,
  onEqualizeImageHeight: jest.fn(),
  onEqualizeImageWidth: jest.fn(),
  onResetImageSize: jest.fn(),
  onClearFormatting: jest.fn(),
  hasClearTarget: false,
  ...overrides,
});

/** Hält den Reiter wie der Editor und meldet jeden Wechsel weiter. */
function StatefulToolbar(initial: TableToolbarProps): React.ReactElement {
  const [tab, setTab] = React.useState(initial.tab);
  return (
    <TableToolbar
      {...initial}
      tab={tab}
      onTabChange={(next) => {
        setTab(next);
        initial.onTabChange(next);
      }}
    />
  );
}

const openTab = (name: string): void => {
  fireEvent.click(screen.getByRole("tab", { name }));
};

describe("TableToolbar", () => {
  it("zeigt sechs Reiter und darunter nur die Werkzeugleiste des gewählten", () => {
    render(<StatefulToolbar {...props()} />);

    const tabs = within(screen.getByRole("tablist", { name: "Werkzeuggruppen" })).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Schrift", "Ausrichtung", "Zellen", "Bilder", "Daten", "Elemente"]);
    expect(screen.getAllByRole("toolbar")).toHaveLength(1);
    expect(screen.getByRole("toolbar", { name: "Schrift" })).toBeInTheDocument();

    openTab("Zellen");
    expect(screen.getByRole("toolbar", { name: "Zellen" })).toBeInTheDocument();
    expect(screen.queryByRole("toolbar", { name: "Schrift" })).toBeNull();
  });

  it("wandert mit den Pfeiltasten zwischen den Reitern und beginnt am Ende wieder vorn", () => {
    render(<StatefulToolbar {...props()} />);

    fireEvent.keyDown(screen.getByRole("tab", { name: "Schrift" }), { key: "ArrowLeft" });
    expect(screen.getByRole("toolbar", { name: "Elemente" })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Elemente" }), { key: "ArrowRight" });
    expect(screen.getByRole("toolbar", { name: "Schrift" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Schrift" })).toHaveAttribute("aria-selected", "true");
  });

  it("benennt jedes Werkzeug, auch die reinen Icons", () => {
    render(<StatefulToolbar {...props()} />);

    for (const tab of ["Schrift", "Ausrichtung", "Zellen", "Bilder", "Daten"]) {
      openTab(tab);
      for (const tool of within(screen.getByRole("toolbar", { name: tab })).getAllByRole("button")) {
        expect(tool).toHaveAccessibleName();
      }
    }
  });

  it("zeigt im Reiter „Elemente“ die Leiste des Editors und meldet den Wechsel", () => {
    const onTabChange = jest.fn();
    render(<StatefulToolbar {...props({ onTabChange })} />);
    expect(screen.queryByRole("button", { name: "Elemente einfügen" })).toBeNull();

    openTab("Elemente");
    expect(onTabChange).toHaveBeenCalledWith("elements");
    expect(within(screen.getByRole("toolbar", { name: "Elemente" })).getByRole("button", { name: "MAN Rot" })).toBeInTheDocument();
  });

  it("zeigt Icons statt Buchstaben für die Auszeichnungen", () => {
    render(<StatefulToolbar {...props({ activeFormat: { bold: true } })} />);

    const bold = screen.getByRole("button", { name: "Fett" });
    expect(bold).toHaveAttribute("aria-pressed", "true");
    expect(bold.textContent).toBe("");
    expect(bold.querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Kursiv" })).toHaveAttribute("aria-pressed", "false");
  });

  it("markiert die gewählte Ausrichtung als gedrückt", () => {
    render(<StatefulToolbar {...props({ activeFormat: { align: "center", valign: "bottom" } })} />);
    openTab("Ausrichtung");

    expect(screen.getByRole("button", { name: "Zentriert" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Linksbündig" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Unten ausrichten" })).toHaveAttribute("aria-pressed", "true");
  });

  it("nennt die gesetzte Farbe am Knopf und setzt sie über „Standard“ zurück", () => {
    const onClearColor = jest.fn();
    render(<StatefulToolbar {...props({ activeFormat: { color: "#ff0000" }, onClearColor })} />);

    expect(screen.getByRole("button", { name: "Schriftfarbe: #ff0000" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hintergrundfarbe: Standard" })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("toolbar-color-options"));
    fireEvent.click(screen.getByTestId("toolbar-color-reset"));

    expect(onClearColor).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("toolbar-color-options-menu")).toBeNull();
  });

  it("zeigt den gedrückten Format-Pinsel, solange er wartet", () => {
    render(<StatefulToolbar {...props({ painterActive: true, hasSelection: false })} />);
    openTab("Daten");

    const painter = screen.getByRole("button", { name: "Format kopieren" });
    expect(painter).toHaveAttribute("aria-pressed", "true");
    expect(painter).not.toBeDisabled();
  });

  it("bietet „Importieren“ neben den Reitern an, in jedem Reiter", () => {
    const onUpload = jest.fn();
    render(<StatefulToolbar {...props({ onUpload })} />);

    const importButton = screen.getByRole("button", { name: "Importieren (.csv, .xlsx)" });
    expect(screen.getByRole("tablist")).not.toContainElement(importButton);
    openTab("Bilder");
    expect(screen.getByRole("button", { name: "Importieren (.csv, .xlsx)" })).toBeInTheDocument();

    const file = new File(["a,b"], "t.csv", { type: "text/csv" });
    fireEvent.change(screen.getByTestId("toolbar-upload"), { target: { files: [file] } });
    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it("zeichnet keine eigene Bedienleiste – Speichern, Hilfe und Schließen stehen im Kopf des Rahmens", () => {
    render(<StatefulToolbar {...props()} />);

    for (const testId of ["toolbar-done", "toolbar-close", "toolbar-help", "toolbar-title", "toolbar-dirty"]) {
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: /Speichern|Schließen|Hilfe/ })).not.toBeInTheDocument();
  });
});

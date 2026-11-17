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
 * Die Vorschau zeigt den Entwurf so, wie Leser ihn sehen – mit der echten
 * Leseansicht, aber ohne Folgen für die Seite darunter.
 */

import * as React from "react";
import { render, screen, within } from "@testing-library/react";

import { TablePreview } from "./table-preview";
import { TableModel } from "./table-model";

const model = (overrides: Partial<TableModel> = {}): TableModel => ({
  data: [
    ["", "Wert"],
    ["Beta", "2"],
    ["Alpha", "1"],
    ["Gamma", "3"],
  ],
  merges: [],
  formats: {},
  sort: null,
  fitImages: true,
  visibleRows: 0,
  exportMode: "off",
  ...overrides,
});

const rowHeads = (): string[] =>
  within(screen.getByTestId("table-preview"))
    .getAllByRole("rowheader")
    .map((cell) => cell.textContent ?? "");

describe("TablePreview", () => {
  it("zeigt den Entwurf in der Leseansicht", () => {
    render(<TablePreview model={model()} />);

    const stage = screen.getByTestId("table-preview");
    expect(within(stage).getByRole("table")).toBeInTheDocument();
    expect(within(stage).getByRole("columnheader", { name: "Wert" })).toBeInTheDocument();
    expect(rowHeads()).toEqual(["Beta", "Alpha", "Gamma"]);
  });

  it("macht die Bühne inert, damit nichts darin bedienbar ist", () => {
    // Ein Export-Knopf lüde sonst eine Datei herunter, ein Klick auf den Kopf
    // sortierte um – Vorschau ist Ansehen, nicht Bedienen.
    render(<TablePreview model={model({ exportMode: "all" })} />);

    expect(screen.getByTestId("table-preview")).toHaveAttribute("inert");
    expect(within(screen.getByTestId("table-preview")).getByText("CSV")).toBeInTheDocument();
  });

  it("folgt der ersten Sortierung, auch wenn sie sich ändert", () => {
    const { rerender } = render(<TablePreview model={model({ sort: { col: 0, dir: "asc" } })} />);
    expect(rowHeads()).toEqual(["Alpha", "Beta", "Gamma"]);

    rerender(<TablePreview model={model({ sort: { col: 0, dir: "desc" } })} />);

    expect(rowHeads()).toEqual(["Gamma", "Beta", "Alpha"]);
  });

  it("klappt ein wie auf der Seite", () => {
    render(<TablePreview model={model({ visibleRows: 2 })} />);

    expect(rowHeads()).toEqual(["Beta", "Alpha"]);
    expect(screen.getByTestId("table-rows-toggle")).toBeInTheDocument();
  });

  it("lauscht weder am Dokument noch am Fenster", () => {
    // Die Vorschau steht im Studio über der echten Seite; was sie dort
    // anmeldete, bliebe nach dem Schließen hängen.
    const onDocument = jest.spyOn(document, "addEventListener");
    const onWindow = jest.spyOn(window, "addEventListener");

    render(<TablePreview model={model({ exportMode: "select", visibleRows: 1 })} />);

    const types = [...onDocument.mock.calls, ...onWindow.mock.calls]
      .map(([type]) => type)
      // React meldet `selectionchange` einmal je Dokument selbst an.
      .filter((type) => type !== "selectionchange");
    expect(types).toEqual([]);
    onDocument.mockRestore();
    onWindow.mockRestore();
  });
});

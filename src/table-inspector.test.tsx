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
 * Das Panel „Tabelle“ rechts im Rahmen: die Einstellungen, die für die ganze
 * Tabelle gelten und früher verstreut in den Reitern standen.
 */

import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TableInspector } from "./table-inspector";
import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
import { TableModel } from "./table-model";

const model = (overrides: Partial<TableModel> = {}): TableModel => ({
  data: [
    ["", "Q1", "<b>Q2</b>"],
    ["Umsatz", "100", "200"],
  ],
  merges: [],
  formats: {},
  sort: null,
  fitImages: true,
  visibleRows: DEFAULT_VISIBLE_ROWS,
  exportMode: "off",
  ...overrides,
});

const lastModel = (onChange: jest.Mock): TableModel => onChange.mock.calls.at(-1)![0] as TableModel;

async function choose(field: string, option: string): Promise<void> {
  await userEvent.click(screen.getByRole("combobox", { name: field }));
  await userEvent.click(await screen.findByRole("option", { name: option }));
}

describe("TableInspector", () => {
  it("steht als Panel „Tabelle“ neben dem Gitter", () => {
    render(<TableInspector value={model()} onChange={jest.fn()} />);

    expect(screen.getByRole("complementary", { name: "Tabelle" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tabelle" })).toBeInTheDocument();
  });

  describe("Erste Sortierung", () => {
    it("bietet jede Spalte mit ihrer Überschrift an und setzt die gewählte aufsteigend", async () => {
      const onChange = jest.fn();
      render(<TableInspector value={model()} onChange={onChange} />);

      expect(screen.getByRole("combobox", { name: "Erste Sortierung" })).toHaveTextContent("Keine");
      await choose("Erste Sortierung", "Spalte 3 · Q2");

      expect(lastModel(onChange).sort).toEqual({ col: 2, dir: "asc" });
    });

    it("dreht die Richtung, ohne die Spalte zu verlieren", async () => {
      const onChange = jest.fn();
      render(<TableInspector value={model({ sort: { col: 1, dir: "asc" } })} onChange={onChange} />);

      expect(screen.getByRole("radio", { name: "Aufsteigend" })).toBeChecked();
      await userEvent.click(screen.getByRole("radio", { name: "Absteigend" }));

      expect(lastModel(onChange).sort).toEqual({ col: 1, dir: "desc" });
    });

    it("zeigt die Richtung nur, wenn eine Spalte gewählt ist", () => {
      render(<TableInspector value={model()} onChange={jest.fn()} />);

      expect(screen.queryByRole("radiogroup", { name: "Richtung der ersten Sortierung" })).toBeNull();
    });

    it("hebt die Sortierung mit „Keine“ wieder auf", async () => {
      const onChange = jest.fn();
      render(<TableInspector value={model({ sort: { col: 1, dir: "desc" } })} onChange={onChange} />);

      await choose("Erste Sortierung", "Keine");

      expect(lastModel(onChange).sort).toBeNull();
    });
  });

  describe("Sichtbare Zeilen", () => {
    it("zeigt den gespeicherten Wert und meldet einen neuen", () => {
      const onChange = jest.fn();
      render(<TableInspector value={model({ visibleRows: 3 })} onChange={onChange} />);

      const input = screen.getByLabelText("Sichtbare Zeilen");
      expect(input).toHaveValue(3);
      fireEvent.change(input, { target: { value: "0" } });

      expect(lastModel(onChange).visibleRows).toBe(0);
    });

    it("liest ein geleertes Feld nicht als null", () => {
      // Mitten im Tippen schaltete NaN als 0 sonst das Einklappen still ab.
      const onChange = jest.fn();
      render(<TableInspector value={model()} onChange={onChange} />);

      fireEvent.change(screen.getByLabelText("Sichtbare Zeilen"), { target: { value: "" } });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("erklärt, dass 0 alle Zeilen zeigt", () => {
      render(<TableInspector value={model()} onChange={jest.fn()} />);

      expect(screen.getByLabelText("Sichtbare Zeilen")).toHaveAccessibleDescription(
        expect.stringContaining("0 zeigt alle Zeilen"),
      );
    });
  });

  describe("Export", () => {
    it("zeigt den gespeicherten Modus und meldet einen neuen", async () => {
      const onChange = jest.fn();
      render(<TableInspector value={model({ exportMode: "all" })} onChange={onChange} />);

      const trigger = screen.getByRole("combobox", { name: "Export" });
      expect(trigger).toHaveTextContent("Ganze Tabelle");
      expect(trigger).toHaveAccessibleDescription(
        expect.stringContaining("In der Staffbase-App wird der Export nicht angezeigt."),
      );
      await choose("Export", "Mit Zeilenauswahl");

      expect(lastModel(onChange).exportMode).toBe("select");
    });
  });

  describe("Bilder anpassen", () => {
    it("schaltet die Begrenzung aus, ohne die Zellen anzufassen", async () => {
      const onChange = jest.fn();
      const value = model();
      render(<TableInspector value={value} onChange={onChange} />);

      const toggle = screen.getByRole("switch", { name: "Bilder anpassen" });
      expect(toggle).toBeChecked();
      await userEvent.click(toggle);

      expect(lastModel(onChange).fitImages).toBe(false);
      expect(lastModel(onChange).data).toBe(value.data);
    });

    it("schaltet sie wieder ein", async () => {
      const onChange = jest.fn();
      render(<TableInspector value={model({ fitImages: false })} onChange={onChange} />);

      await userEvent.click(screen.getByRole("switch", { name: "Bilder anpassen" }));

      expect(lastModel(onChange).fitImages).toBe(true);
    });
  });

  it("nennt die Version des Widgets", () => {
    render(<TableInspector value={model()} onChange={jest.fn()} />);

    expect(screen.getByText("Version 0.0.0-test")).toBeInTheDocument();
  });
});

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
 * Der Element Explorer im Tabellen-Editor: Leiste öffnen, Kasten in die
 * markierten Zellen setzen, ein Element im Gitter anklicken und umfärben.
 * Der Editor läuft im Rahmen, mit einem Entwurf wie im Studio.
 */

import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigShell } from "@man/config-ui/shell/config-shell";
import { elementMarkup } from "@man/config-ui/elements/catalog";
import { ELEMENT_DRAG_TYPE } from "@man/config-ui/elements/element-drag";
import { fakeDataTransfer } from "@man/config-ui/drop/drag-testing";

import { TableEditor } from "./table-editor";
import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
import { TableModel } from "./table-model";
import { stubMediaClient } from "@shared/media/media-client.testing";

const red = elementMarkup({ id: "kasten", color: "#e40045", label: "Diesel", size: "text" });

const sample = (): TableModel => ({
  data: [
    ["Baureihe", "Diesel", "eTruck"],
    ["TGL", red, "–"],
    ["TGM", red, ""],
  ],
  merges: [],
  formats: {},
  sort: null,
  fitImages: true,
  visibleRows: DEFAULT_VISIBLE_ROWS,
  exportMode: "off",
});

/** Hält den Entwurf wie der Rahmen im Studio und gibt jeden neuen Stand weiter. */
function Harness({ onChange }: { onChange: (model: TableModel) => void }): React.ReactElement {
  const [model, setModel] = React.useState(sample);
  return (
    <ConfigShell widgetName="Tabelle" title="Tabelle bearbeiten" dirty={false} onApply={jest.fn()} onDiscard={jest.fn()} onClose={jest.fn()}>
      <TableEditor
        value={model}
        onChange={(next) => {
          setModel(next);
          onChange(next);
        }}
        mediaClient={stubMediaClient()}
      />
    </ConfigShell>
  );
}

function setup() {
  const onChange = jest.fn();
  render(<Harness onChange={onChange} />);
  const last = (): TableModel => onChange.mock.calls[onChange.mock.calls.length - 1][0];
  return { onChange, last, user: userEvent.setup() };
}

const cellTd = (row: number, col: number): HTMLElement => screen.getByLabelText(`Zeile ${row}, Spalte ${col}`).closest("td")!;
const panel = (): HTMLElement => screen.getByRole("complementary", { name: "Elemente" });

const toolbar = (): HTMLElement => screen.getByRole("toolbar", { name: "Elemente" });

describe("Element Explorer im Tabellen-Editor", () => {
  it("bringt mit dem Reiter „Elemente“ den Katalog rechts und nimmt ihn beim Verlassen mit", async () => {
    const { user } = setup();
    expect(screen.queryByRole("button", { name: "Elemente einfügen" })).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Elemente" }));
    expect(panel()).toBeInTheDocument();
    expect(within(toolbar()).getByTestId("element-toolbar-scope")).toHaveTextContent("Neues Element");
    expect(within(toolbar()).getByRole("button", { name: "Katalog anzeigen" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("tab", { name: "Daten" }));
    expect(screen.queryByRole("complementary", { name: "Elemente" })).toBeNull();
  });

  it("setzt das Element mit den Einstellungen der Leiste in die markierte Zelle", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(2, 3));
    await user.click(screen.getByRole("tab", { name: "Elemente" }));
    // Rot kennt die Tabelle schon als „Diesel“: die Bedeutung kommt mit.
    expect(within(toolbar()).getByRole("textbox", { name: "Bedeutung" })).toHaveValue("Diesel");
    await user.click(within(panel()).getByRole("button", { name: "In Zelle C2 einfügen" }));
    expect(last().data[1][2]).toBe(`–${red}`);
  });

  it("setzt das Element in jede markierte Zelle", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(2, 3));
    fireEvent.mouseDown(cellTd(3, 3), { shiftKey: true });
    await user.click(screen.getByRole("tab", { name: "Elemente" }));
    await user.click(within(toolbar()).getByRole("button", { name: "Blau" }));
    await user.type(within(toolbar()).getByRole("textbox", { name: "Bedeutung" }), "eTruck");
    await user.click(within(toolbar()).getByRole("button", { name: "Größer" }));
    await user.click(within(panel()).getByRole("button", { name: "In 2 Zellen einfügen" }));

    const blue = elementMarkup({ id: "kasten", color: "#3875b2", label: "eTruck", size: "large" });
    expect(last().data[1][2]).toBe(`–${blue}`);
    expect(last().data[2][2]).toBe(blue);
  });

  it("fügt ein Antriebs-Icon aus dem Katalog ein", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(3, 3));
    await user.click(screen.getByRole("tab", { name: "Elemente" }));
    await user.click(within(panel()).getByRole("button", { name: "Elektro" }));
    await user.click(within(panel()).getByRole("button", { name: "In Zelle C3 einfügen" }));
    expect(last().data[2][2]).toBe(elementMarkup({ id: "elektro", color: "#e40045", label: "Diesel", size: "text" }));
  });

  it("wechselt beim Klick auf ein Element zum Reiter „Elemente“ und färbt alle gleichen um", async () => {
    const { last, user } = setup();
    const element = cellTd(2, 2).querySelector("[data-man-el]")!;
    fireEvent.mouseDown(element);

    expect(screen.getByRole("tab", { name: "Elemente" })).toHaveAttribute("aria-selected", "true");
    expect(within(toolbar()).getByTestId("element-toolbar-scope")).toHaveTextContent("Kasten in Zelle B2");
    expect(within(panel()).getByTestId("picked-element")).toHaveTextContent("Kasten in Zelle B2 · MAN Rot");
    expect(element).toHaveAttribute("data-man-picked");

    await user.click(within(toolbar()).getByRole("button", { name: "Anthrazit" }));
    const anthracite = elementMarkup({ id: "kasten", color: "#303c49", label: "Diesel", size: "text" });
    expect(last().data[1][1]).toBe(anthracite);
    expect(last().data[2][1]).toBe(anthracite);
  });

  it("öffnet ein Element nicht bei Rechtsklick oder beim Erweitern der Markierung", () => {
    setup();
    fireEvent.mouseDown(cellTd(2, 2).querySelector("[data-man-el]")!, { button: 2 });
    fireEvent.mouseDown(cellTd(3, 2).querySelector("[data-man-el]")!, { shiftKey: true });
    expect(screen.queryByRole("complementary", { name: "Elemente" })).toBeNull();
  });

  it("ändert nur das angeklickte, wenn „alle gleichen“ aus ist, und entfernt es", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(3, 2).querySelector("[data-man-el]")!);
    await user.click(within(toolbar()).getByRole("button", { name: "Alle 2 gleichen Elemente mitändern" }));
    await user.click(within(toolbar()).getByRole("button", { name: "Blau" }));

    expect(last().data[1][1]).toBe(red);
    expect(last().data[2][1]).toBe(elementMarkup({ id: "kasten", color: "#3875b2", label: "Diesel", size: "text" }));

    await user.click(within(toolbar()).getByRole("button", { name: "Element entfernen" }));
    expect(last().data[2][1]).toBe("");
    expect(within(toolbar()).getByTestId("element-toolbar-scope")).toHaveTextContent("Neues Element");
  });

  it("übernimmt die Bedeutung eines gewählten Elements beim Verlassen des Felds", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(2, 2).querySelector("[data-man-el]")!);
    const field = within(toolbar()).getByRole("textbox", { name: "Bedeutung" });
    await user.clear(field);
    await user.type(field, "Diesel Euro 6{Enter}");
    expect(last().data[1][1]).toBe(elementMarkup({ id: "kasten", color: "#e40045", label: "Diesel Euro 6", size: "text" }));
    expect(last().data[2][1]).toBe(last().data[1][1]);
  });

  it("nimmt ein aus dem Katalog gezogenes Element in der Zielzelle an", async () => {
    const { last, user } = setup();
    await user.click(screen.getByRole("tab", { name: "Elemente" }));
    const dataTransfer = fakeDataTransfer({});
    fireEvent.dragStart(within(panel()).getByRole("button", { name: "Kasten" }), { dataTransfer });

    const target = screen.getByLabelText("Zeile 1, Spalte 1");
    fireEvent.dragEnter(target, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });

    expect(JSON.parse(dataTransfer.getData(ELEMENT_DRAG_TYPE))).toMatchObject({ id: "kasten" });
    expect(last().data[0][0]).toBe(`Baureihe${red}`);
  });

  it("setzt das Element an den Cursor der bearbeiteten Zelle", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(1, 2));
    await user.click(screen.getByRole("tab", { name: "Elemente" }));
    fireEvent.doubleClick(cellTd(1, 2));

    const text = screen.getByLabelText("Zeile 1, Spalte 2");
    expect(text).toHaveFocus();
    const range = document.createRange();
    range.setStart(text.firstChild!, 2);
    range.collapse(true);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);

    await user.click(within(panel()).getByRole("button", { name: "In Zelle B1 einfügen" }));
    expect(last().data[0][1]).toBe(`Di${red}esel`);
  });

  it("bietet „Element einfügen…“ im Kontextmenü an", () => {
    setup();
    fireEvent.contextMenu(cellTd(2, 3));
    fireEvent.click(screen.getByTestId("insert-element"));
    expect(panel()).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Elemente" })).toHaveAttribute("aria-selected", "true");
  });

  it("nennt Elemente ohne Bedeutung in der Statuszeile", async () => {
    const { user } = setup();
    fireEvent.mouseDown(cellTd(3, 3));
    await user.click(screen.getByRole("tab", { name: "Elemente" }));
    await user.click(within(toolbar()).getByRole("button", { name: "Weiß" }));
    await user.click(within(panel()).getByRole("button", { name: "In Zelle C3 einfügen" }));
    expect(screen.getByTestId("table-editor-status")).toHaveTextContent("1 Element ohne Bedeutung");
  });
});

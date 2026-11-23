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
import { iconById } from "@shared/icons/catalog";
import { ICON_DRAG_TYPE } from "@shared/icons/icon-drag";
import { InlineIcon, iconMarkup } from "@shared/icons/icon-markup";
import { fakeDataTransfer } from "@man/config-ui/drop/drag-testing";

import { TableEditor } from "./table-editor";
import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
import { TableModel } from "./table-model";
import { stubMediaClient } from "@shared/media/media-client.testing";

const elementMarkup = (element: InlineIcon): string => iconMarkup(element, iconById(element.id)?.name ?? "Icon");
const red = elementMarkup({ id: "shape/kasten", label: "Diesel" });
const blank = (id = "shape/kasten"): string => elementMarkup({ id, label: "" });

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

beforeEach(() => window.localStorage.clear());

function setup() {
  const onChange = jest.fn();
  render(<Harness onChange={onChange} />);
  const last = (): TableModel => onChange.mock.calls[onChange.mock.calls.length - 1][0];
  return { onChange, last, user: userEvent.setup() };
}

const cellTd = (row: number, col: number): HTMLElement => screen.getByLabelText(`Zeile ${row}, Spalte ${col}`).closest("td")!;
const panel = (): HTMLElement => screen.getByRole("complementary", { name: "Icons" });
const toolbar = (): HTMLElement => screen.getByRole("toolbar", { name: "Icons" });

/** Markiert in der bearbeiteten Zelle die Zeichen [from, to) des ersten Textknotens. */
function selectText(row: number, col: number, from: number, to: number): void {
  const text = screen.getByLabelText(`Zeile ${row}, Spalte ${col}`);
  const range = document.createRange();
  range.setStart(text.firstChild!, from);
  range.setEnd(text.firstChild!, to);
  document.getSelection()!.removeAllRanges();
  document.getSelection()!.addRange(range);
}

describe("Icon Explorer im Tabellen-Editor", () => {
  it("bringt mit dem Reiter „Icons“ den Katalog rechts und nimmt ihn beim Verlassen mit", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("tab", { name: "Icons" }));
    expect(panel()).toBeInTheDocument();
    expect(within(toolbar()).getByTestId("element-toolbar-scope")).toHaveTextContent("Kein Icon markiert");
    expect(within(toolbar()).getByRole("button", { name: "Bedeutung" })).toBeDisabled();
    expect(within(toolbar()).getByRole("button", { name: "Icons anzeigen" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("tab", { name: "Daten" }));
    expect(screen.queryByRole("complementary", { name: "Icons" })).toBeNull();
  });

  it("setzt das Element in jede markierte Zelle – ohne eigene Farbe", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(2, 3));
    fireEvent.mouseDown(cellTd(3, 3), { shiftKey: true });
    await user.click(screen.getByRole("tab", { name: "Icons" }));
    await user.click(within(panel()).getByRole("button", { name: "In 2 Zellen einfügen" }));
    expect(last().data[1][2]).toBe(`–${blank()}`);
    expect(last().data[2][2]).toBe(blank());
  });

  it("fügt ein Antriebs-Icon aus dem Katalog ein", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(3, 3));
    await user.click(screen.getByRole("tab", { name: "Icons" }));
    await user.click(within(panel()).getByRole("button", { name: "Ladesäule" }));
    await user.click(within(panel()).getByRole("button", { name: "In Zelle C3 einfügen" }));
    expect(last().data[2][2]).toBe(blank("craft/gaspump-electric"));
  });

  it("markiert ein angeklicktes Element und benennt es über „Bedeutung“", async () => {
    const { last, user } = setup();
    const element = cellTd(2, 2).querySelector("[data-man-icon]")!;
    fireEvent.mouseDown(element);

    expect(screen.getByRole("tab", { name: "Icons" })).toHaveAttribute("aria-selected", "true");
    expect(within(toolbar()).getByTestId("element-toolbar-scope")).toHaveTextContent("Kasten in Zelle B2");
    expect(within(panel()).getByTestId("picked-icon")).toHaveTextContent("Kasten in Zelle B2");
    expect(element).toHaveAttribute("data-man-picked");

    await user.click(within(toolbar()).getByRole("button", { name: "Bedeutung: Diesel" }));
    const field = screen.getByLabelText("Bedeutung");
    await user.clear(field);
    await user.type(field, "Diesel Euro 6{Enter}");
    expect(last().data[1][1]).toBe(elementMarkup({ id: "shape/kasten", label: "Diesel Euro 6" }));
    expect(last().data[2][1]).toBe(red);
  });

  it("bietet „Bedeutung des Elements…“ im Kontextmenü nach einem Rechtsklick auf ein Element", () => {
    setup();
    fireEvent.contextMenu(cellTd(2, 3));
    expect(screen.getByTestId("element-meaning")).toHaveAttribute("data-disabled");
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });

    const element = cellTd(3, 2).querySelector("[data-man-icon]")!;
    fireEvent.mouseDown(element, { button: 2 });
    fireEvent.contextMenu(element);
    fireEvent.click(screen.getByTestId("element-meaning"));
    expect(screen.getByRole("tab", { name: "Icons" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Bedeutung")).toHaveValue("Diesel");
  });

  it("öffnet ein Element nicht beim Erweitern der Markierung", () => {
    setup();
    fireEvent.mouseDown(cellTd(3, 2).querySelector("[data-man-icon]")!, { shiftKey: true });
    expect(screen.queryByRole("complementary", { name: "Icons" })).toBeNull();
  });

  it("entfernt das markierte Element", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(3, 2).querySelector("[data-man-icon]")!);
    await user.click(within(toolbar()).getByRole("button", { name: "Icon entfernen" }));
    expect(last().data[2][1]).toBe("");
    expect(within(toolbar()).getByTestId("element-toolbar-scope")).toHaveTextContent("Kein Icon markiert");
  });

  it("nimmt ein aus dem Katalog gezogenes Element in der Zielzelle an", async () => {
    const { last, user } = setup();
    await user.click(screen.getByRole("tab", { name: "Icons" }));
    const dataTransfer = fakeDataTransfer({});
    fireEvent.dragStart(within(panel()).getByRole("button", { name: "Kasten" }), { dataTransfer });

    const target = screen.getByLabelText("Zeile 1, Spalte 1");
    fireEvent.dragEnter(target, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });

    expect(JSON.parse(dataTransfer.getData(ICON_DRAG_TYPE))).toEqual({ id: "shape/kasten", label: "" });
    expect(last().data[0][0]).toBe(`Baureihe${blank()}`);
  });

  it("setzt das Element an den Cursor der bearbeiteten Zelle", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(1, 2));
    await user.click(screen.getByRole("tab", { name: "Icons" }));
    fireEvent.doubleClick(cellTd(1, 2));
    expect(screen.getByLabelText("Zeile 1, Spalte 2")).toHaveFocus();
    selectText(1, 2, 2, 2);

    await user.click(within(panel()).getByRole("button", { name: "In Zelle B1 einfügen" }));
    expect(last().data[0][1]).toBe(`Di${blank()}esel`);
  });

  it("bietet „Element einfügen…“ im Kontextmenü an", () => {
    setup();
    fireEvent.contextMenu(cellTd(2, 3));
    fireEvent.click(screen.getByTestId("insert-element"));
    expect(panel()).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Icons" })).toHaveAttribute("aria-selected", "true");
  });

  it("nennt Elemente ohne Bedeutung in der Statuszeile", async () => {
    const { user } = setup();
    fireEvent.mouseDown(cellTd(3, 3));
    await user.click(screen.getByRole("tab", { name: "Icons" }));
    await user.click(within(panel()).getByRole("button", { name: "In Zelle C3 einfügen" }));
    expect(screen.getByTestId("table-editor-status")).toHaveTextContent("1 Icon ohne Bedeutung");
  });
});

describe("Schriftfarbe und -größe für Teile einer Zelle", () => {
  it("färbt den markierten Text in der bearbeiteten Zelle, nicht die ganze Zelle", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(1, 2));
    fireEvent.doubleClick(cellTd(1, 2));
    selectText(1, 2, 0, 2);

    await user.click(screen.getByTestId("toolbar-color-options"));
    await user.click(screen.getByTestId("toolbar-color-swatch-e40045"));
    expect(last().data[0][1]).toBe('<span style="color:#e40045">Di</span>esel');
    expect(last().formats["0,1"]).toBeUndefined();
  });

  it("vergrößert den markierten Text über die Schriftgröße", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(1, 2));
    fireEvent.doubleClick(cellTd(1, 2));
    selectText(1, 2, 2, 6);

    await user.click(screen.getByTestId("toolbar-fontsize"));
    await user.click(screen.getByTestId("toolbar-fontsize-20"));
    expect(last().data[0][1]).toBe('Di<span style="font-size:20px">esel</span>');
  });

  it("färbt ohne markierten Text die markierten Zellen samt ihrer Elemente", async () => {
    const { last, user } = setup();
    fireEvent.mouseDown(cellTd(2, 2));
    fireEvent.mouseDown(cellTd(3, 2), { shiftKey: true });
    await user.click(screen.getByTestId("toolbar-color-options"));
    await user.click(screen.getByTestId("toolbar-color-swatch-3875b2"));
    expect(last().formats["1,1"]).toEqual({ color: "#3875b2" });
    expect(last().formats["2,1"]).toEqual({ color: "#3875b2" });
  });
});

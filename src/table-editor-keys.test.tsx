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
 * Tasten im Rahmen: der Rahmen hört Escape und ⌘Z an seiner Wurzel. Was der
 * Editor selbst mit Escape schließt – Zelle, Kontextmenü, Ribbon-Menü,
 * Mediathek-Leiste, Auswahlliste –, darf den Rahmen nicht mitschließen; ⌘Z in
 * einer Zelle gehört der Zelle. Dazu der Klickweg in die Mediathek-Leiste.
 */

import * as React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigShell } from "@man/config-ui/shell/config-shell";

import { TableEditor } from "./table-editor";
import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
import { TableModel } from "./table-model";
import { stubMediaClient } from "@shared/media/media-client.testing";

const sample = (): TableModel => ({
  data: [
    ["", "Q1", "Q2"],
    ["Umsatz", "100", "200"],
  ],
  merges: [],
  formats: {},
  sort: null,
  fitImages: true,
  visibleRows: DEFAULT_VISIBLE_ROWS,
  exportMode: "off",
});

function renderInShell(): { onClose: jest.Mock; undo: jest.Mock; onChange: jest.Mock } {
  const onClose = jest.fn();
  const undo = jest.fn();
  const onChange = jest.fn();
  render(
    <ConfigShell
      widgetName="Tabelle"
      title="Tabelle bearbeiten"
      dirty={false}
      history={{ canUndo: true, canRedo: false, undo, redo: jest.fn() }}
      onApply={jest.fn()}
      onDiscard={jest.fn()}
      onClose={onClose}
    >
      <TableEditor value={sample()} onChange={onChange} mediaClient={stubMediaClient()} />
    </ConfigShell>,
  );
  return { onClose, undo, onChange };
}

const cellDiv = (label: string): HTMLElement => screen.getByLabelText(label);
const cellTd = (label: string): HTMLElement => cellDiv(label).closest("td")!;
const escape = (target: Element): boolean => fireEvent.keyDown(target, { key: "Escape" });
const mediaPanel = (): HTMLElement | null => screen.queryByRole("complementary", { name: "Bild für Zelle B2" });

/** Markiert B2 und klickt im Reiter „Bilder“ auf „Bild“. */
function openMediaForB2(): void {
  fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
  fireEvent.click(screen.getByRole("tab", { name: "Bilder" }));
  fireEvent.click(screen.getByTestId("toolbar-image-button"));
}

describe("Escape im Rahmen", () => {
  it("schließt den Rahmen, wenn nichts anderes offen ist", () => {
    // Gegenprobe: ohne sie bewiese keiner der Tests unten etwas.
    const { onClose } = renderInShell();

    escape(screen.getByTestId("table-editor-grid"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("beendet das Bearbeiten einer Zelle, nicht den Rahmen", () => {
    const { onClose } = renderInShell();
    fireEvent.doubleClick(cellTd("Zeile 2, Spalte 2"));
    expect(cellDiv("Zeile 2, Spalte 2")).toHaveAttribute("contenteditable", "true");

    escape(cellDiv("Zeile 2, Spalte 2"));

    expect(onClose).not.toHaveBeenCalled();
    expect(cellDiv("Zeile 2, Spalte 2")).toHaveAttribute("contenteditable", "false");
    // Der Fokus bleibt im Rahmen, damit seine Tasten weiter ankommen.
    expect(document.activeElement).toBe(screen.getByTestId("table-editor"));
  });

  it("schließt das Kontextmenü, nicht den Rahmen", async () => {
    const { onClose } = renderInShell();
    const td = cellTd("Zeile 2, Spalte 2");
    fireEvent.mouseDown(td);
    fireEvent.contextMenu(td);
    const menu = screen.getByTestId("table-editor-menu");

    await act(async () => {
      escape(menu);
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByTestId("table-editor-menu")).toBeNull();
  });

  it("schließt ein Ribbon-Menü, nicht den Rahmen – wo immer der Fokus steht", () => {
    const { onClose } = renderInShell();
    fireEvent.click(screen.getByRole("tab", { name: "Zellen" }));
    fireEvent.click(screen.getByTestId("toolbar-insert"));
    expect(screen.getByTestId("toolbar-insert-menu")).toBeInTheDocument();

    escape(screen.getByTestId("table-editor-grid"));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByTestId("toolbar-insert-menu")).toBeNull();
  });

  it("gibt den Fokus nach Escape im Ribbon-Menü an dessen Knopf zurück", () => {
    renderInShell();
    fireEvent.click(screen.getByRole("tab", { name: "Zellen" }));
    const trigger = screen.getByTestId("toolbar-insert");
    trigger.focus();
    fireEvent.click(trigger);
    screen.getByTestId("toolbar-insert-row-above").focus();

    escape(screen.getByTestId("toolbar-insert-row-above"));

    expect(document.activeElement).toBe(trigger);
  });

  it("schließt die Mediathek-Leiste, nicht den Rahmen", async () => {
    const { onClose } = renderInShell();
    openMediaForB2();
    expect(mediaPanel()).toBeInTheDocument();
    await screen.findByTestId("media-picker-item-a");

    // Der Fokus steht im Gitter, nicht in der Leiste: der Rahmen schließt
    // dann die oberste Leiste, nicht sich selbst.
    escape(screen.getByTestId("table-editor-grid"));

    expect(onClose).not.toHaveBeenCalled();
    expect(mediaPanel()).toBeNull();
    // Zurück ist das Panel „Tabelle“, über dem die Leiste lag.
    expect(screen.getByRole("complementary", { name: "Tabelle" })).toBeInTheDocument();
  });

  it("schließt eine Auswahlliste im Panel, nicht den Rahmen", async () => {
    const { onClose } = renderInShell();
    await userEvent.click(screen.getByRole("combobox", { name: "Export" }));
    const listbox = await screen.findByRole("listbox");

    await act(async () => {
      escape(listbox);
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});

describe("⌘Z im Rahmen", () => {
  it("bleibt in einer bearbeiteten Zelle beim Browser", () => {
    const { undo } = renderInShell();
    fireEvent.doubleClick(cellTd("Zeile 2, Spalte 2"));

    fireEvent.keyDown(cellDiv("Zeile 2, Spalte 2"), { key: "z", metaKey: true });

    expect(undo).not.toHaveBeenCalled();
  });

  it("nimmt außerhalb einer Zelle einen Schritt des Rahmens zurück", () => {
    const { undo } = renderInShell();

    fireEvent.keyDown(screen.getByTestId("table-editor-grid"), { key: "z", metaKey: true });

    expect(undo).toHaveBeenCalledTimes(1);
  });
});

describe("Mediathek-Leiste im Rahmen", () => {
  it("öffnet sich für die markierte Zelle und setzt das gewählte Bild dort ein", async () => {
    const { onChange } = renderInShell();
    openMediaForB2();
    // Im Rahmen angedockt statt als Overlay über dem Editor.
    expect(mediaPanel()!.querySelector("[data-layout='panel']")).not.toBeNull();

    fireEvent.click(await screen.findByTestId("media-picker-item-a"));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const model = onChange.mock.calls.at(-1)![0] as TableModel;
    expect(model.data[1][1]).toContain('src="https://cdn.example.test/a.png?token=1"');
    expect(model.data[1][1].startsWith("100")).toBe(true);
    expect(mediaPanel()).toBeNull();
  });
});

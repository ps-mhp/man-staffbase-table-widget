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
 * Das Gitter mit der Tastatur wie in Excel: wandern, markieren, tippen,
 * leeren, kopieren, einfügen, ausfüllen – und das Kontextmenü auf einer
 * Mehrfachmarkierung.
 */

import * as React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfigShell } from "@man/config-ui/shell/config-shell";

import { TableEditor } from "./table-editor";
import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
import { TableModel } from "./table-model";
import { stubMediaClient } from "@shared/media/media-client.testing";

const sample = (): TableModel => ({
  data: [
    ["", "Q1", "Q2"],
    ["Umsatz", "100", "200"],
    ["Kosten", "50", "60"],
  ],
  merges: [],
  formats: {},
  sort: null,
  fitImages: true,
  visibleRows: DEFAULT_VISIBLE_ROWS,
  exportMode: "off",
});

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
  return { onChange, last };
}

const text = (row: number, col: number): HTMLElement => screen.getByLabelText(`Zeile ${row}, Spalte ${col}`);
const cellTd = (row: number, col: number): HTMLElement => text(row, col).closest("td")!;
const editor = (): HTMLElement => screen.getByTestId("table-editor");
const press = (key: string, mods: Partial<Record<"shiftKey" | "metaKey" | "ctrlKey" | "altKey", boolean>> = {}): void => {
  fireEvent.keyDown(document.activeElement ?? editor(), { key, ...mods });
};
const selected = (row: number, col: number): boolean => cellTd(row, col).classList.contains("table-editor__cell--selected");

function select(r1: number, c1: number, r2 = r1, c2 = c1): void {
  fireEvent.mouseDown(cellTd(r1, c1));
  fireEvent.mouseUp(cellTd(r1, c1));
  if (r2 !== r1 || c2 !== c1) fireEvent.mouseDown(cellTd(r2, c2), { shiftKey: true });
}

describe("Gitter wie Excel – wandern und markieren", () => {
  it("bewegt die aktive Zelle mit Pfeilen, Tab und Enter", () => {
    setup();
    select(2, 2);
    press("ArrowRight");
    expect(selected(2, 3)).toBe(true);
    press("ArrowDown");
    expect(selected(3, 3)).toBe(true);
    press("Tab", { shiftKey: true });
    expect(selected(3, 2)).toBe(true);
    press("Enter", { shiftKey: true });
    expect(selected(2, 2)).toBe(true);
    expect(selected(3, 2)).toBe(false);
  });

  it("zieht mit Umschalt+Pfeil die Markierung auf und wieder zurück", () => {
    setup();
    select(2, 2);
    press("ArrowDown", { shiftKey: true });
    press("ArrowRight", { shiftKey: true });
    expect([selected(2, 2), selected(3, 2), selected(2, 3), selected(3, 3)]).toEqual([true, true, true, true]);
    press("ArrowUp", { shiftKey: true });
    expect(selected(3, 3)).toBe(false);
    expect(selected(2, 3)).toBe(true);
  });

  it("markiert mit ⌘A alles", () => {
    setup();
    select(2, 2);
    press("a", { metaKey: true });
    expect(selected(1, 1)).toBe(true);
    expect(selected(3, 3)).toBe(true);
  });
});

describe("Gitter wie Excel – Inhalte", () => {
  it("leert mit Entf alle markierten Zellen", () => {
    const { last } = setup();
    select(2, 2, 3, 3);
    press("Delete");
    expect(last().data.slice(1).map((row) => row.slice(1))).toEqual([
      ["", ""],
      ["", ""],
    ]);
    expect(last().data[1][0]).toBe("Umsatz");
  });

  it("ersetzt beim Tippen den Inhalt, Enter übernimmt und wandert nach unten", () => {
    const { last } = setup();
    select(2, 2);
    press("7");
    expect(last().data[1][1]).toBe("7");
    expect(text(2, 2)).toHaveAttribute("contenteditable", "true");

    press("Enter");
    expect(text(2, 2)).toHaveAttribute("contenteditable", "false");
    expect(selected(3, 2)).toBe(true);
    expect(editor()).toHaveFocus();
  });

  it("verwirft mit Esc, was getippt wurde", () => {
    const { last } = setup();
    select(2, 2);
    press("9");
    expect(last().data[1][1]).toBe("9");
    press("Escape");
    expect(last().data[1][1]).toBe("100");
    expect(text(2, 2)).toHaveAttribute("contenteditable", "false");
  });

  it("bearbeitet mit F2, ohne den Inhalt zu ersetzen", () => {
    const { onChange } = setup();
    select(3, 3);
    press("F2");
    expect(text(3, 3)).toHaveAttribute("contenteditable", "true");
    expect(text(3, 3)).toHaveTextContent("60");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("setzt Formatierung und Schriftfarbe auf alle markierten Zellen", () => {
    const { last } = setup();
    select(2, 2, 3, 3);
    press("b", { metaKey: true });
    expect(["1,1", "1,2", "2,1", "2,2"].every((key) => last().formats[key]?.bold === true)).toBe(true);

    fireEvent.change(screen.getByTestId("toolbar-color"), { target: { value: "#e40045" } });
    expect(["1,1", "1,2", "2,1", "2,2"].map((key) => last().formats[key]?.color)).toEqual(["#e40045", "#e40045", "#e40045", "#e40045"]);
  });

  it("füllt mit ⌘D die erste Zeile nach unten", () => {
    const { last } = setup();
    select(2, 2, 3, 3);
    press("d", { metaKey: true });
    expect(last().data[2]).toEqual(["Kosten", "100", "200"]);
  });
});

describe("Gitter wie Excel – Zwischenablage über die Tastatur", () => {
  let stored: Record<string, string>;
  const originalClipboard = navigator.clipboard;

  beforeAll(() => {
    // jsdom kennt `Blob.text()` nicht; Browser schon.
    if (typeof Blob.prototype.text !== "function") {
      Object.defineProperty(Blob.prototype, "text", {
        configurable: true,
        value(this: Blob): Promise<string> {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsText(this);
          });
        },
      });
    }
  });

  beforeEach(() => {
    stored = {};
    class FakeItem {
      constructor(readonly parts: Record<string, Blob>) {}
      get types(): string[] {
        return Object.keys(this.parts);
      }
      async getType(type: string): Promise<Blob> {
        return this.parts[type];
      }
    }
    Object.assign(globalThis, { ClipboardItem: FakeItem });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        write: jest.fn(async (items: FakeItem[]) => {
          for (const [type, blob] of Object.entries(items[0].parts)) stored[type] = await blob.text();
        }),
        read: jest.fn(async () => [
          new FakeItem(Object.fromEntries(Object.entries(stored).map(([type, value]) => [type, new Blob([value], { type })]))),
        ]),
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: originalClipboard });
    delete (globalThis as { ClipboardItem?: unknown }).ClipboardItem;
  });

  it("kopiert mit ⌘C und fügt mit ⌘V samt Werten ein", async () => {
    const { last } = setup();
    select(2, 2, 3, 2);
    await act(async () => press("c", { metaKey: true }));
    await waitFor(() => expect(stored["text/plain"]).toBe("100\n50"));

    select(2, 3);
    await act(async () => press("v", { metaKey: true }));
    await waitFor(() => expect(last().data.map((row) => row[2])).toEqual(["Q2", "100", "50"]));
  });

  it("schneidet mit ⌘X aus", async () => {
    const { last } = setup();
    select(3, 2, 3, 3);
    await act(async () => press("x", { metaKey: true }));
    await waitFor(() => expect(last().data[2]).toEqual(["Kosten", "", ""]));
    expect(stored["text/plain"]).toBe("50\t60");
  });

  it("meldet, wenn der Browser die Zwischenablage verweigert", async () => {
    setup();
    (navigator.clipboard.read as jest.Mock).mockRejectedValueOnce(new Error("NotAllowedError"));
    select(2, 2);
    await act(async () => press("v", { metaKey: true }));
    expect(screen.getByTestId("table-editor-status")).toHaveTextContent("Einfügen nicht möglich");
  });
});

describe("Kontextmenü auf einer Mehrfachmarkierung", () => {
  it("lässt die Markierung stehen, wenn man in sie rechts klickt", () => {
    setup();
    select(2, 2, 3, 3);
    fireEvent.mouseDown(cellTd(3, 3), { button: 2 });
    fireEvent.contextMenu(cellTd(3, 3));
    expect([selected(2, 2), selected(2, 3), selected(3, 2), selected(3, 3)]).toEqual([true, true, true, true]);
  });

  it("markiert neu, wenn man außerhalb rechts klickt", () => {
    setup();
    select(2, 2, 2, 3);
    fireEvent.mouseDown(cellTd(3, 1), { button: 2 });
    expect(selected(3, 1)).toBe(true);
    expect(selected(2, 2)).toBe(false);
  });
});

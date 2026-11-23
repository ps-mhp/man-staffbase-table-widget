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
 * Zellen kopieren, ausschneiden, einfügen und mit dem Ausfüllkästchen
 * fortschreiben – im Editor, mit einem Entwurf wie im Studio.
 */

import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConfigShell } from "@man/config-ui/shell/config-shell";
import { fakeDataTransfer } from "@man/config-ui/drop/drag-testing";

import { TableEditor } from "./table-editor";
import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
import { TableModel } from "./table-model";
import { stubMediaClient } from "@shared/media/media-client.testing";

const sample = (): TableModel => ({
  data: [
    ["", "Q1", "Q2", "Q3"],
    ["Umsatz", "100", "", ""],
    ["Kosten", "50", "", ""],
    ["Saldo", "", "", ""],
  ],
  merges: [],
  formats: { "1,1": { bold: true } },
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

/** Zeile und Spalte 1-basiert wie die Beschriftung im Gitter. */
const cellTd = (row: number, col: number): HTMLElement => screen.getByLabelText(`Zeile ${row}, Spalte ${col}`).closest("td")!;
const editor = (): HTMLElement => screen.getByTestId("table-editor");
const status = (): HTMLElement => screen.getByTestId("table-editor-status");

/** Markiert von (r1, c1) bis (r2, c2) wie mit Klick und Umschalt-Klick. */
function select(r1: number, c1: number, r2 = r1, c2 = c1): void {
  fireEvent.mouseDown(cellTd(r1, c1));
  fireEvent.mouseUp(cellTd(r1, c1));
  if (r2 !== r1 || c2 !== c1) fireEvent.mouseDown(cellTd(r2, c2), { shiftKey: true });
}

describe("Zellen kopieren und einfügen", () => {
  it("gibt dem Editor beim Markieren den Fokus, damit ⌘C dort ankommt", () => {
    setup();
    select(2, 2);
    expect(editor()).toHaveFocus();
  });

  it("kopiert die Markierung als Text und HTML und umrandet sie", () => {
    setup();
    select(2, 2, 3, 2);
    const clipboardData = fakeDataTransfer({});
    fireEvent.copy(editor(), { clipboardData });

    expect(clipboardData.getData("text/plain")).toBe("100\n50");
    expect(clipboardData.getData("text/html")).toContain("<td>100</td>");
    expect(cellTd(2, 2)).toHaveClass("table-editor__cell--copied-top");
    expect(cellTd(3, 2)).toHaveClass("table-editor__cell--copied-bottom");
    expect(status()).toHaveTextContent("Kopiert · ⌘V fügt in die Markierung ein");
  });

  it("fügt Kopiertes samt Format in die Markierung ein und markiert das Eingefügte", () => {
    const { last } = setup();
    select(2, 2, 3, 2);
    const clipboardData = fakeDataTransfer({});
    fireEvent.copy(editor(), { clipboardData });
    select(2, 4);
    fireEvent.paste(editor(), { clipboardData });

    expect(last().data.map((row) => row[3])).toEqual(["Q3", "100", "50", ""]);
    expect(last().formats["1,3"]).toEqual({ bold: true });
    expect(cellTd(3, 4)).toHaveClass("table-editor__cell--selected");
  });

  it("nimmt Tabulator-Text aus Excel an", () => {
    const { last } = setup();
    select(4, 2);
    fireEvent.paste(editor(), { clipboardData: fakeDataTransfer({ "text/plain": "1\t2\t3\n4\t5\t6\n" }) });
    expect(last().data[3]).toEqual(["Saldo", "1", "2", "3"]);
    expect(last().data[4]).toEqual(["", "4", "5", "6"]);
  });

  it("leert beim Ausschneiden die Werte", () => {
    const { last } = setup();
    select(2, 2, 3, 2);
    const clipboardData = fakeDataTransfer({});
    fireEvent.cut(editor(), { clipboardData });
    expect(clipboardData.getData("text/plain")).toBe("100\n50");
    expect(last().data.map((row) => row[1])).toEqual(["Q1", "", "", ""]);
  });

  it("lässt die Zwischenablage einer bearbeiteten Zelle beim Text", () => {
    const { onChange } = setup();
    fireEvent.doubleClick(cellTd(2, 2));
    const clipboardData = fakeDataTransfer({});
    fireEvent.copy(screen.getByLabelText("Zeile 2, Spalte 2"), { clipboardData });
    expect(clipboardData.getData("text/plain")).toBe("");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Ausfüllkästchen", () => {
  it("sitzt an der unteren rechten Ecke der Markierung", () => {
    setup();
    select(2, 2, 3, 2);
    expect(cellTd(3, 2)).toContainElement(screen.getByTestId("fill-handle"));
  });

  it("schreibt die Markierung beim Ziehen über die Nachbarzellen fort", () => {
    const { last } = setup();
    select(2, 2, 3, 2);
    fireEvent.mouseDown(screen.getByTestId("fill-handle"));
    fireEvent.mouseEnter(cellTd(3, 4));

    expect(cellTd(2, 3)).toHaveClass("table-editor__cell--fill");
    expect(status()).toHaveTextContent("Loslassen füllt die Zellen aus");

    fireEvent.mouseUp(cellTd(3, 4));
    expect(last().data[1]).toEqual(["Umsatz", "100", "100", "100"]);
    expect(last().data[2]).toEqual(["Kosten", "50", "50", "50"]);
    expect(last().formats["1,3"]).toEqual({ bold: true });
    expect(cellTd(3, 4)).toHaveClass("table-editor__cell--selected");
    expect(cellTd(2, 3)).not.toHaveClass("table-editor__cell--fill");
  });

  it("ändert nichts, wenn man in der Quelle loslässt", () => {
    const { onChange } = setup();
    select(2, 2);
    fireEvent.mouseDown(screen.getByTestId("fill-handle"));
    fireEvent.mouseEnter(cellTd(2, 2));
    fireEvent.mouseUp(cellTd(2, 2));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("fehlt beim Bearbeiten einer Zelle", () => {
    setup();
    select(2, 2);
    fireEvent.doubleClick(cellTd(2, 2));
    expect(screen.queryByTestId("fill-handle")).toBeNull();
  });
});

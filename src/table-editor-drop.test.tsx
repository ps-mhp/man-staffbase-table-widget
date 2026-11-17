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
 * Bilder aus der Mediathek-Leiste auf eine Zelle ziehen: jede Zelle ist eine
 * Ablagezone, das Bild landet in genau dieser Zelle – im jüngsten Stand der
 * Tabelle, auch wenn zwischen Ablegen und Antwort des Servers weiter
 * bearbeitet wurde.
 */

import * as React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MEDIA_DRAG_TYPE } from "@man/config-ui/drop/drag-payload";
import { fakeDataTransfer } from "@man/config-ui/drop/drag-testing";
import { MediaClient, MediaItem } from "@shared/media/media-client";
import { mediaItem, stubMediaClient } from "@shared/media/media-client.testing";
import { forgetDraggedForTests } from "@shared/media/media-drag";

import { TableEditor } from "./table-editor";
import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
import { TableModel } from "./table-model";

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

/** Was die Leiste beim Ziehen einer Kachel mitgibt. */
const mediaTransfer = (id = "a") =>
  fakeDataTransfer({
    [MEDIA_DRAG_TYPE]: JSON.stringify({
      id,
      fileName: `${id}.png`,
      previewUrl: `https://cdn.example.test/${id}-preview.png`,
      type: "image",
    }),
    "text/uri-list": `https://cdn.example.test/${id}-preview.png`,
  });

const cellDiv = (label: string): HTMLElement => screen.getByLabelText(label);
const zoneOf = (label: string): HTMLElement => cellDiv(label).closest<HTMLElement>("[data-drop-state]")!;

/** Hält die Tabelle selbst, wie der Rahmen: jede Änderung kommt als neuer Wert zurück. */
function Harness({ client, onModel }: { client: MediaClient; onModel: (model: TableModel) => void }): React.ReactElement {
  const [value, setValue] = React.useState(sample);
  return (
    <TableEditor
      value={value}
      onChange={(next) => {
        setValue(next);
        onModel(next);
      }}
      mediaClient={client}
    />
  );
}

function setup(client: MediaClient = stubMediaClient({ getMedium: jest.fn(async () => mediaItem("a")) })) {
  const onModel = jest.fn();
  render(<Harness client={client} onModel={onModel} />);
  const last = (): TableModel => onModel.mock.calls.at(-1)![0] as TableModel;
  return { onModel, last };
}

beforeEach(() => forgetDraggedForTests());

describe("Bilder auf Zellen ziehen", () => {
  it("macht jede Zelle zur Ablagezone und setzt das Bild in die getroffene", async () => {
    const { onModel, last } = setup();
    const dataTransfer = mediaTransfer();
    const zone = zoneOf("Zeile 2, Spalte 2");

    fireEvent.dragEnter(zone, { dataTransfer });
    expect(zone).toHaveAttribute("data-drop-state", "over");
    fireEvent.drop(zone, { dataTransfer });

    await waitFor(() => expect(onModel).toHaveBeenCalled());
    expect(last().data[1][1]).toMatch(/^100<img [^>]*src="https:\/\/cdn\.example\.test\/a\.png\?token=1"/);
    expect(last().data[1][2]).toBe("200");
  });

  it("schreibt in den jüngsten Stand, nicht in den beim Ablegen", async () => {
    let release: (item: MediaItem) => void = () => undefined;
    const getMedium = jest.fn(() => new Promise<MediaItem>((resolve) => (release = resolve)));
    const { last } = setup(stubMediaClient({ getMedium }));
    const dataTransfer = mediaTransfer();

    fireEvent.drop(zoneOf("Zeile 2, Spalte 2"), { dataTransfer });
    expect(zoneOf("Zeile 2, Spalte 2")).toHaveAttribute("data-drop-state", "busy");
    // Während der Server antwortet, geht die Arbeit an der Tabelle weiter.
    const other = cellDiv("Zeile 3, Spalte 3");
    await act(async () => {
      other.innerHTML = "Neu";
      other.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => release(mediaItem("a")));

    await waitFor(() => expect(last().data[1][1]).toContain("<img"));
    expect(last().data[2][2]).toBe("Neu");
  });

  it("nimmt das Medium in einer bearbeiteten Zelle nicht als Text auf", async () => {
    const { last } = setup();
    fireEvent.doubleClick(cellDiv("Zeile 2, Spalte 2").closest("td")!);
    const editable = cellDiv("Zeile 2, Spalte 2");
    expect(editable).toHaveAttribute("contenteditable", "true");
    const dataTransfer = mediaTransfer();

    // `false`: abgefangen – der Browser fügte sonst die Vorschau-Adresse ein.
    expect(fireEvent.dragOver(editable, { dataTransfer })).toBe(false);
    expect(fireEvent.drop(editable, { dataTransfer })).toBe(false);

    await waitFor(() => expect(last().data[1][1]).toContain("<img"));
    expect(last().data[1][1]).not.toContain("a-preview.png");
  });

  it("lässt gezogenen Text beim Browser", () => {
    setup();
    fireEvent.doubleClick(cellDiv("Zeile 2, Spalte 2").closest("td")!);

    const dataTransfer = fakeDataTransfer({ "text/plain": "Hallo" });

    expect(fireEvent.dragOver(cellDiv("Zeile 2, Spalte 2"), { dataTransfer })).toBe(true);
  });
});

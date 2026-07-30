/*!
 * Copyright 2026, Staffbase SE and contributors.
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

import { screen, waitFor, within } from "@testing-library/dom";

import { tableModelToSlotMarkup } from "./table-dom";
import { TableModel, serializeTableModel } from "./table-model";

import "../dev/bootstrap";

const model = (data: string[][]): TableModel => ({
  data,
  merges: [],
  formats: {},
  sort: null,
});

describe("Widget test", () => {
  let stopTableEditorInjector: () => void;

  beforeAll(async () => {
    document.body.innerHTML = `
        <div id="preview"></div>
        <div id="config"></div>
        `;
    ({ stopTableEditorInjector } = await import("./index"));
  });

  afterAll(() => {
    stopTableEditorInjector();
  });

  it("should render the widget with the given table data", async () => {
    const widget = document.createElement("table-widget");
    widget.setAttribute(
      "tabledata",
      JSON.stringify([
        ["", "Kopf 1"],
        ["Kopf 2", "42"],
      ]),
    );
    document.body.appendChild(widget);

    expect(await screen.findByText("Kopf 1")).toBeInTheDocument();
    expect(screen.getByText("Kopf 2")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByLabelText("Table Widget")).toBeInTheDocument();
  });

  it("carries the translatable slot content on the element in slots mode", async () => {
    const widget = document.createElement("table-widget");
    widget.setAttribute("tablemode", "slots");
    widget.setAttribute(
      "tabledata",
      serializeTableModel(model([["", "Slotkopf"], ["Slotzeile", "7"]])),
    );
    document.body.appendChild(widget);

    // The base class builds its wrapper inside the element, so the child nodes
    // have to be re-attached after rendering to end up in the stored shape.
    await waitFor(() => expect(widget.querySelector("[data-table]")).not.toBeNull());
    expect(widget.querySelector("[data-table]")!.textContent).toContain("Slotkopf");
  });

  it("renders pre-existing slot content instead of the attribute", async () => {
    // Built through innerHTML so attributes and child nodes arrive together and
    // the element upgrades on connect — exactly how stored article HTML behaves.
    const host = document.createElement("div");
    host.innerHTML =
      `<table-widget tablemode="slots" ` +
      `tabledata="${serializeTableModel(model([["", "Quelltext"]]))}">` +
      `${tableModelToSlotMarkup(model([["", "Uebersetzt"]]))}` +
      `</table-widget>`;
    document.body.appendChild(host);
    const widget = host.firstElementChild as HTMLElement;

    // Assert on the rendered table, not on the seeded (hidden) slot markup.
    const rendered = await waitFor(() => {
      const el = widget.querySelector<HTMLElement>("[data-table-source]");
      expect(el).not.toBeNull();
      return el!;
    });
    expect(rendered).toHaveAttribute("data-table-source", "slots");
    expect(rendered.textContent).toContain("Uebersetzt");
    // The document's slot node must survive untouched — regenerating it from
    // the attribute would put the source language back.
    expect(widget.querySelector("[data-table]")!.textContent).toContain("Uebersetzt");
    expect(within(rendered).queryByText("Quelltext")).not.toBeInTheDocument();
  });

  it("mounts the grid editor into the config dialog rendered by the dev harness", async () => {
    await waitFor(() => {
      expect(document.querySelector('[data-testid="table-editor"]')).not.toBeNull();
    });

    const textarea = document.querySelector<HTMLTextAreaElement>("#root_tabledata");
    expect(textarea?.style.display).toBe("none");
  });
});

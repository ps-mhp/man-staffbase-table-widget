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

import { screen, waitFor } from "@testing-library/dom";

import "../dev/bootstrap";

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

  it("mounts the grid editor into the config dialog rendered by the dev harness", async () => {
    await waitFor(() => {
      expect(document.querySelector('[data-testid="table-editor"]')).not.toBeNull();
    });

    const textarea = document.querySelector<HTMLTextAreaElement>("#root_tabledata");
    expect(textarea?.style.display).toBe("none");
  });
});

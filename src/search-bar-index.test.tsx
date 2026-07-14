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

import { screen } from "@testing-library/dom";
import { SEARCH_BAR_PLACEHOLDER } from "./search-bar-relocator";

describe("search-bar widget block", () => {
  let stopSearchBarRelocator: () => void;
  let capturedDefinition: Parameters<typeof window.defineBlock>[0] | null = null;

  beforeAll(async () => {
    class FakeBaseClass extends window.HTMLElement {
      renderBlock(_container: HTMLElement): void {
        // overridden by the block under test
      }
      connectedCallback(): void {
        this.renderBlock(this);
      }
      attributeChangedCallback(): void {
        this.renderBlock(this);
      }
      public parseAttributes<T extends Record<string, unknown>>(): T {
        const attrs: Record<string, string> = {};
        for (const attr of Array.from(this.attributes)) {
          attrs[attr.name] = attr.value;
        }
        return attrs as T;
      }
      get contentLanguage(): string {
        return "en_US";
      }
    }

    window.defineBlock = (definition): void => {
      capturedDefinition = definition;
      const factory = definition.blockDefinition.factory;
      const CustomElementClass = factory(
        FakeBaseClass as unknown as Parameters<typeof factory>[0],
        {} as unknown as Parameters<typeof factory>[1],
      );
      window.customElements.define(definition.blockDefinition.name, CustomElementClass);
    };

    ({ stopSearchBarRelocator } = await import("./search-bar-index"));
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  afterAll(() => {
    stopSearchBarRelocator();
  });

  it("renders the default placeholder marker", async () => {
    const widget = document.createElement("search-bar-widget");
    document.body.appendChild(widget);

    expect(await screen.findByText(SEARCH_BAR_PLACEHOLDER)).toBeInTheDocument();
  });

  it("renders a custom placeholder from the attribute", async () => {
    const widget = document.createElement("search-bar-widget");
    widget.setAttribute("placeholder", "MARKER-XYZ");
    document.body.appendChild(widget);

    expect(await screen.findByText("MARKER-XYZ")).toBeInTheDocument();
  });

  // Staffbase rejects a bundle as "Not a valid widget bundle" unless the
  // definition mirrors a real widget: at least one configurable attribute with
  // a matching configurationSchema property and a uiSchema entry (the working
  // table widget has exactly this shape). Guard it so it can never regress.
  it("exposes a Staffbase-valid definition (attribute + schema + uiSchema)", () => {
    const definition = capturedDefinition;
    expect(definition).not.toBeNull();

    const bd = definition!.blockDefinition;
    expect(bd.attributes).toContain("placeholder");

    expect(bd.configurationSchema.properties).toBeDefined();
    expect(bd.configurationSchema.properties).toHaveProperty("placeholder");

    expect(bd.uiSchema).toBeDefined();
    expect(bd.uiSchema).toHaveProperty("placeholder");
  });
});

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

  afterAll(() => {
    stopSearchBarRelocator();
  });

  it("registers the block and renders the placeholder marker", () => {
    const widget = document.createElement("search-bar-widget");
    document.body.appendChild(widget);

    expect(widget.textContent).toBe(SEARCH_BAR_PLACEHOLDER);
  });

  // Staffbase rejects a bundle as "Not a valid widget bundle" unless the
  // definition carries a well-formed configuration schema (with a `properties`
  // object) and a uiSchema. Guard that shape so it can never regress to `{}`.
  it("exposes a well-formed configurationSchema and uiSchema for Staffbase", () => {
    const definition = capturedDefinition;
    expect(definition).not.toBeNull();

    const schema = definition!.blockDefinition.configurationSchema;
    expect(schema).toBeDefined();
    expect(typeof schema.properties).toBe("object");
    expect(schema.properties).not.toBeNull();

    expect(definition!.blockDefinition.uiSchema).toBeDefined();
  });
});

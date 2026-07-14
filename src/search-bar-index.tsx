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

import { BlockFactory, BlockDefinition, ExternalBlockDefinition, BaseBlock } from "widget-sdk";
import { SEARCH_BAR_PLACEHOLDER, startSearchBarRelocator } from "./search-bar-relocator";
import pkg from "../package.json";

/**
 * Starts the relocator as this bundle loads, mirroring how the table widget
 * installs its editor injector. It watches the document for the marker (which
 * the block below renders) and the hosting application's search bar, and moves
 * the search bar into the marker's place once both exist.
 *
 * Exported only so tests can dispose of the observer on teardown; production
 * code never needs to call it.
 */
export const stopSearchBarRelocator = startSearchBarRelocator();

/**
 * Inline 32x32 magnifier icon (base64 data URI) shown on the widget
 * installation page. Kept inline instead of importing an `.svg` asset so this
 * entry does not depend on the repo's `.svg` webpack loader rules.
 */
const ICON_DATA_URI =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMyMzM4NDgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMSIgY3k9IjExIiByPSI3Ii8+PGxpbmUgeDE9IjIxIiB5MT0iMjEiIHgyPSIxNi42NSIgeTI9IjE2LjY1Ii8+PC9zdmc+";

/**
 * Creates the custom-element class registered for this block. The block does
 * nothing but render the marker text; the actual search-bar relocation is
 * handled by the module-level {@link startSearchBarRelocator} side effect.
 *
 * ```html
 * <search-bar-widget></search-bar-widget>
 * ```
 */
const factory: BlockFactory = (BaseBlockClass, _widgetApi) => {
  return class SearchBarWidgetBlock extends BaseBlockClass implements BaseBlock {
    public constructor() {
      super();
    }

    public renderBlock(container: HTMLElement): void {
      container.textContent = SEARCH_BAR_PLACEHOLDER;
    }
  };
};

/**
 * The definition of the block, to let it successfully register to the hosting
 * application. It has no configurable attributes.
 */
const blockDefinition: BlockDefinition = {
  name: "search-bar-widget",
  factory: factory,
  attributes: [],
  blockLevel: "block",
  configurationSchema: {},
  label: "Search Bar Placement",
  iconUrl: ICON_DATA_URI,
};

/**
 * Wrapping definition, which defines meta information about the block.
 */
const externalBlockDefinition: ExternalBlockDefinition = {
  blockDefinition,
  author: pkg.author,
  version: pkg.version,
};

/**
 * This call is mandatory to register the block in the hosting application.
 */
window.defineBlock(externalBlockDefinition);

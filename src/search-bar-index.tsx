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

import React, { ReactElement } from "react";
import ReactDOM from "react-dom/client";

import { BlockFactory, BlockDefinition, ExternalBlockDefinition, BaseBlock, BlockAttributes } from "widget-sdk";
import { JSONSchema7 } from "json-schema";
import { UiSchema } from "@rjsf/utils";
import { SEARCH_BAR_PLACEHOLDER, SEARCH_BAR_WIDGET_TAG, startSearchBarRelocator } from "./search-bar-relocator";
import pkg from "../package.json";

/**
 * Define which attributes are handled by the widget. This should also be
 * reflected in the configuration schema below.
 */
const widgetAttributes: string[] = ["placeholder"];

/**
 * Starts the relocator as this bundle loads, mirroring how the table widget
 * installs its editor injector. It watches the document for the block and the
 * hosting application's search bar, and moves the search bar into the block's
 * place once both exist.
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
 * React component. Renders the marker text (the configurable placeholder,
 * falling back to the default token) that shows where the search bar will be
 * placed until the relocator swaps it in.
 */
export type SearchBarWidgetProps = BlockAttributes & {
  placeholder?: string;
};

export const SearchBarWidget = ({ placeholder }: SearchBarWidgetProps): ReactElement => {
  const text = placeholder && placeholder.trim().length > 0 ? placeholder : SEARCH_BAR_PLACEHOLDER;
  return <span>{text}</span>;
};

/**
 * schema used for generation of the configuration dialog
 * see https://rjsf-team.github.io/react-jsonschema-form/docs/ for documentation
 */
const configurationSchema: JSONSchema7 = {
  properties: {
    placeholder: {
      type: "string",
      title: "Platzhalter-Text",
      default: SEARCH_BAR_PLACEHOLDER,
    },
  },
};

/**
 * schema to add more customization to the form's look and feel
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema
 */
const uiSchema: UiSchema = {
  placeholder: {
    "ui:help": "Text, der angezeigt wird, bis die Suchleiste an diese Stelle verschoben wurde.",
  },
};

/**
 * This factory creates the class which is registered with the tagname in the
 * `custom element registry`. Gets the parental class and a set of helper
 * utilities provided by the hosting application.
 */
const factory: BlockFactory = (BaseBlockClass, _widgetApi) => {
  /**
   *  <search-bar-widget placeholder="[[SEARCH_BAR_PLACEMENT]]"></search-bar-widget>
   */
  return class SearchBarWidgetBlock extends BaseBlockClass implements BaseBlock {
    private _root: ReactDOM.Root | null = null;

    public constructor() {
      super();
    }

    private get props(): SearchBarWidgetProps {
      const attrs = this.parseAttributes<SearchBarWidgetProps>();
      return {
        ...attrs,
        contentLanguage: this.contentLanguage,
      };
    }

    public renderBlock(container: HTMLElement): void {
      this._root ??= ReactDOM.createRoot(container);
      this._root.render(<SearchBarWidget {...this.props} />);
    }

    /**
     * The observed attributes, where the widget reacts on.
     */
    public static get observedAttributes(): string[] {
      return widgetAttributes;
    }

    /**
     * Callback invoked on every change of an observed attribute. Call the
     * parental method before applying own logic.
     */
    public attributeChangedCallback(...args: [string, string | undefined, string | undefined]): void {
      super.attributeChangedCallback.apply(this, args);
    }
  };
};

/**
 * The definition of the block, to let it successfully register to the hosting
 * application.
 */
const blockDefinition: BlockDefinition = {
  name: SEARCH_BAR_WIDGET_TAG,
  factory: factory,
  attributes: widgetAttributes,
  blockLevel: "block",
  configurationSchema: configurationSchema,
  uiSchema: uiSchema,
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

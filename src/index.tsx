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

import { startWidget } from "@shared/dev-mode/start-widget";
import { setPublicPathFromBundle } from "@shared/public-path";

// Muss vor jedem dynamischen `import()` laufen (ExcelJS beim .xlsx-Upload),
// damit die Chunks vom CDN und nicht von der Hosting-Seite geladen werden.
setPublicPathFromBundle("table-widget.js");
import React from "react";
import ReactDOM from "react-dom/client";

import { BlockFactory, BlockDefinition, ExternalBlockDefinition, BaseBlock } from "widget-sdk";
import { TableWidgetProps, TableWidget } from "./table-widget";
import { configurationSchema, uiSchema } from "./configuration-schema";
import { startTableEditorInjector } from "./table-editor-injector";
import { getTranslationRegistry } from "@shared/translation/registry";
import { tableTranslationProvider } from "./translation-provider";
import icon from "../resources/table-widget.svg";
import pkg from '../package.json'

/**
 * Define which attributes are handled by the widget. This should be also reflected in configuration schema
 */
const widgetAttributes: string[] = [
  'tabledata',
];

/**
 * Starts watching the whole document for the RJSF-rendered `tabledata`
 * textarea (config dialog) so the custom grid editor can be mounted next to
 * it. There is no official Staffbase SDK hook for the config dialog, so this
 * widget bundle's own module load is the only place to install this side
 * effect (see `table-editor-injector.ts`). Safe to run unconditionally: it
 * is a no-op (beyond the cheap `MutationObserver`) in any context where the
 * config dialog never appears, e.g. when the bundle only renders the
 * read-only widget on a live page.
 *
 * Exported only so tests can dispose of the observer on teardown (jsdom
 * tears down its own `window` between test files, which would otherwise
 * cause a lingering `MutationObserver` callback to throw); production code
 * never needs to call this.
 */
export const stopTableEditorInjector = startTableEditorInjector();

/**
 * Installed unconditionally at module load: on a live content page the
 * translation endpoint is never called, so registering costs nothing there.
 * Exported so tests can unregister.
 */
export const stopTranslationProvider = getTranslationRegistry().register(tableTranslationProvider);

/**
 * This factory creates the class which is registered with the tagname in the `custom element registry`
 * Gets the parental class and a set of helper utilities provided by the hosting application.
 */
const factory: BlockFactory = (BaseBlockClass, _widgetApi) => {
  /**
   *  <table-widget tabledata='[["","Spalte 1"],["Zeile 1",""]]'></table-widget>
   */
  return class TableWidgetBlock extends BaseBlockClass implements BaseBlock {
    private _root: ReactDOM.Root | null = null;

    public constructor() {
      super();
    }

    private get props(): TableWidgetProps {
      const attrs = this.parseAttributes<TableWidgetProps>();
      return {
        ...attrs,
        contentLanguage: this.contentLanguage,
      };
    }

    public renderBlock(container: HTMLElement): void {
      this._root ??= ReactDOM.createRoot(container);
      this._root.render(<TableWidget {...this.props} />);
    }

    /**
     * The observed attributes, where the widgets reacts on.
     */
    public static get observedAttributes(): string[] {
      return widgetAttributes;
    }

    /**
     * Callback invoked on every change of an observed attribute. Call the parental method before
     * applying own logic.
     */
    public attributeChangedCallback(...args: [string, string | undefined, string | undefined]): void {
      super.attributeChangedCallback.apply(this, args);
    }
  };
};

/**
 * The definition of the block, to let it successful register to the hosting application
 */
const blockDefinition: BlockDefinition = {
    name: "table-widget",
    factory: factory,
    attributes: widgetAttributes,
    blockLevel: 'block',
    configurationSchema: configurationSchema,
    uiSchema: uiSchema,
    label: 'Table Widget',
    iconUrl: icon
};

/**
 * Wrapping definition, which defines meta informations about the block.
 */
const externalBlockDefinition: ExternalBlockDefinition = {
  blockDefinition,
  author: pkg.author,
  version: pkg.version
};

/**
 * Registers the block with the hosting application.
 *
 * The call goes through `startWidget`, which first asks whether a local
 * development server serves this widget. On virtually every browser the answer
 * is no and this registers immediately; on the developer's machine the local
 * bundle takes over and registers instead. Only ever one of the two, a block
 * name cannot be claimed twice.
 */
void startWidget({
  name: "table-widget",
  version: pkg.version,
  register: () => window.defineBlock(externalBlockDefinition),
});

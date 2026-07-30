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

import "./public-path";
import React from "react";
import ReactDOM from "react-dom/client";

import { BlockFactory, BlockDefinition, ExternalBlockDefinition, BaseBlock } from "widget-sdk";
import { TableWidgetProps, TableWidget } from "./table-widget";
import { configurationSchema, uiSchema } from "./configuration-schema";
import { startTableEditorInjector } from "./table-editor-injector";
import { startTinyMceBridge } from "./tinymce-bridge";
import { SLOT_SELECTOR, tableModelToSlotMarkup } from "./table-dom";
import { parseTableModel, serializeTableModel } from "./table-model";
import { isTablePayload } from "./table-payload";
import { asTableMode, writesSlots } from "./table-mode";
import icon from "../resources/table-widget.svg";
import pkg from '../package.json'

console.log('I GET LOADED!');

/**
 * Define which attributes are handled by the widget. This should be also reflected in configuration schema
 */
const widgetAttributes: string[] = [
  'tabledata',
  'tablemode',
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
 * Bridges the page editor (TinyMCE) so the table is stored as translatable
 * content of the widget element rather than only in its configuration — see
 * `tinymce-bridge.ts` for why the widget SDK cannot do this itself.
 *
 * Installed here, at module load, for the same reason as the injector above:
 * this runs whether or not any widget instance exists, which is exactly what is
 * needed to reach an editor that has not been given a widget yet.
 *
 * Exported only so tests can stop the lookup on teardown.
 */
export const stopTinyMceBridge = startTinyMceBridge();

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
    /**
     * Own container for the React tree. Deliberately not the container the SDK
     * hands over: that may be the element itself, and a React root owns its
     * container's entire child list — it would wipe the slot node on every
     * commit. With a nested mount the two never fight over the same children.
     */
    private _mount: HTMLElement | null = null;
    /**
     * Slot markup that came from the stored document, captured before anything
     * rendered over it. Only this form can have been rewritten by a content
     * translation, so it is kept strictly apart from the markup this class
     * generates itself — the generated form is just the attribute in another
     * shape and must never masquerade as translated content.
     */
    private _captured: string | null = null;
    /** The slot node this class generated, as opposed to one the document had. */
    private _slotNode: Element | null = null;
    private _captureDone = false;

    public constructor() {
      super();
    }

    /**
     * Reads the slot markup the document delivered, at most once.
     *
     * Called from every path that touches the slots, because the order of the
     * lifecycle callbacks cannot be relied on: upgrading an element runs
     * `attributeChangedCallback` *before* `connectedCallback`, so capturing in
     * the latter would happen after the first render had already regenerated
     * the slots from the attribute — destroying translated content before ever
     * reading it. Nothing is recorded while no slot node is present, so child
     * nodes that arrive later can still be picked up.
     */
    private captureFromDocument(): void {
      if (this._captureDone) return;
      const slot = this.querySelector(SLOT_SELECTOR);
      if (!slot) return;
      if (slot !== this._slotNode) this._captured = slot.outerHTML;
      this._captureDone = true;
    }

    private get props(): TableWidgetProps {
      this.captureFromDocument();
      const attrs = this.parseAttributes<TableWidgetProps>();
      return {
        ...attrs,
        // Empty string rather than `undefined`: `BlockAttributes` is indexed as
        // `string | number | boolean`, and an absent slot reads as falsy anyway.
        tableslots: this._captured ?? "",
        contentLanguage: this.contentLanguage,
      };
    }

    /**
     * Runs after the config dialog closed and the attributes were applied. The
     * only lifecycle hook that gives access to *this* element while the author
     * is editing, so it is where the translatable child content is written.
     */
    public parseConfig<T extends Record<string, unknown>>(attributes: T): Record<string, string> {
      const config = super.parseConfig(attributes);
      // Re-serialize on every save, not just when the grid editor produced a
      // new value: an instance whose author only touched another field would
      // otherwise keep its raw-JSON attribute, which is exactly the form the
      // translation pipeline truncates. `parseTableModel` reads both forms and
      // `serializeTableModel` always encodes, so this is idempotent.
      const normalized = serializeTableModel(parseTableModel(config.tabledata));
      // An author's edit supersedes whatever this instance carried, including
      // slots a translation had rewritten — those describe the old table. The
      // capture is closed at the same time so the stale node cannot be read
      // back in on the next render.
      this._captured = null;
      this._captureDone = true;
      return { ...config, tabledata: normalized };
    }

    /**
     * The default implementation draws a generic placeholder, which means none
     * of this class's rendering runs while the author is in the editor — and
     * therefore no slot node exists there. Whatever the editor serializes on
     * save, it can only keep child nodes that are actually present, so the
     * editor has to run the same path as a live page.
     */
    public renderBlockInEditor(container: HTMLElement): void {
      this.renderBlock(container);
    }

    /**
     * Rewrites a legacy raw-JSON `tabledata` into the encoded payload on the
     * element itself. `parseConfig` is the documented channel for this, but it
     * is not observably called in every host, and a raw-JSON attribute is the
     * form the translation pipeline truncates.
     *
     * Converges after a single pass: the value written is a payload, so the
     * `attributeChangedCallback` it triggers takes the early return.
     */
    private normalizeStoredData(): void {
      const raw = this.getAttribute("tabledata");
      if (raw === null || raw === "" || isTablePayload(raw)) return;
      this.setAttribute("tabledata", serializeTableModel(parseTableModel(raw)));
    }

    public renderBlock(container: HTMLElement): void {
      this.normalizeStoredData();
      // Anything that rewrites the element's children — the host, or a
      // translation writing back into the page — detaches the mount, and a root
      // bound to a detached node renders nowhere. Re-create both when that
      // happened instead of silently rendering into limbo.
      if (!this._mount || this._mount.parentNode !== container) {
        this._root?.unmount();
        this._root = null;
        this._mount = document.createElement("div");
        container.appendChild(this._mount);
      }
      this._root ??= ReactDOM.createRoot(this._mount);
      this._root.render(<TableWidget {...this.props} />);
      this.syncSlotNode();
    }

    /**
     * Keeps the element's child content in the shape it is meant to be stored
     * in. Runs after every render because that is also what follows an
     * attribute change, so the slots can never go stale against `tabledata`.
     */
    private syncSlotNode(): void {
      this.captureFromDocument();
      const existing = this.querySelector(SLOT_SELECTOR);
      if (!writesSlots(asTableMode(this.getAttribute("tablemode")))) {
        existing?.remove();
        this._slotNode = null;
        return;
      }
      // Content the document delivered stays untouched: it is the only form a
      // translation can have rewritten, and regenerating it from the attribute
      // would replace the translation with the source language.
      if (this._captured !== null) return;

      const template = document.createElement("template");
      template.innerHTML = tableModelToSlotMarkup(
        parseTableModel(this.getAttribute("tabledata") ?? undefined),
      );
      const slot = template.content.firstElementChild;
      if (!slot) return;
      // Both sides are parser-normalized here, so this compares content rather
      // than incidental differences in quoting or attribute order.
      if (existing && existing.outerHTML === slot.outerHTML) return;
      if (existing) {
        existing.replaceWith(slot);
      } else {
        this.insertBefore(slot, this.firstChild);
      }
      this._slotNode = slot;
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
 * This call is mandatory to register the block in the hosting application.
 */
window.defineBlock(externalBlockDefinition);

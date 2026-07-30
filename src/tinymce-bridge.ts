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

import { openTableEditor } from "./table-editor-modal";
import { readTableModel, serializeTableModel, TableModel } from "./table-model";
import { SLOT_ATTRIBUTE, tableModelToSlotMarkup, parseSlotMarkup } from "./table-dom";
import { t } from "./i18n";

/**
 * Writes the table into the **page content** instead of the widget config.
 *
 * Why this exists: the widget SDK offers no way to store translatable content.
 * Its only documented channel is the attribute set, and the page editor
 * serializes an external widget from its own document model — tag name plus
 * attributes — so child nodes written at runtime never reach the save request.
 * Proven by the editor's own POST body, which emitted the element empty even
 * with the slot node provably present in the browser DOM.
 *
 * The page editor is TinyMCE, and TinyMCE *is* reachable from this bundle's
 * module scope. That gives three levers the SDK does not have:
 *
 *  1. `schema.addValidChildren` — teaches the model that `<table-widget>` may
 *     carry children at all, so they survive parsing and serialization.
 *  2. `undoManager.transact` — writes through the editor's own API, i.e. into
 *     the model rather than past it, and keeps undo/dirty state honest.
 *  3. `GetContent` / `PostProcess` — the serialized string on its way out. This
 *     is the belt-and-braces path: it lands the content even if the schema
 *     still drops the children, because it edits the output, not the model.
 *
 * The widget element stays in the content. It is what the author inserts, what
 * makes the bundle load, and what renders the real table on a live page. This
 * bridge only fills it with the translatable representation.
 */

const WIDGET_TAG = "table-widget";

/**
 * Matches one widget element and its content. Widgets never nest, so a lazy
 * body is unambiguous, and the attribute values this widget uses (a base64
 * payload and a mode keyword) can never contain `>`.
 */
const WIDGET_ELEMENT = new RegExp(`<${WIDGET_TAG}\\b([^>]*)>([\\s\\S]*?)</${WIDGET_TAG}>`, "gi");

/** Also match the self-closed form some serializers emit for empty elements. */
const WIDGET_SELF_CLOSED = new RegExp(`<${WIDGET_TAG}\\b([^>]*?)/>`, "gi");

/**
 * Children the model must accept on the widget element. Without this TinyMCE
 * treats an unknown element as childless and discards everything inside it.
 */
const VALID_CHILDREN = `+${WIDGET_TAG}[div|table|thead|tbody|tfoot|tr|th|td|span|br]`;

/**
 * Makes the stored (normally hidden) slot table visible while authoring, so the
 * author sees their table in the content flow rather than an empty box. Only
 * the visibility differs between editor and live page — there is a single
 * representation, which is the point.
 */
const editorStyle = (): string => `
${WIDGET_TAG} {
  display: block;
  position: relative;
  margin: 4px 0;
  padding: 8px;
  border: 1px dashed #b7bcc3;
  background: #fafbfc;
}
${WIDGET_TAG}::before {
  content: ${JSON.stringify(t("editorPreviewHint"))};
  display: block;
  margin-bottom: 6px;
  font: 12px/1.4 -apple-system, "Segoe UI", sans-serif;
  color: #6b7280;
}
${WIDGET_TAG} [${SLOT_ATTRIBUTE}] { display: block !important; }
${WIDGET_TAG} table { border-collapse: collapse; width: 100%; font: 13px/1.4 -apple-system, "Segoe UI", sans-serif; }
${WIDGET_TAG} th, ${WIDGET_TAG} td { border: 1px solid #d0d5dd; padding: 4px 8px; }
${WIDGET_TAG} [data-covered] { opacity: 0.45; }
`;

/* ------------------------------------------------------------------ *
 * The slice of the TinyMCE API this bridge uses.                     *
 * Declared structurally: the editor is the host's dependency, not    *
 * ours, so there are no types to import and nothing may be assumed   *
 * beyond what is probed for at runtime.                              *
 * ------------------------------------------------------------------ */

interface TinyMceContentEvent {
  content?: string;
  format?: string;
}

export interface TinyMceEditor {
  initialized?: boolean;
  getBody?: () => HTMLElement | null | undefined;
  dom?: { addStyle?: (css: string) => void };
  schema?: { addValidChildren?: (spec: string) => void };
  undoManager?: { transact?: (fn: () => void) => void };
  setDirty?: (state: boolean) => void;
  /** TinyMCE 5 name. */
  fire?: (name: string, args?: unknown) => unknown;
  /** TinyMCE 6+ name. */
  dispatch?: (name: string, args?: unknown) => unknown;
  on?: (name: string, handler: (event: never) => void) => unknown;
}

export interface TinyMceGlobal {
  editors?: TinyMceEditor[];
  on?: (name: string, handler: (event: { editor?: TinyMceEditor }) => void) => unknown;
}

/* ------------------------------------------------------------------ *
 * Content rewriting                                                  *
 * ------------------------------------------------------------------ */

/**
 * Reads one attribute out of a raw attribute string, entity-decoded.
 *
 * Parsed in a document without a browsing context on purpose: custom elements
 * do not upgrade there, so reading an attribute can never run this widget's own
 * constructor as a side effect.
 */
const readAttribute = (rawAttributes: string, name: string): string | null => {
  const doc = document.implementation.createHTMLDocument("");
  doc.body.innerHTML = `<${WIDGET_TAG}${rawAttributes}></${WIDGET_TAG}>`;
  return doc.body.firstElementChild?.getAttribute(name) ?? null;
};

/**
 * Fills every widget element in a serialized content string with the
 * translatable slot markup derived from its own `tabledata` attribute.
 *
 * Idempotent, and never overwrites content that is already there: existing
 * children are the only form a translation can have rewritten, so replacing
 * them would swap a translated table back to the source language.
 *
 * Exported for tests, and because it is the single place that defines what
 * "the widget carries its content" means on the wire.
 */
export function injectSlotsIntoContent(content: string): string {
  if (!content || content.toLowerCase().indexOf(`<${WIDGET_TAG}`) === -1) return content;

  const slotsFor = (rawAttributes: string): string | null => {
    const read = readTableModel(readAttribute(rawAttributes, "tabledata") ?? undefined);
    return read.status === "ok" ? tableModelToSlotMarkup(read.model) : null;
  };

  return content
    .replace(WIDGET_SELF_CLOSED, (whole, rawAttributes: string) => {
      const slots = slotsFor(rawAttributes);
      return slots === null ? whole : `<${WIDGET_TAG}${rawAttributes}>${slots}</${WIDGET_TAG}>`;
    })
    .replace(WIDGET_ELEMENT, (whole, rawAttributes: string, inner: string) => {
      if (inner.includes(SLOT_ATTRIBUTE)) return whole;
      const slots = slotsFor(rawAttributes);
      return slots === null ? whole : `<${WIDGET_TAG}${rawAttributes}>${slots}${inner}</${WIDGET_TAG}>`;
    });
}

/* ------------------------------------------------------------------ *
 * Editor wiring                                                      *
 * ------------------------------------------------------------------ */

/** The model an element currently represents, slots first — as at runtime. */
const modelOf = (element: Element): TableModel =>
  parseSlotMarkup(element.innerHTML) ??
  readTableModel(element.getAttribute("tabledata") ?? undefined).model;

const notifyChanged = (editor: TinyMceEditor): void => {
  editor.setDirty?.(true);
  // Name differs between TinyMCE 5 and 6; whichever exists is the right one.
  (editor.dispatch ?? editor.fire)?.call(editor, "change");
};

/**
 * Writes a model onto a widget element inside the editor.
 *
 * Both forms are written: the attribute stays the authoritative source for
 * editing and the fallback for rendering, the children are what a translation
 * can reach. Wrapped in `transact` so it is one undo step and the editor
 * registers the change instead of finding a silently mutated DOM.
 */
const applyModel = (editor: TinyMceEditor, element: Element, model: TableModel): void => {
  const write = (): void => {
    element.setAttribute("tabledata", serializeTableModel(model));
    element.innerHTML = tableModelToSlotMarkup(model);
  };
  const transact = editor.undoManager?.transact;
  if (typeof transact === "function") transact.call(editor.undoManager, write);
  else write();
  notifyChanged(editor);
};

const widgetAt = (target: EventTarget | null): Element | null => {
  if (!(target instanceof Element)) return null;
  return target.closest(WIDGET_TAG);
};

/**
 * Teaches the model that the widget may carry children.
 *
 * Must happen before the editor parses its content, otherwise the children of a
 * stored — possibly translated — table are discarded on load and the only thing
 * left to render the editor preview from is the source-language attribute.
 * `PreInit` is that moment: the parser and schema exist, the content does not
 * yet. Idempotent per instance.
 */
const attachSchema = (editor: TinyMceEditor, done: WeakSet<TinyMceEditor>): void => {
  if (done.has(editor)) return;
  done.add(editor);
  editor.schema?.addValidChildren?.(VALID_CHILDREN);
  diagnostics.schemasPatched += 1;
};

/**
 * Installs the bridge on one editor instance. Idempotent per instance: the
 * host may fire `init` more than once for the same editor.
 */
const attach = (editor: TinyMceEditor, attached: WeakSet<TinyMceEditor>): void => {
  if (attached.has(editor)) return;
  attached.add(editor);
  diagnostics.editorsAttached += 1;

  editor.dom?.addStyle?.(editorStyle());

  // Content leaving the editor, whichever way the host asks for it. Both hooks
  // hand over the same mutable string; the injection is idempotent, so seeing it
  // twice is harmless and missing one would lose the content.
  const fillOnWayOut = (event: TinyMceContentEvent): void => {
    if (typeof event.content !== "string") return;
    if (event.format !== undefined && event.format !== "html") return;
    const filled = injectSlotsIntoContent(event.content);
    diagnostics.serializations += 1;
    if (filled !== event.content) diagnostics.contentFilled += 1;
    diagnostics.lastContent = filled;
    event.content = filled;
  };
  editor.on?.("GetContent", fillOnWayOut as (event: never) => void);
  editor.on?.("PostProcess", fillOnWayOut as (event: never) => void);

  const openFor = (element: Element): void => {
    openTableEditor({
      initial: modelOf(element),
      onSave: (model) => applyModel(editor, element, model),
    });
  };

  editor.on?.("dblclick", ((event: { target?: EventTarget | null }) => {
    const element = widgetAt(event.target ?? null);
    if (element) openFor(element);
  }) as (event: never) => void);

  // Existing instances get their content filled in right away, so an author who
  // saves without ever opening the editor still stores a translatable table.
  const body = editor.getBody?.();
  if (body) {
    body.querySelectorAll(WIDGET_TAG).forEach((element) => {
      if (element.querySelector(`[${SLOT_ATTRIBUTE}]`)) return;
      const read = readTableModel(element.getAttribute("tabledata") ?? undefined);
      if (read.status === "ok") element.innerHTML = tableModelToSlotMarkup(read.model);
    });
  }
};

/* ------------------------------------------------------------------ *
 * Discovery                                                          *
 * ------------------------------------------------------------------ */

/**
 * Finds TinyMCE without assuming which document this bundle ended up in: the
 * widget bundle may be loaded in the page that hosts the editor, or inside a
 * frame next to it. Cross-origin access throws, which is a definitive "not
 * here" rather than an error worth surfacing.
 */
export const findTinyMce = (): TinyMceGlobal | null => {
  for (const scope of reachableScopes()) {
    const found = (scope as unknown as { tinymce?: TinyMceGlobal }).tinymce;
    if (found) return found;
  }
  return null;
};

/**
 * The windows this bundle may share with the editor, deduplicated. Reading
 * `parent`/`top` across origins throws, which is a definitive "not here".
 */
export function reachableScopes(): Window[] {
  const scopes: Window[] = [];
  for (const candidate of [window, window.parent, window.top]) {
    try {
      if (candidate && !scopes.includes(candidate)) {
        // Touch the property to provoke a cross-origin failure here rather than
        // at every later use.
        void (candidate as unknown as { tinymce?: unknown }).tinymce;
        scopes.push(candidate);
      }
    } catch {
      // Cross-origin frame — unusable.
    }
  }
  return scopes;
}

/**
 * Catches the moment TinyMCE is assigned to a window.
 *
 * Polling is not good enough and was the original defect: the host loads TinyMCE
 * lazily, only once an editor route is rendered, while this bundle loads far
 * earlier. Any bounded poll expires before an author ever opens the page editor,
 * and an unbounded one would run forever on every live content page. Replacing
 * the property with an accessor costs nothing and fires whenever the assignment
 * happens — before, during or long after this call.
 *
 * @returns a function restoring the plain property, or `null` when the property
 * cannot be intercepted (already non-configurable, or a hostile scope).
 */
function interceptGlobal(scope: Window, onFound: (tinymce: TinyMceGlobal) => void): (() => void) | null {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(scope, "tinymce");
    if (descriptor && descriptor.configurable === false) return null;

    let current = (scope as unknown as { tinymce?: TinyMceGlobal }).tinymce;
    const define = (definition: PropertyDescriptor): void =>
      void Object.defineProperty(scope, "tinymce", { configurable: true, enumerable: true, ...definition });

    define({
      get: () => current,
      set: (next: TinyMceGlobal | undefined) => {
        current = next;
        if (next) onFound(next);
      },
    });

    return () => define({ writable: true, value: current });
  } catch {
    return null;
  }
}

/**
 * What the bridge has actually managed to do, readable from the browser console
 * via `window.__tableWidgetBridge`.
 *
 * This workaround depends on host internals that no contract covers, so "did it
 * attach?" and "did it fill the content?" must be answerable without guessing
 * from an empty save payload.
 */
export const diagnostics = {
  /** Windows whose `tinymce` property the bridge is watching. */
  scopesWatched: 0,
  /** True once the TinyMCE global was found in any scope. */
  tinymceFound: false,
  /** Editors the bridge is fully attached to. */
  editorsAttached: 0,
  /** Editors whose schema was taught to keep the widget's children. */
  schemasPatched: 0,
  /** `GetContent`/`PostProcess` passes the bridge has seen. */
  serializations: 0,
  /** Of those, how many the bridge actually added content to. */
  contentFilled: 0,
  /** The last string handed on to the host. */
  lastContent: null as string | null,
};

const publishDiagnostics = (): void => {
  (window as unknown as Record<string, unknown>).__tableWidgetBridge = diagnostics;
};

/**
 * Starts watching for TinyMCE instances and bridges each one.
 *
 * Safe to call unconditionally at module load: with no editor in the page it
 * installs one property accessor per reachable window and does nothing else.
 *
 * @param lookup how to obtain the TinyMCE global; injectable for tests.
 * @param scopes windows to intercept the global on; injectable for tests.
 * @returns a cleanup function that stops watching. Already-bridged editors keep
 * their handlers — the host owns their lifecycle, not this bundle.
 */
export function startTinyMceBridge(
  lookup: () => TinyMceGlobal | null = findTinyMce,
  scopes: Window[] = reachableScopes(),
): () => void {
  const attached = new WeakSet<TinyMceEditor>();
  const schemaPatched = new WeakSet<TinyMceEditor>();
  const bound = new WeakSet<TinyMceGlobal>();
  const restores: (() => void)[] = [];

  publishDiagnostics();

  const stop = (): void => {
    restores.splice(0).forEach((restore) => restore());
    diagnostics.scopesWatched = 0;
  };

  const attachWhenReady = (editor: TinyMceEditor | undefined): void => {
    if (!editor) return;
    if (editor.initialized) {
      // Already running: the content is parsed, so the schema patch can no
      // longer protect it. Applying it anyway keeps later edits from being
      // dropped on the next round-trip.
      attachSchema(editor, schemaPatched);
      attach(editor, attached);
      return;
    }
    editor.on?.("PreInit", (() => attachSchema(editor, schemaPatched)) as (event: never) => void);
    editor.on?.("init", (() => {
      attachSchema(editor, schemaPatched);
      attach(editor, attached);
    }) as (event: never) => void);
  };

  const bind = (tinymce: TinyMceGlobal): void => {
    if (bound.has(tinymce)) return;
    bound.add(tinymce);
    diagnostics.tinymceFound = true;
    // `AddEditor` first: an editor created while the existing ones are being
    // walked must not slip through the gap between the two.
    tinymce.on?.("AddEditor", (event) => attachWhenReady(event.editor));
    (tinymce.editors ?? []).forEach(attachWhenReady);
  };

  // Watch every reachable window, whether or not TinyMCE is there yet. The host
  // loads it lazily, so "not there now" says nothing about later.
  for (const scope of scopes) {
    const restore = interceptGlobal(scope, bind);
    if (restore) {
      restores.push(restore);
      diagnostics.scopesWatched += 1;
    }
  }

  // Already loaded — the accessor above only fires on future assignments.
  const found = lookup();
  if (found) bind(found);

  return stop;
}

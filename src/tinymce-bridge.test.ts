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

import {
  diagnostics,
  injectSlotsIntoContent,
  startTinyMceBridge,
  TinyMceEditor,
  TinyMceGlobal,
} from "./tinymce-bridge";
import { serializeTableModel } from "./table-model";
import { parseSlotMarkup, SLOT_ATTRIBUTE } from "./table-dom";

const MODEL = {
  data: [
    ["", "Spalte 1"],
    ["Zeile 1", "Test 1.1"],
  ],
  merges: [],
  formats: {},
  sort: null,
};

const payload = (): string => serializeTableModel(MODEL);

/** Minimal stand-in for the slice of the TinyMCE API the bridge touches. */
class FakeEditor implements TinyMceEditor {
  public initialized = true;
  public dirty = false;
  public readonly styles: string[] = [];
  public readonly validChildren: string[] = [];
  public readonly events: string[] = [];
  private readonly handlers = new Map<string, ((event: unknown) => void)[]>();
  private readonly body: HTMLElement;

  public constructor(bodyHtml = "") {
    this.body = document.createElement("div");
    this.body.innerHTML = bodyHtml;
  }

  public getBody = (): HTMLElement => this.body;
  public dom = { addStyle: (css: string): void => void this.styles.push(css) };
  public schema = {
    addValidChildren: (spec: string): void => void this.validChildren.push(spec),
  };
  public undoManager = { transact: (fn: () => void): void => fn() };
  public setDirty = (state: boolean): void => void (this.dirty = state);
  public dispatch = (name: string): void => void this.events.push(name);

  public on = (name: string, handler: (event: never) => void): void => {
    const list = this.handlers.get(name) ?? [];
    list.push(handler as (event: unknown) => void);
    this.handlers.set(name, list);
  };

  public emit(name: string, event: unknown): void {
    (this.handlers.get(name) ?? []).forEach((handler) => handler(event));
  }
}

const globalFor = (...editors: TinyMceEditor[]): TinyMceGlobal => ({
  editors,
  on: () => undefined,
});

describe("injectSlotsIntoContent", () => {
  it("leaves content without a widget untouched", () => {
    const content = "<p>Hello</p>";
    expect(injectSlotsIntoContent(content)).toBe(content);
  });

  it("fills an empty widget element from its own attribute", () => {
    const content = `<table-widget tabledata="${payload()}" tablemode="slots"></table-widget><p>&nbsp;</p>`;
    const filled = injectSlotsIntoContent(content);

    const parsed = parseSlotMarkup(filled);
    expect(parsed?.data).toEqual(MODEL.data);
    // Everything around the widget survives verbatim.
    expect(filled).toContain('tablemode="slots"');
    expect(filled).toContain("<p>&nbsp;</p>");
  });

  it("fills the self-closed form too", () => {
    const content = `<table-widget tabledata="${payload()}"/>`;
    expect(parseSlotMarkup(injectSlotsIntoContent(content))?.data).toEqual(MODEL.data);
  });

  it("is idempotent", () => {
    const content = `<table-widget tabledata="${payload()}"></table-widget>`;
    const once = injectSlotsIntoContent(content);
    expect(injectSlotsIntoContent(once)).toBe(once);
  });

  it("never overwrites content that is already there", () => {
    // What a translated page looks like: children in the target language, the
    // attribute still holding the source. Regenerating would undo the
    // translation, so the existing children must win.
    const translated = `<table-widget tabledata="${payload()}"><div data-table aria-hidden="true" style="display:none"><table><tr><th data-cell="0,0"></th><th data-cell="0,1">Column 1</th></tr><tr><th data-cell="1,0">Row 1</th><td data-cell="1,1">Test 1.1</td></tr></table></div></table-widget>`;
    expect(injectSlotsIntoContent(translated)).toBe(translated);
  });

  it("leaves a widget whose attribute is unreadable alone", () => {
    // The truncated form the translation pipeline used to produce. Nothing can
    // be recovered from it, and inventing a table would hide the data loss.
    const content = `<table-widget tabledata="{"></table-widget>`;
    expect(injectSlotsIntoContent(content)).toBe(content);
  });
});

describe("startTinyMceBridge", () => {
  it("teaches the schema that the widget may carry children", () => {
    const editor = new FakeEditor();
    startTinyMceBridge(() => globalFor(editor))();
    expect(editor.validChildren.join(" ")).toContain("+table-widget[");
  });

  it("makes the stored table visible while authoring", () => {
    const editor = new FakeEditor();
    startTinyMceBridge(() => globalFor(editor))();
    expect(editor.styles.join(" ")).toContain("[data-table] { display: block !important; }");
  });

  it("fills widgets already present in the editor body", () => {
    const editor = new FakeEditor(`<table-widget tabledata="${payload()}"></table-widget>`);
    startTinyMceBridge(() => globalFor(editor))();
    const widget = editor.getBody().querySelector("table-widget");
    expect(parseSlotMarkup(widget?.innerHTML)?.data).toEqual(MODEL.data);
  });

  it("fills the content on its way out of the editor", () => {
    const editor = new FakeEditor();
    startTinyMceBridge(() => globalFor(editor))();

    const event = {
      format: "html",
      content: `<table-widget tabledata="${payload()}"></table-widget>`,
    };
    editor.emit("GetContent", event);

    expect(parseSlotMarkup(event.content)?.data).toEqual(MODEL.data);
  });

  it("ignores non-HTML serializations", () => {
    const editor = new FakeEditor();
    startTinyMceBridge(() => globalFor(editor))();

    const event = { format: "text", content: "Spalte 1" };
    editor.emit("GetContent", event);

    expect(event.content).toBe("Spalte 1");
  });

  it("waits for an editor that is not initialized yet", () => {
    const editor = new FakeEditor();
    editor.initialized = false;
    startTinyMceBridge(() => globalFor(editor))();

    expect(editor.validChildren).toHaveLength(0);
    editor.emit("init", {});
    expect(editor.validChildren).toHaveLength(1);
  });

  it("patches the schema before the editor parses its content", () => {
    // Children must be valid by the time stored content is loaded, otherwise a
    // translated table's child nodes are discarded on the way in.
    const editor = new FakeEditor();
    editor.initialized = false;
    startTinyMceBridge(() => globalFor(editor))();

    editor.emit("PreInit", {});
    expect(editor.validChildren).toHaveLength(1);
    // The style goes into the iframe, which does not exist yet at PreInit.
    expect(editor.styles).toHaveLength(0);

    editor.emit("init", {});
    expect(editor.validChildren).toHaveLength(1);
    expect(editor.styles).toHaveLength(1);
  });

  it("attaches to an editor only once", () => {
    const editor = new FakeEditor();
    editor.initialized = false;
    startTinyMceBridge(() => globalFor(editor))();

    editor.emit("init", {});
    editor.emit("init", {});
    expect(editor.validChildren).toHaveLength(1);
  });

  it("catches a TinyMCE that is loaded long after the bundle", () => {
    // The defect this replaced: the host loads TinyMCE only once an editor route
    // is rendered, which can be minutes after this bundle. Any expiring poll
    // misses it entirely, so the assignment itself has to be the trigger.
    const scope = { tinymce: undefined } as unknown as Window;
    const editor = new FakeEditor();
    const stop = startTinyMceBridge(() => null, [scope]);

    expect(editor.validChildren).toHaveLength(0);

    (scope as unknown as { tinymce: TinyMceGlobal }).tinymce = globalFor(editor);
    expect(editor.validChildren).toHaveLength(1);

    stop();
  });

  it("leaves the intercepted global readable and restores it on stop", () => {
    const scope = { tinymce: undefined } as unknown as Window;
    const stop = startTinyMceBridge(() => null, [scope]);

    const tinymce = globalFor(new FakeEditor());
    (scope as unknown as { tinymce: TinyMceGlobal }).tinymce = tinymce;
    expect((scope as unknown as { tinymce: TinyMceGlobal }).tinymce).toBe(tinymce);

    stop();
    const descriptor = Object.getOwnPropertyDescriptor(scope, "tinymce");
    expect(descriptor?.value).toBe(tinymce);
    expect(descriptor?.get).toBeUndefined();
  });

  it("binds a global only once even if reassigned", () => {
    const scope = { tinymce: undefined } as unknown as Window;
    const editor = new FakeEditor();
    const tinymce = globalFor(editor);
    const stop = startTinyMceBridge(() => null, [scope]);

    (scope as unknown as { tinymce: TinyMceGlobal }).tinymce = tinymce;
    (scope as unknown as { tinymce: TinyMceGlobal }).tinymce = tinymce;
    expect(editor.validChildren).toHaveLength(1);

    stop();
  });

  it("uses a TinyMCE that is already there", () => {
    const editor = new FakeEditor();
    const stop = startTinyMceBridge(() => globalFor(editor), []);
    expect(editor.validChildren).toHaveLength(1);
    stop();
  });

  it("reports what it managed to do", () => {
    const editor = new FakeEditor(`<table-widget tabledata="${payload()}"></table-widget>`);
    const stop = startTinyMceBridge(() => globalFor(editor), []);

    const event = {
      format: "html",
      content: `<table-widget tabledata="${payload()}"></table-widget>`,
    };
    editor.emit("GetContent", event);

    const reported = (window as unknown as { __tableWidgetBridge?: typeof diagnostics })
      .__tableWidgetBridge;
    expect(reported?.tinymceFound).toBe(true);
    expect(reported?.editorsAttached).toBeGreaterThan(0);
    expect(reported?.serializations).toBeGreaterThan(0);
    expect(reported?.contentFilled).toBeGreaterThan(0);
    expect(reported?.lastContent).toContain(SLOT_ATTRIBUTE);

    stop();
  });
});

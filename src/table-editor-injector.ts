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

import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { TableEditor } from "./table-editor";
import { TableData, parseTableData, serializeTableData } from "./table-json";

/**
 * The DOM id RJSF/MUI renders for the `tabledata` schema property when
 * `uiSchema["tabledata"]["ui:widget"] === "textarea"` (see
 * `configuration-schema.ts`). Confirmed via a throwaway render spike that
 * this id lands directly on the real `<textarea>` element, not a wrapper.
 */
const TEXTAREA_SELECTOR = "#root_tabledata";

/**
 * Writes `value` into `element` using the native property setter and then
 * dispatches a bubbling `input` event, so that React's synthetic event
 * system (and therefore RJSF's controlled `onChange`) picks up the change.
 * A plain `element.value = ...` assignment does NOT trigger React's
 * listeners because React overrides the setter on the element instance.
 */
function setNativeTextareaValue(element: HTMLTextAreaElement, value: string): void {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )?.set;
  nativeSetter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

interface InjectedEditorProps {
  textarea: HTMLTextAreaElement;
}

/**
 * Bridges the controlled `TableEditor` component with the plain-DOM RJSF
 * textarea: seeds its initial value from the textarea's current value (so
 * editing an existing widget instance shows the existing table), and mirrors
 * every change back into the textarea so RJSF's own form state stays the
 * source of truth on submit.
 */
function InjectedEditor({ textarea }: InjectedEditorProps): React.ReactElement {
  const [value, setValue] = React.useState<TableData>(() => parseTableData(textarea.value));

  const handleChange = (data: TableData): void => {
    setValue(data);
    setNativeTextareaValue(textarea, serializeTableData(data));
  };

  return React.createElement(TableEditor, { value, onChange: handleChange });
}

interface MountedEditor {
  root: ReactDOM.Root;
  mountPoint: HTMLElement;
}

/**
 * Watches the DOM for the `#root_tabledata` textarea rendered by RJSF inside
 * the widget's config dialog, and injects the custom `TableEditor` grid UI
 * right before it. The original textarea is hidden (not removed) so it
 * keeps acting as RJSF's real form field; the injected editor stays in sync
 * by writing into it via {@link setNativeTextareaValue}.
 *
 * Safe to call before the dialog exists in the DOM (installs a
 * `MutationObserver` and keeps watching) and safe to call in contexts where
 * the dialog never appears at all, e.g. when the widget bundle runs on a
 * live content page to just render the table (the observer then simply
 * never finds a match).
 *
 * Idempotent per textarea instance (re-scans do not double-inject), and
 * cleans up editors whose textarea got removed from the DOM (e.g. the
 * dialog was closed) to avoid leaking React roots.
 *
 * @param root the DOM subtree to watch; defaults to `document`. Exposed for
 * testing so tests can scope the observer to a small detached container
 * instead of the whole `document`.
 * @returns a cleanup function that disconnects the observer and unmounts
 * any editors it injected.
 */
export function startTableEditorInjector(root: ParentNode = document): () => void {
  const mounted = new Map<HTMLTextAreaElement, MountedEditor>();

  const injectInto = (textarea: HTMLTextAreaElement): void => {
    if (mounted.has(textarea)) return;

    textarea.style.display = "none";

    const mountPoint = document.createElement("div");
    mountPoint.className = "table-editor-mount";
    textarea.insertAdjacentElement("beforebegin", mountPoint);

    const editorRoot = ReactDOM.createRoot(mountPoint);
    editorRoot.render(React.createElement(InjectedEditor, { textarea }));

    mounted.set(textarea, { root: editorRoot, mountPoint });
  };

  const cleanupDetached = (): void => {
    for (const [textarea, { root: editorRoot, mountPoint }] of mounted) {
      if (!document.contains(textarea)) {
        editorRoot.unmount();
        mountPoint.remove();
        mounted.delete(textarea);
      }
    }
  };

  const scan = (): void => {
    cleanupDetached();
    const textarea = root.querySelector<HTMLTextAreaElement>(TEXTAREA_SELECTOR);
    if (textarea) injectInto(textarea);
  };

  scan();

  const observer = new MutationObserver(scan);
  const target: Node = root === document ? document.body : (root as Element);
  observer.observe(target, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    for (const { root: editorRoot, mountPoint } of mounted.values()) {
      editorRoot.unmount();
      mountPoint.remove();
    }
    mounted.clear();
  };
}

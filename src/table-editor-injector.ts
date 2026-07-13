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
import { createPortal } from "react-dom";
import { TableEditor } from "./table-editor";
import { TableModel, parseTableModel, serializeTableModel } from "./table-model";

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

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  // Max 32-bit z-index so the editor always sits above the hosting app's own
  // config dialog / modals (Staffbase renders the widget's settings dialog on
  // top of the page; without this the editor would be hidden behind it).
  zIndex: 2147483647,
};

const panelStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "6px",
  width: "90vw",
  height: "90vh",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
};

const panelBodyStyle: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
};

const reopenButtonStyle: React.CSSProperties = {
  border: "1px dashed #b7bcc3",
  background: "#fafbfc",
  color: "#3a4148",
  cursor: "pointer",
  padding: "8px 16px",
  borderRadius: "4px",
  fontSize: "13px",
};

/**
 * Bridges the controlled `TableEditor` component with the plain-DOM RJSF
 * textarea: seeds its initial value from the textarea's current value (so
 * editing an existing widget instance shows the existing table), and mirrors
 * every change back into the textarea so RJSF's own form state stays the
 * source of truth on submit.
 *
 * The grid editor itself is only ever usable inside a large modal overlay,
 * since RJSF renders the real textarea inline in whatever (often narrow)
 * form container the host page provides. The modal opens automatically as
 * soon as this component mounts; a small placeholder button is shown at the
 * textarea's position to reopen it after the user closes it via "Fertig".
 * Edits made before closing are preserved (state lives here, not in the
 * modal), so reopening shows the table exactly as it was left.
 */
// Staffbase's config dialog is a Radix `Popover`. Radix's `DismissableLayer`
// dismisses popovers via *two independent* document-level listeners:
//  - `usePointerDownOutside`: a bubble-phase `pointerdown` listener on
//    `document`, skipped only if a capture-phase `onPointerDownCapture` on
//    the popover's own content div already saw the event.
//  - `useFocusOutside`: a bubble-phase `focusin` listener on `document`,
//    skipped only if a capture-phase `onFocusCapture` on the popover's own
//    content div already saw the event.
// Our editor is portaled to `document.body` but lives in a *separate* React
// root injected via `MutationObserver`, so it never participates in
// Staffbase's React tree and neither capture handler ever fires for it -
// every pointerdown AND every focus move inside our modal used to reach
// `document` and dismiss the popover.
//
// The fix must stop these events from ever reaching `document`, but only
// *after* React's own delegated handlers (e.g. the "Fertig" button's
// onClick) have run. React attaches its synthetic-event listeners for
// portaled content directly on the portal's container - `document.body`
// here - during commit, which happens before this effect (a passive
// effect always runs after commit, including after any ref/layout work).
// So adding our own native listener on `document.body`, scoped to events
// whose target is inside our modal, lets React's handlers fire first and
// then stops the event before it can bubble past `document.body` up to
// `document`, where Radix listens. Stopping any earlier (e.g. on the
// modal's own root) would block React's own event delegation too.
const OUTSIDE_INTERACTION_EVENTS = [
  "pointerdown",
  "mousedown",
  "mouseup",
  "click",
  "touchstart",
  "touchend",
  "focusin",
] as const;

function useStopOutsideDismissPropagation(isActive: boolean): React.RefObject<HTMLDivElement | null> {
  const modalRootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isActive) {
      return;
    }

    const stopIfInsideModal = (event: Event): void => {
      if (event.target instanceof Node && modalRootRef.current?.contains(event.target)) {
        event.stopPropagation();
      }
    };
    OUTSIDE_INTERACTION_EVENTS.forEach((eventName) => document.body.addEventListener(eventName, stopIfInsideModal));
    return () => {
      OUTSIDE_INTERACTION_EVENTS.forEach((eventName) => document.body.removeEventListener(eventName, stopIfInsideModal));
    };
  }, [isActive]);

  return modalRootRef;
}

function InjectedEditor({ textarea }: InjectedEditorProps): React.ReactElement {
  const [value, setValue] = React.useState<TableModel>(() => parseTableModel(textarea.value));
  const [isOpen, setIsOpen] = React.useState(true);
  const modalRef = useStopOutsideDismissPropagation(isOpen);

  const handleChange = (model: TableModel): void => {
    setValue(model);
    setNativeTextareaValue(textarea, serializeTableModel(model));
  };

  if (!isOpen) {
    return React.createElement(
      "button",
      {
        type: "button",
        "data-testid": "table-editor-reopen",
        style: reopenButtonStyle,
        onClick: () => setIsOpen(true),
      },
      "Tabelle bearbeiten",
    );
  }

  // Rendered via a portal straight onto `document.body` instead of inline
  // in the component tree. Staffbase wraps the config dialog in a Radix
  // popover that sets a `transform` on one of its ancestors; per the CSS
  // spec that makes the transformed ancestor the containing block for any
  // `position: fixed` descendant, so an inline modal gets clipped to the
  // popover's small box (and its `overflow-y: hidden`) instead of covering
  // the viewport, showing up as a blank area. Portaling to `document.body`
  // escapes that ancestor chain entirely, so `position: fixed` reliably
  // targets the real viewport regardless of where this component is
  // mounted in the form.
  return createPortal(
    React.createElement(
      "div",
      { "data-testid": "table-editor-modal", style: overlayStyle, ref: modalRef },
      React.createElement(
        "div",
        { style: panelStyle },
        React.createElement(
          "div",
          { style: panelBodyStyle },
          React.createElement(TableEditor, {
            value,
            onChange: handleChange,
            onDone: () => setIsOpen(false),
          }),
        ),
      ),
    ),
    document.body,
  );
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

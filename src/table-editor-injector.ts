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
import { createPortal } from "react-dom";

import { setNativeFieldValue, startConfigFieldInjector } from "@shared/config-field-injector";
import { TableEditor } from "./table-editor";
import { TableModel, parseTableModel, encodeTableAttribute } from "./table-model";

/** The schema property whose field the editor takes over. */
const FIELD_KEY = "tabledata";

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

/**
 * Holds the editor at exactly the panel's remaining height and does *not*
 * scroll itself — the editor scrolls its grid internally so the toolbar stays
 * put no matter how long the table is. `minHeight: 0` is required for a flex
 * item to be allowed to shrink below its content size.
 */
const panelBodyStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  overflow: "hidden",
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
    setNativeFieldValue(textarea, encodeTableAttribute(model));
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

/**
 * Watches for the widget's configuration dialog and injects the grid editor in
 * front of its `tabledata` field.
 *
 * The field is hidden rather than removed: it stays RJSF's real form field, and
 * the editor writes every change back into it, so the dialog's own state
 * remains the source of truth on submit.
 *
 * @param root the subtree to watch; defaults to the document. Exposed so tests
 * can scope the observer to a detached container.
 * @returns a function that stops watching and unmounts the editor.
 */
export function startTableEditorInjector(root: ParentNode = document): () => void {
  return startConfigFieldInjector<HTMLTextAreaElement>({
    fieldKey: FIELD_KEY,
    root,
    hideField: true,
    render: (textarea) => React.createElement(InjectedEditor, { textarea }),
  });
}

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
import { TableModel } from "./table-model";
import { overlayStyle, panelStyle, panelBodyStyle } from "./modal-styles";

/**
 * Opens the grid editor as a standalone modal, driven imperatively rather than
 * from a React tree.
 *
 * Needed because the second place the editor is reachable from is the page
 * editor (see `tinymce-bridge.ts`), which is plain DOM inside a TinyMCE
 * instance — there is no component tree to render into. The config dialog has
 * its own entry point (`table-editor-injector.ts`) and keeps using it.
 */

export interface OpenTableEditorOptions {
  /** Model the editor opens with. */
  initial: TableModel;
  /** Invoked once, with the final model, when the author closes the editor. */
  onSave: (model: TableModel) => void;
}

/** Events that must not reach `document` while the modal is open. */
const CONTAINED_EVENTS = [
  "pointerdown",
  "mousedown",
  "mouseup",
  "click",
  "touchstart",
  "touchend",
  "focusin",
] as const;

interface ModalProps extends OpenTableEditorOptions {
  onClose: () => void;
}

function Modal({ initial, onSave, onClose }: ModalProps): React.ReactElement {
  const [model, setModel] = React.useState<TableModel>(initial);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  // The hosting page listens on `document` for outside interactions to dismiss
  // its own layers (and TinyMCE reacts to focus leaving its iframe). Keep both
  // from seeing anything that happened inside the modal, but only after React's
  // delegated handlers — which are attached on `document.body` — have run.
  React.useEffect(() => {
    const containIfInside = (event: Event): void => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) {
        event.stopPropagation();
      }
    };
    CONTAINED_EVENTS.forEach((name) => document.body.addEventListener(name, containIfInside));
    return () => {
      CONTAINED_EVENTS.forEach((name) => document.body.removeEventListener(name, containIfInside));
    };
  }, []);

  const handleDone = (): void => {
    onSave(model);
    onClose();
  };

  return (
    <div data-testid="table-editor-modal" style={overlayStyle} ref={rootRef}>
      <div style={panelStyle}>
        <div style={panelBodyStyle}>
          <TableEditor value={model} onChange={setModel} onDone={handleDone} />
        </div>
      </div>
    </div>
  );
}

/**
 * Mounts the editor on `document.body` and returns a function that closes it.
 *
 * `onSave` runs exactly once, on close, with whatever the author left in the
 * grid — closing *is* saving here, matching the config dialog's behaviour where
 * every change is mirrored straight into the backing field.
 */
export function openTableEditor({ initial, onSave }: OpenTableEditorOptions): () => void {
  const host = document.createElement("div");
  host.className = "table-editor-modal-host";
  document.body.appendChild(host);

  const root = ReactDOM.createRoot(host);
  let closed = false;

  const close = (): void => {
    if (closed) return;
    closed = true;
    // Unmounting synchronously from inside a React event handler would tear the
    // tree down mid-commit, so defer past the current task.
    setTimeout(() => {
      root.unmount();
      host.remove();
    }, 0);
  };

  root.render(<Modal initial={initial} onSave={onSave} onClose={close} />);
  return close;
}

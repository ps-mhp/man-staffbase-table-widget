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

import * as React from "react";

import { startFieldModalInjector } from "@shared/config-modal";
import { TableEditor } from "./table-editor";
import { TableModel, parseTableModel, encodeTableAttribute } from "./table-model";

/** The schema property whose field the editor takes over. */
const FIELD_KEY = "tabledata";

/**
 * Watches for the widget's configuration dialog and injects the grid editor in
 * front of its `tabledata` field.
 *
 * Everything about surviving the host's dialog — the portal, the dismiss
 * isolation, the write-back through the native setter — lives in
 * `@shared/config-modal`; what remains here is the table itself.
 *
 * @param root the subtree to watch; defaults to the document. Exposed so tests
 * can scope the observer to a detached container.
 * @returns a function that stops watching and unmounts the editor.
 */
export function startTableEditorInjector(root: ParentNode = document): () => void {
  return startFieldModalInjector<TableModel>({
    fieldKey: FIELD_KEY,
    root,
    reopenLabel: "Tabelle bearbeiten",
    modalTestId: "table-editor-modal",
    reopenTestId: "table-editor-reopen",
    parse: parseTableModel,
    serialize: encodeTableAttribute,
    // The editor draws its own frame — toolbar and grid share an edge — so the
    // panel's form-style padding would only push that frame away from it.
    panelStyle: { padding: "0px" },
    render: ({ value, onChange, onSave, onClose, dirty }) =>
      React.createElement(TableEditor, { value, onChange, onSave, onClose, dirty }),
  });
}

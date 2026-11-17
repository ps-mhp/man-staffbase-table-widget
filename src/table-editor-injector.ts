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
import { Table2 } from "lucide-react";

import { FieldModalShellOptions, startFieldModalInjector } from "@shared/config-modal";
import { tableChangesStatus } from "./editor-status";
import { TableModel, parseTableModel, encodeTableAttribute } from "./table-model";

/** The schema property whose field the editor takes over. */
const FIELD_KEY = "tabledata";

/**
 * Der Editor kommt erst, wenn ein Dialog ihn zeigt: er baut auf
 * `@man/config-ui` (Radix, react-aria, Tailwind) und bringt Kontextmenü,
 * Medienauswahl und Import mit – nichts davon gehört ins Seitenbündel, das
 * jede Leserin lädt. Hier bleibt nur, was der Rahmen braucht, bevor der
 * Editor da ist: Name, Icon, Status.
 */
const loadEditor = () => import("./table-editor");

const LazyTableEditor = React.lazy(() => loadEditor().then((module) => ({ default: module.TableEditor })));

/** Die Hilfe aus demselben Chunk wie der Editor; ihr Text ist zu lang fürs Seitenbündel. */
const LazyTableEditorHelp = React.lazy(() =>
  loadEditor().then((module) => ({ default: module.TableEditorHelp })),
);

const LOADING = React.createElement("p", { className: "p-6 text-sm text-muted-foreground" }, "Editor wird geladen …");

/**
 * Was der gemeinsame Rahmen von der Tabelle wissen muss. Offengelegt für
 * Tests. Keine Prüfung: jedes Modell lässt sich schreiben, `parseTableModel`
 * rückt beim Lesen alles zurecht.
 */
export const tableEditorShell: FieldModalShellOptions<TableModel> = {
  widgetName: "Tabelle",
  title: "Tabelle bearbeiten",
  icon: Table2,
  preview: true,
  help: React.createElement(React.Suspense, { fallback: null }, React.createElement(LazyTableEditorHelp)),
  statusText: tableChangesStatus,
};

/**
 * Watches for the widget's configuration dialog and injects the grid editor in
 * front of its `tabledata` field.
 *
 * Everything about surviving the host's dialog — the portal, the dismiss
 * isolation, the write-back through the native setter — lives in
 * `@shared/config-modal`; Kopf, Übernehmen, Rückgängig, Hilfe und Rückfrage
 * im Rahmen von `@man/config-ui`. What remains here is the table itself.
 *
 * Kein `panelClassName` mehr: im Rahmen ist das Panel immer Vollbild ohne
 * Polster, die Option gilt dort nicht.
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
    shell: tableEditorShell,
    render: ({ value, onChange }) =>
      React.createElement(React.Suspense, { fallback: LOADING }, React.createElement(LazyTableEditor, { value, onChange })),
  });
}

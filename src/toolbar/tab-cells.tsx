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
import { ReactElement } from "react";
import { Plus, TableCellsMerge, TableCellsSplit, Trash2 } from "lucide-react";
import { ToolButton } from "@man/config-ui/toolbar/tool-button";
import { ToolMenu, ToolMenuItem } from "@man/config-ui/toolbar/tool-menu";
import { ToolSeparator, Toolbar } from "@man/config-ui/toolbar/toolbar";

import { TableToolbarProps } from "./props";

export type CellsTabProps = Pick<
  TableToolbarProps,
  | "hasSelection"
  | "insert"
  | "onInsertRowAbove"
  | "onInsertRowBelow"
  | "onInsertColLeft"
  | "onInsertColRight"
  | "onDeleteRows"
  | "onDeleteCols"
  | "onMerge"
  | "onUnmerge"
  | "canUnmerge"
>;

/** Structural edits: merging cells and adding or removing rows and columns. */
export function CellsTab({
  hasSelection,
  insert,
  onInsertRowAbove,
  onInsertRowBelow,
  onInsertColLeft,
  onInsertColRight,
  onDeleteRows,
  onDeleteCols,
  onMerge,
  onUnmerge,
  canUnmerge,
}: CellsTabProps): ReactElement {
  const disabled = !hasSelection;

  // With a full row or column selected the menu offers only what fits that
  // selection; with nothing selected it offers both.
  const showRow = insert.row || (!insert.row && !insert.col);
  const showCol = insert.col || (!insert.row && !insert.col);

  const item = (testId: string, text: string, run: () => void, close: () => void): ReactElement => (
    <ToolMenuItem
      key={testId}
      data-testid={testId}
      onClick={() => {
        run();
        close();
      }}
    >
      {text}
    </ToolMenuItem>
  );

  return (
    <Toolbar aria-label="Zellen">
      <ToolButton data-testid="toolbar-merge" label="Zellen verbinden" icon={TableCellsMerge} disabled={disabled} onClick={onMerge}>
        Verbinden
      </ToolButton>
      <ToolButton data-testid="toolbar-unmerge" label="Verbindung aufheben" icon={TableCellsSplit} disabled={!canUnmerge} onClick={onUnmerge}>
        Lösen
      </ToolButton>
      <ToolSeparator />
      <ToolMenu testId="toolbar-insert" label="Zeile oder Spalte einfügen" icon={Plus} text="Einfügen">
        {(close) => [
          ...(showRow
            ? [
                item("toolbar-insert-row-above", "Zeile oberhalb", onInsertRowAbove, close),
                item("toolbar-insert-row-below", "Zeile unterhalb", onInsertRowBelow, close),
              ]
            : []),
          ...(showCol
            ? [
                item("toolbar-insert-col-left", "Spalte links", onInsertColLeft, close),
                item("toolbar-insert-col-right", "Spalte rechts", onInsertColRight, close),
              ]
            : []),
        ]}
      </ToolMenu>
      <ToolMenu testId="toolbar-delete" label="Zeilen oder Spalten löschen" icon={Trash2} text="Löschen" disabled={disabled}>
        {(close) => [
          item("toolbar-delete-rows", "Zeile(n) löschen", onDeleteRows, close),
          item("toolbar-delete-cols", "Spalte(n) löschen", onDeleteCols, close),
        ]}
      </ToolMenu>
    </Toolbar>
  );
}

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

import { Menu, MenuItem, useEditorStyles } from "@shared/editor-ui";
import { RibbonButton } from "./controls";
import { IconChevron, IconDelete, IconInsert } from "./icons";
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
  // Lädt das Stylesheet der Redaktionsebene (`Menu`), referenzgezählt in
  // `document.head` — siehe RibbonShell für dieselbe Begründung.
  useEditorStyles();
  const disabled = !hasSelection;

  // With a full row or column selected the menu offers only what fits that
  // selection; with nothing selected it offers both.
  const showRow = insert.row || (!insert.row && !insert.col);
  const showCol = insert.col || (!insert.row && !insert.col);

  return (
    <>
      <RibbonButton testId="toolbar-merge" title="Zellen verbinden" disabled={disabled} onClick={onMerge}>
        Verbinden
      </RibbonButton>
      <RibbonButton testId="toolbar-unmerge" title="Verbindung aufheben" disabled={!canUnmerge} onClick={onUnmerge}>
        Lösen
      </RibbonButton>

      <Menu
        label="Einfügen"
        trigger={
          <button type="button" className="tw-rb__big" data-testid="toolbar-insert" title="Einfügen">
            <IconInsert />
            <span className="tw-rb__label">Einfügen <IconChevron /></span>
          </button>
        }
      >
        {showRow && (
          <>
            <MenuItem data-testid="toolbar-insert-row-above" onClick={onInsertRowAbove}>
              Zeile oberhalb
            </MenuItem>
            <MenuItem data-testid="toolbar-insert-row-below" onClick={onInsertRowBelow}>
              Zeile unterhalb
            </MenuItem>
          </>
        )}
        {showCol && (
          <>
            <MenuItem data-testid="toolbar-insert-col-left" onClick={onInsertColLeft}>
              Spalte links
            </MenuItem>
            <MenuItem data-testid="toolbar-insert-col-right" onClick={onInsertColRight}>
              Spalte rechts
            </MenuItem>
          </>
        )}
      </Menu>

      <Menu
        label="Löschen"
        trigger={
          <button type="button" className="tw-rb__big" data-testid="toolbar-delete" title="Löschen" disabled={disabled}>
            <IconDelete />
            <span className="tw-rb__label">Löschen <IconChevron /></span>
          </button>
        }
      >
        <MenuItem data-testid="toolbar-delete-rows" onClick={onDeleteRows}>
          Zeile(n) löschen
        </MenuItem>
        <MenuItem data-testid="toolbar-delete-cols" onClick={onDeleteCols}>
          Spalte(n) löschen
        </MenuItem>
      </Menu>
    </>
  );
}

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
import { ReactElement } from "react";

import { Dropdown, RibbonButton } from "./controls";
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
  const disabled = !hasSelection;

  // With a full row or column selected the menu offers only what fits that
  // selection; with nothing selected it offers both.
  const showRow = insert.row || (!insert.row && !insert.col);
  const showCol = insert.col || (!insert.row && !insert.col);

  return (
    <>
      <div className="tw-rb__rows">
        <div className="tw-rb__row" style={{ width: "100%" }} >
          <RibbonButton testId="toolbar-merge" variant="block" title="Zellen verbinden" disabled={disabled} onClick={onMerge}>
            Verbinden
          </RibbonButton>
        </div>
        <div className="tw-rb__row" style={{ width: "100%" }} >
          <RibbonButton testId="toolbar-unmerge" variant="block" title="Verbindung aufheben" disabled={!canUnmerge} onClick={onUnmerge}>
            Lösen
          </RibbonButton>
        </div>
      </div>
      <Dropdown
        testId="toolbar-insert-menu"
        trigger={(toggle) => (
          <button type="button" className="tw-rb__big" data-testid="toolbar-insert" title="Einfügen" onClick={toggle}>
            <IconInsert />
            <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>Einfügen <IconChevron /></span>
          </button>
        )}
      >
        {(close) => (
          <>
            {showRow && (
              <>
                <button type="button" className="tw-rb__menu-item" data-testid="toolbar-insert-row-above" onClick={() => { onInsertRowAbove(); close(); }}>
                  Zeile oberhalb
                </button>
                <button type="button" className="tw-rb__menu-item" data-testid="toolbar-insert-row-below" onClick={() => { onInsertRowBelow(); close(); }}>
                  Zeile unterhalb
                </button>
              </>
            )}
            {showCol && (
              <>
                <button type="button" className="tw-rb__menu-item" data-testid="toolbar-insert-col-left" onClick={() => { onInsertColLeft(); close(); }}>
                  Spalte links
                </button>
                <button type="button" className="tw-rb__menu-item" data-testid="toolbar-insert-col-right" onClick={() => { onInsertColRight(); close(); }}>
                  Spalte rechts
                </button>
              </>
            )}
          </>
        )}
      </Dropdown>

      <Dropdown
        testId="toolbar-delete-menu"
        trigger={(toggle) => (
          <button type="button" className="tw-rb__big" data-testid="toolbar-delete" title="Löschen" disabled={disabled} onClick={toggle}>
            <IconDelete />
            <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>Löschen <IconChevron /></span>
          </button>
        )}
      >
        {(close) => (
          <>
            <button type="button" className="tw-rb__menu-item" data-testid="toolbar-delete-rows" onClick={() => { onDeleteRows(); close(); }}>
              Zeile(n) löschen
            </button>
            <button type="button" className="tw-rb__menu-item" data-testid="toolbar-delete-cols" onClick={() => { onDeleteCols(); close(); }}>
              Spalte(n) löschen
            </button>
          </>
        )}
      </Dropdown>
    </>
  );
}

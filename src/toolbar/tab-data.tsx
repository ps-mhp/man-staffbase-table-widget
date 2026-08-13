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
import { ReactElement, useRef } from "react";

import { Dropdown } from "./controls";
import { IconChevron, IconClearFormat, IconPainter, IconSort, IconUpload } from "./icons";
import { TableToolbarProps } from "./props";

export type DataTabProps = Pick<
  TableToolbarProps,
  | "hasSelection"
  | "painterActive"
  | "onSortAsc"
  | "onSortDesc"
  | "onClearSort"
  | "onCopyFormat"
  | "onUpload"
  | "visibleRows"
  | "onChangeVisibleRows"
  | "onClearFormatting"
  | "hasClearTarget"
>;

/** Actions on the table as a whole: order, import, and resetting formatting. */
export function DataTab({
  hasSelection,
  painterActive,
  onSortAsc,
  onSortDesc,
  onClearSort,
  onCopyFormat,
  onUpload,
  visibleRows,
  onChangeVisibleRows,
  onClearFormatting,
  hasClearTarget,
}: DataTabProps): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const disabled = !hasSelection;

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.target.value = "";
  };

  return (
    <>
      <Dropdown
        testId="toolbar-sort-menu"
        trigger={(toggle) => (
          <button type="button" className="tw-rb__big" data-testid="toolbar-sort" title="Sortierung" disabled={disabled} onClick={toggle}>
            <IconSort />
            <span className="tw-rb__label">Sortieren <IconChevron /></span>
          </button>
        )}
      >
        {(close) => (
          <>
            <button type="button" className="tw-rb__menu-item" data-testid="toolbar-sort-asc" onClick={() => { onSortAsc(); close(); }}>
              Aufsteigend (diese Spalte)
            </button>
            <button type="button" className="tw-rb__menu-item" data-testid="toolbar-sort-desc" onClick={() => { onSortDesc(); close(); }}>
              Absteigend (diese Spalte)
            </button>
            <button type="button" className="tw-rb__menu-item" data-testid="toolbar-sort-clear" onClick={() => { onClearSort(); close(); }}>
              Sortierung entfernen
            </button>
          </>
        )}
      </Dropdown>

      <button type="button" className="tw-rb__big" data-testid="toolbar-painter" title="Format kopieren" disabled={disabled && !painterActive} onClick={onCopyFormat} style={painterActive ? { color: "#0a63b0", background: "#e8f2fc", borderColor: "#9ecbf0" } : undefined}>
        <IconPainter />
        <span>Format</span>
      </button>

      <label
        className="tw-rb__rows-limit"
        title="Zeilen, die die veröffentlichte Tabelle zeigt, bevor sie hinter einem Button einklappt. 0 zeigt alle Zeilen."
      >
        <input
          type="number"
          min={0}
          step={1}
          data-testid="toolbar-visible-rows"
          value={visibleRows}
          onChange={(event) => {
            // An emptied field reads as NaN. Treating that as 0 would
            // silently switch collapsing off mid-typing, so it is ignored
            // until a number is there.
            const next = event.target.valueAsNumber;
            if (Number.isFinite(next)) onChangeVisibleRows(next);
          }}
        />
        <span>Sichtbare Zeilen</span>
      </label>

      <Dropdown
        testId="toolbar-clear-format-menu"
        trigger={(toggle) => (
          <button
            type="button"
            className="tw-rb__big"
            data-testid="toolbar-clear-format"
            title={
              hasClearTarget
                ? "Formatierung der Markierung entfernen"
                : "Formatierung der ganzen Tabelle entfernen (nichts markiert)"
            }
            onClick={toggle}
          >
            <IconClearFormat />
            <span className="tw-rb__label">Formatierung <IconChevron /></span>
          </button>
        )}
      >
        {(close) => {
          const suffix = hasClearTarget ? "der Markierung" : "der ganzen Tabelle";
          return (
            <>
              <button type="button" className="tw-rb__menu-item" data-testid="toolbar-clear-format-all" onClick={() => { onClearFormatting("all"); close(); }}>
                {`Alles entfernen (${suffix})`}
              </button>
              <button type="button" className="tw-rb__menu-item" data-testid="toolbar-clear-format-text" onClick={() => { onClearFormatting("text"); close(); }}>
                Nur Textformatierung entfernen
              </button>
              <button type="button" className="tw-rb__menu-item" data-testid="toolbar-clear-format-images" onClick={() => { onClearFormatting("images"); close(); }}>
                Nur Bildgrößen zurücksetzen
              </button>
            </>
          );
        }}
      </Dropdown>

      <button type="button" className="tw-rb__big" data-testid="toolbar-upload-button" title="Tabelle hochladen (.csv, .xlsx)" onClick={() => fileInputRef.current?.click()}>
        <IconUpload />
        <span>Importieren</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        data-testid="toolbar-upload"
        aria-label="Tabelle hochladen"
        onChange={handleFile}
        className="tw-rb__file-input"
      />
    </>
  );
}

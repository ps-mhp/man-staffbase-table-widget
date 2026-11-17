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
import { IconChevron, IconClearFormat, IconPainter, IconUpload } from "./icons";
import { TableToolbarProps } from "./props";

export type DataTabProps = Pick<
  TableToolbarProps,
  | "hasSelection"
  | "painterActive"
  | "onCopyFormat"
  | "onUpload"
  | "onClearFormatting"
  | "hasClearTarget"
>;

/**
 * Actions on the table's content: copying and resetting formatting, import.
 * Erste Sortierung, sichtbare Zeilen und Export sind Einstellungen der ganzen
 * Tabelle und stehen im Panel „Tabelle“ rechts.
 */
export function DataTab({
  hasSelection,
  painterActive,
  onCopyFormat,
  onUpload,
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
      <button type="button" className="tw-rb__big" data-testid="toolbar-painter" title="Format kopieren" disabled={disabled && !painterActive} onClick={onCopyFormat} style={painterActive ? { color: "#0a63b0", background: "#e8f2fc", borderColor: "#9ecbf0" } : undefined}>
        <IconPainter />
        <span>Format</span>
      </button>

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

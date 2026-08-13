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
import { ReactElement, useRef } from "react";

import { ColorButton, Dropdown, RibbonButton } from "./toolbar/controls";
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconChevron,
  IconClearFormat,
  IconDelete,
  IconImage,
  IconImageSize,
  IconInsert,
  IconPainter,
  IconSave,
  IconSort,
  IconSubscript,
  IconSuperscript,
  IconUpload,
  IconVAlignBottom,
  IconVAlignMiddle,
  IconVAlignTop,
} from "./toolbar/icons";
import { TableToolbarProps } from "./toolbar/props";
import { RIBBON_CSS } from "./toolbar/ribbon-css";

export type { TableToolbarProps };

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32];


/**
 * Excel-style ribbon shown above the grid editor, grouped into sections
 * ("Speichern", "Schriftart", "Ausrichtung", "Zellen", "Werkzeuge"). Only the
 * functions this widget actually supports are exposed. All controls except
 * save and upload act on the current cell selection and are disabled when no
 * cell is selected.
 */
export const TableToolbar = (props: TableToolbarProps): ReactElement => {
  const {
    hasSelection,
    activeFormat,
    painterActive,
    insert,
    onToggle,
    onAlign,
    onVerticalAlign,
    onColor,
    onClearColor,
    onBackground,
    onClearBackground,
    onFontSize,
    onFontSizeStep,
    onSuperscript,
    onSubscript,
    onInsertRowAbove,
    onInsertRowBelow,
    onInsertColLeft,
    onInsertColRight,
    onDeleteRows,
    onDeleteCols,
    onMerge,
    onUnmerge,
    canUnmerge,
    onSortAsc,
    onSortDesc,
    onClearSort,
    onCopyFormat,
    onUpload,
    onInsertImage,
    hasSelectedImages,
    canEqualizeImages,
    onEqualizeImageHeight,
    onEqualizeImageWidth,
    onResetImageSize,
    fitImages,
    onToggleFitImages,
    visibleRows,
    onChangeVisibleRows,
    onClearFormatting,
    hasClearTarget,
    onDone,
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const disabled = !hasSelection;

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.target.value = "";
  };

  const showRow = insert.row || (!insert.row && !insert.col);
  const showCol = insert.col || (!insert.row && !insert.col);

  return (
    <div className="tw-rb" data-testid="table-toolbar">
      <style>{RIBBON_CSS}</style>

      {onDone && (
        <div className="tw-rb__section">
          <div className="tw-rb__body">
            <button type="button" className="tw-rb__big tw-rb__big--primary" data-testid="toolbar-done" title="Speichern" onClick={onDone}>
              <IconSave />
              <span>Speichern</span>
            </button>
          </div>
          <div className="tw-rb__label">Speichern</div>
        </div>
      )}

      <div className="tw-rb__section">
        <div className="tw-rb__body">
          <div className="tw-rb__rows">
            <div className="tw-rb__row">
              <select
                className="tw-rb__select"
                data-testid="toolbar-fontsize"
                aria-label="Schriftgröße"
                disabled={disabled}
                value={activeFormat.fontSize ?? ""}
                onChange={(e) => onFontSize(e.target.value === "" ? null : Number(e.target.value))}
              >
                <option value="">Standard</option>
                {FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <RibbonButton testId="toolbar-fontsize-inc" variant="step" title="Schrift vergrößern" disabled={disabled} onClick={() => onFontSizeStep(1)}>
                <span style={{ fontSize: "14px" }}>A</span><span style={{ fontSize: "9px" }}>▲</span>
              </RibbonButton>
              <RibbonButton testId="toolbar-fontsize-dec" variant="step" title="Schrift verkleinern" disabled={disabled} onClick={() => onFontSizeStep(-1)}>
                <span style={{ fontSize: "11px" }}>A</span><span style={{ fontSize: "9px" }}>▼</span>
              </RibbonButton>
              <RibbonButton testId="toolbar-align-left" variant="icon" title="Linksbündig" disabled={disabled} active={activeFormat.align === "left"} onClick={() => onAlign("left")}>
                <IconAlignLeft />
              </RibbonButton>
              <RibbonButton testId="toolbar-align-center" variant="icon" title="Zentriert" disabled={disabled} active={activeFormat.align === "center"} onClick={() => onAlign("center")}>
                <IconAlignCenter />
              </RibbonButton>
              <RibbonButton testId="toolbar-align-right" variant="icon" title="Rechtsbündig" disabled={disabled} active={activeFormat.align === "right"} onClick={() => onAlign("right")}>
                <IconAlignRight />
              </RibbonButton>
              <RibbonButton testId="toolbar-valign-top" variant="icon" title="Oben ausrichten" disabled={disabled} active={activeFormat.valign === "top"} onClick={() => onVerticalAlign("top")}>
                <IconVAlignTop />
              </RibbonButton>
              <RibbonButton testId="toolbar-valign-middle" variant="icon" title="Mittig ausrichten" disabled={disabled} active={activeFormat.valign === "middle"} onClick={() => onVerticalAlign("middle")}>
                <IconVAlignMiddle />
              </RibbonButton>
              <RibbonButton testId="toolbar-valign-bottom" variant="icon" title="Unten ausrichten" disabled={disabled} active={activeFormat.valign === "bottom"} onClick={() => onVerticalAlign("bottom")}>
                <IconVAlignBottom />
              </RibbonButton>
            </div>
            <div className="tw-rb__row">
              <RibbonButton testId="toolbar-bold" variant="icon" title="Fett" disabled={disabled} active={activeFormat.bold} onClick={() => onToggle("bold")}>
                <strong>F</strong>
              </RibbonButton>
              <RibbonButton testId="toolbar-italic" variant="icon" title="Kursiv" disabled={disabled} active={activeFormat.italic} onClick={() => onToggle("italic")}>
                <em>K</em>
              </RibbonButton>
              <RibbonButton testId="toolbar-underline" variant="icon" title="Unterstrichen" disabled={disabled} active={activeFormat.underline} onClick={() => onToggle("underline")}>
                <span style={{ textDecoration: "underline" }}>U</span>
              </RibbonButton>
              <RibbonButton testId="toolbar-strike" variant="icon" title="Durchgestrichen" disabled={disabled} active={activeFormat.strikethrough} onClick={() => onToggle("strikethrough")}>
                <span style={{ textDecoration: "line-through" }}>S</span>
              </RibbonButton>
              <RibbonButton testId="toolbar-superscript" variant="icon" title="Hochstellen" disabled={disabled} onClick={onSuperscript}>
                <IconSuperscript />
              </RibbonButton>
              <RibbonButton testId="toolbar-subscript" variant="icon" title="Tiefstellen" disabled={disabled} onClick={onSubscript}>
                <IconSubscript />
              </RibbonButton>
              <ColorButton
                testId="toolbar-bg"
                title="Hintergrundfarbe"
                disabled={disabled}
                value={activeFormat.background}
                onChange={onBackground}
                onClear={onClearBackground}
                glyph={
                  <span aria-hidden style={{ display: "inline-flex" }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
                      <rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor" />
                    </svg>
                  </span>
                }
              />
              <ColorButton
                testId="toolbar-color"
                title="Schriftfarbe"
                disabled={disabled}
                value={activeFormat.color}
                onChange={onColor}
                onClear={onClearColor}
                glyph={<span aria-hidden style={{ fontSize: "14px", fontWeight: 700 }}>A</span>}
              />
            </div>
          </div>
        </div>
        <div className="tw-rb__label">Schrift</div>
      </div>

      <div className="tw-rb__section">
        <div className="tw-rb__body">
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
        </div>
        <div className="tw-rb__label">Zellen</div>
      </div>

      <div className="tw-rb__section">
        <div className="tw-rb__body">
          <Dropdown
            testId="toolbar-sort-menu"
            trigger={(toggle) => (
              <button type="button" className="tw-rb__big" data-testid="toolbar-sort" title="Sortierung" disabled={disabled} onClick={toggle}>
                <IconSort />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>Sortieren <IconChevron /></span>
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

          <button type="button" className="tw-rb__big" data-testid="toolbar-painter" title="Format kopieren" disabled={disabled && !painterActive} onClick={onCopyFormat} style={painterActive ? { color: "#0a6ec4", background: "#e4f0fb" } : undefined}>
            <IconPainter />
            <span>Format</span>
          </button>

          <button type="button" className="tw-rb__big" data-testid="toolbar-image-button" title="Bild in Zelle einfügen" disabled={disabled} onClick={onInsertImage}>
            <IconImage />
            <span>Bild</span>
          </button>

          <Dropdown
            testId="toolbar-image-size-menu"
            trigger={(toggle) => (
              <button
                type="button"
                className="tw-rb__big"
                data-testid="toolbar-image-size"
                title="Größe der markierten Bilder angleichen (Maßstab ist das zuerst markierte Bild)"
                disabled={!hasSelectedImages}
                onClick={toggle}
              >
                <IconImageSize />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>Bildgröße <IconChevron /></span>
              </button>
            )}
          >
            {(close) => (
              <>
                <button type="button" className="tw-rb__menu-item" data-testid="toolbar-image-equal-height" disabled={!canEqualizeImages} title={canEqualizeImages ? undefined : "Mindestens zwei markierte Bilder nötig"} onClick={() => { onEqualizeImageHeight(); close(); }}>
                  Gleiche Höhe wie erstes Bild
                </button>
                <button type="button" className="tw-rb__menu-item" data-testid="toolbar-image-equal-width" disabled={!canEqualizeImages} title={canEqualizeImages ? undefined : "Mindestens zwei markierte Bilder nötig"} onClick={() => { onEqualizeImageWidth(); close(); }}>
                  Gleiche Breite wie erstes Bild
                </button>
                <button type="button" className="tw-rb__menu-item" data-testid="toolbar-image-reset-size" onClick={() => { onResetImageSize(); close(); }}>
                  Standardgröße
                </button>
              </>
            )}
          </Dropdown>

          <button
            type="button"
            role="switch"
            aria-checked={fitImages}
            className="tw-rb__switch"
            data-testid="toolbar-image-fit"
            title="Bilder auf die Breite der Tabelle begrenzen. Ausgeschaltet werden sie immer in ihrer eigenen Größe angezeigt."
            onClick={onToggleFitImages}
          >
            <span className="tw-rb__switch-track" aria-hidden="true" />
            <span>Bilder anpassen</span>
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>Formatierung <IconChevron /></span>
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
            style={{ display: "none" }}
          />
        </div>
        <div className="tw-rb__label">Werkzeuge</div>
      </div>
    </div>
  );
};

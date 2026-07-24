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
import { ReactElement, useEffect, useRef, useState } from "react";
import { CellFormat, TextAlign } from "./table-model";

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32];

/**
 * Excel-like ribbon styling. Inline styles can't express `:hover`/`:active`
 * and this widget's Webpack build has no CSS loader, so the toolbar renders
 * this scoped stylesheet (everything namespaced under `.tw-rb`) as a `<style>`
 * element in its own markup — always in sync with the component and correct
 * across HMR without touching `document.head`.
 */
const RIBBON_CSS = `
.tw-rb {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0;
  padding: 5px 3px;
  border: 1px solid #d9dee3;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
  margin-bottom: 10px;
  font-size: 13px;
  color: #1f2d3a;
  box-sizing: border-box;
}
.tw-rb__section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3px 10px 2px;
  box-sizing: border-box;
}
.tw-rb__section + .tw-rb__section { border-left: 1px solid #e6e9ed; }
.tw-rb__body { display: flex; align-items: stretch; gap: 4px; flex: 1 1 auto; }
.tw-rb__label { font-size: 10px; color: #7a838e; margin-top: 4px; line-height: 1; text-align: center; letter-spacing: 0.2px; }
.tw-rb__rows { display: flex; flex-direction: column; justify-content: center; gap: 4px; align-items: flex-start; }
.tw-rb__row { display: flex; align-items: stretch; gap: 3px; }
.tw-rb__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 28px;
  min-width: 28px;
  padding: 0 7px;
  border: 1px solid #dbe0e5;
  border-radius: 5px;
  background: #fff;
  color: #2b3742;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
  transition: background 110ms ease, border-color 110ms ease, color 110ms ease, box-shadow 110ms ease;
}
.tw-rb__btn:hover:not(:disabled) { background: #eef3f8; border-color: #b9c2cc; }
.tw-rb__btn:focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(0, 116, 217, 0.4); }
.tw-rb__btn:active:not(:disabled) { background: #e1e7ee; }
.tw-rb__btn:disabled { opacity: 0.45; cursor: not-allowed; }
.tw-rb__btn--active,
.tw-rb__btn--active:hover:not(:disabled) {
  background: #0074d9;
  border-color: #0068c2;
  color: #fff;
}
.tw-rb__btn--icon { width: 43px; min-width: 43px; padding: 0; }
.tw-rb__btn--step { width: 42px; min-width: 42px; padding: 0; gap: 1px; }
.tw-rb__btn--block { width: 100%; }
.tw-rb__big {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 100%;
  width: 76px;
  min-width: 76px;
  padding: 5px 4px;
  border: 1px solid #dbe0e5;
  border-radius: 6px;
  background: #fff;
  color: #2b3742;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
  transition: background 110ms ease, border-color 110ms ease;
}
.tw-rb__big:hover:not(:disabled) { background: #eef3f8; border-color: #b9c2cc; }
.tw-rb__big:disabled { opacity: 0.45; cursor: not-allowed; }
.tw-rb__big--primary {
  color: #fff;
  background: #0074d9;
  border-color: #0068c2;
}
.tw-rb__big--primary:hover:not(:disabled) { background: #0068c2; border-color: #005aa8; }
.tw-rb__select {
  -webkit-appearance: none;
  appearance: none;
  min-height: 28px;
  border: 1px solid #dbe0e5;
  border-radius: 5px;
  background-color: #fff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%236b7684' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 4.5L6 8l3-3.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 7px center;
  background-size: 11px;
  color: #2b3742;
  padding: 0 24px 0 8px;
  font-size: 13px;
  cursor: pointer;
  min-width: 88px;
  box-sizing: border-box;
}
.tw-rb__select:hover:not(:disabled) { border-color: #b9c2cc; }
.tw-rb__select:disabled { opacity: 0.45; cursor: not-allowed; }
.tw-rb__color {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 28px;
  width: 30px;
  min-width: 30px;
  padding: 2px 0 0;
  border: 1px solid #dbe0e5;
  border-right: none;
  border-radius: 5px 0 0 5px;
  background: #fff;
  color: #2b3742;
  cursor: pointer;
  line-height: 1;
  box-sizing: border-box;
}
.tw-rb__color:hover:not(:disabled) { background: #eef3f8; }
.tw-rb__color:disabled { opacity: 0.45; cursor: not-allowed; }
.tw-rb__color-bar {
  width: 18px;
  height: 4px;
  margin-top: 2px;
  border-radius: 1px;
  border: 1px solid rgba(0,0,0,0.12);
  box-sizing: border-box;
}
.tw-rb__caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  width: 18px;
  padding: 0;
  border: 1px solid #dbe0e5;
  border-radius: 0 5px 5px 0;
  background: #fff;
  color: #6b7684;
  cursor: pointer;
  box-sizing: border-box;
}
.tw-rb__caret:hover:not(:disabled) { background: #eef3f8; border-color: #b9c2cc; }
.tw-rb__caret:disabled { opacity: 0.45; cursor: not-allowed; }
.tw-rb__menu {
  position: absolute;
  top: calc(100% + 3px);
  left: 0;
  min-width: 190px;
  background: #fff;
  border: 1px solid #d9dee3;
  border-radius: 8px;
  box-shadow: 0 8px 26px rgba(16, 24, 40, 0.16);
  padding: 5px;
  z-index: 20;
}
.tw-rb__menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #2b3742;
}
.tw-rb__menu-item:hover { background: #eef3f8; }
.tw-rb__swatch { width: 16px; height: 16px; border: 1px solid #cfd4da; border-radius: 3px; flex: 0 0 auto; }
`;

const svgBase = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const IconSave = (): ReactElement => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M8 3v5h6V3" />
    <path d="M8 21v-6h8v6" />
  </svg>
);

const IconSuperscript = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <path d="M2 13L8 5M8 13L2 5" />
    <path d="M11 3.5c0-.6.5-1 1.2-1s1.3.4 1.3 1c0 .5-.3.8-.9 1.2L11 7h3" strokeWidth={1.2} />
  </svg>
);

const IconSubscript = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <path d="M2 11L8 3M8 11L2 3" />
    <path d="M11 10.5c0-.6.5-1 1.2-1s1.3.4 1.3 1c0 .5-.3.8-.9 1.2L11 14h3" strokeWidth={1.2} />
  </svg>
);

const IconAlignLeft = (): ReactElement => (
  <svg {...svgBase} aria-hidden><path d="M2 4h12M2 8h8M2 12h10" /></svg>
);
const IconAlignCenter = (): ReactElement => (
  <svg {...svgBase} aria-hidden><path d="M2 4h12M4 8h8M3 12h10" /></svg>
);
const IconAlignRight = (): ReactElement => (
  <svg {...svgBase} aria-hidden><path d="M2 4h12M6 8h8M4 12h10" /></svg>
);

const IconInsert = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <rect x="2" y="2" width="12" height="12" rx="1" opacity="0.5" />
    <path d="M8 5v6M5 8h6" />
  </svg>
);
const IconDelete = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <rect x="2" y="2" width="12" height="12" rx="1" opacity="0.5" />
    <path d="M5 8h6" />
  </svg>
);
const IconSort = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <path d="M4 3v10M2 11l2 2 2-2" />
    <path d="M9 5h5M9 8h4M9 11h3" strokeWidth={1.2} />
  </svg>
);
const IconPainter = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <path d="M4 9l6-6 3 3-6 6z" />
    <path d="M4 9l-1 4 4-1" />
  </svg>
);
const IconUpload = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <path d="M8 11V3M5 6l3-3 3 3" />
    <path d="M3 12v1h10v-1" />
  </svg>
);
const IconImage = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <rect x="2" y="3" width="12" height="10" rx="1.5" />
    <circle cx="5.5" cy="6.5" r="1" />
    <path d="M3 12l3.5-3.5L9 11l2-2 2 2" />
  </svg>
);
const IconChevron = (): ReactElement => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 4.5L6 8l3-3.5" />
  </svg>
);

/** White box with a red diagonal slash — the "no colour set" (Standard) look. */
const STANDARD_BAR =
  "linear-gradient(to top right, #fff 0 40%, #e53935 40% 60%, #fff 60% 100%)";

export interface TableToolbarProps {
  hasSelection: boolean;
  activeFormat: CellFormat;
  painterActive: boolean;
  insert: { row: boolean; col: boolean };

  onToggle: (key: "bold" | "italic" | "underline" | "strikethrough") => void;
  onAlign: (align: TextAlign) => void;
  onColor: (color: string) => void;
  onClearColor: () => void;
  onBackground: (color: string) => void;
  onClearBackground: () => void;
  onFontSize: (size: number | null) => void;
  onFontSizeStep: (delta: number) => void;
  onSuperscript: () => void;
  onSubscript: () => void;
  onInsertRowAbove: () => void;
  onInsertRowBelow: () => void;
  onInsertColLeft: () => void;
  onInsertColRight: () => void;
  onDeleteRows: () => void;
  onDeleteCols: () => void;
  onMerge: () => void;
  onUnmerge: () => void;
  canUnmerge: boolean;
  onSortAsc: () => void;
  onSortDesc: () => void;
  onClearSort: () => void;
  onCopyFormat: () => void;
  onUpload: (file: File) => void;
  onInsertImage: () => void;
  onDone?: () => void;
}

function RibbonButton({
  onClick,
  active,
  disabled,
  title,
  testId,
  variant,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  testId: string;
  variant?: "icon" | "step" | "block";
  children: React.ReactNode;
}): ReactElement {
  const className = [
    "tw-rb__btn",
    variant === "icon" ? "tw-rb__btn--icon" : "",
    variant === "step" ? "tw-rb__btn--step" : "",
    variant === "block" ? "tw-rb__btn--block" : "",
    active ? "tw-rb__btn--active" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={className}
      title={title}
      aria-label={title}
      aria-pressed={active}
      data-testid={testId}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** A closable dropdown menu anchored to a trigger, used for Insert/Delete/Sort. */
function Dropdown({
  trigger,
  children,
  testId,
}: {
  trigger: (toggle: () => void, open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  testId: string;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Use the capture phase: the injected editor can live inside a modal that
    // stops propagation of bubble-phase pointer events at document.body (to
    // avoid dismissing the host popover). A capture-phase listener on
    // document still fires before that, so an outside click reliably closes
    // this dropdown.
    const onDoc = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc, true);
    return () => document.removeEventListener("mousedown", onDoc, true);
  }, [open]);

  return (
    <div ref={ref} className="tw-rb__dropdown" style={{ position: "relative", display: "flex" }}>
      {trigger(() => setOpen((o) => !o), open)}
      {open && (
        <div className="tw-rb__menu" data-testid={testId}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** Excel-style colour button: glyph over a colour bar, chevron opens options. */
function ColorButton({
  value,
  onChange,
  onClear,
  disabled,
  title,
  testId,
  glyph,
}: {
  value: string | undefined;
  onChange: (color: string) => void;
  onClear: () => void;
  disabled: boolean;
  title: string;
  testId: string;
  glyph: React.ReactNode;
}): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const isStandard = !value;
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        type="button"
        className="tw-rb__color"
        title={title}
        aria-label={title}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {glyph}
        <span
          className="tw-rb__color-bar"
          aria-hidden
          style={{ background: isStandard ? STANDARD_BAR : value }}
        />
      </button>
      <input
        ref={inputRef}
        type="color"
        data-testid={testId}
        aria-label={title}
        disabled={disabled}
        value={value ?? "#233848"}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: "absolute", left: 0, bottom: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />
      <Dropdown
        testId={`${testId}-menu`}
        trigger={(toggle) => (
          <button
            type="button"
            className="tw-rb__caret"
            title={`${title}: Optionen`}
            aria-label={`${title}: Optionen`}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggle}
          >
            <IconChevron />
          </button>
        )}
      >
        {(close) => (
          <>
            <button
              type="button"
              className="tw-rb__menu-item"
              data-testid={`${testId}-reset`}
              onClick={() => {
                onClear();
                close();
              }}
            >
              <span className="tw-rb__swatch" style={{ background: STANDARD_BAR }} /> Standard
            </button>
            <button
              type="button"
              className="tw-rb__menu-item"
              onClick={() => {
                close();
                inputRef.current?.click();
              }}
            >
              <span className="tw-rb__swatch" style={{ background: value ?? "#233848" }} /> Farbe wählen…
            </button>
          </>
        )}
      </Dropdown>
    </div>
  );
}

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

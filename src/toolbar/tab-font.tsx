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

import { ColorButton, RibbonButton } from "./controls";
import { IconSubscript, IconSuperscript } from "./icons";
import { TableToolbarProps } from "./props";

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32];

export type FontTabProps = Pick<
  TableToolbarProps,
  | "hasSelection"
  | "activeFormat"
  | "onToggle"
  | "onColor"
  | "onClearColor"
  | "onBackground"
  | "onClearBackground"
  | "onFontSize"
  | "onFontSizeStep"
  | "onSuperscript"
  | "onSubscript"
  | "onToggleLowercase"
  | "lowercaseActive"
>;

/** Everything that changes how the characters in a cell look. */
export function FontTab({
  hasSelection,
  activeFormat,
  onToggle,
  onColor,
  onClearColor,
  onBackground,
  onClearBackground,
  onFontSize,
  onFontSizeStep,
  onSuperscript,
  onSubscript,
  onToggleLowercase,
  lowercaseActive,
}: FontTabProps): ReactElement {
  const disabled = !hasSelection;

  return (
    <>
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
      <RibbonButton
        testId="toolbar-lowercase"
        variant="icon"
        title="Versalien aufheben"
        disabled={disabled}
        active={lowercaseActive}
        onClick={onToggleLowercase}
      >
        <span style={{ fontSize: "13px", textTransform: "lowercase" }}>aa</span>
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
    </>
  );
}

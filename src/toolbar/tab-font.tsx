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
import { AArrowDown, AArrowUp, Bold, Italic, PaintBucket, Strikethrough, Subscript, Superscript, Underline } from "lucide-react";
import { ToolButton } from "@man/config-ui/toolbar/tool-button";
import { ToolMenu, ToolMenuItem } from "@man/config-ui/toolbar/tool-menu";
import { ToolSeparator, Toolbar } from "@man/config-ui/toolbar/toolbar";

import { ColorTool } from "@man/config-ui/toolbar/color-tool";
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
>;

/**
 * Everything that changes how the characters in a cell look: Auszeichnung,
 * Farben, Größe – in dieser Reihenfolge wie im Screen, je Gruppe getrennt.
 */
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
}: FontTabProps): ReactElement {
  const disabled = !hasSelection;

  return (
    <Toolbar aria-label="Schrift">
      <ToolButton data-testid="toolbar-bold" label="Fett" icon={Bold} disabled={disabled} pressed={activeFormat.bold === true} onClick={() => onToggle("bold")} />
      <ToolButton data-testid="toolbar-italic" label="Kursiv" icon={Italic} disabled={disabled} pressed={activeFormat.italic === true} onClick={() => onToggle("italic")} />
      <ToolButton data-testid="toolbar-underline" label="Unterstrichen" icon={Underline} disabled={disabled} pressed={activeFormat.underline === true} onClick={() => onToggle("underline")} />
      <ToolButton data-testid="toolbar-strike" label="Durchgestrichen" icon={Strikethrough} disabled={disabled} pressed={activeFormat.strikethrough === true} onClick={() => onToggle("strikethrough")} />
      {/* Befehle, keine Umschalter: sie wirken auf den markierten Text in der Zelle. */}
      <ToolButton data-testid="toolbar-superscript" label="Hochstellen" icon={Superscript} disabled={disabled} onClick={onSuperscript} />
      <ToolButton data-testid="toolbar-subscript" label="Tiefstellen" icon={Subscript} disabled={disabled} onClick={onSubscript} />
      <ToolSeparator />
      <ColorTool
        testId="toolbar-color"
        label="Schriftfarbe"
        disabled={disabled}
        value={activeFormat.color}
        onChange={onColor}
        onClear={onClearColor}
        glyph={<span className="text-[15px] font-bold">A</span>}
        standardBar="var(--foreground)"
      />
      <ColorTool
        testId="toolbar-bg"
        label="Hintergrundfarbe"
        disabled={disabled}
        value={activeFormat.background}
        onChange={onBackground}
        onClear={onClearBackground}
        glyph={<PaintBucket className="size-4" aria-hidden />}
        standardBar="transparent"
      />
      <ToolSeparator />
      <ToolMenu
        testId="toolbar-fontsize"
        label={`Schriftgröße: ${activeFormat.fontSize ?? "Standard"}`}
        title="Schriftgröße"
        disabled={disabled}
        text={<span className="min-w-12 text-left">{activeFormat.fontSize ?? "Standard"}</span>}
      >
        {(close) => (
          <div className="flex w-32 flex-col">
            {[undefined, ...FONT_SIZES].map((size) => (
              <ToolMenuItem
                key={size ?? "standard"}
                data-testid={`toolbar-fontsize-${size ?? "standard"}`}
                aria-pressed={activeFormat.fontSize === size}
                // Die Liste nimmt den Fokus nicht: markierter Text in der Zelle bleibt markiert.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onFontSize(size ?? null);
                  close();
                }}
              >
                {size ?? "Standard"}
              </ToolMenuItem>
            ))}
          </div>
        )}
      </ToolMenu>
      <ToolButton data-testid="toolbar-fontsize-inc" label="Schrift vergrößern" icon={AArrowUp} disabled={disabled} onClick={() => onFontSizeStep(1)} />
      <ToolButton data-testid="toolbar-fontsize-dec" label="Schrift verkleinern" icon={AArrowDown} disabled={disabled} onClick={() => onFontSizeStep(-1)} />
    </Toolbar>
  );
}

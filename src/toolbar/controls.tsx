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
import { ToolButton } from "@man/config-ui/toolbar/tool-button";
import { ToolMenu, ToolMenuItem } from "@man/config-ui/toolbar/tool-menu";

/**
 * „Keine Farbe gesetzt“: weiße Fläche mit rotem Schrägstrich, aus den Tokens
 * des Rahmens. Nur im Config-Modal zu sehen, das sie definiert.
 */
const STANDARD_SWATCH = "linear-gradient(to top right, var(--background) 0 40%, var(--destructive) 40% 60%, var(--background) 60% 100%)";

/** Womit der Farbwähler startet, solange die Zelle keine Farbe hat. */
const PICKER_START = "#233848";

/** Ein Farbfeld im Menü: die gesetzte Farbe oder „Standard“. */
function Swatch({ color }: { color: string | undefined }): ReactElement {
  return (
    <span
      aria-hidden
      className="size-4 shrink-0 rounded-sm border border-input"
      style={{ background: color ?? STANDARD_SWATCH }}
    />
  );
}

export interface ColorButtonProps {
  value: string | undefined;
  onChange: (color: string) => void;
  onClear: () => void;
  disabled: boolean;
  /** „Schriftfarbe“, „Hintergrundfarbe“ – Name des Knopfs und des Farbfelds. */
  label: string;
  /** `data-testid` des Farbfelds; das Menü daneben heißt `${testId}-options`. */
  testId: string;
  /** Das Zeichen über dem Farbbalken: „A“ oder ein Icon. */
  glyph: React.ReactNode;
  /**
   * Der Balken ohne gesetzte Farbe: für Schrift die Textfarbe des Rahmens
   * (die Zelle erbt die Schriftfarbe der Seite), für den Hintergrund keiner.
   */
  standardBar: string;
}

/**
 * Farbe wie in Office: Zeichen über einem Balken in der gesetzten Farbe,
 * ein Klick öffnet den Farbwähler; der Pfeil daneben bietet „Standard“
 * (Farbe entfernen) und „Farbe wählen…“.
 *
 * Der native Farbwähler bleibt bedienbar und wird deshalb nicht ausgeblendet,
 * sondern auf einen unsichtbaren Punkt gelegt: `display: none` nähme manchen
 * Browsern die Möglichkeit, den Dialog zu öffnen. Aus der Tab-Folge ist er
 * genommen – der Knopf davor öffnet ihn.
 */
export function ColorButton({ value, onChange, onClear, disabled, label, testId, glyph, standardBar }: ColorButtonProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = (): void => inputRef.current?.click();

  return (
    <span className="relative inline-flex shrink-0 items-center">
      <ToolButton label={`${label}: ${value ?? "Standard"}`} title={label} disabled={disabled} onClick={openPicker}>
        <span aria-hidden className="inline-flex flex-col items-center gap-0.5 leading-none">
          {glyph}
          <span className="h-[3px] w-4 rounded-full" style={{ background: value ?? standardBar }} />
        </span>
      </ToolButton>
      <input
        ref={inputRef}
        type="color"
        tabIndex={-1}
        data-testid={testId}
        aria-label={label}
        disabled={disabled}
        value={value ?? PICKER_START}
        onChange={(event) => onChange(event.target.value)}
        className="pointer-events-none absolute bottom-0 left-0 size-px opacity-0"
      />
      <ToolMenu label={`${label}: Optionen`} testId={`${testId}-options`} disabled={disabled} className="w-5 min-w-0 px-0">
        {(close) => (
          <>
            <ToolMenuItem
              data-testid={`${testId}-reset`}
              onClick={() => {
                onClear();
                close();
              }}
            >
              <Swatch color={undefined} /> Standard
            </ToolMenuItem>
            <ToolMenuItem
              onClick={() => {
                close();
                openPicker();
              }}
            >
              <Swatch color={value ?? PICKER_START} /> Farbe wählen…
            </ToolMenuItem>
          </>
        )}
      </ToolMenu>
    </span>
  );
}

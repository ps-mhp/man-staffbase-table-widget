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
import { ReactElement, useEffect, useRef, useState } from "react";

import { Button, useEditorStyles } from "@shared/editor-ui";
import { IconChevron } from "./icons";

/** White box with a red diagonal slash — the "no colour set" (Standard) look. */
const STANDARD_BAR =
  "linear-gradient(to top right, #fff 0 40%, #e53935 40% 60%, #fff 60% 100%)";

export function RibbonButton({
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
  variant?: "icon" | "step";
  children: React.ReactNode;
}): ReactElement {
  // Lädt das Stylesheet der Redaktionsebene (`Button`), referenzgezählt in
  // `document.head` — siehe RibbonShell für dieselbe Begründung.
  useEditorStyles();
  // `tw-rb__btn` bleibt das Vokabular des Ribbons: es platziert den Knopf im
  // Raster der Zeile (Breite, Fluchtlinien). `--icon`/`--step` markieren nur
  // noch die Rasterplätze, ihre alte Optik liefert jetzt `Button`.
  const layoutClassName = [
    "tw-rb__btn",
    variant === "icon" ? "tw-rb__btn--icon" : "",
    variant === "step" ? "tw-rb__btn--step" : "",
    active ? "tw-rb__btn--active" : "",
  ]
    .filter(Boolean)
    .join(" ");
  // `IconButton` passt hier nicht: sie verlangt `icon: IconName` und schließt
  // `children` aus, die Ribbon-Symbole sind aber freie JSX-Knoten (fettes
  // „B“, kursives „I“ usw.) ohne Namen im MAN-Katalog — und bleiben das laut
  // Plan dauerhaft. Der Icon-Fall baut deshalb auf `Button` und holt sich
  // `IconButton`s eigene Optik über deren Klasse `man-ed-button--icon`.
  const className =
    variant === "icon"
      ? ["man-ed-button--icon", layoutClassName].filter(Boolean).join(" ")
      : layoutClassName;
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      // `title` bleibt die Kurzhilfe beim Überfahren, `aria-label` der
      // zugängliche Name — beide werden gebraucht, `Button` liefert keinen
      // von beiden automatisch für einen reinen Symbol-Knopf.
      title={title}
      aria-label={title}
      // Unverändert durchgereicht, nicht `!!active`/`active ?? false`: ein
      // einfacher Auslöser (Hoch-/Tiefstellen, Schritt-Knöpfe) hat `active`
      // gar nicht gesetzt und soll auch kein `aria-pressed` tragen — nur ein
      // echter Umschalter (Fett, Kursiv, …) bekommt `"true"`/`"false"`.
      aria-pressed={active}
      data-testid={testId}
      disabled={disabled}
      // Verhindert, dass ein Klick auf den Ribbon-Knopf der gerade
      // bearbeiteten `contenteditable`-Zelle den Fokus (und damit die
      // Textauswahl) nimmt. Ohne das würde z. B. "Fett" ins Leere formatieren,
      // weil die Auswahl beim Mousedown schon verloren wäre.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/** A closable dropdown menu anchored to a trigger, used for Insert/Delete/Sort. */
export function Dropdown({
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
    <div ref={ref} className="tw-rb__dropdown">
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
export function ColorButton({
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
    <div className="tw-rb__color-wrap">
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
        className="tw-rb__color-input"
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

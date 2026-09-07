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

import { Button, Menu, MenuItem, useEditorStyles } from "@shared/editor-ui";
import { IconChevron } from "./icons";

/**
 * White box with a red diagonal slash — the "no colour set" (Standard) look.
 *
 * Aufgabe 13a: Blieb beim Umbau auf `Menu` stehen (`#fff`/`#e53935`), obwohl
 * er als Inline-Stil dieselbe Prüfung durchläuft wie ein Stylesheet-Wert.
 * Die Fläche ist eine echte Gestaltungsentscheidung (`surface`, Weiß); der
 * Schrägbalken ist dagegen eine **Bedeutungsdarstellung**: ein diagonaler
 * roter Strich für "kein Wert" (wie das Verbotszeichen einer Beschilderung),
 * keine Markenfarbe auf einer Fläche. Er zieht deshalb `red-700` — denselben
 * Rot-Rampenschritt wie `danger` (`_tokens.scss:58` in
 * `src/shared/editor-ui/styles/_tokens.scss`), aber unter seinem
 * beschreibenden Namen, weil `danger` im übrigen Code zerstörerische
 * Aktionen bedeutet (siehe Kommentar an `$text-mark` in der lokalen
 * `_tokens.scss`) — das ist hier nicht gemeint.
 */
const STANDARD_BAR =
  "linear-gradient(to top right, var(--man-editor-surface) 0 40%, var(--man-editor-red-700) 40% 60%, var(--man-editor-surface) 60% 100%)";

/**
 * Vorgabefarbe der Farbauswahl, solange keine Farbe gewählt ist.
 *
 * Aufgabe 13a: stand bisher als `#233848` da — gemessen gegen den Textton
 * der Ebene (`tokens.man-editor(text)`, `src/shared/editor-ui/styles/_tokens.scss:92`,
 * `#12171c`) ist das **nicht** derselbe Wert, also ein Rest der alten
 * Staffbase-Oberfläche, kein Token. Der Wert zieht deshalb hier auf den
 * tatsächlichen MAN-Textton.
 *
 * Bleibt trotzdem ein literaler Hex-String, nicht `var(--man-editor-text)`:
 * er füllt einerseits das native `value`-Attribut von `<input type="color">`
 * (Zeile weiter unten) — ein HTML-Attribut, kein CSS-Kontext, akzeptiert
 * also keine Custom Property. Diese eine Stelle ist der Grund, warum
 * `no-raw-values.test.ts` hier noch einen Eintrag in `ALLOWED` führt.
 */
const DEFAULT_SWATCH_COLOR = "#12171c";

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
  // Lädt das Stylesheet der Redaktionsebene (`Button`, `Menu`), referenzgezählt
  // in `document.head` — siehe RibbonShell für dieselbe Begründung.
  useEditorStyles();
  const inputRef = useRef<HTMLInputElement>(null);
  const isStandard = !value;
  return (
    <div className="tw-rb__color-wrap">
      <Button
        variant="ghost"
        size="sm"
        className="tw-rb__color"
        title={title}
        aria-label={title}
        disabled={disabled}
        // Verhindert, dass ein Klick auf den Farbknopf die Textauswahl der
        // gerade bearbeiteten `contenteditable`-Zelle verliert — siehe
        // `RibbonButton` für dieselbe Begründung.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {glyph}
        <span
          className="tw-rb__color-bar"
          aria-hidden
          style={{ background: isStandard ? STANDARD_BAR : value }}
        />
      </Button>
      <input
        ref={inputRef}
        type="color"
        data-testid={testId}
        aria-label={title}
        disabled={disabled}
        value={value ?? DEFAULT_SWATCH_COLOR}
        onChange={(e) => onChange(e.target.value)}
        className="tw-rb__color-input"
      />
      <Menu
        label={`${title}: Optionen`}
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="tw-rb__caret"
            title={`${title}: Optionen`}
            aria-label={`${title}: Optionen`}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
          >
            <IconChevron />
          </Button>
        }
      >
        <MenuItem data-testid={`${testId}-reset`} onClick={onClear}>
          <span className="tw-rb__swatch" style={{ background: STANDARD_BAR }} /> Standard
        </MenuItem>
        <MenuItem onClick={() => inputRef.current?.click()}>
          {/* Vorschau-Swatch in CSS-Kontext (anders als das native
              `value`-Attribut oben): hier greift `var(--man-editor-text)`
              direkt, kein literaler Hex-Wert nötig. */}
          <span className="tw-rb__swatch" style={{ background: value ?? "var(--man-editor-text)" }} /> Farbe wählen…
        </MenuItem>
      </Menu>
    </div>
  );
}

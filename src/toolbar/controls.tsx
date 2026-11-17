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
import { useEscapeLayer } from "@man/config-ui/shell/escape-layers";

import { IconChevron } from "./icons";
import { activeElementOf, eventRootOf } from "@shared/shadow-dom";

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
  const className = [
    "tw-rb__btn",
    variant === "icon" ? "tw-rb__btn--icon" : "",
    variant === "step" ? "tw-rb__btn--step" : "",
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
    // An der Wurzel des Editors, in der Capture-Phase: das Config-Modal hält
    // Klicks am Host an, und an `document` hieße das Ziel aus dem Shadow Root
    // nur „Host“ – jeder Klick ins Menü zählte dort als „außerhalb“.
    // `composedPath` sieht durch den Shadow Root hindurch.
    const root = eventRootOf(ref.current);
    const onMouseDown = (event: Event): void => {
      if (ref.current && !event.composedPath().includes(ref.current)) setOpen(false);
    };
    root.addEventListener("mousedown", onMouseDown, true);
    return () => root.removeEventListener("mousedown", onMouseDown, true);
  }, [open]);

  // Escape schließt das Menü, nicht den Rahmen darum. Stand der Fokus im Menü,
  // ginge er mit ihm verloren – dann zurück an den Knopf, der es öffnete.
  const closeByEscape = (): void => {
    const wrapper = ref.current;
    const focusInside = wrapper !== null && wrapper.contains(activeElementOf(wrapper));
    setOpen(false);
    if (focusInside) wrapper.querySelector<HTMLButtonElement>("button")?.focus();
  };
  // Im Rahmen fragt dessen Escape zuerst die jüngste Ebene – auch wenn der
  // Fokus gar nicht im Menü steht.
  useEscapeLayer(open, closeByEscape);

  return (
    <div
      ref={ref}
      className="tw-rb__dropdown"
      // Außerhalb eines Rahmens gibt es keine Ebenen; da reicht Escape mit dem
      // Fokus im Menü. `preventDefault`: der Rahmen lässt es dann liegen.
      onKeyDown={(event) => {
        if (!open || event.key !== "Escape" || event.defaultPrevented) return;
        event.preventDefault();
        closeByEscape();
      }}
    >
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

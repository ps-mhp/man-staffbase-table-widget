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

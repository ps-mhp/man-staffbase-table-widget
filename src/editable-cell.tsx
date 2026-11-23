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

import { MEDIA_DRAG_TYPE, hasDragType } from "@man/config-ui/drop/drag-payload";
import { ICON_DRAG_TYPE } from "@shared/icons/icon-drag";

import { clampImageWidth } from "./cell-image";
import { sanitizeRichText } from "./rich-text";
import { activeElementOf, selectionOf } from "@shared/shadow-dom";

export interface EditableCellProps {
  html: string;
  ariaLabel: string;
  editing: boolean;
  format: React.CSSProperties;
  onInput: (value: string) => void;
  onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void;
  onStopEdit: () => void;
  /**
   * Escape beim Bearbeiten: wie in Excel die Eingabe verwerfen. Der Rahmen
   * schließt auf Escape – deshalb nimmt die Zelle die Taste vorher weg.
   */
  onEscape: () => void;
  /**
   * Enter, Tab (mit Umschalt rückwärts): Eingabe übernehmen und zur
   * Nachbarzelle wandern, wie in Excel. Ohne Angabe bleibt Enter beim Text.
   */
  onCommit?: (dir: "up" | "down" | "left" | "right") => void;
}

/** Puts the caret at the end of `el`, asked of the cell's own root (shadow DOM). */
function placeCaretAtEnd(el: HTMLElement): void {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = selectionOf(el);
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/**
 * Drags the bottom-right handle to resize the selected image. `preventDefault`
 * on the initiating mousedown keeps the contenteditable focused (so the cell
 * doesn't blur/close mid-drag), and the new width is persisted on release.
 *
 * The move/up listeners are attached in the **capture** phase: when the
 * editor runs inside the injected config-dialog modal, a bubble-phase
 * `mouseup` listener on `document.body` stops propagation for events inside
 * the modal (to keep the host popover from dismissing). A bubble-phase
 * listener on `document` would therefore never receive the `mouseup` and the
 * drag would never end; capturing runs before that `stopPropagation`.
 */
function startImageResize(event: React.MouseEvent, img: HTMLImageElement, onMove: () => void, onDone: () => void): void {
  event.preventDefault();
  event.stopPropagation();
  const startX = event.clientX;
  const startWidth = img.getBoundingClientRect().width || img.offsetWidth || 100;

  const move = (moveEvent: MouseEvent): void => {
    const width = clampImageWidth(startWidth + (moveEvent.clientX - startX));
    img.style.width = `${width}px`;
    img.style.height = "auto";
    onMove();
  };
  const up = (): void => {
    document.removeEventListener("mousemove", move, true);
    document.removeEventListener("mouseup", up, true);
    onDone();
  };
  document.addEventListener("mousemove", move, true);
  document.addEventListener("mouseup", up, true);
}

/**
 * Ein Medium aus der Mediathek-Leiste oder ein Element aus dem Explorer
 * gehört der Ablagezone um die Zelle (`CellDropZone`), nicht dem Text: eine
 * bearbeitete Zelle nähme sonst die mitgezogene Vorschau-Adresse oder das
 * JSON als Text auf. `preventDefault` hält den
 * Browser davon ab; das Ereignis steigt weiter zur Zone, die das Bild
 * einsetzt. Alles andere – gezogener Text – bleibt beim Browser.
 */
function keepMediaOutOfText(event: React.DragEvent<HTMLDivElement>): void {
  if (hasDragType(event.dataTransfer, MEDIA_DRAG_TYPE) || hasDragType(event.dataTransfer, ICON_DRAG_TYPE)) event.preventDefault();
}

/**
 * A single cell's content. It is only `contenteditable` while it is the cell
 * being edited (entered via double-click); the rest of the time editing is
 * off so that mouse drags select cells instead of text/caret. Content is set
 * imperatively (never while focused) so React re-renders don't reset the
 * caret, and is read back out as sanitized inline markup (only `<sup>`/`<sub>`
 * survive).
 *
 * ⌘Z in der bearbeiteten Zelle bleibt beim Browser: der Rahmen lässt
 * Rückgängig in `contenteditable` aus und nimmt so nur Getipptes zurück.
 */
export function EditableCell({
  html,
  ariaLabel,
  editing,
  format,
  onInput,
  onPaste,
  onStopEdit,
  onEscape,
  onCommit,
}: EditableCellProps): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  // Bumped to re-render (reposition the resize handle) during a drag.
  const [, setTick] = useState(0);
  const readBack = (): void => onInput(sanitizeRichText(ref.current?.innerHTML ?? ""));

  useEffect(() => {
    const el = ref.current;
    // Not while the cell is being typed in — asked of the cell's own root: in
    // the config modal's shadow root `document.activeElement` is the host.
    if (el && el !== activeElementOf(el) && el.innerHTML !== html) {
      el.innerHTML = html;
      setSelectedImg(null);
    }
  }, [html]);

  // When a cell enters edit mode, focus it and drop the caret at the end;
  // leaving edit mode always clears any image resize selection/handle.
  useEffect(() => {
    const el = ref.current;
    if (editing && el && el !== activeElementOf(el)) placeCaretAtEnd(el);
    if (!editing) setSelectedImg(null);
  }, [editing]);

  const handlePos = ((): { left: number; top: number } | null => {
    const img = selectedImg;
    const cont = containerRef.current;
    if (!editing || !img || !cont || !cont.contains(img)) return null;
    const imgRect = img.getBoundingClientRect();
    const contRect = cont.getBoundingClientRect();
    return { left: imgRect.right - contRect.left, top: imgRect.bottom - contRect.top };
  })();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!editing || event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      // Vor dem Rahmen: der ignoriert Ereignisse, die schon jemand behandelt hat.
      event.preventDefault();
      onEscape();
      return;
    }
    if (event.key === "Enter" && event.altKey) {
      // Alt+Enter: Zeilenumbruch in der Zelle, wie in Excel.
      event.preventDefault();
      if (typeof document.execCommand === "function") document.execCommand("insertLineBreak");
      readBack();
      return;
    }
    if (onCommit === undefined || event.metaKey || event.ctrlKey) return;
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      readBack();
      onCommit(event.key === "Enter" ? (event.shiftKey ? "up" : "down") : event.shiftKey ? "left" : "right");
    }
  };

  return (
    <div ref={containerRef} className="table-editor__cell-box">
      <div
        ref={ref}
        role="textbox"
        contentEditable={editing}
        suppressContentEditableWarning
        aria-label={ariaLabel}
        className={`table-editor__editable${editing ? " table-editor__editable--editing" : ""}`}
        style={format}
        onPaste={onPaste}
        onBlur={onStopEdit}
        onKeyDown={handleKeyDown}
        onDragOver={keepMediaOutOfText}
        onDrop={keepMediaOutOfText}
        onInput={readBack}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          setSelectedImg(editing && target.tagName === "IMG" ? (target as HTMLImageElement) : null);
        }}
      />
      {handlePos && selectedImg && (
        <div
          data-testid="image-resize-handle"
          aria-label="Bildgröße ändern"
          onMouseDown={(event) => startImageResize(event, selectedImg, () => setTick((t) => t + 1), readBack)}
          className="table-editor__image-handle"
          // Follows the image it belongs to, so its position is data, not style.
          style={{ left: handlePos.left - 6, top: handlePos.top - 6 }}
        />
      )}
    </div>
  );
}

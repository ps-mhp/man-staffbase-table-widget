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

import { Dropdown } from "./controls";
import { IconChevron, IconImage, IconImageSize } from "./icons";
import { TableToolbarProps } from "./props";

export type ImagesTabProps = Pick<
  TableToolbarProps,
  | "hasSelection"
  | "onInsertImage"
  | "hasSelectedImages"
  | "canEqualizeImages"
  | "onEqualizeImageHeight"
  | "onEqualizeImageWidth"
  | "onResetImageSize"
  | "fitImages"
  | "onToggleFitImages"
>;

/** Putting pictures into cells and getting them to a common size. */
export function ImagesTab({
  hasSelection,
  onInsertImage,
  hasSelectedImages,
  canEqualizeImages,
  onEqualizeImageHeight,
  onEqualizeImageWidth,
  onResetImageSize,
  fitImages,
  onToggleFitImages,
}: ImagesTabProps): ReactElement {
  const disabled = !hasSelection;

  return (
    <>
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
    </>
  );
}

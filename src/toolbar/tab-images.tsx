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
import { ImagePlus, Scaling } from "lucide-react";
import { ToolButton } from "@man/config-ui/toolbar/tool-button";
import { ToolMenu, ToolMenuItem } from "@man/config-ui/toolbar/tool-menu";
import { Toolbar } from "@man/config-ui/toolbar/toolbar";

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
>;

const NEEDS_TWO = "Mindestens zwei markierte Bilder nötig";

/**
 * Putting pictures into cells and getting them to a common size. Der
 * Schalter „Bilder anpassen“ gilt für die ganze Tabelle und steht im Panel
 * „Tabelle“ rechts.
 */
export function ImagesTab({
  hasSelection,
  onInsertImage,
  hasSelectedImages,
  canEqualizeImages,
  onEqualizeImageHeight,
  onEqualizeImageWidth,
  onResetImageSize,
}: ImagesTabProps): ReactElement {
  return (
    <Toolbar aria-label="Bilder">
      <ToolButton data-testid="toolbar-image-button" label="Bild in Zelle einfügen" icon={ImagePlus} disabled={!hasSelection} onClick={onInsertImage}>
        Bild
      </ToolButton>
      <ToolMenu
        testId="toolbar-image-size"
        label="Bildgröße angleichen"
        title="Größe der markierten Bilder angleichen (Maßstab ist das zuerst markierte Bild)"
        icon={Scaling}
        text="Bildgröße"
        disabled={!hasSelectedImages}
      >
        {(close) => (
          <>
            <ToolMenuItem data-testid="toolbar-image-equal-height" disabled={!canEqualizeImages} title={canEqualizeImages ? undefined : NEEDS_TWO} onClick={() => { onEqualizeImageHeight(); close(); }}>
              Gleiche Höhe wie erstes Bild
            </ToolMenuItem>
            <ToolMenuItem data-testid="toolbar-image-equal-width" disabled={!canEqualizeImages} title={canEqualizeImages ? undefined : NEEDS_TWO} onClick={() => { onEqualizeImageWidth(); close(); }}>
              Gleiche Breite wie erstes Bild
            </ToolMenuItem>
            <ToolMenuItem data-testid="toolbar-image-reset-size" onClick={() => { onResetImageSize(); close(); }}>
              Standardgröße
            </ToolMenuItem>
          </>
        )}
      </ToolMenu>
    </Toolbar>
  );
}

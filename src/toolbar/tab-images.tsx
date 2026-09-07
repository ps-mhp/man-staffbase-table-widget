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

import { Icon, Menu, MenuItem, Switch, useEditorStyles } from "@shared/editor-ui";
import { IconChevron, IconImageSize } from "./icons";
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
  // Lädt das Stylesheet der Redaktionsebene (`Menu`), referenzgezählt in
  // `document.head` — siehe RibbonShell für dieselbe Begründung.
  useEditorStyles();
  const disabled = !hasSelection;
  // Kennung für den Hilfetext des Schalters. `useId` (wie `Field` in der
  // Ebene) statt einer fest verdrahteten Zeichenkette: eine Zeichenkette
  // kollidierte, sobald `ImagesTab` zweimal auf der Seite steht (z. B. zwei
  // Tabellen-Widgets), und ein `aria-describedby` mit doppelt vergebener ID
  // zeigte auf den ersten Treffer im DOM — unter Umständen den falschen Text.
  const fitImagesHelpId = React.useId();

  return (
    <>
      <button type="button" className="tw-rb__btn" data-testid="toolbar-image-button" title="Bild in Zelle einfügen" disabled={disabled} onClick={onInsertImage}>
        <Icon name="image" size="md" />
        <span>Bild</span>
      </button>


      <Menu
        label="Bildgröße"
        trigger={
          <button
            type="button"
            className="tw-rb__btn"
            data-testid="toolbar-image-size"
            title="Größe der markierten Bilder angleichen (Maßstab ist das zuerst markierte Bild)"
            disabled={!hasSelectedImages}
          >
            <IconImageSize />
            <span className="tw-rb__label">Bildgröße <IconChevron /></span>
          </button>
        }
      >
        <MenuItem
          data-testid="toolbar-image-equal-height"
          disabled={!canEqualizeImages}
          title={canEqualizeImages ? undefined : "Mindestens zwei markierte Bilder nötig"}
          onClick={onEqualizeImageHeight}
        >
          Gleiche Höhe wie erstes Bild
        </MenuItem>
        <MenuItem
          data-testid="toolbar-image-equal-width"
          disabled={!canEqualizeImages}
          title={canEqualizeImages ? undefined : "Mindestens zwei markierte Bilder nötig"}
          onClick={onEqualizeImageWidth}
        >
          Gleiche Breite wie erstes Bild
        </MenuItem>
        <MenuItem data-testid="toolbar-image-reset-size" onClick={onResetImageSize}>
          Standardgröße
        </MenuItem>
      </Menu>

      {/*
        `Switch` zerlegt seine Props einzeln (kein `...rest`) und nimmt daher
        weder `data-testid` noch `title` an. Der `title` ist echter Hilfetext
        für die Redaktion und wandert deshalb auf diese umschließende Hülle —
        `title` an einem Element wirkt auch für dessen Inhalt, das erhält den
        Maus-Tooltip für sehende Redakteure. Für Screenreader trägt das allein
        nichts bei: die Berechnung des zugänglichen Namens/der Beschreibung
        liest `title` nur am Element selbst, nicht an Vorfahren (`role="switch"`
        sitzt am `<button>` in `Switch`, nicht an dieser Hülle). Deshalb steht
        derselbe Text zusätzlich als eigenes, aber visuell verstecktes Element
        im DOM (`tw-rb__visually-hidden` — im Layout unsichtbar, für
        Hilfstechnik aber vorhanden, anders als `display: none`), das `Switch`
        über `aria-describedby` verdrahtet bekommt. Das verlorene
        `data-testid="toolbar-image-fit"` wird in `table-editor.test.tsx`
        durch `getByRole("switch", { name: "Bilder anpassen" })` ersetzt.
      */}
      <span
        className="tw-rb__switch-wrap"
        title="Bilder auf die Breite der Tabelle begrenzen. Ausgeschaltet werden sie immer in ihrer eigenen Größe angezeigt."
      >
        <Switch
          checked={fitImages}
          onCheckedChange={onToggleFitImages}
          label="Bilder anpassen"
          aria-describedby={fitImagesHelpId}
        />
        <span id={fitImagesHelpId} className="tw-rb__visually-hidden">
          Bilder auf die Breite der Tabelle begrenzen. Ausgeschaltet werden sie immer in ihrer eigenen Größe angezeigt.
        </span>
      </span>
    </>
  );
}

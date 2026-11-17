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

import { CellFormat, TextAlign, VerticalAlign } from "../table-model";
import { ClearScope } from "../clear-format";

/** The toolbar's tabs, in the order they appear. */
export type TabId = "font" | "align" | "cells" | "images" | "data";

/**
 * Alles, was an Zellen und Markierung hängt. Einstellungen der ganzen Tabelle
 * (erste Sortierung, sichtbare Zeilen, Export, Bilder anpassen) stehen im
 * Panel „Tabelle“ rechts (`table-inspector.tsx`), Speichern, Schließen und
 * Hilfe im Kopf des Rahmens.
 */
export interface TableToolbarProps {
  hasSelection: boolean;
  activeFormat: CellFormat;
  painterActive: boolean;
  insert: { row: boolean; col: boolean };

  onToggle: (key: "bold" | "italic" | "underline" | "strikethrough") => void;
  onAlign: (align: TextAlign) => void;
  onVerticalAlign: (align: VerticalAlign) => void;
  onColor: (color: string) => void;
  onClearColor: () => void;
  onBackground: (color: string) => void;
  onClearBackground: () => void;
  onFontSize: (size: number | null) => void;
  onFontSizeStep: (delta: number) => void;
  onSuperscript: () => void;
  onSubscript: () => void;
  onInsertRowAbove: () => void;
  onInsertRowBelow: () => void;
  onInsertColLeft: () => void;
  onInsertColRight: () => void;
  onDeleteRows: () => void;
  onDeleteCols: () => void;
  onMerge: () => void;
  onUnmerge: () => void;
  canUnmerge: boolean;
  onCopyFormat: () => void;
  onUpload: (file: File) => void;
  onInsertImage: () => void;
  /** True when the selection holds at least one image. */
  hasSelectedImages: boolean;
  /** True when it holds at least two — i.e. one can be the size reference. */
  canEqualizeImages: boolean;
  onEqualizeImageHeight: () => void;
  onEqualizeImageWidth: () => void;
  onResetImageSize: () => void;
  /**
   * Resets formatting — on the selection, or on the whole table when nothing
   * is selected, which is why these stay enabled without a selection.
   */
  onClearFormatting: (scope: ClearScope) => void;
  /** True while a selection limits the reset to part of the table. */
  hasClearTarget: boolean;
}

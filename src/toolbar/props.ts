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

import { CellFormat, TextAlign, VerticalAlign } from "../table-model";
import { ClearScope } from "../clear-format";

/** The toolbar's tabs, in the order they appear. */
export type TabId = "font" | "align" | "cells" | "images" | "data";

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
  /** Toggles the "text-lowercase" mark on the current text or cell selection. */
  onToggleLowercase: () => void;
  /** True when the anchor cell is fully marked, so the button shows as active. */
  lowercaseActive: boolean;
  onInsertRowAbove: () => void;
  onInsertRowBelow: () => void;
  onInsertColLeft: () => void;
  onInsertColRight: () => void;
  onDeleteRows: () => void;
  onDeleteCols: () => void;
  onMerge: () => void;
  onUnmerge: () => void;
  canUnmerge: boolean;
  onSortAsc: () => void;
  onSortDesc: () => void;
  onClearSort: () => void;
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
   * Whether images are capped to the width of the rendered table. Applies to
   * the whole table, so the switch stays enabled without a selection.
   */
  fitImages: boolean;
  onToggleFitImages: () => void;
  /**
   * Data rows shown before the published table collapses behind a button;
   * `0` shows all of them. A table-wide setting, like {@link fitImages}.
   */
  visibleRows: number;
  onChangeVisibleRows: (rows: number) => void;
  /**
   * Resets formatting — on the selection, or on the whole table when nothing
   * is selected, which is why these stay enabled without a selection.
   */
  onClearFormatting: (scope: ClearScope) => void;
  /** True while a selection limits the reset to part of the table. */
  hasClearTarget: boolean;
  onSave?: () => void;
  onClose?: () => void;
  dirty?: boolean;
}

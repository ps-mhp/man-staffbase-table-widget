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

/**
 * Every user-facing string of the table editor's authoring UI (ribbon,
 * context menu, media picker, config dialog and the error/alert texts those
 * surfaces produce).
 *
 * Values may contain `{placeholder}` tokens that {@link t} substitutes; the
 * token names are documented per key. Because every locale catalogue is typed
 * as the full interface, a missing translation is a compile error rather than
 * a runtime fallback.
 */
export interface Messages {
  // --- Save section ---
  /** Primary "commit and close the editor" button. */
  save: string;
  /** Section caption underneath the save button. */
  sectionSave: string;

  // --- Font section ---
  sectionFont: string;
  /** Accessible name of the font-size dropdown. */
  fontSize: string;
  /** Dropdown entry meaning "inherit the widget's font size". */
  fontSizeDefault: string;
  fontSizeIncrease: string;
  fontSizeDecrease: string;
  bold: string;
  /**
   * Single letter on the bold button — localized, because it stands for the
   * translated word (DE "F" for *Fett*, EN "B" for *Bold*, …). Same for the
   * italic/underline/strikethrough glyphs below.
   */
  boldGlyph: string;
  italic: string;
  italicGlyph: string;
  underline: string;
  underlineGlyph: string;
  strikethrough: string;
  strikethroughGlyph: string;
  superscript: string;
  subscript: string;
  backgroundColor: string;
  textColor: string;
  /** Caret next to a colour button. Placeholder: `{label}` (the colour name). */
  colorOptions: string;
  /** Colour-menu entry that clears the colour again. */
  colorStandard: string;
  /** Colour-menu entry that opens the native colour picker. */
  colorPick: string;

  // --- Alignment ---
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  valignTop: string;
  valignMiddle: string;
  valignBottom: string;

  // --- Cells section ---
  sectionCells: string;
  mergeCells: string;
  /** Short form on the narrow ribbon button. */
  mergeShort: string;
  unmergeCells: string;
  /** Short form on the narrow ribbon button. */
  unmergeShort: string;
  insert: string;
  insertRowAbove: string;
  insertRowBelow: string;
  insertColLeft: string;
  insertColRight: string;
  delete: string;
  deleteRows: string;
  deleteCols: string;

  // --- Tools section ---
  sectionTools: string;
  /** Noun ("Sorting") used as a menu title. */
  sort: string;
  /** Verb ("Sort") used as a button caption. */
  sortShort: string;
  sortAsc: string;
  sortDesc: string;
  sortClear: string;
  copyFormat: string;
  formatShort: string;
  insertImage: string;
  imageShort: string;
  imageSizeTitle: string;
  imageSizeShort: string;
  /** Why the equalize entries are disabled. */
  imageEqualizeHint: string;
  imageEqualHeight: string;
  imageEqualWidth: string;
  imageDefaultSize: string;
  uploadTable: string;
  importShort: string;
  /** Accessible name of the hidden file input. */
  uploadTableAria: string;

  // --- Grid ---
  selectAll: string;
  /** Column handle. Placeholder: `{n}` (1-based column number). */
  selectColumn: string;
  /** Row handle. Placeholder: `{n}` (1-based row number). */
  selectRow: string;
  /** Cell accessible name. Placeholders: `{row}`, `{col}` (both 1-based). */
  cellAria: string;
  resizeImage: string;

  // --- Context menu (full sentences, unlike the ribbon's short forms) ---
  menuInsertRowAbove: string;
  menuInsertRowBelow: string;
  menuInsertColLeft: string;
  menuInsertColRight: string;
  menuInsertImage: string;
  menuTextOptions: string;

  // --- Media picker ---
  mediaTitle: string;
  mediaSearchPlaceholder: string;
  mediaSearchAria: string;
  mediaUpload: string;
  close: string;
  mediaLoading: string;
  mediaEmpty: string;
  loadingShort: string;
  loadMore: string;

  // --- Injected editor ---
  editTable: string;

  // --- Config dialog (RJSF schema) ---
  configTableDataTitle: string;
  configTableDataHelp: string;

  // --- Errors ---
  errImageInsert: string;
  errImageSizes: string;
  errImport: string;
  /** Placeholder: `{name}` (the rejected file name). */
  errUnsupportedFile: string;
  /** Shown in place of the table when the stored data cannot be read. */
  errTableDataUnreadable: string;
  /** Follow-up line telling an author how to recover. */
  errTableDataUnreadableHint: string;
  errMediaLoad: string;
  errMediaLoadMore: string;
  errUpload: string;
  errMediaNetwork: string;
  /** Placeholder: `{status}` (the HTTP status code). */
  errMediaRequest: string;
  errUploadNoMedium: string;
}

export type MessageKey = keyof Messages;

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

import { Messages } from "../messages";

/** English — also the fallback for any browser language we don't ship. */
export const en: Messages = {
  save: "Save",
  sectionSave: "Save",

  sectionFont: "Font",
  fontSize: "Font size",
  fontSizeDefault: "Default",
  fontSizeIncrease: "Increase font size",
  fontSizeDecrease: "Decrease font size",
  bold: "Bold",
  boldGlyph: "B",
  italic: "Italic",
  italicGlyph: "I",
  underline: "Underline",
  underlineGlyph: "U",
  strikethrough: "Strikethrough",
  strikethroughGlyph: "S",
  superscript: "Superscript",
  subscript: "Subscript",
  backgroundColor: "Background color",
  textColor: "Font color",
  colorOptions: "{label}: options",
  colorStandard: "Default",
  colorPick: "Choose color…",

  alignLeft: "Align left",
  alignCenter: "Center",
  alignRight: "Align right",
  valignTop: "Align top",
  valignMiddle: "Align middle",
  valignBottom: "Align bottom",

  sectionCells: "Cells",
  mergeCells: "Merge cells",
  mergeShort: "Merge",
  unmergeCells: "Unmerge cells",
  unmergeShort: "Unmerge",
  insert: "Insert",
  insertRowAbove: "Row above",
  insertRowBelow: "Row below",
  insertColLeft: "Column left",
  insertColRight: "Column right",
  delete: "Delete",
  deleteRows: "Delete row(s)",
  deleteCols: "Delete column(s)",

  sectionTools: "Tools",
  sort: "Sorting",
  sortShort: "Sort",
  sortAsc: "Ascending (this column)",
  sortDesc: "Descending (this column)",
  sortClear: "Remove sorting",
  copyFormat: "Copy format",
  formatShort: "Format",
  insertImage: "Insert image into cell",
  imageShort: "Image",
  imageSizeTitle:
    "Match the size of the selected images (the first selected image is the reference)",
  imageSizeShort: "Image size",
  imageEqualizeHint: "At least two selected images required",
  imageEqualHeight: "Same height as first image",
  imageEqualWidth: "Same width as first image",
  imageDefaultSize: "Default size",
  uploadTable: "Upload table (.csv, .xlsx)",
  importShort: "Import",
  uploadTableAria: "Upload table",

  selectAll: "Select all",
  selectColumn: "Select column {n}",
  selectRow: "Select row {n}",
  cellAria: "Row {row}, column {col}",
  resizeImage: "Resize image",

  menuInsertRowAbove: "Insert row above",
  menuInsertRowBelow: "Insert row below",
  menuInsertColLeft: "Insert column left",
  menuInsertColRight: "Insert column right",
  menuInsertImage: "Insert image…",
  menuTextOptions: "Text options",

  mediaTitle: "Staffbase media",
  mediaSearchPlaceholder: "Search media…",
  mediaSearchAria: "Search media",
  mediaUpload: "Upload image",
  close: "Close",
  mediaLoading: "Loading media…",
  mediaEmpty: "No media found.",
  loadingShort: "Loading…",
  loadMore: "Load more",

  editTable: "Edit table",

  configTableDataTitle: "Table data",
  configTableDataHelp: "Edited with the table editor above.",

  configTableModeTitle: "Table storage",
  configTableModeHelp: "\"Attribute\" is the previous behaviour. \"Slots\" stores the table as translatable content inside the widget. \"Both\" writes each form and prefers the slots when reading.",
  configTableModeAttribute: "Attribute (not translatable)",
  configTableModeSlots: "Slots (translatable)",
  configTableModeBoth: "Both (slots preferred)",

  errImageInsert: "The image could not be inserted.",
  errImageSizes: "The image sizes could not be determined.",
  errImport: "Import failed",
  errUnsupportedFile: "Unsupported file format: {name}",
  errTableDataUnreadable: "The table data could not be read.",
  errTableDataUnreadableHint: "Please reopen the table in the widget and save it again.",
  errMediaLoad: "The media could not be loaded.",
  errMediaLoadMore: "No further media could be loaded.",
  errUpload: "Upload failed.",
  errMediaNetwork: "Network error during the media request.",
  errMediaRequest: "Media request failed (HTTP {status}).",
  errUploadNoMedium: "The upload did not return a valid medium.",
};

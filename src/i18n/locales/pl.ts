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

/** Polish. */
export const pl: Messages = {
  save: "Zapisz",
  sectionSave: "Zapisz",

  sectionFont: "Czcionka",
  fontSize: "Rozmiar czcionki",
  fontSizeDefault: "Domyślny",
  fontSizeIncrease: "Zwiększ rozmiar czcionki",
  fontSizeDecrease: "Zmniejsz rozmiar czcionki",
  bold: "Pogrubienie",
  boldGlyph: "B",
  italic: "Kursywa",
  italicGlyph: "I",
  underline: "Podkreślenie",
  underlineGlyph: "U",
  strikethrough: "Przekreślenie",
  strikethroughGlyph: "S",
  superscript: "Indeks górny",
  subscript: "Indeks dolny",
  backgroundColor: "Kolor tła",
  textColor: "Kolor czcionki",
  colorOptions: "{label}: opcje",
  colorStandard: "Domyślny",
  colorPick: "Wybierz kolor…",

  alignLeft: "Wyrównaj do lewej",
  alignCenter: "Wyśrodkuj",
  alignRight: "Wyrównaj do prawej",
  valignTop: "Wyrównaj do góry",
  valignMiddle: "Wyrównaj do środka",
  valignBottom: "Wyrównaj do dołu",

  sectionCells: "Komórki",
  mergeCells: "Scal komórki",
  mergeShort: "Scal",
  unmergeCells: "Rozdziel komórki",
  unmergeShort: "Rozdziel",
  insert: "Wstaw",
  insertRowAbove: "Wiersz powyżej",
  insertRowBelow: "Wiersz poniżej",
  insertColLeft: "Kolumna po lewej",
  insertColRight: "Kolumna po prawej",
  delete: "Usuń",
  deleteRows: "Usuń wiersz(e)",
  deleteCols: "Usuń kolumnę(y)",

  sectionTools: "Narzędzia",
  sort: "Sortowanie",
  sortShort: "Sortuj",
  sortAsc: "Rosnąco (ta kolumna)",
  sortDesc: "Malejąco (ta kolumna)",
  sortClear: "Usuń sortowanie",
  copyFormat: "Kopiuj formatowanie",
  formatShort: "Format",
  insertImage: "Wstaw obraz do komórki",
  imageShort: "Obraz",
  imageSizeTitle:
    "Ujednolij rozmiar zaznaczonych obrazów (wzorcem jest pierwszy zaznaczony obraz)",
  imageSizeShort: "Rozmiar obrazu",
  imageEqualizeHint: "Potrzebne są co najmniej dwa zaznaczone obrazy",
  imageEqualHeight: "Ta sama wysokość jak pierwszy obraz",
  imageEqualWidth: "Ta sama szerokość jak pierwszy obraz",
  imageDefaultSize: "Rozmiar domyślny",
  uploadTable: "Prześlij tabelę (.csv, .xlsx)",
  importShort: "Importuj",
  uploadTableAria: "Prześlij tabelę",

  selectAll: "Zaznacz wszystko",
  selectColumn: "Zaznacz kolumnę {n}",
  selectRow: "Zaznacz wiersz {n}",
  cellAria: "Wiersz {row}, kolumna {col}",
  resizeImage: "Zmień rozmiar obrazu",

  menuInsertRowAbove: "Wstaw wiersz powyżej",
  menuInsertRowBelow: "Wstaw wiersz poniżej",
  menuInsertColLeft: "Wstaw kolumnę po lewej",
  menuInsertColRight: "Wstaw kolumnę po prawej",
  menuInsertImage: "Wstaw obraz…",
  menuTextOptions: "Opcje tekstu",

  mediaTitle: "Multimedia Staffbase",
  mediaSearchPlaceholder: "Szukaj multimediów…",
  mediaSearchAria: "Szukaj multimediów",
  mediaUpload: "Prześlij obraz",
  close: "Zamknij",
  mediaLoading: "Wczytywanie multimediów…",
  mediaEmpty: "Nie znaleziono multimediów.",
  loadingShort: "Wczytywanie…",
  loadMore: "Wczytaj więcej",

  editTable: "Edytuj tabelę",
  editorPreviewHint: "Widget tabeli — kliknij dwukrotnie, aby edytować",

  configTableDataTitle: "Dane tabeli",
  configTableDataHelp: "Edytowane w edytorze tabeli powyżej.",

  configTableModeTitle: "Sposób zapisu tabeli",
  configTableModeHelp: "„Atrybut” to dotychczasowe zachowanie. „Sloty” dodatkowo zapisują tabelę jako tłumaczalną treść w widżecie; atrybut pozostaje jako zabezpieczenie. Użyta forma jest podana w atrybucie data-table-source.",
  configTableModeAttribute: "Atrybut (nieprzetłumaczalny)",
  configTableModeSlots: "Sloty (tłumaczalne)",

  errImageInsert: "Nie udało się wstawić obrazu.",
  errImageSizes: "Nie udało się ustalić rozmiarów obrazów.",
  errImport: "Import nie udał się",
  errUnsupportedFile: "Nieobsługiwany format pliku: {name}",
  errTableDataUnreadable: "Nie udało się odczytać danych tabeli.",
  errTableDataUnreadableHint: "Otwórz tabelę w widżecie ponownie i zapisz ją jeszcze raz.",
  errMediaLoad: "Nie udało się wczytać multimediów.",
  errMediaLoadMore: "Nie udało się wczytać kolejnych multimediów.",
  errUpload: "Przesyłanie nie udało się.",
  errMediaNetwork: "Błąd sieci podczas żądania multimediów.",
  errMediaRequest: "Żądanie multimediów nie udało się (HTTP {status}).",
  errUploadNoMedium: "Przesyłanie nie zwróciło prawidłowego pliku multimedialnego.",
};

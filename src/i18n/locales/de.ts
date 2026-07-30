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

/** German — the wording the editor shipped with before it was localized. */
export const de: Messages = {
  save: "Speichern",
  sectionSave: "Speichern",

  sectionFont: "Schrift",
  fontSize: "Schriftgröße",
  fontSizeDefault: "Standard",
  fontSizeIncrease: "Schrift vergrößern",
  fontSizeDecrease: "Schrift verkleinern",
  bold: "Fett",
  boldGlyph: "F",
  italic: "Kursiv",
  italicGlyph: "K",
  underline: "Unterstrichen",
  underlineGlyph: "U",
  strikethrough: "Durchgestrichen",
  strikethroughGlyph: "S",
  superscript: "Hochstellen",
  subscript: "Tiefstellen",
  backgroundColor: "Hintergrundfarbe",
  textColor: "Schriftfarbe",
  colorOptions: "{label}: Optionen",
  colorStandard: "Standard",
  colorPick: "Farbe wählen…",

  alignLeft: "Linksbündig",
  alignCenter: "Zentriert",
  alignRight: "Rechtsbündig",
  valignTop: "Oben ausrichten",
  valignMiddle: "Mittig ausrichten",
  valignBottom: "Unten ausrichten",

  sectionCells: "Zellen",
  mergeCells: "Zellen verbinden",
  mergeShort: "Verbinden",
  unmergeCells: "Verbindung aufheben",
  unmergeShort: "Lösen",
  insert: "Einfügen",
  insertRowAbove: "Zeile oberhalb",
  insertRowBelow: "Zeile unterhalb",
  insertColLeft: "Spalte links",
  insertColRight: "Spalte rechts",
  delete: "Löschen",
  deleteRows: "Zeile(n) löschen",
  deleteCols: "Spalte(n) löschen",

  sectionTools: "Werkzeuge",
  sort: "Sortierung",
  sortShort: "Sortieren",
  sortAsc: "Aufsteigend (diese Spalte)",
  sortDesc: "Absteigend (diese Spalte)",
  sortClear: "Sortierung entfernen",
  copyFormat: "Format kopieren",
  formatShort: "Format",
  insertImage: "Bild in Zelle einfügen",
  imageShort: "Bild",
  imageSizeTitle:
    "Größe der markierten Bilder angleichen (Maßstab ist das zuerst markierte Bild)",
  imageSizeShort: "Bildgröße",
  imageEqualizeHint: "Mindestens zwei markierte Bilder nötig",
  imageEqualHeight: "Gleiche Höhe wie erstes Bild",
  imageEqualWidth: "Gleiche Breite wie erstes Bild",
  imageDefaultSize: "Standardgröße",
  uploadTable: "Tabelle hochladen (.csv, .xlsx)",
  importShort: "Importieren",
  uploadTableAria: "Tabelle hochladen",

  selectAll: "Alles auswählen",
  selectColumn: "Spalte {n} auswählen",
  selectRow: "Zeile {n} auswählen",
  cellAria: "Zeile {row}, Spalte {col}",
  resizeImage: "Bildgröße ändern",

  menuInsertRowAbove: "Zeile oberhalb einfügen",
  menuInsertRowBelow: "Zeile unterhalb einfügen",
  menuInsertColLeft: "Spalte links einfügen",
  menuInsertColRight: "Spalte rechts einfügen",
  menuInsertImage: "Bild einfügen…",
  menuTextOptions: "Textoptionen",

  mediaTitle: "Staffbase Medien",
  mediaSearchPlaceholder: "Medien durchsuchen…",
  mediaSearchAria: "Medien durchsuchen",
  mediaUpload: "Bild hochladen",
  close: "Schließen",
  mediaLoading: "Medien werden geladen…",
  mediaEmpty: "Keine Medien gefunden.",
  loadingShort: "Lädt…",
  loadMore: "Mehr laden",

  editTable: "Tabelle bearbeiten",
  editorPreviewHint: "Tabellen-Widget — Doppelklick zum Bearbeiten",

  configTableDataTitle: "Tabellendaten",
  configTableDataHelp: "Wird über den Tabellen-Editor oberhalb bearbeitet.",

  configTableModeTitle: "Speicherform der Tabelle",
  configTableModeHelp: "„Attribut“ ist das bisherige Verhalten. „Slots“ legt die Tabelle zusätzlich als übersetzbaren Inhalt im Widget ab; das Attribut bleibt als Rückfallebene erhalten. Welche Form gerendert wurde, steht im Attribut data-table-source.",
  configTableModeAttribute: "Attribut (nicht übersetzbar)",
  configTableModeSlots: "Slots (übersetzbar)",

  errImageInsert: "Bild konnte nicht eingefügt werden.",
  errImageSizes: "Bildgrößen konnten nicht ermittelt werden.",
  errImport: "Import fehlgeschlagen",
  errUnsupportedFile: "Nicht unterstütztes Dateiformat: {name}",
  errTableDataUnreadable: "Tabellendaten konnten nicht gelesen werden.",
  errTableDataUnreadableHint: "Bitte die Tabelle im Widget erneut öffnen und speichern.",
  errMediaLoad: "Medien konnten nicht geladen werden.",
  errMediaLoadMore: "Weitere Medien konnten nicht geladen werden.",
  errUpload: "Upload fehlgeschlagen.",
  errMediaNetwork: "Netzwerkfehler bei der Medienanfrage.",
  errMediaRequest: "Medienanfrage fehlgeschlagen (HTTP {status}).",
  errUploadNoMedium: "Upload lieferte kein gültiges Medium zurück.",
};

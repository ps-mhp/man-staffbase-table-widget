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

/** Dutch. */
export const nl: Messages = {
  save: "Opslaan",
  sectionSave: "Opslaan",

  sectionFont: "Lettertype",
  fontSize: "Tekengrootte",
  fontSizeDefault: "Standaard",
  fontSizeIncrease: "Tekengrootte vergroten",
  fontSizeDecrease: "Tekengrootte verkleinen",
  bold: "Vet",
  boldGlyph: "B",
  italic: "Cursief",
  italicGlyph: "I",
  underline: "Onderstrepen",
  underlineGlyph: "U",
  strikethrough: "Doorhalen",
  strikethroughGlyph: "S",
  superscript: "Superscript",
  subscript: "Subscript",
  backgroundColor: "Achtergrondkleur",
  textColor: "Tekstkleur",
  colorOptions: "{label}: opties",
  colorStandard: "Standaard",
  colorPick: "Kleur kiezen…",

  alignLeft: "Links uitlijnen",
  alignCenter: "Centreren",
  alignRight: "Rechts uitlijnen",
  valignTop: "Boven uitlijnen",
  valignMiddle: "Midden uitlijnen",
  valignBottom: "Onder uitlijnen",

  sectionCells: "Cellen",
  mergeCells: "Cellen samenvoegen",
  mergeShort: "Samenvoegen",
  unmergeCells: "Samenvoeging opheffen",
  unmergeShort: "Splitsen",
  insert: "Invoegen",
  insertRowAbove: "Rij erboven",
  insertRowBelow: "Rij eronder",
  insertColLeft: "Kolom links",
  insertColRight: "Kolom rechts",
  delete: "Verwijderen",
  deleteRows: "Rij(en) verwijderen",
  deleteCols: "Kolom(men) verwijderen",

  sectionTools: "Hulpmiddelen",
  sort: "Sortering",
  sortShort: "Sorteren",
  sortAsc: "Oplopend (deze kolom)",
  sortDesc: "Aflopend (deze kolom)",
  sortClear: "Sortering verwijderen",
  copyFormat: "Opmaak kopiëren",
  formatShort: "Opmaak",
  insertImage: "Afbeelding in cel invoegen",
  imageShort: "Afbeelding",
  imageSizeTitle:
    "Grootte van de geselecteerde afbeeldingen gelijkmaken (de eerst geselecteerde afbeelding is de maatstaf)",
  imageSizeShort: "Afbeeldingsgrootte",
  imageEqualizeHint: "Er zijn minimaal twee geselecteerde afbeeldingen nodig",
  imageEqualHeight: "Zelfde hoogte als eerste afbeelding",
  imageEqualWidth: "Zelfde breedte als eerste afbeelding",
  imageDefaultSize: "Standaardgrootte",
  uploadTable: "Tabel uploaden (.csv, .xlsx)",
  importShort: "Importeren",
  uploadTableAria: "Tabel uploaden",

  selectAll: "Alles selecteren",
  selectColumn: "Kolom {n} selecteren",
  selectRow: "Rij {n} selecteren",
  cellAria: "Rij {row}, kolom {col}",
  resizeImage: "Afbeeldingsgrootte wijzigen",

  menuInsertRowAbove: "Rij erboven invoegen",
  menuInsertRowBelow: "Rij eronder invoegen",
  menuInsertColLeft: "Kolom links invoegen",
  menuInsertColRight: "Kolom rechts invoegen",
  menuInsertImage: "Afbeelding invoegen…",
  menuTextOptions: "Tekstopties",

  mediaTitle: "Staffbase-media",
  mediaSearchPlaceholder: "Media zoeken…",
  mediaSearchAria: "Media zoeken",
  mediaUpload: "Afbeelding uploaden",
  close: "Sluiten",
  mediaLoading: "Media worden geladen…",
  mediaEmpty: "Geen media gevonden.",
  loadingShort: "Laden…",
  loadMore: "Meer laden",

  editTable: "Tabel bewerken",
  editorPreviewHint: "Tabelwidget — dubbelklik om te bewerken",

  configTableDataTitle: "Tabelgegevens",
  configTableDataHelp: "Wordt bewerkt via de tabeleditor hierboven.",

  configTableModeTitle: "Opslag van de tabel",
  configTableModeHelp: "„Attribuut” is het vorige gedrag. „Slots” slaat de tabel daarnaast op als vertaalbare inhoud in de widget; het attribuut blijft als terugval bewaard. Welke vorm daadwerkelijk is weergegeven, staat in het attribuut data-table-source.",
  configTableModeAttribute: "Attribuut (niet vertaalbaar)",
  configTableModeSlots: "Slots (vertaalbaar)",

  errImageInsert: "De afbeelding kon niet worden ingevoegd.",
  errImageSizes: "De afbeeldingsgroottes konden niet worden bepaald.",
  errImport: "Importeren mislukt",
  errUnsupportedFile: "Niet-ondersteunde bestandsindeling: {name}",
  errTableDataUnreadable: "De tabelgegevens konden niet worden gelezen.",
  errTableDataUnreadableHint: "Open de tabel opnieuw in de widget en sla deze opnieuw op.",
  errMediaLoad: "De media konden niet worden geladen.",
  errMediaLoadMore: "Er konden geen verdere media worden geladen.",
  errUpload: "Uploaden mislukt.",
  errMediaNetwork: "Netwerkfout bij de media-aanvraag.",
  errMediaRequest: "Media-aanvraag mislukt (HTTP {status}).",
  errUploadNoMedium: "De upload heeft geen geldig medium geretourneerd.",
};

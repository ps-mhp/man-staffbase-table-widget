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

/** Italian. */
export const it: Messages = {
  save: "Salva",
  sectionSave: "Salva",

  sectionFont: "Carattere",
  fontSize: "Dimensione carattere",
  fontSizeDefault: "Predefinito",
  fontSizeIncrease: "Aumenta dimensione carattere",
  fontSizeDecrease: "Riduci dimensione carattere",
  bold: "Grassetto",
  boldGlyph: "G",
  italic: "Corsivo",
  italicGlyph: "C",
  underline: "Sottolineato",
  underlineGlyph: "S",
  strikethrough: "Barrato",
  strikethroughGlyph: "B",
  superscript: "Apice",
  subscript: "Pedice",
  backgroundColor: "Colore di sfondo",
  textColor: "Colore carattere",
  colorOptions: "{label}: opzioni",
  colorStandard: "Predefinito",
  colorPick: "Scegli colore…",

  alignLeft: "Allinea a sinistra",
  alignCenter: "Centra",
  alignRight: "Allinea a destra",
  valignTop: "Allinea in alto",
  valignMiddle: "Allinea al centro",
  valignBottom: "Allinea in basso",

  sectionCells: "Celle",
  mergeCells: "Unisci celle",
  mergeShort: "Unisci",
  unmergeCells: "Dividi celle",
  unmergeShort: "Dividi",
  insert: "Inserisci",
  insertRowAbove: "Riga sopra",
  insertRowBelow: "Riga sotto",
  insertColLeft: "Colonna a sinistra",
  insertColRight: "Colonna a destra",
  delete: "Elimina",
  deleteRows: "Elimina riga/righe",
  deleteCols: "Elimina colonna/colonne",

  sectionTools: "Strumenti",
  sort: "Ordinamento",
  sortShort: "Ordina",
  sortAsc: "Crescente (questa colonna)",
  sortDesc: "Decrescente (questa colonna)",
  sortClear: "Rimuovi ordinamento",
  copyFormat: "Copia formato",
  formatShort: "Formato",
  insertImage: "Inserisci immagine nella cella",
  imageShort: "Immagine",
  imageSizeTitle:
    "Uniforma la dimensione delle immagini selezionate (la prima immagine selezionata è il riferimento)",
  imageSizeShort: "Dimensione immagine",
  imageEqualizeHint: "Sono necessarie almeno due immagini selezionate",
  imageEqualHeight: "Stessa altezza della prima immagine",
  imageEqualWidth: "Stessa larghezza della prima immagine",
  imageDefaultSize: "Dimensione predefinita",
  uploadTable: "Carica tabella (.csv, .xlsx)",
  importShort: "Importa",
  uploadTableAria: "Carica tabella",

  selectAll: "Seleziona tutto",
  selectColumn: "Seleziona colonna {n}",
  selectRow: "Seleziona riga {n}",
  cellAria: "Riga {row}, colonna {col}",
  resizeImage: "Ridimensiona immagine",

  menuInsertRowAbove: "Inserisci riga sopra",
  menuInsertRowBelow: "Inserisci riga sotto",
  menuInsertColLeft: "Inserisci colonna a sinistra",
  menuInsertColRight: "Inserisci colonna a destra",
  menuInsertImage: "Inserisci immagine…",
  menuTextOptions: "Opzioni testo",

  mediaTitle: "Media Staffbase",
  mediaSearchPlaceholder: "Cerca media…",
  mediaSearchAria: "Cerca media",
  mediaUpload: "Carica immagine",
  close: "Chiudi",
  mediaLoading: "Caricamento dei media…",
  mediaEmpty: "Nessun media trovato.",
  loadingShort: "Caricamento…",
  loadMore: "Carica altri",

  editTable: "Modifica tabella",
  editorPreviewHint: "Widget tabella — doppio clic per modificare",

  configTableDataTitle: "Dati della tabella",
  configTableDataHelp: "Modificati tramite l'editor di tabelle sopra.",

  configTableModeTitle: "Archiviazione della tabella",
  configTableModeHelp: "«Attributo» è il comportamento precedente. «Slot» archivia inoltre la tabella come contenuto traducibile nel widget; l'attributo resta come riserva. La forma effettivamente resa è indicata nell'attributo data-table-source.",
  configTableModeAttribute: "Attributo (non traducibile)",
  configTableModeSlots: "Slot (traducibile)",

  errImageInsert: "Non è stato possibile inserire l'immagine.",
  errImageSizes: "Non è stato possibile determinare le dimensioni delle immagini.",
  errImport: "Importazione non riuscita",
  errUnsupportedFile: "Formato di file non supportato: {name}",
  errTableDataUnreadable: "Non è stato possibile leggere i dati della tabella.",
  errTableDataUnreadableHint: "Riapri la tabella nel widget e salvala di nuovo.",
  errMediaLoad: "Non è stato possibile caricare i media.",
  errMediaLoadMore: "Non è stato possibile caricare altri media.",
  errUpload: "Caricamento non riuscito.",
  errMediaNetwork: "Errore di rete nella richiesta dei media.",
  errMediaRequest: "Richiesta dei media non riuscita (HTTP {status}).",
  errUploadNoMedium: "Il caricamento non ha restituito un media valido.",
};

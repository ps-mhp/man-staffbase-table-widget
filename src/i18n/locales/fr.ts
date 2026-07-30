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

/** French. */
export const fr: Messages = {
  save: "Enregistrer",
  sectionSave: "Enregistrer",

  sectionFont: "Police",
  fontSize: "Taille de police",
  fontSizeDefault: "Par défaut",
  fontSizeIncrease: "Augmenter la taille de police",
  fontSizeDecrease: "Réduire la taille de police",
  bold: "Gras",
  boldGlyph: "G",
  italic: "Italique",
  italicGlyph: "I",
  underline: "Souligné",
  underlineGlyph: "S",
  strikethrough: "Barré",
  strikethroughGlyph: "B",
  superscript: "Exposant",
  subscript: "Indice",
  backgroundColor: "Couleur d'arrière-plan",
  textColor: "Couleur de police",
  colorOptions: "{label} : options",
  colorStandard: "Par défaut",
  colorPick: "Choisir une couleur…",

  alignLeft: "Aligner à gauche",
  alignCenter: "Centrer",
  alignRight: "Aligner à droite",
  valignTop: "Aligner en haut",
  valignMiddle: "Aligner au milieu",
  valignBottom: "Aligner en bas",

  sectionCells: "Cellules",
  mergeCells: "Fusionner les cellules",
  mergeShort: "Fusionner",
  unmergeCells: "Annuler la fusion",
  unmergeShort: "Séparer",
  insert: "Insérer",
  insertRowAbove: "Ligne au-dessus",
  insertRowBelow: "Ligne en dessous",
  insertColLeft: "Colonne à gauche",
  insertColRight: "Colonne à droite",
  delete: "Supprimer",
  deleteRows: "Supprimer la ou les lignes",
  deleteCols: "Supprimer la ou les colonnes",

  sectionTools: "Outils",
  sort: "Tri",
  sortShort: "Trier",
  sortAsc: "Croissant (cette colonne)",
  sortDesc: "Décroissant (cette colonne)",
  sortClear: "Supprimer le tri",
  copyFormat: "Reproduire la mise en forme",
  formatShort: "Format",
  insertImage: "Insérer une image dans la cellule",
  imageShort: "Image",
  imageSizeTitle:
    "Uniformiser la taille des images sélectionnées (la première image sélectionnée sert de référence)",
  imageSizeShort: "Taille d'image",
  imageEqualizeHint: "Au moins deux images sélectionnées sont nécessaires",
  imageEqualHeight: "Même hauteur que la première image",
  imageEqualWidth: "Même largeur que la première image",
  imageDefaultSize: "Taille par défaut",
  uploadTable: "Importer un tableau (.csv, .xlsx)",
  importShort: "Importer",
  uploadTableAria: "Importer un tableau",

  selectAll: "Tout sélectionner",
  selectColumn: "Sélectionner la colonne {n}",
  selectRow: "Sélectionner la ligne {n}",
  cellAria: "Ligne {row}, colonne {col}",
  resizeImage: "Redimensionner l'image",

  menuInsertRowAbove: "Insérer une ligne au-dessus",
  menuInsertRowBelow: "Insérer une ligne en dessous",
  menuInsertColLeft: "Insérer une colonne à gauche",
  menuInsertColRight: "Insérer une colonne à droite",
  menuInsertImage: "Insérer une image…",
  menuTextOptions: "Options de texte",

  mediaTitle: "Médias Staffbase",
  mediaSearchPlaceholder: "Rechercher des médias…",
  mediaSearchAria: "Rechercher des médias",
  mediaUpload: "Téléverser une image",
  close: "Fermer",
  mediaLoading: "Chargement des médias…",
  mediaEmpty: "Aucun média trouvé.",
  loadingShort: "Chargement…",
  loadMore: "Charger plus",

  editTable: "Modifier le tableau",

  configTableDataTitle: "Données du tableau",
  configTableDataHelp: "Modifiées via l'éditeur de tableau ci-dessus.",

  errImageInsert: "L'image n'a pas pu être insérée.",
  errImageSizes: "Les tailles des images n'ont pas pu être déterminées.",
  errImport: "Échec de l'importation",
  errUnsupportedFile: "Format de fichier non pris en charge : {name}",
  errTableDataUnreadable: "Les données du tableau n'ont pas pu être lues.",
  errTableDataUnreadableHint: "Veuillez rouvrir le tableau dans le widget et l'enregistrer à nouveau.",
  errMediaLoad: "Les médias n'ont pas pu être chargés.",
  errMediaLoadMore: "Aucun média supplémentaire n'a pu être chargé.",
  errUpload: "Échec du téléversement.",
  errMediaNetwork: "Erreur réseau lors de la requête de médias.",
  errMediaRequest: "La requête de médias a échoué (HTTP {status}).",
  errUploadNoMedium: "Le téléversement n'a pas renvoyé de média valide.",
};

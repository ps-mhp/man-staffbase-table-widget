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

/** Spanish. */
export const es: Messages = {
  save: "Guardar",
  sectionSave: "Guardar",

  sectionFont: "Fuente",
  fontSize: "Tamaño de fuente",
  fontSizeDefault: "Predeterminado",
  fontSizeIncrease: "Aumentar tamaño de fuente",
  fontSizeDecrease: "Reducir tamaño de fuente",
  bold: "Negrita",
  boldGlyph: "N",
  italic: "Cursiva",
  italicGlyph: "K",
  underline: "Subrayado",
  underlineGlyph: "S",
  strikethrough: "Tachado",
  strikethroughGlyph: "T",
  superscript: "Superíndice",
  subscript: "Subíndice",
  backgroundColor: "Color de fondo",
  textColor: "Color de fuente",
  colorOptions: "{label}: opciones",
  colorStandard: "Predeterminado",
  colorPick: "Elegir color…",

  alignLeft: "Alinear a la izquierda",
  alignCenter: "Centrar",
  alignRight: "Alinear a la derecha",
  valignTop: "Alinear arriba",
  valignMiddle: "Alinear al centro",
  valignBottom: "Alinear abajo",

  sectionCells: "Celdas",
  mergeCells: "Combinar celdas",
  mergeShort: "Combinar",
  unmergeCells: "Separar celdas",
  unmergeShort: "Separar",
  insert: "Insertar",
  insertRowAbove: "Fila arriba",
  insertRowBelow: "Fila abajo",
  insertColLeft: "Columna a la izquierda",
  insertColRight: "Columna a la derecha",
  delete: "Eliminar",
  deleteRows: "Eliminar fila(s)",
  deleteCols: "Eliminar columna(s)",

  sectionTools: "Herramientas",
  sort: "Ordenación",
  sortShort: "Ordenar",
  sortAsc: "Ascendente (esta columna)",
  sortDesc: "Descendente (esta columna)",
  sortClear: "Quitar ordenación",
  copyFormat: "Copiar formato",
  formatShort: "Formato",
  insertImage: "Insertar imagen en la celda",
  imageShort: "Imagen",
  imageSizeTitle:
    "Igualar el tamaño de las imágenes seleccionadas (la primera imagen seleccionada es la referencia)",
  imageSizeShort: "Tamaño de imagen",
  imageEqualizeHint: "Se necesitan al menos dos imágenes seleccionadas",
  imageEqualHeight: "Misma altura que la primera imagen",
  imageEqualWidth: "Misma anchura que la primera imagen",
  imageDefaultSize: "Tamaño predeterminado",
  uploadTable: "Subir tabla (.csv, .xlsx)",
  importShort: "Importar",
  uploadTableAria: "Subir tabla",

  selectAll: "Seleccionar todo",
  selectColumn: "Seleccionar columna {n}",
  selectRow: "Seleccionar fila {n}",
  cellAria: "Fila {row}, columna {col}",
  resizeImage: "Cambiar tamaño de imagen",

  menuInsertRowAbove: "Insertar fila arriba",
  menuInsertRowBelow: "Insertar fila abajo",
  menuInsertColLeft: "Insertar columna a la izquierda",
  menuInsertColRight: "Insertar columna a la derecha",
  menuInsertImage: "Insertar imagen…",
  menuTextOptions: "Opciones de texto",

  mediaTitle: "Medios de Staffbase",
  mediaSearchPlaceholder: "Buscar medios…",
  mediaSearchAria: "Buscar medios",
  mediaUpload: "Subir imagen",
  close: "Cerrar",
  mediaLoading: "Cargando medios…",
  mediaEmpty: "No se encontraron medios.",
  loadingShort: "Cargando…",
  loadMore: "Cargar más",

  editTable: "Editar tabla",

  configTableDataTitle: "Datos de la tabla",
  configTableDataHelp: "Se edita con el editor de tablas de arriba.",

  errImageInsert: "No se pudo insertar la imagen.",
  errImageSizes: "No se pudieron determinar los tamaños de las imágenes.",
  errImport: "Error de importación",
  errUnsupportedFile: "Formato de archivo no compatible: {name}",
  errTableDataUnreadable: "No se pudieron leer los datos de la tabla.",
  errTableDataUnreadableHint: "Vuelve a abrir la tabla en el widget y guárdala de nuevo.",
  errMediaLoad: "No se pudieron cargar los medios.",
  errMediaLoadMore: "No se pudieron cargar más medios.",
  errUpload: "Error al subir el archivo.",
  errMediaNetwork: "Error de red en la solicitud de medios.",
  errMediaRequest: "La solicitud de medios falló (HTTP {status}).",
  errUploadNoMedium: "La subida no devolvió un medio válido.",
};

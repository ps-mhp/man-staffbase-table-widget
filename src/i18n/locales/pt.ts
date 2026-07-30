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

/**
 * Portuguese. Wording follows Brazilian usage ("Salvar", "Excluir",
 * "Mesclar"), which covers the far larger share of Portuguese-speaking
 * users; `pt-PT` browsers resolve here too.
 */
export const pt: Messages = {
  save: "Salvar",
  sectionSave: "Salvar",

  sectionFont: "Fonte",
  fontSize: "Tamanho da fonte",
  fontSizeDefault: "Padrão",
  fontSizeIncrease: "Aumentar tamanho da fonte",
  fontSizeDecrease: "Diminuir tamanho da fonte",
  bold: "Negrito",
  boldGlyph: "N",
  italic: "Itálico",
  italicGlyph: "I",
  underline: "Sublinhado",
  underlineGlyph: "S",
  strikethrough: "Riscado",
  strikethroughGlyph: "R",
  superscript: "Sobrescrito",
  subscript: "Subscrito",
  backgroundColor: "Cor de fundo",
  textColor: "Cor da fonte",
  colorOptions: "{label}: opções",
  colorStandard: "Padrão",
  colorPick: "Escolher cor…",

  alignLeft: "Alinhar à esquerda",
  alignCenter: "Centralizar",
  alignRight: "Alinhar à direita",
  valignTop: "Alinhar em cima",
  valignMiddle: "Alinhar ao centro",
  valignBottom: "Alinhar embaixo",

  sectionCells: "Células",
  mergeCells: "Mesclar células",
  mergeShort: "Mesclar",
  unmergeCells: "Desfazer mesclagem",
  unmergeShort: "Separar",
  insert: "Inserir",
  insertRowAbove: "Linha acima",
  insertRowBelow: "Linha abaixo",
  insertColLeft: "Coluna à esquerda",
  insertColRight: "Coluna à direita",
  delete: "Excluir",
  deleteRows: "Excluir linha(s)",
  deleteCols: "Excluir coluna(s)",

  sectionTools: "Ferramentas",
  sort: "Classificação",
  sortShort: "Classificar",
  sortAsc: "Crescente (esta coluna)",
  sortDesc: "Decrescente (esta coluna)",
  sortClear: "Remover classificação",
  copyFormat: "Copiar formatação",
  formatShort: "Formato",
  insertImage: "Inserir imagem na célula",
  imageShort: "Imagem",
  imageSizeTitle:
    "Igualar o tamanho das imagens selecionadas (a primeira imagem selecionada é a referência)",
  imageSizeShort: "Tamanho da imagem",
  imageEqualizeHint: "São necessárias pelo menos duas imagens selecionadas",
  imageEqualHeight: "Mesma altura da primeira imagem",
  imageEqualWidth: "Mesma largura da primeira imagem",
  imageDefaultSize: "Tamanho padrão",
  uploadTable: "Carregar tabela (.csv, .xlsx)",
  importShort: "Importar",
  uploadTableAria: "Carregar tabela",

  selectAll: "Selecionar tudo",
  selectColumn: "Selecionar coluna {n}",
  selectRow: "Selecionar linha {n}",
  cellAria: "Linha {row}, coluna {col}",
  resizeImage: "Redimensionar imagem",

  menuInsertRowAbove: "Inserir linha acima",
  menuInsertRowBelow: "Inserir linha abaixo",
  menuInsertColLeft: "Inserir coluna à esquerda",
  menuInsertColRight: "Inserir coluna à direita",
  menuInsertImage: "Inserir imagem…",
  menuTextOptions: "Opções de texto",

  mediaTitle: "Mídia do Staffbase",
  mediaSearchPlaceholder: "Pesquisar mídia…",
  mediaSearchAria: "Pesquisar mídia",
  mediaUpload: "Carregar imagem",
  close: "Fechar",
  mediaLoading: "Carregando mídia…",
  mediaEmpty: "Nenhuma mídia encontrada.",
  loadingShort: "Carregando…",
  loadMore: "Carregar mais",

  editTable: "Editar tabela",
  editorPreviewHint: "Widget de tabela — clique duas vezes para editar",

  configTableDataTitle: "Dados da tabela",
  configTableDataHelp: "Editados pelo editor de tabelas acima.",

  configTableModeTitle: "Armazenamento da tabela",
  configTableModeHelp: "“Atributo” é o comportamento anterior. “Slots” armazena adicionalmente a tabela como conteúdo traduzível dentro do widget; o atributo é mantido como alternativa. A forma realmente renderizada consta no atributo data-table-source.",
  configTableModeAttribute: "Atributo (não traduzível)",
  configTableModeSlots: "Slots (traduzível)",

  errImageInsert: "Não foi possível inserir a imagem.",
  errImageSizes: "Não foi possível determinar os tamanhos das imagens.",
  errImport: "Falha na importação",
  errUnsupportedFile: "Formato de arquivo não compatível: {name}",
  errTableDataUnreadable: "Não foi possível ler os dados da tabela.",
  errTableDataUnreadableHint: "Reabra a tabela no widget e salve novamente.",
  errMediaLoad: "Não foi possível carregar a mídia.",
  errMediaLoadMore: "Não foi possível carregar mais mídia.",
  errUpload: "Falha no carregamento.",
  errMediaNetwork: "Erro de rede na solicitação de mídia.",
  errMediaRequest: "A solicitação de mídia falhou (HTTP {status}).",
  errUploadNoMedium: "O carregamento não retornou uma mídia válida.",
};

/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
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

import * as React from "react";
import { ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { ConfigWorkspace } from "@man/config-ui/layout/config-workspace";
import { ELEMENT_ATTRIBUTE, InlineElement, elementMarkup } from "@man/config-ui/elements/catalog";
import { elementStylesheet } from "@man/config-ui/elements/element-css";
import { useElementPanel } from "@man/config-ui/elements/element-panel";
import { StatusBar } from "@man/config-ui/toolbar/status-bar";
import {
  TableModel,
  CellRange,
  CellFormat,
  TextAlign,
  VerticalAlign,
  normalizeRange,
  insertRow,
  insertColumn,
  deleteRow,
  deleteColumn,
  mergeCells,
  unmergeCells,
  setFormat,
  setSort,
  cellFormat,
  isCovered,
  mergeAt,
} from "./table-model";
import { updateCell, parsePastedText, pasteBlock } from "./grid-operations";
import { sanitizeRichText } from "./rich-text";
import { formatToStyle, formatToCellStyle } from "./cell-style";
import { TableToolbar } from "./table-toolbar";
import { importTableFile } from "./table-import";
import { MediaClient, createMediaClient } from "@shared/media/media-client";
import { PickedImage } from "@shared/media/media-picker";
import { useMediaPanel } from "@shared/media/use-media-panel";
import {
  buildImageMarkup,
  countCellImages,
  equalizedWidths,
  listCellImages,
  setCellImageWidths,
  DEFAULT_IMAGE_WIDTH,
} from "./cell-image";
import { MeasureImage, measureImage } from "./image-measure";
import { IMAGE_FIT_CLASS, IMAGE_NO_FIT_CLASS } from "./image-fit";
import imageFitCss from "./styles/image-fit.scss";
import imageNoFitCss from "./styles/image-no-fit.scss";
import { ClearScope, clearFormatting } from "./clear-format";
import {
  applyFill,
  blockToHtml,
  blockToText,
  clearCells,
  copyBlock,
  fillExtension,
  pasteCells,
  readClipboard,
  unionRange,
} from "./cell-clipboard";
import {
  ElementAddress,
  ElementPatch,
  appendElement,
  countMatching,
  countWithoutMeaning,
  elementAt,
  meaningsByColor,
  ownColors,
  removeCellElement,
  tableElements,
  updateCellElement,
  updateMatchingElements,
} from "./cell-element";
import tableEditorCss from "./styles/table-editor.scss";
import { useHotStyle } from "@shared/hot-style";
import { activeElementOf, eventRootOf, selectionOf } from "@shared/shadow-dom";
import { usePortalContainer } from "@shared/ui/portal-container";
import { EditableCell } from "./editable-cell";
import { GridContextMenu, GridMenuActions } from "./grid-context-menu";
import { CellDropZone } from "./cell-drop-zone";
import { cellName, cellsInRanges, clampRanges, fullLines } from "./selection";
import { ColumnHeaders, RowHeader } from "./grid-headers";
import { gridHint, gridStatusText } from "./grid-status";
import { TableInspector } from "./table-inspector";
import { TablePreview } from "./table-preview";

/**
 * Mitgeliefert für den Rahmen: der Injektor lädt die Hilfe aus diesem Modul
 * nach, damit sie im selben Chunk wie der Editor liegt und nicht im
 * Seitenbündel, das jede Leserin lädt.
 */
export { TableEditorHelp } from "./table-editor-help";

export interface TableEditorProps {
  value: TableModel;
  /**
   * Bekommt jedes neue Modell. Im Rahmen ist das der Entwurf: übernommen wird
   * erst über „Übernehmen“ im Kopf, den der Editor nicht selbst zeichnet.
   */
  onChange: (model: TableModel) => void;
  /**
   * Media API client used by the image picker and clipboard-image upload.
   * Defaults to a same-origin {@link createMediaClient}; injectable for tests.
   */
  mediaClient?: MediaClient;
  /**
   * Resolves an image's intrinsic size, needed to equalize image heights.
   * Defaults to {@link measureImage}; injectable for tests.
   */
  measure?: MeasureImage;
}

/**
 * Class names of `styles/table-editor.scss`. Collected here so a rename shows
 * up as a compile error rather than as silently unstyled markup.
 */
const CELL = "table-editor__cell";

/** Die Elemente des Explorers sehen im Gitter aus wie auf der Seite. */
const ELEMENT_CSS = elementStylesheet();
const ELEMENT_SELECTOR = `[${ELEMENT_ATTRIBUTE}]`;

/** The markup of an inserted image: its own width, capped at the default. */
const imageMarkup = (image: PickedImage): string => {
  const width = image.width ? Math.min(image.width, DEFAULT_IMAGE_WIDTH) : DEFAULT_IMAGE_WIDTH;
  return buildImageMarkup({ src: image.url, alt: image.alt, width });
};

/**
 * Returns the first image file found on a clipboard payload (either as a
 * `File` in `files` or an image `DataTransferItem`), or `null` if the paste
 * carries no image. Used to route a pasted screenshot/image into an upload.
 */
const firstImageFile = (clipboard: DataTransfer | null): File | null => {
  if (!clipboard) return null;
  const files = clipboard.files ? Array.from(clipboard.files) : [];
  const fromFiles = files.find((f) => f.type.startsWith("image/"));
  if (fromFiles) return fromFiles;
  const items = clipboard.items ? Array.from(clipboard.items) : [];
  for (const item of items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return null;
};

/**
 * Editable grid used to build/maintain the widget's table inside the
 * Staffbase config dialog. Fully controlled: the parent owns the
 * {@link TableModel} and receives every change via `onChange`.
 *
 * Features: cell/row/column selection, a formatting toolbar and a Radix
 * context menu (insert/delete rows & columns, merge/unmerge, text formatting
 * incl. per-character super-/sub-script, a preset sort), a format painter and
 * CSV/XLSX upload. Row 0 and column 0 are the frozen header row/column and
 * are never deletable.
 *
 * Im Rahmen von `@man/config-ui` (`ConfigWorkspace`): Hauptfläche mit Reitern
 * und Gitter, rechts das Panel „Tabelle“ für die Einstellungen der ganzen
 * Tabelle, in den Geräte-Ansichten statt des Gitters die Leseansicht.
 * Übernehmen, Rückgängig, Hilfe und Schließen zeichnet der Rahmen. Nachgeladen
 * wird der Editor nur im Studio (`table-editor-injector.ts`).
 */
export const TableEditor = ({
  value,
  onChange,
  mediaClient,
  measure = measureImage,
}: TableEditorProps): ReactElement => {
  const hotTableEditorCss = useHotStyle(tableEditorCss, "table-widget", "styles/table-editor.scss");
  const hotImageFitCss = useHotStyle(imageFitCss, "table-widget", "styles/image-fit.scss");
  const hotImageNoFitCss = useHotStyle(imageNoFitCss, "table-widget", "styles/image-no-fit.scss");
  const data = value.data;
  const rowCount = data.length;
  const colCount = data[0]?.length ?? 0;

  const client = useMemo(() => mediaClient ?? createMediaClient(), [mediaClient]);

  /**
   * All selected ranges, oldest first. A plain click/drag keeps a single
   * range; Ctrl/Cmd-click appends another one. The *last* range is the active
   * one that structural operations (insert/delete/merge/sort) act on, while
   * formatting and the image tools act on every selected cell.
   */
  const [storedRanges, setRanges] = useState<CellRange[]>([]);
  // Rückgängig im Rahmen kann Zeilen und Spalten unter der Markierung
  // wegnehmen; zugeschnitten zeigt sie nie ins Leere.
  const ranges = useMemo(() => clampRanges(storedRanges, rowCount, colCount), [storedRanges, rowCount, colCount]);
  const selection = ranges.length > 0 ? ranges[ranges.length - 1] : null;
  const [anchor, setAnchor] = useState<[number, number] | null>(null);
  const [editing, setEditing] = useState<[number, number] | null>(null);
  const activeCell = useRef<[number, number] | null>(null);
  const isDragging = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // The menus go where the editor is — into the config modal's shadow root,
  // with the editor's stylesheet — not into `document.body`, where they would
  // be unstyled and every click in them would close the Studio's dialog.
  const portalContainer = usePortalContainer();
  // Im Rahmen die Mediathek-Leiste rechts, sonst das Overlay (`media.overlay`).
  const media = useMediaPanel(client);
  // Der jüngste Stand für alles, was erst nach einer Anfrage ankommt – ein
  // abgelegtes, gewähltes oder eingefügtes Bild. Bis dahin kann sich die
  // Tabelle geändert haben; geschrieben wird in sie, nicht in den Stand beim
  // Ablegen.
  const latest = useRef({ value, onChange });
  useLayoutEffect(() => {
    latest.current = { value, onChange };
  });
  const [copiedPattern, setCopiedPattern] = useState<{
    rows: number;
    cols: number;
    formats: CellFormat[][];
  } | null>(null);
  const painterActive = copiedPattern !== null;

  const isEditing = (row: number, col: number): boolean =>
    editing !== null && editing[0] === row && editing[1] === col;

  /**
   * Der Fokus gehört dem Editor, solange Zellen markiert (nicht bearbeitet)
   * werden: dort kommen ⌘C, ⌘X und ⌘V an. Der Mausdruck auf eine Zelle
   * verhindert sein Standardverhalten und gäbe den Fokus sonst nirgends hin.
   */
  const focusGrid = (): void => {
    const root = rootRef.current;
    if (root !== null && activeElementOf(root) !== root) root.focus({ preventScroll: true });
  };

  // --- Ausfüllkästchen: die Markierung über Nachbarzellen fortschreiben ---

  /** Das laufende Ziehen am Kästchen: Quelle und, sobald man sie verlässt, die Erweiterung. */
  const fillDrag = useRef<{ source: CellRange; extension: CellRange | null } | null>(null);
  const [fillPreview, setFillPreview] = useState<CellRange | null>(null);
  /** Beendet das Ziehen – auch, wenn die Maus außerhalb des Gitters losgelassen wird. */
  const finishFill = useRef<() => void>(() => undefined);
  useLayoutEffect(() => {
    finishFill.current = () => {
      const drag = fillDrag.current;
      if (drag === null) return;
      fillDrag.current = null;
      setFillPreview(null);
      if (drag.extension === null) return;
      const { value: current, onChange: change } = latest.current;
      change(applyFill(current, drag.source, drag.extension));
      const filled = unionRange(drag.source, drag.extension);
      setAnchor([filled.top, filled.left]);
      setRanges([filled]);
    };
  });

  const startFill = (event: React.MouseEvent): void => {
    if (selection === null || event.button !== 0) return;
    // Vor der Zelle darunter: die begänne sonst eine neue Markierung.
    event.preventDefault();
    event.stopPropagation();
    isDragging.current = false;
    fillDrag.current = { source: selection, extension: null };
  };

  // Stop drag-selecting when the mouse is released anywhere (also outside the
  // grid), so a drag that ends off-table doesn't get stuck.
  useEffect(() => {
    const stop = (): void => {
      isDragging.current = false;
      finishFill.current();
    };
    // At the editor's root: in the config modal every click stops at the host.
    const root = eventRootOf(rootRef.current);
    root.addEventListener("mouseup", stop);
    return () => root.removeEventListener("mouseup", stop);
  }, []);

  const isSelected = (row: number, col: number): boolean =>
    ranges.some(
      (range) =>
        row >= range.top && row <= range.bottom && col >= range.left && col <= range.right,
    );

  /** Starts a new range — replacing the selection, or adding to it (Ctrl/Cmd). */
  const selectSingle = (row: number, col: number, additive = false): void => {
    setAnchor([row, col]);
    const range: CellRange = { top: row, left: col, bottom: row, right: col };
    setRanges((prev) => (additive ? [...prev, range] : [range]));
  };

  /** Grows the range that is currently being drawn (shift-click / drag). */
  const extendTo = (row: number, col: number): void => {
    const start = anchor ?? [row, col];
    const range = normalizeRange(start, [row, col]);
    setRanges((prev) => (prev.length > 0 ? [...prev.slice(0, -1), range] : [range]));
  };

  const selectRow = (row: number): void => {
    focusGrid();
    setAnchor([row, 0]);
    setRanges([{ top: row, left: 0, bottom: row, right: colCount - 1 }]);
  };

  const selectColumn = (col: number): void => {
    focusGrid();
    setAnchor([0, col]);
    setRanges([{ top: 0, left: col, bottom: rowCount - 1, right: col }]);
  };

  const selectAll = (): void => {
    focusGrid();
    setAnchor([0, 0]);
    setRanges([{ top: 0, left: 0, bottom: rowCount - 1, right: colCount - 1 }]);
  };

  const clearSelection = (): void => {
    setRanges([]);
    setAnchor(null);
  };

  const handleCellMouseDown = (event: React.MouseEvent, row: number, col: number): void => {
    const pickedHere = pickElementAt(event, row, col);
    if (!pickedHere) setPickedElement(null);
    // While a cell is being edited, let the mouse drive the caret normally –
    // a click on an element leaves the cell, so its new colour shows at once.
    if (isEditing(row, col)) {
      if (pickedHere) {
        event.preventDefault();
        leaveEdit();
      }
      return;
    }

    if (event.shiftKey) {
      event.preventDefault();
      focusGrid();
      extendTo(row, col);
      isDragging.current = true;
      return;
    }
    // Selecting a different cell ends any in-progress edit.
    if (editing) setEditing(null);
    event.preventDefault();
    focusGrid();
    selectSingle(row, col, event.ctrlKey || event.metaKey);
    isDragging.current = true;
  };

  /** Extends the selection while dragging with the mouse button held down. */
  const handleCellMouseEnter = (row: number, col: number): void => {
    const drag = fillDrag.current;
    if (drag !== null) {
      drag.extension = fillExtension(drag.source, row, col);
      setFillPreview(drag.extension);
      return;
    }
    if (isDragging.current && editing === null) extendTo(row, col);
  };

  /** Double-click enters edit mode for the cell. */
  const handleCellDoubleClick = (row: number, col: number): void => {
    setEditing([row, col]);
    activeCell.current = [row, col];
  };

  const handleCellMouseUp = (): void => {
    isDragging.current = false;
    finishFill.current();
    if (painterActive && copiedPattern && selection) {
      applyPainter(selection);
    }
  };

  const handleCellContextMenu = (row: number, col: number): void => {
    if (!isSelected(row, col)) selectSingle(row, col);
  };

  const handleInput = (row: number, col: number, next: string): void => {
    onChange({ ...value, data: updateCell(data, row, col, next) });
  };

  // --- Image insertion (picker, clipboard upload) ---

  /**
   * Appends the image to the target cell's content (images flow inline) – in
   * the latest model, see `latest`. A cell that no longer exists is skipped.
   * The ref is advanced right away, so two images arriving before the next
   * render both land.
   */
  const insertImageIntoCell = useCallback((row: number, col: number, image: PickedImage): void => {
    const markup = imageMarkup(image);
    const { value: current, onChange: change } = latest.current;
    const existing = current.data[row]?.[col];
    if (!markup || existing === undefined) return;
    const next = { ...current, data: updateCell(current.data, row, col, existing ? `${existing}${markup}` : markup) };
    latest.current = { value: next, onChange: change };
    change(next);
  }, []);

  /** The cell an image should target: the one being edited, else the selection. */
  const currentImageTarget = (): [number, number] | null =>
    editing ?? (selection ? [selection.top, selection.left] : null);

  /**
   * „Bild“ im Reiter und im Kontextmenü. Die Zelle wird beim Öffnen
   * festgehalten: die Leiste bleibt offen, während man weiter markiert, und
   * das Bild gehört in die Zelle, für die man sie geöffnet hat.
   */
  const openImagePicker = (): void => {
    const target = currentImageTarget();
    if (!target) return;
    const [row, col] = target;
    media.openMedia({
      title: `Bild für Zelle ${cellName(row, col)}`,
      accept: "images",
      onSelect: (picked) => insertImageIntoCell(row, col, picked),
    });
  };

  /**
   * Escape in einer Zelle: Bearbeiten beenden und den Fokus an den Editor
   * geben. Ohne ihn stünde der Fokus nirgends, und die Tasten des Rahmens
   * (⌘S, Escape zum Schließen) kämen nicht mehr an.
   */
  const leaveEdit = (): void => {
    setEditing(null);
    rootRef.current?.focus();
  };

  /** Uploads a clipboard/paste image, publishes it, and inserts it. */
  const uploadAndInsertImage = async (file: File, row: number, col: number): Promise<void> => {
    try {
      const item = await client.uploadMedia(file);
      const url = await client.ensurePublicImageUrl(item);
      insertImageIntoCell(row, col, {
        url,
        width: item.width,
        height: item.height,
        alt: item.fileName,
      });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Bild konnte nicht eingefügt werden.");
    }
  };

  /**
   * Multi-cell paste (tab/newline-separated, e.g. from a spreadsheet) is
   * written as a block starting at the target cell; a pasted image is uploaded
   * and embedded; a single-cell text paste is inserted as plain text so no
   * foreign markup/styling leaks in.
   */
  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>, row: number, col: number): void => {
    const imageFile = firstImageFile(event.clipboardData);
    if (imageFile) {
      event.preventDefault();
      void uploadAndInsertImage(imageFile, row, col);
      return;
    }
    const text = event.clipboardData?.getData("text") ?? "";
    if (text.includes("\t") || text.includes("\n")) {
      event.preventDefault();
      onChange({ ...value, data: pasteBlock(data, row, col, parsePastedText(text)) });
      return;
    }
    event.preventDefault();
    if (typeof document.execCommand === "function") {
      document.execCommand("insertText", false, text);
      const el = event.currentTarget;
      handleInput(row, col, sanitizeRichText(el.innerHTML));
    } else {
      handleInput(row, col, sanitizeRichText(text));
    }
  };

  // --- Equalizing image sizes across the selection ---

  /** How many inline images the current selection holds (cheap, per render). */
  const selectedImageCount = useMemo(
    () =>
      cellsInRanges(ranges).reduce((sum, [row, col]) => sum + countCellImages(data[row]?.[col]), 0),
    [ranges, data],
  );

  /**
   * Resizes every selected image. `"height"`/`"width"` take the **first**
   * selected image as the reference (with `"height"` deriving each image's
   * width from its own aspect ratio, since only widths are persisted);
   * `"default"` resets all of them to {@link DEFAULT_IMAGE_WIDTH}. Selection
   * order defines "first", which is why multiple ranges are kept in the order
   * they were Ctrl/Cmd-clicked.
   */
  const resizeImages = async (mode: "height" | "width" | "default"): Promise<void> => {
    const images = cellsInRanges(ranges).flatMap(([row, col]) =>
      listCellImages(data[row]?.[col]).map((image) => ({ row, col, ...image })),
    );
    if (images.length === 0 || (mode !== "default" && images.length < 2)) return;

    let widths: Array<number | undefined>;
    if (mode === "default") {
      widths = images.map(() => DEFAULT_IMAGE_WIDTH);
    } else {
      const naturals = await Promise.all(images.map((image) => measure(image.src)));
      widths = equalizedWidths(
        mode,
        images.map((image, i) => ({ width: image.width, natural: naturals[i] })),
      );
    }
    if (widths.every((width) => width === undefined)) {
      window.alert("Bildgrößen konnten nicht ermittelt werden.");
      return;
    }

    // One markup rewrite per cell, carrying the widths of all its images.
    const perCell = new Map<string, Array<number | undefined>>();
    images.forEach((image, i) => {
      const key = `${image.row},${image.col}`;
      const cellWidths = perCell.get(key) ?? [];
      cellWidths[image.index] = widths[i];
      perCell.set(key, cellWidths);
    });

    let nextData = data;
    perCell.forEach((cellWidths, key) => {
      const [row, col] = key.split(",").map(Number);
      nextData = updateCell(nextData, row, col, setCellImageWidths(nextData[row]?.[col], cellWidths));
    });
    onChange({ ...value, data: nextData });
  };

  // --- Format helpers ---

  const applyFormat = (patch: CellFormat): void => {
    if (ranges.length === 0) return;
    onChange(setFormat(value, cellsInRanges(ranges), patch));
  };

  const anchorFormat: CellFormat = selection
    ? cellFormat(value, selection.top, selection.left)
    : {};

  const toggleKey = (key: "bold" | "italic" | "underline" | "strikethrough"): void =>
    applyFormat({ [key]: !anchorFormat[key] });

  const FONT_SIZE_STEPS = [10, 12, 14, 16, 18, 20, 24, 28, 32];
  /** Grows/shrinks the selection's font size by one step (Excel A^/A˅). */
  const stepFontSize = (delta: number): void => {
    const current = anchorFormat.fontSize ?? 14;
    let index = FONT_SIZE_STEPS.findIndex((s) => s >= current);
    if (index === -1) index = FONT_SIZE_STEPS.length - 1;
    if (delta > 0 && FONT_SIZE_STEPS[index] <= current) index += 1;
    if (delta < 0) index -= 1;
    const next = FONT_SIZE_STEPS[Math.max(0, Math.min(FONT_SIZE_STEPS.length - 1, index))];
    applyFormat({ fontSize: next });
  };

  /**
   * Applies super-/sub-script to the current text selection inside the active
   * cell via `execCommand`, then reads the result back as sanitized markup.
   */
  const applyVertAlign = (command: "superscript" | "subscript"): void => {
    const cell = activeCell.current;
    const root = rootRef.current;
    const el = root === null ? null : (activeElementOf(root) as HTMLElement | null);
    if (!cell || !el || !el.isContentEditable) return;
    if (typeof document.execCommand === "function") {
      document.execCommand(command);
      handleInput(cell[0], cell[1], sanitizeRichText(el.innerHTML));
    }
  };

  // --- Insert / delete / merge (context menu + toolbar) ---

  const withSelection = (fn: (sel: CellRange) => void) => (): void => {
    if (selection) fn(selection);
  };

  const insertRowAbove = (): void => onChange(insertRow(value, selection ? selection.top : rowCount));
  const insertRowBelow = (): void => onChange(insertRow(value, selection ? selection.bottom + 1 : rowCount));
  const insertColLeft = (): void => onChange(insertColumn(value, selection ? selection.left : colCount));
  const insertColRight = (): void => onChange(insertColumn(value, selection ? selection.right + 1 : colCount));

  const doDeleteRows = withSelection((sel) => {
    let next = value;
    for (let r = sel.bottom; r >= sel.top; r--) next = deleteRow(next, r);
    onChange(next);
  });
  const doDeleteCols = withSelection((sel) => {
    let next = value;
    for (let c = sel.right; c >= sel.left; c--) next = deleteColumn(next, c);
    onChange(next);
  });

  const doMerge = withSelection((sel) => onChange(mergeCells(value, sel)));
  const doUnmerge = withSelection((sel) => onChange(unmergeCells(value, sel.top, sel.left)));

  const doSort = (dir: "asc" | "desc"): void => {
    if (selection) onChange(setSort(value, { col: selection.left, dir }));
  };
  const clearSort = (): void => onChange(setSort(value, null));

  /**
   * Without a selection this resets the whole table — the diagnostic case,
   * where the point is to rule out stored formatting entirely.
   */
  const clearFormats = (scope: ClearScope): void =>
    onChange(clearFormatting(value, cellsInRanges(ranges), scope));

  // --- Kopieren, Ausschneiden, Einfügen von Zellen (⌘C, ⌘X, ⌘V) ---

  /** Der zuletzt kopierte Bereich, gestrichelt umrandet wie in Excel – bis sich die Tabelle ändert. */
  const [copiedRange, setCopiedRange] = useState<CellRange | null>(null);
  useEffect(() => setCopiedRange(null), [data]);

  /**
   * Nur, was am Editor selbst ankommt: in einer bearbeiteten Zelle oder in
   * einem Feld der Leisten gehört die Zwischenablage dem Text.
   */
  const isGridClipboardEvent = (event: React.ClipboardEvent): boolean =>
    event.target === rootRef.current && editing === null && event.clipboardData !== null;

  const copySelection = (event: React.ClipboardEvent, cut: boolean): void => {
    if (!isGridClipboardEvent(event) || selection === null) return;
    event.preventDefault();
    const block = copyBlock(value, selection);
    event.clipboardData.setData("text/plain", blockToText(block));
    event.clipboardData.setData("text/html", blockToHtml(block));
    if (cut) onChange(clearCells(value, selection));
    else setCopiedRange(selection);
  };

  const pasteIntoSelection = (event: React.ClipboardEvent): void => {
    if (!isGridClipboardEvent(event) || selection === null) return;
    event.preventDefault();
    const block = readClipboard(event.clipboardData.getData("text/html"), event.clipboardData.getData("text/plain"));
    if (block === null) {
      // Ein Bild ohne Text, etwa ein Bildschirmfoto: in die erste markierte Zelle.
      const image = firstImageFile(event.clipboardData);
      if (image) void uploadAndInsertImage(image, selection.top, selection.left);
      return;
    }
    const result = pasteCells(value, selection, block);
    onChange(result.model);
    setAnchor([result.range.top, result.range.left]);
    setRanges([result.range]);
  };

  // --- Elemente (Element Explorer) ---

  /**
   * Das angeklickte Element; die Leiste zeigt dann „Bearbeiten“. Form und
   * Farbe stehen dabei: ändert sich die Zelle, zeigte die Stelle allein
   * womöglich auf ein anderes Element.
   */
  const [pickedElement, setPickedElement] = useState<(ElementAddress & Pick<InlineElement, "id" | "color">) | null>(null);
  const elements = useMemo(() => tableElements(data), [data]);
  const meanings = useMemo(() => meaningsByColor(elements), [elements]);
  const usedColors = useMemo(() => ownColors(elements), [elements]);

  /** Wohin „Einfügen“ setzt: die bearbeitete Zelle, sonst jede markierte (verdeckte nicht). */
  const elementTargets: Array<[number, number]> = editing
    ? [editing]
    : cellsInRanges(ranges).filter(([row, col]) => !isCovered(value, row, col));
  const elementTarget =
    elementTargets.length === 0
      ? null
      : elementTargets.length === 1
        ? `Zelle ${cellName(elementTargets[0][0], elementTargets[0][1])}`
        : `${elementTargets.length} Zellen`;

  const pickedInfo = useMemo(() => {
    if (pickedElement === null) return null;
    const element = elementAt(data, pickedElement);
    if (element === null || element.id !== pickedElement.id || element.color !== pickedElement.color) return null;
    return { element, where: `Zelle ${cellName(pickedElement.row, pickedElement.col)}`, sameCount: countMatching(elements, element) };
  }, [data, elements, pickedElement]);

  /**
   * An den Cursor – aber nur, solange er noch in der bearbeiteten Zelle
   * steht. Die Kacheln und „Einfügen“ nehmen den Fokus nicht; wer zuvor in
   * ein Feld der Leiste getippt hat, bekommt das Element ans Zellende.
   *
   * Über die Auswahl selbst statt `execCommand("insertHTML")`: Chrome
   * schreibt dort Inline-Stile um (etwa in `rgb()`), und die Farbe ist hier
   * Inhalt.
   */
  const insertElementAtCaret = (element: InlineElement): boolean => {
    const cell = editing;
    const root = rootRef.current;
    const el = root === null ? null : (activeElementOf(root) as HTMLElement | null);
    const selection = el === null ? null : selectionOf(el);
    const editable = el !== null && (el.isContentEditable || el.getAttribute("contenteditable") === "true");
    if (!cell || !el || !editable || !selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return false;
    const node = range.createContextualFragment(elementMarkup(element)).firstChild;
    if (node === null) return false;
    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    handleInput(cell[0], cell[1], sanitizeRichText(el.innerHTML));
    return true;
  };

  const insertElement = (element: InlineElement): void => {
    if (insertElementAtCaret(element) || elementTargets.length === 0) return;
    const next = elementTargets.reduce(
      (acc, [row, col]) => updateCell(acc, row, col, appendElement(acc[row]?.[col], element)),
      data,
    );
    onChange({ ...value, data: next });
  };

  /** Aus der Leiste auf eine Zelle gezogen: ans Ende genau dieser Zelle. */
  const dropElementIntoCell = (row: number, col: number, element: InlineElement): void => {
    const { value: current, onChange: change } = latest.current;
    const existing = current.data[row]?.[col];
    if (existing === undefined) return;
    change({ ...current, data: updateCell(current.data, row, col, appendElement(existing, element)) });
  };

  const updatePickedElement = (patch: ElementPatch, all: boolean): void => {
    if (pickedElement === null || pickedInfo === null) return;
    const { row, col, index } = pickedElement;
    const next = all
      ? updateMatchingElements(data, pickedInfo.element, patch)
      : updateCell(data, row, col, updateCellElement(data[row]?.[col], index, patch));
    if (patch.color !== undefined) setPickedElement({ ...pickedElement, color: patch.color });
    onChange({ ...value, data: next });
  };

  const removePickedElement = (): void => {
    if (pickedElement === null) return;
    const { row, col, index } = pickedElement;
    setPickedElement(null);
    onChange({ ...value, data: updateCell(data, row, col, removeCellElement(data[row]?.[col], index)) });
  };

  const elementPanel = useElementPanel(
    { target: elementTarget, picked: pickedInfo, meanings, usedColors },
    {
      onInsert: insertElement,
      onUpdate: updatePickedElement,
      onRemove: removePickedElement,
      onRelease: () => setPickedElement(null),
      onClosed: () => setPickedElement(null),
    },
  );

  /**
   * Ein Klick auf ein Element im Gitter wählt es zum Bearbeiten und öffnet
   * die Leiste. Welches es ist, sagt seine Stelle unter den Elementen der
   * Zelle – so zählt auch `cell-element.ts`.
   */
  function pickElementAt(event: React.MouseEvent, row: number, col: number): boolean {
    // Rechtsklick und Markieren mit Umschalt/⌘ bleiben, was sie sind.
    if (event.button !== 0 || event.shiftKey || event.ctrlKey || event.metaKey) return false;
    const cell = event.currentTarget as HTMLElement;
    const node = (event.target as Element).closest?.(ELEMENT_SELECTOR);
    if (!node || !cell.contains(node)) return false;
    const index = Array.from(cell.querySelectorAll(ELEMENT_SELECTOR)).indexOf(node);
    const element = index < 0 ? null : elementAt(data, { row, col, index });
    if (element === null) return false;
    setPickedElement({ row, col, index, id: element.id, color: element.color });
    if (!elementPanel.isOpen) elementPanel.open();
    return true;
  }

  // Das gewählte Element trägt seinen Ring im DOM der Zelle; deren Inhalt
  // setzt `EditableCell` selbst, deshalb hier nach jedem Zeichnen.
  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return;
    root.querySelectorAll("[data-man-picked]").forEach((node) => node.removeAttribute("data-man-picked"));
    if (pickedElement === null || pickedInfo === null) return;
    const cell = root.querySelector(`[aria-label="Zeile ${pickedElement.row + 1}, Spalte ${pickedElement.col + 1}"]`);
    cell?.querySelectorAll(ELEMENT_SELECTOR)[pickedElement.index]?.setAttribute("data-man-picked", "");
  });

  // Weg ist weg – etwa nach Rückgängig: dann zurück zum Einfügen.
  useEffect(() => {
    if (pickedElement !== null && pickedInfo === null) setPickedElement(null);
  }, [pickedElement, pickedInfo]);

  // --- Format painter (pattern-based, like Excel) ---

  /**
   * Arms the painter by capturing the *pattern* of formats across the current
   * selection (an R x C grid of cell formats), or disarms it if already armed.
   */
  const handleCopyFormat = (): void => {
    if (painterActive) {
      setCopiedPattern(null);
      return;
    }
    if (!selection) return;
    const rows = selection.bottom - selection.top + 1;
    const cols = selection.right - selection.left + 1;
    const formats: CellFormat[][] = [];
    for (let i = 0; i < rows; i++) {
      const rowFormats: CellFormat[] = [];
      for (let j = 0; j < cols; j++) {
        rowFormats.push({ ...cellFormat(value, selection.top + i, selection.left + j) });
      }
      formats.push(rowFormats);
    }
    setCopiedPattern({ rows, cols, formats });
  };

  /**
   * Applies the copied pattern anchored at the target range's top-left. A
   * single target cell stamps the whole pattern once; a larger target tiles
   * the pattern (repeating it) to fill the area, so neighbouring cells follow
   * the originally selected pattern.
   */
  const applyPainter = (target: CellRange): void => {
    const pattern = copiedPattern;
    if (!pattern) return;
    const fillBottom = Math.min(rowCount - 1, Math.max(target.bottom, target.top + pattern.rows - 1));
    const fillRight = Math.min(colCount - 1, Math.max(target.right, target.left + pattern.cols - 1));

    let next = value;
    for (let r = target.top; r <= fillBottom; r++) {
      for (let c = target.left; c <= fillRight; c++) {
        const patch = pattern.formats[(r - target.top) % pattern.rows][(c - target.left) % pattern.cols];
        next = setFormat(next, [[r, c]], fullFormatPatch(patch));
      }
    }
    onChange(next);
    setCopiedPattern(null);
  };

  // --- Upload ---

  const handleUpload = (file: File): void => {
    importTableFile(file)
      .then((imported) => {
        clearSelection();
        onChange(imported);
      })
      .catch((err: unknown) => {
        window.alert(err instanceof Error ? err.message : "Import fehlgeschlagen");
      });
  };

  // Which insert options are contextually relevant.
  const fullRowSelected = selection !== null && selection.left === 0 && selection.right === colCount - 1;
  const fullColSelected = selection !== null && selection.top === 0 && selection.bottom === rowCount - 1;

  // Whether the current selection overlaps any merged region (so "unmerge"
  // can be disabled when there's nothing to split).
  const canUnmerge =
    selection !== null &&
    value.merges.some(
      (m) =>
        m.row <= selection.bottom &&
        m.row + m.rowSpan - 1 >= selection.top &&
        m.col <= selection.right &&
        m.col + m.colSpan - 1 >= selection.left,
    );

  const menuActions: GridMenuActions = {
    insertRowAbove,
    insertRowBelow,
    insertColLeft,
    insertColRight,
    deleteRows: doDeleteRows,
    deleteCols: doDeleteCols,
    merge: doMerge,
    unmerge: doUnmerge,
    insertImage: openImagePicker,
    insertElement: elementPanel.open,
    toggle: toggleKey,
    format: applyFormat,
    sort: doSort,
    clearSort,
  };

  const toolbar = (
    <TableToolbar
      hasSelection={selection !== null}
      activeFormat={anchorFormat}
      painterActive={painterActive}
      insert={{ row: fullRowSelected, col: fullColSelected }}
      onToggle={toggleKey}
      onAlign={(align: TextAlign) => applyFormat({ align })}
      onVerticalAlign={(valign: VerticalAlign) => applyFormat({ valign })}
      onColor={(color) => applyFormat({ color })}
      onClearColor={() => applyFormat({ color: undefined })}
      onBackground={(background) => applyFormat({ background })}
      onClearBackground={() => applyFormat({ background: undefined })}
      onFontSize={(size) => applyFormat({ fontSize: size ?? undefined })}
      onFontSizeStep={stepFontSize}
      onSuperscript={() => applyVertAlign("superscript")}
      onSubscript={() => applyVertAlign("subscript")}
      elementsOpen={elementPanel.isOpen}
      elementsAvailable={elementPanel.available}
      onToggleElements={elementPanel.toggle}
      onInsertRowAbove={insertRowAbove}
      onInsertRowBelow={insertRowBelow}
      onInsertColLeft={insertColLeft}
      onInsertColRight={insertColRight}
      onDeleteRows={doDeleteRows}
      onDeleteCols={doDeleteCols}
      onMerge={doMerge}
      onUnmerge={doUnmerge}
      canUnmerge={canUnmerge}
      onCopyFormat={handleCopyFormat}
      onUpload={handleUpload}
      onInsertImage={openImagePicker}
      hasSelectedImages={selectedImageCount > 0}
      canEqualizeImages={selectedImageCount > 1}
      onEqualizeImageHeight={() => void resizeImages("height")}
      onEqualizeImageWidth={() => void resizeImages("width")}
      onResetImageSize={() => void resizeImages("default")}
      onClearFormatting={clearFormats}
      hasClearTarget={ranges.length > 0}
    />
  );

  // Ganz markierte Spalten und Zeilen zeigt ihr Rand; die aktuelle Zelle (in
  // Bearbeitung, sonst der Anfang der Markierung) trägt einen Rahmen.
  const full = fullLines(ranges, rowCount, colCount);
  const current = editing ?? (selection ? anchor : null);
  const isCurrent = (row: number, col: number): boolean =>
    current !== null && current[0] === row && current[1] === col;

  /** Ob eine (verbundene) Zelle den Bereich berührt. */
  const touches = (range: CellRange | null, row: number, col: number, rowSpan: number, colSpan: number): boolean =>
    range !== null && row <= range.bottom && row + rowSpan - 1 >= range.top && col <= range.right && col + colSpan - 1 >= range.left;

  /** Gestrichelter Rand um den kopierten Bereich: je Zelle nur die Seiten am Rand. */
  const copiedClasses = (row: number, col: number, rowSpan: number, colSpan: number): string[] => {
    const range = copiedRange;
    if (range === null || !touches(range, row, col, rowSpan, colSpan)) return [];
    return [
      `${CELL}--copied`,
      row <= range.top ? `${CELL}--copied-top` : "",
      row + rowSpan - 1 >= range.bottom ? `${CELL}--copied-bottom` : "",
      col <= range.left ? `${CELL}--copied-left` : "",
      col + colSpan - 1 >= range.right ? `${CELL}--copied-right` : "",
    ];
  };

  /**
   * Das Ausfüllkästchen sitzt an der Zelle mit der unteren rechten Ecke der
   * Markierung – bei einer verbundenen Zelle an deren Anker. Nur bei genau
   * einem Bereich und nicht beim Bearbeiten oder mit dem Format-Pinsel.
   */
  const fillCorner = ((): [number, number] | null => {
    if (selection === null || ranges.length !== 1 || editing !== null || painterActive) return null;
    const { bottom, right } = selection;
    const merge = value.merges.find(
      (m) => bottom >= m.row && bottom < m.row + m.rowSpan && right >= m.col && right < m.col + m.colSpan,
    );
    return merge ? [merge.row, merge.col] : [bottom, right];
  })();

  const grid = (
    <table className="table-editor__grid" data-testid="table-editor-grid">
      <ColumnHeaders
        colCount={colCount}
        fullColumns={full.cols}
        allSelected={full.cols.size === colCount && colCount > 0}
        onSelectAll={selectAll}
        onSelectColumn={selectColumn}
      />
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            <RowHeader row={rowIndex} full={full.rows.has(rowIndex)} onSelect={() => selectRow(rowIndex)} />
            {row.map((cell, colIndex) => {
              if (isCovered(value, rowIndex, colIndex)) return null;
              const merge = mergeAt(value, rowIndex, colIndex);
              const isHeader = rowIndex === 0 || colIndex === 0;
              return (
                <td
                  key={colIndex}
                  colSpan={merge && merge.colSpan > 1 ? merge.colSpan : undefined}
                  rowSpan={merge && merge.rowSpan > 1 ? merge.rowSpan : undefined}
                  className={[
                    CELL,
                    isHeader ? `${CELL}--head` : "",
                    isSelected(rowIndex, colIndex) ? `${CELL}--selected` : "",
                    isCurrent(rowIndex, colIndex) ? `${CELL}--current` : "",
                    touches(fillPreview, rowIndex, colIndex, merge?.rowSpan ?? 1, merge?.colSpan ?? 1) ? `${CELL}--fill` : "",
                    ...copiedClasses(rowIndex, colIndex, merge?.rowSpan ?? 1, merge?.colSpan ?? 1),
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={formatToCellStyle(cellFormat(value, rowIndex, colIndex))}
                  onMouseDown={(e) => handleCellMouseDown(e, rowIndex, colIndex)}
                  onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                  onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                  onContextMenu={() => handleCellContextMenu(rowIndex, colIndex)}
                >
                  {/* Jede Zelle nimmt Bilder aus der Mediathek-Leiste und Elemente aus dem Explorer an. */}
                  <CellDropZone
                    client={client}
                    onImage={(image) => insertImageIntoCell(rowIndex, colIndex, image)}
                    onElement={(element) => dropElementIntoCell(rowIndex, colIndex, element)}
                  >
                    <EditableCell
                      html={sanitizeRichText(cell)}
                      ariaLabel={`Zeile ${rowIndex + 1}, Spalte ${colIndex + 1}`}
                      editing={isEditing(rowIndex, colIndex)}
                      format={formatToStyle(cellFormat(value, rowIndex, colIndex))}
                      onInput={(next) => handleInput(rowIndex, colIndex, next)}
                      onPaste={(e) => handlePaste(e, rowIndex, colIndex)}
                      onStopEdit={() => setEditing((cur) => (cur && cur[0] === rowIndex && cur[1] === colIndex ? null : cur))}
                      onEscape={leaveEdit}
                    />
                  </CellDropZone>
                  {fillCorner !== null && fillCorner[0] === rowIndex && fillCorner[1] === colIndex && (
                    <span
                      aria-hidden
                      data-testid="fill-handle"
                      className="table-editor__fill-handle"
                      title="Ziehen füllt die Nachbarzellen aus"
                      onMouseDown={startFill}
                    />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    // `tabIndex={-1}`: Ziel des Fokus nach Escape in einer Zelle (`leaveEdit`).
    <div
      className="table-editor"
      data-testid="table-editor"
      ref={rootRef}
      tabIndex={-1}
      onCopy={(event) => copySelection(event, false)}
      onCut={(event) => copySelection(event, true)}
      onPaste={pasteIntoSelection}
    >
      {/* The editor carries its own stylesheet rather than writing to
          `document.head`: it is mounted into someone else's dialog and should
          leave nothing behind when it goes. */}
      <style>{hotTableEditorCss}</style>
      <style>{ELEMENT_CSS}</style>
      <ConfigWorkspace
        className="min-h-0 flex-1"
        inspector={<TableInspector value={value} onChange={onChange} />}
        preview={<TablePreview model={value} />}
      >
        <div className="table-editor__main">
          {toolbar}
          {/* The container query box has to be a separate, stretched element.
              `container-type: inline-size` contains the inline axis, so the box's
              own width can no longer be derived from its contents — putting it on
              the shrink-to-fit frame below collapsed that frame to zero width. */}
          <div className={`table-editor__fit-scope ${value.fitImages ? IMAGE_FIT_CLASS : IMAGE_NO_FIT_CLASS}`}>
            {value.fitImages ? <style>{hotImageFitCss}</style> : <style>{hotImageNoFitCss}</style>}
            <ContextMenu.Root>
              <ContextMenu.Trigger asChild>
                <div className="table-editor__grid-wrap" data-testid="table-editor-grid-wrap" onMouseUp={handleCellMouseUp}>
                  {grid}
                </div>
              </ContextMenu.Trigger>
              <GridContextMenu container={portalContainer} hasSelection={selection !== null} actions={menuActions} />
            </ContextMenu.Root>
          </div>
          <StatusBar
            data-testid="table-editor-status"
            start={gridStatusText(rowCount, colCount, ranges, countWithoutMeaning(elements))}
            end={gridHint({ editing: editing !== null, painterActive, filling: fillPreview !== null, copied: copiedRange !== null })}
          />
        </div>
      </ConfigWorkspace>

      {media.overlay}
    </div>
  );
};

/**
 * Builds a format patch that fully replaces a target cell's format with the
 * copied one (missing keys become `undefined`, so they get cleared). Used by
 * the format painter.
 */
function fullFormatPatch(source: CellFormat): CellFormat {
  return {
    bold: source.bold,
    italic: source.italic,
    underline: source.underline,
    strikethrough: source.strikethrough,
    align: source.align,
    valign: source.valign,
    color: source.color,
    background: source.background,
    fontSize: source.fontSize,
  };
}

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

import * as React from "react";
import { ReactElement, useEffect, useRef, useState } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {
  TableModel,
  CellRange,
  CellFormat,
  TextAlign,
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
import { TableToolbar } from "./table-toolbar";
import { importTableFile } from "./table-import";

export interface TableEditorProps {
  value: TableModel;
  onChange: (model: TableModel) => void;
  /** Optional: when provided, the toolbar shows a "Fertig" button. */
  onDone?: () => void;
}

const cellBoxStyle: React.CSSProperties = {
  border: "1px solid #d5d9dd",
  padding: "0",
  position: "relative",
  minWidth: "70px",
};

const headerCellBoxStyle: React.CSSProperties = {
  ...cellBoxStyle,
  background: "#f5f6f7",
};

const selectedCellStyle: React.CSSProperties = {
  boxShadow: "inset 0 0 0 2px #0074d9",
  background: "#eaf4ff",
};

const editableStyle: React.CSSProperties = {
  minWidth: "70px",
  minHeight: "20px",
  boxSizing: "border-box",
  padding: "6px 8px",
  outline: "none",
  font: "inherit",
  whiteSpace: "pre-wrap",
};

const handleStyle: React.CSSProperties = {
  background: "#eceff2",
  border: "1px solid #d5d9dd",
  cursor: "pointer",
  padding: "2px 6px",
  fontSize: "11px",
  color: "#5b6470",
  textAlign: "center",
  userSelect: "none",
};

const menuContentStyle: React.CSSProperties = {
  minWidth: "220px",
  background: "#fff",
  borderRadius: "6px",
  padding: "4px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
  fontSize: "13px",
  zIndex: 2000,
};

const menuItemStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  outline: "none",
  userSelect: "none",
};

const separatorStyle: React.CSSProperties = {
  height: "1px",
  background: "#e5e8ec",
  margin: "4px 0",
};

const cellsInRange = (range: CellRange): Array<[number, number]> => {
  const cells: Array<[number, number]> = [];
  for (let r = range.top; r <= range.bottom; r++) {
    for (let c = range.left; c <= range.right; c++) {
      cells.push([r, c]);
    }
  }
  return cells;
};

/**
 * A single cell's content. It is only `contenteditable` while it is the cell
 * being edited (entered via double-click); the rest of the time editing is
 * off so that mouse drags select cells instead of text/caret. Content is set
 * imperatively (never while focused) so React re-renders don't reset the
 * caret, and is read back out as sanitized inline markup (only `<sup>`/`<sub>`
 * survive).
 */
function EditableCell({
  html,
  ariaLabel,
  editing,
  onInput,
  onPaste,
  onStopEdit,
}: {
  html: string;
  ariaLabel: string;
  editing: boolean;
  onInput: (value: string) => void;
  onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void;
  onStopEdit: () => void;
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el !== document.activeElement && el.innerHTML !== html) {
      el.innerHTML = html;
    }
  }, [html]);

  // When a cell enters edit mode, focus it and drop the caret at the end.
  useEffect(() => {
    const el = ref.current;
    if (editing && el && el !== document.activeElement) {
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  return (
    <div
      ref={ref}
      role="textbox"
      contentEditable={editing}
      suppressContentEditableWarning
      aria-label={ariaLabel}
      style={{ ...editableStyle, cursor: editing ? "text" : "default" }}
      onPaste={onPaste}
      onBlur={onStopEdit}
      onInput={() => onInput(sanitizeRichText(ref.current?.innerHTML ?? ""))}
    />
  );
}

/** A Radix context-menu item with the shared styling. */
function MenuItem({
  children,
  onSelect,
  disabled,
  testId,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  testId?: string;
}): ReactElement {
  return (
    <ContextMenu.Item
      disabled={disabled}
      data-testid={testId}
      style={{ ...menuItemStyle, opacity: disabled ? 0.4 : 1 }}
      onSelect={onSelect}
    >
      {children}
    </ContextMenu.Item>
  );
}

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
 */
export const TableEditor = ({ value, onChange, onDone }: TableEditorProps): ReactElement => {
  const data = value.data;
  const rowCount = data.length;
  const colCount = data[0]?.length ?? 0;

  const [selection, setSelection] = useState<CellRange | null>(null);
  const [anchor, setAnchor] = useState<[number, number] | null>(null);
  const [editing, setEditing] = useState<[number, number] | null>(null);
  const activeCell = useRef<[number, number] | null>(null);
  const isDragging = useRef(false);
  const [copiedPattern, setCopiedPattern] = useState<{
    rows: number;
    cols: number;
    formats: CellFormat[][];
  } | null>(null);
  const painterActive = copiedPattern !== null;

  const isEditing = (row: number, col: number): boolean =>
    editing !== null && editing[0] === row && editing[1] === col;

  // Stop drag-selecting when the mouse is released anywhere (also outside the
  // grid), so a drag that ends off-table doesn't get stuck.
  useEffect(() => {
    const stop = (): void => {
      isDragging.current = false;
    };
    document.addEventListener("mouseup", stop);
    return () => document.removeEventListener("mouseup", stop);
  }, []);

  const isSelected = (row: number, col: number): boolean =>
    selection !== null &&
    row >= selection.top &&
    row <= selection.bottom &&
    col >= selection.left &&
    col <= selection.right;

  const selectSingle = (row: number, col: number): void => {
    setAnchor([row, col]);
    setSelection({ top: row, left: col, bottom: row, right: col });
  };

  const extendTo = (row: number, col: number): void => {
    const start = anchor ?? [row, col];
    setSelection(normalizeRange(start, [row, col]));
  };

  const selectRow = (row: number): void => {
    setAnchor([row, 0]);
    setSelection({ top: row, left: 0, bottom: row, right: colCount - 1 });
  };

  const selectColumn = (col: number): void => {
    setAnchor([0, col]);
    setSelection({ top: 0, left: col, bottom: rowCount - 1, right: col });
  };

  const selectAll = (): void => {
    setAnchor([0, 0]);
    setSelection({ top: 0, left: 0, bottom: rowCount - 1, right: colCount - 1 });
  };

  const handleCellMouseDown = (event: React.MouseEvent, row: number, col: number): void => {
    // While a cell is being edited, let the mouse drive the caret normally.
    if (isEditing(row, col)) return;

    if (event.shiftKey) {
      event.preventDefault();
      extendTo(row, col);
      isDragging.current = true;
      return;
    }
    // Selecting a different cell ends any in-progress edit.
    if (editing) setEditing(null);
    event.preventDefault();
    selectSingle(row, col);
    isDragging.current = true;
  };

  /** Extends the selection while dragging with the mouse button held down. */
  const handleCellMouseEnter = (row: number, col: number): void => {
    if (isDragging.current && editing === null) extendTo(row, col);
  };

  /** Double-click enters edit mode for the cell. */
  const handleCellDoubleClick = (row: number, col: number): void => {
    setEditing([row, col]);
    activeCell.current = [row, col];
  };

  const handleCellMouseUp = (): void => {
    isDragging.current = false;
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

  /**
   * Multi-cell paste (tab/newline-separated, e.g. from a spreadsheet) is
   * written as a block starting at the target cell; a single-cell paste is
   * inserted as plain text so no foreign markup/styling leaks in.
   */
  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>, row: number, col: number): void => {
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

  // --- Format helpers ---

  const applyFormat = (patch: CellFormat): void => {
    if (!selection) return;
    onChange(setFormat(value, cellsInRange(selection), patch));
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
    const el = document.activeElement as HTMLElement | null;
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

  const doSort = (dir: "asc" | "desc") => (): void => {
    if (selection) onChange(setSort(value, { col: selection.left, dir }));
  };
  const clearSort = (): void => onChange(setSort(value, null));

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
        setSelection(null);
        setAnchor(null);
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

  return (
    <div className="table-editor" data-testid="table-editor">
      <TableToolbar
        hasSelection={selection !== null}
        activeFormat={anchorFormat}
        painterActive={painterActive}
        insert={{ row: fullRowSelected, col: fullColSelected }}
        onToggle={toggleKey}
        onAlign={(align: TextAlign) => applyFormat({ align })}
        onColor={(color) => applyFormat({ color })}
        onClearColor={() => applyFormat({ color: undefined })}
        onBackground={(background) => applyFormat({ background })}
        onClearBackground={() => applyFormat({ background: undefined })}
        onFontSize={(size) => applyFormat({ fontSize: size ?? undefined })}
        onFontSizeStep={stepFontSize}
        onSuperscript={() => applyVertAlign("superscript")}
        onSubscript={() => applyVertAlign("subscript")}
        onInsertRowAbove={insertRowAbove}
        onInsertRowBelow={insertRowBelow}
        onInsertColLeft={insertColLeft}
        onInsertColRight={insertColRight}
        onDeleteRows={doDeleteRows}
        onDeleteCols={doDeleteCols}
        onMerge={doMerge}
        onUnmerge={doUnmerge}
        canUnmerge={canUnmerge}
        onSortAsc={doSort("asc")}
        onSortDesc={doSort("desc")}
        onClearSort={clearSort}
        onCopyFormat={handleCopyFormat}
        onUpload={handleUpload}
        onDone={onDone}
      />

      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div
            className="table-editor__grid-wrap"
            onMouseUp={handleCellMouseUp}
            style={{
              display: "inline-block",
              maxWidth: "100%",
              overflow: "auto",
              border: "1px solid #d9dee3",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.06)",
              background: "#fff",
            }}
          >
            <table style={{ borderCollapse: "collapse" }} data-testid="table-editor-grid">
            <thead>
              <tr>
                <th style={handleStyle} data-testid="select-all" onClick={selectAll} aria-label="Alles auswählen" />
                {Array.from({ length: colCount }, (_, col) => (
                  <th key={col} style={handleStyle} data-testid={`col-handle-${col}`} aria-label={`Spalte ${col + 1} auswählen`} onClick={() => selectColumn(col)}>
                    ▽
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <th style={handleStyle} data-testid={`row-handle-${rowIndex}`} aria-label={`Zeile ${rowIndex + 1} auswählen`} onClick={() => selectRow(rowIndex)}>
                    ▷
                  </th>
                  {row.map((cell, colIndex) => {
                    if (isCovered(value, rowIndex, colIndex)) return null;
                    const merge = mergeAt(value, rowIndex, colIndex);
                    const isHeader = rowIndex === 0 || colIndex === 0;
                    return (
                      <td
                        key={colIndex}
                        colSpan={merge && merge.colSpan > 1 ? merge.colSpan : undefined}
                        rowSpan={merge && merge.rowSpan > 1 ? merge.rowSpan : undefined}
                        style={{
                          ...(isHeader ? headerCellBoxStyle : cellBoxStyle),
                          ...(isSelected(rowIndex, colIndex) ? selectedCellStyle : {}),
                        }}
                        onMouseDown={(e) => handleCellMouseDown(e, rowIndex, colIndex)}
                        onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                        onContextMenu={() => handleCellContextMenu(rowIndex, colIndex)}
                      >
                        <EditableCell
                          html={sanitizeRichText(cell)}
                          ariaLabel={`Zeile ${rowIndex + 1}, Spalte ${colIndex + 1}`}
                          editing={isEditing(rowIndex, colIndex)}
                          onInput={(next) => handleInput(rowIndex, colIndex, next)}
                          onPaste={(e) => handlePaste(e, rowIndex, colIndex)}
                          onStopEdit={() => setEditing((cur) => (cur && cur[0] === rowIndex && cur[1] === colIndex ? null : cur))}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </ContextMenu.Trigger>

        <ContextMenu.Portal>
          <ContextMenu.Content style={menuContentStyle} data-testid="table-editor-menu">
            <MenuItem testId="insert-row-above" onSelect={insertRowAbove} disabled={selection === null}>Zeile oberhalb einfügen</MenuItem>
            <MenuItem testId="insert-row-below" onSelect={insertRowBelow} disabled={selection === null}>Zeile unterhalb einfügen</MenuItem>
            <MenuItem testId="insert-col-left" onSelect={insertColLeft} disabled={selection === null}>Spalte links einfügen</MenuItem>
            <MenuItem testId="insert-col-right" onSelect={insertColRight} disabled={selection === null}>Spalte rechts einfügen</MenuItem>
            <ContextMenu.Separator style={separatorStyle} />
            <MenuItem testId="delete-rows" onSelect={doDeleteRows} disabled={selection === null}>Zeile(n) löschen</MenuItem>
            <MenuItem testId="delete-cols" onSelect={doDeleteCols} disabled={selection === null}>Spalte(n) löschen</MenuItem>
            <ContextMenu.Separator style={separatorStyle} />
            <MenuItem testId="merge-cells" onSelect={doMerge} disabled={selection === null}>Zellen verbinden</MenuItem>
            <MenuItem testId="unmerge-cells" onSelect={doUnmerge} disabled={selection === null}>Verbindung aufheben</MenuItem>
            <ContextMenu.Separator style={separatorStyle} />
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger style={menuItemStyle} data-testid="text-options">Textoptionen ▸</ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.SubContent style={menuContentStyle}>
                  <MenuItem testId="fmt-bold" onSelect={() => toggleKey("bold")}>Fett</MenuItem>
                  <MenuItem testId="fmt-italic" onSelect={() => toggleKey("italic")}>Kursiv</MenuItem>
                  <MenuItem testId="fmt-underline" onSelect={() => toggleKey("underline")}>Unterstrichen</MenuItem>
                  <MenuItem testId="fmt-strike" onSelect={() => toggleKey("strikethrough")}>Durchgestrichen</MenuItem>
                  <ContextMenu.Separator style={separatorStyle} />
                  <MenuItem testId="align-left" onSelect={() => applyFormat({ align: "left" })}>Linksbündig</MenuItem>
                  <MenuItem testId="align-center" onSelect={() => applyFormat({ align: "center" })}>Zentriert</MenuItem>
                  <MenuItem testId="align-right" onSelect={() => applyFormat({ align: "right" })}>Rechtsbündig</MenuItem>
                </ContextMenu.SubContent>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger style={menuItemStyle} data-testid="sort-options">Sortierung ▸</ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.SubContent style={menuContentStyle}>
                  <MenuItem testId="sort-asc" onSelect={doSort("asc")} disabled={selection === null}>Aufsteigend (diese Spalte)</MenuItem>
                  <MenuItem testId="sort-desc" onSelect={doSort("desc")} disabled={selection === null}>Absteigend (diese Spalte)</MenuItem>
                  <MenuItem testId="sort-clear" onSelect={clearSort}>Sortierung entfernen</MenuItem>
                </ContextMenu.SubContent>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
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
    color: source.color,
    background: source.background,
    fontSize: source.fontSize,
  };
}

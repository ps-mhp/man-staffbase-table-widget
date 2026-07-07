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
import { ReactElement } from "react";
import { TableData } from "./table-json";
import {
  updateCell,
  addRow,
  removeRow,
  addColumn,
  removeColumn,
  parsePastedText,
  pasteBlock,
} from "./grid-operations";

export interface TableEditorProps {
  value: TableData;
  onChange: (data: TableData) => void;
}

const cellBoxStyle: React.CSSProperties = {
  border: "1px solid #d5d9dd",
  padding: "2px",
  position: "relative",
};

const headerCellBoxStyle: React.CSSProperties = {
  ...cellBoxStyle,
  background: "#f5f6f7",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "80px",
  boxSizing: "border-box",
  border: "none",
  background: "transparent",
  padding: "6px 8px",
  font: "inherit",
};

const iconButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "-8px",
  right: "-8px",
  width: "18px",
  height: "18px",
  lineHeight: "16px",
  borderRadius: "50%",
  border: "1px solid #c7cbd1",
  background: "#fff",
  color: "#5b6470",
  fontSize: "12px",
  cursor: "pointer",
  padding: 0,
};

const addButtonStyle: React.CSSProperties = {
  border: "1px dashed #b7bcc3",
  background: "#fafbfc",
  color: "#3a4148",
  cursor: "pointer",
  padding: "6px 12px",
  borderRadius: "4px",
  fontSize: "13px",
};

/**
 * Editable grid used to build/maintain the widget's table data inside the
 * Staffbase config dialog. Fully controlled: the parent owns `value` and
 * receives every change via `onChange`.
 *
 * Row 0 and column 0 represent the frozen header row/column of the rendered
 * widget and are visually distinguished, and cannot be removed (see
 * `grid-operations.ts`).
 */
export const TableEditor = ({ value, onChange }: TableEditorProps): ReactElement => {
  const handlePaste = (
    event: React.ClipboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number,
  ): void => {
    const text = event.clipboardData?.getData("text");
    if (!text || !text.includes("\t") && !text.includes("\n")) {
      // Single-cell plain paste: let the browser's native input paste happen.
      return;
    }
    event.preventDefault();
    const block = parsePastedText(text);
    onChange(pasteBlock(value, rowIndex, colIndex, block));
  };

  return (
    <div className="table-editor" data-testid="table-editor">
      <table style={{ borderCollapse: "collapse" }}>
        <tbody>
          {value.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  style={rowIndex === 0 || colIndex === 0 ? headerCellBoxStyle : cellBoxStyle}
                >
                  <input
                    type="text"
                    style={inputStyle}
                    value={cell}
                    aria-label={`Zeile ${rowIndex + 1}, Spalte ${colIndex + 1}`}
                    onChange={(e) => onChange(updateCell(value, rowIndex, colIndex, e.target.value))}
                    onPaste={(e) => handlePaste(e, rowIndex, colIndex)}
                  />
                  {colIndex > 0 && rowIndex === 0 && (
                    <button
                      type="button"
                      style={iconButtonStyle}
                      aria-label={`Spalte ${colIndex + 1} entfernen`}
                      onClick={() => onChange(removeColumn(value, colIndex))}
                    >
                      ×
                    </button>
                  )}
                  {rowIndex > 0 && colIndex === 0 && (
                    <button
                      type="button"
                      style={iconButtonStyle}
                      aria-label={`Zeile ${rowIndex + 1} entfernen`}
                      onClick={() => onChange(removeRow(value, rowIndex))}
                    >
                      ×
                    </button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button type="button" style={addButtonStyle} onClick={() => onChange(addRow(value))}>
          + Zeile
        </button>
        <button type="button" style={addButtonStyle} onClick={() => onChange(addColumn(value))}>
          + Spalte
        </button>
      </div>
    </div>
  );
};

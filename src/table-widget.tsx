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

import React, { ReactElement, useMemo, useState } from "react";
import { BlockAttributes } from "widget-sdk";
import {
  parseTableModel,
  isCovered,
  mergeAt,
  cellFormat,
} from "./table-model";
import { formatToStyle } from "./cell-style";
import { sanitizeRichText, richTextToPlain } from "./rich-text";

/**
 * React Component
 */
export type TableWidgetProps = BlockAttributes & {
  tabledata?: string;
};

const baseCellStyle: React.CSSProperties = {
  padding: "8px 12px",
  whiteSpace: "nowrap",
  borderBottom: "1px solid #3e3b3b",
};

const headerCellStyle: React.CSSProperties = {
  ...baseCellStyle,
  fontWeight: "bold",
  cursor: "pointer",
  userSelect: "none",
  borderBottom: "2px solid #233848",
};

const alignFor = (colIndex: number): React.CSSProperties["textAlign"] =>
  colIndex === 0 ? "left" : "center";

/**
 * The first column carries the (often long) row labels. Cap it so it can
 * never take more than 75% of the *visible* container width (via the `cqw`
 * container-query unit — see the `container-type` on the scroll wrapper),
 * otherwise a very long label could push the data columns out of view and
 * make horizontal scrolling useless. When capped, the label wraps at word
 * boundaries. `break-word` (not `anywhere`) is deliberate: it only breaks a
 * word that is itself too long, so normal labels don't shatter into single
 * characters as auto table-layout squeezes the column.
 */
const firstColumnStyle: React.CSSProperties = {
  maxWidth: "75cqw",
  whiteSpace: "normal",
  overflowWrap: "break-word",
};

/** Renders a cell's (possibly super-/sub-scripted) content as safe markup. */
const CellContent = ({ value }: { value: string }): ReactElement => (
  <span dangerouslySetInnerHTML={{ __html: sanitizeRichText(value) }} />
);

interface SortState {
  col: number;
  asc: boolean;
}

export const TableWidget = ({ tabledata }: TableWidgetProps): ReactElement => {
  const model = useMemo(() => parseTableModel(tabledata), [tabledata]);
  const { data } = model;
  const headerRow = data[0] ?? [];

  const [sort, setSort] = useState<SortState | null>(
    model.sort ? { col: model.sort.col, asc: model.sort.dir === "asc" } : null,
  );

  /**
   * Body rows are rendered by their *original* row index so merges and
   * formats (which are keyed by absolute coordinates) always resolve
   * correctly, even after sorting only reorders which original row shows
   * where. Row 0 (header) is never part of the sortable body.
   */
  const bodyOrder = useMemo(() => {
    const order = data.map((_, index) => index).slice(1);
    if (sort === null) return order;
    return [...order].sort((ra, rb) => {
      const x = richTextToPlain(data[ra][sort.col] ?? "").trim();
      const y = richTextToPlain(data[rb][sort.col] ?? "").trim();
      const cmp = x.localeCompare(y, "de", { numeric: true });
      return sort.asc ? cmp : -cmp;
    });
  }, [data, sort]);

  const toggleSort = (col: number): void => {
    setSort((prev) => (prev && prev.col === col ? { col, asc: !prev.asc } : { col, asc: true }));
  };

  const spanProps = (row: number, col: number): { colSpan?: number; rowSpan?: number } => {
    const merge = mergeAt(model, row, col);
    if (!merge) return {};
    return {
      ...(merge.colSpan > 1 ? { colSpan: merge.colSpan } : {}),
      ...(merge.rowSpan > 1 ? { rowSpan: merge.rowSpan } : {}),
    };
  };

  return (
    <div
      className="table-widget-scroll"
      style={{ overflow: "auto", maxWidth: "100%", maxHeight: "70vh", containerType: "inline-size" }}
    >
      <table
        style={{
          borderCollapse: "separate",
          borderSpacing: "3px 0",
          tableLayout: "auto",
          width: "100%",
        }}
      >
        <thead>
          <tr>
            {headerRow.map((cell, colIndex) => {
              if (isCovered(model, 0, colIndex)) return null;
              return (
                <th
                  key={colIndex}
                  scope="col"
                  onClick={() => toggleSort(colIndex)}
                  {...spanProps(0, colIndex)}
                  style={{
                    ...headerCellStyle,
                    textAlign: alignFor(colIndex),
                    ...(colIndex === 0 ? firstColumnStyle : {}),
                    ...formatToStyle(cellFormat(model, 0, colIndex)),
                    background: "#fff",
                    position: "sticky",
                    top: 0,
                    zIndex: colIndex === 0 ? 3 : 2,
                    ...(colIndex === 0 ? { left: 0 } : {}),
                  }}
                >
                  <CellContent value={cell} />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {bodyOrder.map((rowIndex, displayIndex) => {
            const row = data[rowIndex];
            const gapStyle: React.CSSProperties = displayIndex === 0 ? { paddingTop: "16px" } : {};
            return (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => {
                  if (isCovered(model, rowIndex, colIndex)) return null;
                  const format = formatToStyle(cellFormat(model, rowIndex, colIndex));
                  const spans = spanProps(rowIndex, colIndex);
                  return colIndex === 0 ? (
                    <th
                      key={colIndex}
                      scope="row"
                      {...spans}
                      style={{
                        ...baseCellStyle,
                        textAlign: alignFor(colIndex),
                        ...firstColumnStyle,
                        fontWeight: "bold",
                        background: "#fff",
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        ...format,
                        ...gapStyle,
                      }}
                    >
                      <CellContent value={cell} />
                    </th>
                  ) : (
                    <td
                      key={colIndex}
                      {...spans}
                      style={{
                        ...baseCellStyle,
                        textAlign: alignFor(colIndex),
                        ...format,
                        ...gapStyle,
                      }}
                    >
                      <CellContent value={cell} />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

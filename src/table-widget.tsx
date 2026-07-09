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
import { parseTableData } from "./table-json";

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

export const TableWidget = ({ tabledata }: TableWidgetProps): ReactElement => {
  const data = parseTableData(tabledata);
  const [headerRow, ...bodyRows] = data;

  const [sort, setSort] = useState<{ col: number; asc: boolean } | null>(null);

  const sortedBodyRows = useMemo(() => {
    if (sort === null) {
      return bodyRows;
    }
    const { col, asc } = sort;
    return [...bodyRows].sort((a, b) => {
      const x = (a[col] ?? "").trim();
      const y = (b[col] ?? "").trim();
      return asc
        ? x.localeCompare(y, "de", { numeric: true })
        : y.localeCompare(x, "de", { numeric: true });
    });
  }, [bodyRows, sort]);

  const toggleSort = (col: number): void => {
    setSort((prev) =>
      prev && prev.col === col ? { col, asc: !prev.asc } : { col, asc: true },
    );
  };

  return (
    <div style={{ overflow: "auto", maxWidth: "100%" }}>
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
            {headerRow.map((cell, colIndex) => (
              <th
                key={colIndex}
                scope="col"
                onClick={() => toggleSort(colIndex)}
                style={{ ...headerCellStyle, textAlign: alignFor(colIndex) }}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedBodyRows.map((row, rowIndex) => {
            const gapStyle: React.CSSProperties =
              rowIndex === 0 ? { paddingTop: "16px" } : {};
            return (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) =>
                  colIndex === 0 ? (
                    <th
                      key={colIndex}
                      scope="row"
                      style={{
                        ...baseCellStyle,
                        textAlign: alignFor(colIndex),
                        fontWeight: "bold",
                        ...gapStyle,
                      }}
                    >
                      {cell}
                    </th>
                  ) : (
                    <td
                      key={colIndex}
                      style={{
                        ...baseCellStyle,
                        textAlign: alignFor(colIndex),
                        ...gapStyle,
                      }}
                    >
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};


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

import React, { ReactElement } from "react";
import { BlockAttributes } from "widget-sdk";
import { parseTableData } from "./table-json";

/**
 * React Component
 */
export type TableWidgetProps = BlockAttributes & {
  tabledata?: string;
};

const cellStyle: React.CSSProperties = {
  border: "1px solid #d5d9dd",
  padding: "8px 12px",
  textAlign: "left",
  whiteSpace: "nowrap",
  background: "#fff",
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 600,
  background: "#f5f6f7",
};

export const TableWidget = ({ tabledata }: TableWidgetProps): ReactElement => {
  const data = parseTableData(tabledata);
  const [headerRow, ...bodyRows] = data;

  return (
    <div
      className="table-widget-scroll"
      style={{
        overflow: "auto",
        maxWidth: "100%",
        maxHeight: "70vh",
        border: "1px solid #d5d9dd",
        borderRadius: "4px",
      }}
    >
      <table
        style={{
          borderCollapse: "collapse",
          tableLayout: "auto",
        }}
      >
        <thead>
          <tr>
            {headerRow.map((cell, colIndex) => (
              <th
                key={colIndex}
                scope="col"
                style={{
                  ...headerCellStyle,
                  position: "sticky",
                  top: 0,
                  zIndex: colIndex === 0 ? 3 : 2,
                  ...(colIndex === 0 ? { left: 0 } : {}),
                }}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) =>
                colIndex === 0 ? (
                  <th
                    key={colIndex}
                    scope="row"
                    style={{
                      ...headerCellStyle,
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                    }}
                  >
                    {cell}
                  </th>
                ) : (
                  <td key={colIndex} style={cellStyle}>
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


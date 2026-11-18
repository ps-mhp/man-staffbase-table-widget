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

/**
 * Der Rand des Gitters wie in einer Tabellenkalkulation: Buchstaben über den
 * Spalten, Nummern vor den Zeilen, oben links das Eckfeld.
 *
 * Jeder Rand ist ein Knopf: ein Klick markiert die ganze Spalte, Zeile oder
 * Tabelle, ein Rechtsklick markiert sie auch (sofern nicht schon geschehen)
 * und öffnet dann das Kontextmenü des Gitters – „Spalte(n) löschen“ wirkt so
 * auf die Spalte unter der Maus. Ganz markierte Spalten und Zeilen zeigt ihr
 * Rand in der Akzentfarbe.
 */

import * as React from "react";
import { ReactElement } from "react";

import { columnLetters } from "./selection";

const HEAD = "table-editor__head";
const HANDLE = "table-editor__handle";

const headClass = (...modifiers: Array<string | false>): string =>
  [HEAD, ...modifiers.filter(Boolean).map((modifier) => `${HEAD}--${modifier}`)].join(" ");

interface HandleProps {
  testId: string;
  label: string;
  full: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}

/** Ein Rand als Knopf; Rechtsklick markiert vor dem Kontextmenü. */
function Handle({ testId, label, full, onSelect, children }: HandleProps): ReactElement {
  return (
    <button
      type="button"
      className={HANDLE}
      data-testid={testId}
      aria-label={label}
      title={label}
      onClick={onSelect}
      onContextMenu={() => {
        if (!full) onSelect();
      }}
    >
      {children}
    </button>
  );
}

export interface ColumnHeadersProps {
  colCount: number;
  /** Spalten, die die Markierung von oben bis unten umfasst. */
  fullColumns: ReadonlySet<number>;
  allSelected: boolean;
  onSelectAll: () => void;
  onSelectColumn: (col: number) => void;
}

/** Die Kopfzeile des Gitters: Eckfeld und ein Buchstabe je Spalte. */
export function ColumnHeaders({ colCount, fullColumns, allSelected, onSelectAll, onSelectColumn }: ColumnHeadersProps): ReactElement {
  return (
    <thead>
      <tr>
        <th scope="col" className={headClass("corner", allSelected && "active")}>
          <Handle testId="select-all" label="Alles auswählen" full={allSelected} onSelect={onSelectAll} />
        </th>
        {Array.from({ length: colCount }, (_, col) => {
          const full = fullColumns.has(col);
          const letters = columnLetters(col);
          return (
            <th key={col} scope="col" className={headClass("col", full && "active")}>
              <Handle testId={`col-handle-${col}`} label={`Spalte ${letters} auswählen`} full={full} onSelect={() => onSelectColumn(col)}>
                {letters}
              </Handle>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export interface RowHeaderProps {
  row: number;
  /** Die Markierung umfasst die Zeile von links bis rechts. */
  full: boolean;
  onSelect: () => void;
}

/** Die Nummer vor einer Zeile, ab 1 gezählt. */
export function RowHeader({ row, full, onSelect }: RowHeaderProps): ReactElement {
  return (
    <th scope="row" className={headClass("row", full && "active")}>
      <Handle testId={`row-handle-${row}`} label={`Zeile ${row + 1} auswählen`} full={full} onSelect={onSelect}>
        {row + 1}
      </Handle>
    </th>
  );
}

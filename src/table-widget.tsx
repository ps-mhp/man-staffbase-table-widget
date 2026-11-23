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

import React, { ReactElement, useEffect, useId, useMemo, useRef, useState } from "react";
import { BlockAttributes } from "widget-sdk";
import {
  parseTableModel,
  isCovered,
  mergeAt,
  cellFormat,
} from "./table-model";
import { formatToStyle, formatToCellStyle } from "./cell-style";
import { sanitizeRichText, richTextToPlain } from "./rich-text";
import { cellToPlain } from "./cell-text";
import { IMAGE_FIT_CLASS, IMAGE_NO_FIT_CLASS } from "./image-fit";
import imageFitCss from "./styles/image-fit.scss";
import imageNoFitCss from "./styles/image-no-fit.scss";
import tableWidgetCss from "./styles/table-widget.scss";
import { useIconStylesheet } from "@shared/icons/use-icon-stylesheet";
import { useHotStyle } from "@shared/hot-style";
import {
  clampRowSpan,
  collapseToggleLabel,
  collapses,
  hiddenRowCount,
  visibleRowOrder,
} from "./row-collapse";
import { isNativeApp } from "@shared/staffbase/native-app";
import { CSV_MIME, XLSX_MIME, buildExportGrid, toCsv, toXlsx } from "./table-export";
import { downloadFile, exportFileName } from "./download";

/**
 * React Component
 */
export type TableWidgetProps = BlockAttributes & {
  tabledata?: string;
};

/**
 * Class names of `styles/table-widget.scss`. They are collected here so a
 * rename shows up as a compile error rather than as silently unstyled markup.
 */
const CELL = "table-widget__cell";
const CELL_HEAD = `${CELL} ${CELL}--head`;
const CELL_ROWHEAD = `${CELL} ${CELL}--rowhead`;
const CELL_FIRST = `${CELL}--first`;
const CELL_GAP = `${CELL}--gap`;
const CELL_SELECT = `${CELL} ${CELL}--select`;
const CELL_SELECT_HEAD = `${CELL_SELECT} ${CELL}--select-head`;
const ROW_SELECTED = "table-widget__row--selected";

type ExportFormat = "xlsx" | "csv";
const FORMAT_LABEL: Record<ExportFormat, string> = { xlsx: "Excel", csv: "CSV" };
const FORMAT_BUTTON: Record<ExportFormat, string> = { xlsx: "Excel (.xlsx)", csv: "CSV" };

const rowsLabel = (count: number): string => (count === 1 ? "1 Zeile" : `${count} Zeilen`);

const selectionLabel = (count: number): string =>
  count === 0 ? "Keine Zeile ausgewählt" : `${rowsLabel(count)} ausgewählt`;

/** The extra top padding that separates the first body row from the header. */
const gapClass = (displayIndex: number): string => (displayIndex === 0 ? ` ${CELL_GAP}` : "");

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
  // Icons der Bibliothek: Form nachgeladen, nur für die Icons dieser Tabelle; Farbe aus dem Text.
  const iconCss = useIconStylesheet(useMemo(() => model.data.flat().join(""), [model]));
  const { data } = model;
  const headerRow = data[0] ?? [];

  const hotTableWidgetCss = useHotStyle(tableWidgetCss, "table-widget", "styles/table-widget.scss");
  const hotImageFitCss = useHotStyle(imageFitCss, "table-widget", "styles/image-fit.scss");
  const hotImageNoFitCss = useHotStyle(imageNoFitCss, "table-widget", "styles/image-no-fit.scss");

  // Whether the reader has revealed the hidden rows. This is a viewing
  // decision, not content, so it stays out of the model and leaves nothing
  // behind when the table is saved.
  const [expanded, setExpanded] = useState(false);
  // Ties the button to the rows it governs for screen readers. `useId` keeps
  // it unique when a page carries several tables.
  const bodyId = `table-widget-body-${useId()}`;

  // In der Staffbase-App gibt es weder Auswahl noch Download: Blob-Downloads
  // sind in deren WebViews nicht verlässlich.
  const exportMode = isNativeApp() ? "off" : model.exportMode;
  const selectable = exportMode === "select";
  // Wie `expanded` ein Lesezustand: nichts davon wird gespeichert. Schlüssel
  // ist der ursprüngliche Zeilenindex, so übersteht die Auswahl Sortieren
  // und Einklappen.
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [failed, setFailed] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

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

  const limit = model.visibleRows;
  const collapsible = collapses(bodyOrder.length, limit);
  const shownOrder = visibleRowOrder(bodyOrder, limit, expanded);
  const hidden = hiddenRowCount(bodyOrder.length, limit);

  // Nur Zeilen, die es noch gibt — die Vorschau im Editor kann Zeilen
  // löschen, während eine Auswahl steht.
  const chosen = bodyOrder.filter((row) => selected.has(row));
  const allChosen = bodyOrder.length > 0 && chosen.length === bodyOrder.length;
  const someChosen = chosen.length > 0 && !allChosen;

  useEffect(() => {
    // `indeterminate` gibt es nur als DOM-Eigenschaft, nicht als Attribut.
    if (selectAllRef.current) selectAllRef.current.indeterminate = someChosen;
  }, [someChosen, selectable]);

  const toggleRow = (row: number): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(row)) next.add(row);
      return next;
    });
  };

  // Teilauswahl → alle, alle → keine (Craft/Gmail).
  const toggleAll = (): void => {
    setSelected(allChosen ? new Set() : new Set(bodyOrder));
  };

  const rowTitle = (row: number): string => {
    const merge = model.merges.find((m) => m.col === 0 && row >= m.row && row < m.row + m.rowSpan);
    // Mit der Bedeutung von Elementen: eine Zeile, die nur „■“ trägt, heißt „Diesel“.
    return cellToPlain(data[merge ? merge.row : row]?.[0] ?? "");
  };

  const runExport = async (format: ExportFormat): Promise<void> => {
    setBusy(format);
    setFailed(false);
    try {
      const grid = buildExportGrid({ model, rowOrder: bodyOrder, selected: selectable ? new Set(chosen) : null });
      if (format === "csv") downloadFile(toCsv(grid), exportFileName("csv"), CSV_MIME);
      else downloadFile(await toXlsx(grid), exportFileName("xlsx"), XLSX_MIME);
    } catch (error) {
      console.error("Tabellen-Export fehlgeschlagen", error);
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const exportLabel = (format: ExportFormat): string =>
    selectable && chosen.length > 0
      ? `Auswahl (${rowsLabel(chosen.length)}) als ${FORMAT_LABEL[format]} exportieren`
      : `Ganze Tabelle als ${FORMAT_LABEL[format]} exportieren`;

  const toggleSort = (col: number): void => {
    setSort((prev) => (prev && prev.col === col ? { col, asc: !prev.asc } : { col, asc: true }));
  };

  /**
   * `displayIndex` is the row's position among the rows actually rendered.
   * A row span is shortened to what is left of them, so a merged cell in the
   * last visible row cannot reach into rows that the collapse cut away — the
   * browser would otherwise paint it past the end of the table.
   */
  const spanProps = (
    row: number,
    col: number,
    displayIndex: number,
  ): { colSpan?: number; rowSpan?: number } => {
    const merge = mergeAt(model, row, col);
    if (!merge) return {};
    const rowSpan = clampRowSpan(merge.rowSpan, displayIndex, shownOrder.length);
    return {
      ...(merge.colSpan > 1 ? { colSpan: merge.colSpan } : {}),
      ...(rowSpan > 1 ? { rowSpan } : {}),
    };
  };

  return (
    <div className={`table-widget${selectable ? " table-widget--selectable" : ""}`}>
      {exportMode !== "off" && (
        <div className="table-widget__export">
          {selectable && (
            <p className="table-widget__export-count" aria-live="polite">
              {selectionLabel(chosen.length)}
            </p>
          )}
          <div className="table-widget__export-actions">
            {(["xlsx", "csv"] as const).map((format) => (
              <button
                key={format}
                type="button"
                className="table-widget__export-button"
                onClick={() => void runExport(format)}
                disabled={busy !== null}
                aria-busy={busy === format}
                aria-label={exportLabel(format)}
                title={exportLabel(format)}
              >
                {busy === format ? "Wird erstellt …" : FORMAT_BUTTON[format]}
              </button>
            ))}
          </div>
        </div>
      )}
      {failed && (
        <p className="table-widget__export-error" role="alert">
          Export fehlgeschlagen. Bitte erneut versuchen.
        </p>
      )}
    <div className={`table-widget-scroll ${model.fitImages ? IMAGE_FIT_CLASS : IMAGE_NO_FIT_CLASS}`}>
      {/* The widget carries its own stylesheet instead of writing to
          `document.head`, so it comes and goes with the component. The image
          rules are part of it in both states: the host page styles article
          images too, so "off" is an explicit rule rather than the absence of
          one. */}
      <style>{`${hotTableWidgetCss}\n${model.fitImages ? hotImageFitCss : hotImageNoFitCss}\n${iconCss}`}</style>
      <table className="table-widget__table">
        <thead>
          <tr>
            {selectable && (
              <th scope="col" className={CELL_SELECT_HEAD}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  aria-label="Alle Zeilen auswählen"
                  checked={allChosen}
                  onChange={toggleAll}
                />
              </th>
            )}
            {headerRow.map((cell, colIndex) => {
              if (isCovered(model, 0, colIndex)) return null;
              const headerFormat = cellFormat(model, 0, colIndex);
              return (
                <th
                  key={colIndex}
                  scope="col"
                  onClick={() => toggleSort(colIndex)}
                  {...spanProps(0, colIndex, 0)}
                  className={`${CELL_HEAD}${colIndex === 0 ? ` ${CELL_FIRST}` : ""}`}
                  // Only what the model says about this one cell stays inline;
                  // an inline style beats the stylesheet, which is exactly the
                  // precedence a per-cell format needs.
                  style={{
                    ...formatToStyle(headerFormat),
                    ...formatToCellStyle(headerFormat),
                  }}
                >
                  <CellContent value={cell} />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody id={bodyId}>
          {shownOrder.map((rowIndex, displayIndex) => {
            const row = data[rowIndex];
            return (
              <tr key={rowIndex} className={selectable && selected.has(rowIndex) ? ROW_SELECTED : undefined}>
                {selectable && (
                  <td className={`${CELL_SELECT}${gapClass(displayIndex)}`}>
                    <input
                      type="checkbox"
                      aria-label={`Zeile auswählen: ${rowTitle(rowIndex) || bodyOrder.indexOf(rowIndex) + 1}`}
                      checked={selected.has(rowIndex)}
                      onChange={() => toggleRow(rowIndex)}
                    />
                  </td>
                )}
                {row.map((cell, colIndex) => {
                  if (isCovered(model, rowIndex, colIndex)) return null;
                  const cellFmt = cellFormat(model, rowIndex, colIndex);
                  const format = { ...formatToStyle(cellFmt), ...formatToCellStyle(cellFmt) };
                  const spans = spanProps(rowIndex, colIndex, displayIndex);
                  return colIndex === 0 ? (
                    <th
                      key={colIndex}
                      scope="row"
                      {...spans}
                      className={`${CELL_ROWHEAD} ${CELL_FIRST}${gapClass(displayIndex)}`}
                      style={format}
                    >
                      <CellContent value={cell} />
                    </th>
                  ) : (
                    <td
                      key={colIndex}
                      {...spans}
                      className={`${CELL}${gapClass(displayIndex)}`}
                      style={format}
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

      {/* Outside the scroll wrapper on purpose: inside, the button would
          drift off screen as soon as a wide table is scrolled sideways. */}
      {collapsible && (
        <button
          type="button"
          data-testid="table-rows-toggle"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={bodyId}
          className="table-widget__toggle"
        >
          {collapseToggleLabel(hidden, expanded)}
        </button>
      )}
    </div>
  );
};

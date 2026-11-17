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
 * Was am Status im Kopf des Rahmens steht, solange der Entwurf nicht
 * übernommen ist: „3 Zellen geändert“, „Struktur geändert“, „Einstellungen
 * geändert“.
 *
 * Liegt im Seitenbündel, weil der Injektor es dem Rahmen mitgibt, bevor der
 * Editor nachgeladen ist – deshalb nichts außer dem Modell.
 */

import { TableModel, formatKey } from "./table-model";

const sameJson = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Zeilen, Spalten oder Verbindungen anders: dann verschieben sich die Zellen
 * gegeneinander, und eine Zahl geänderter Zellen sagte nichts mehr.
 */
function structureChanged(draft: TableModel, saved: TableModel): boolean {
  const columns = (model: TableModel): number => model.data[0]?.length ?? 0;
  return (
    draft.data.length !== saved.data.length ||
    columns(draft) !== columns(saved) ||
    !sameJson(draft.merges, saved.merges)
  );
}

/** Zellen, deren Inhalt oder Format abweicht; jede zählt einmal. */
function changedCells(draft: TableModel, saved: TableModel): number {
  let count = 0;
  draft.data.forEach((row, r) =>
    row.forEach((value, c) => {
      const key = formatKey(r, c);
      // Über JSON verglichen: ein Feld mit `undefined` schreibt `setFormat`
      // nie hinaus, es darf also auch hier nicht als Änderung zählen.
      const differs = value !== saved.data[r]?.[c] || !sameJson(draft.formats[key], saved.formats[key]);
      if (differs) count += 1;
    }),
  );
  return count;
}

/** Was nicht an einer Zelle hängt, sondern an der ganzen Tabelle (Panel „Tabelle“). */
function settingsChanged(draft: TableModel, saved: TableModel): boolean {
  return (
    !sameJson(draft.sort, saved.sort) ||
    draft.fitImages !== saved.fitImages ||
    draft.visibleRows !== saved.visibleRows ||
    draft.exportMode !== saved.exportMode
  );
}

const cellsText = (count: number): string => (count === 1 ? "1 Zelle geändert" : `${count} Zellen geändert`);

/**
 * Der Text zum Status, oder `undefined`, wenn sich nichts unterscheidet.
 * Teile stehen mit „·“ hintereinander, etwa „2 Zellen geändert · Einstellungen
 * geändert“.
 */
export function tableChangesStatus(draft: TableModel, saved: TableModel): string | undefined {
  const parts: string[] = [];
  if (structureChanged(draft, saved)) {
    parts.push("Struktur geändert");
  } else {
    const cells = changedCells(draft, saved);
    if (cells > 0) parts.push(cellsText(cells));
  }
  if (settingsChanged(draft, saved)) parts.push("Einstellungen geändert");
  return parts.length === 0 ? undefined : parts.join(" · ");
}

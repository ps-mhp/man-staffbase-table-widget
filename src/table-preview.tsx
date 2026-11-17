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
 * Die Vorschau des Entwurfs in den Ansichten Desktop, Tablet und Mobil: die
 * echte Leseansicht (`TableWidget`), nicht eine Nachbildung – Einklappen,
 * Export-Leiste und erste Sortierung sehen aus wie auf der Seite.
 *
 * `TableWidget` taugt dafür ohne eigenen Vorschau-Schalter: es meldet sich
 * weder an `document` noch an `window` an, misst nichts auf der Seite und
 * lädt nur auf Klick herunter. Die Bühne ist `inert`, also gibt es keinen
 * Klick – kein Download, kein Umsortieren, kein Tab durch Knöpfe, die hier
 * nichts bedeuten.
 *
 * Grenze: Der Gerätrahmen ist kein iframe. Medienabfragen der Leseansicht
 * (`max-width: 767px`) fragen das Fenster des Studios, nicht den Rahmen; die
 * schmalen Zellpolster des Telefons zeigt „Mobil“ deshalb nicht. Die
 * Bilddeckelung hängt an Container-Abfragen und stimmt.
 */

import * as React from "react";
import { ReactElement, useMemo } from "react";

import { TableWidget } from "./table-widget";
import { TableModel, serializeTableModel } from "./table-model";

export interface TablePreviewProps {
  model: TableModel;
}

export function TablePreview({ model }: TablePreviewProps): ReactElement {
  // Das Attribut, wie es auf der Seite stünde – nur ohne Base64-Hülle, die
  // `parseTableModel` ohnehin nicht braucht.
  const tabledata = useMemo(() => serializeTableModel(model), [model]);
  // `TableWidget` übernimmt die erste Sortierung nur beim Einhängen (danach
  // gehört sie dem Leser). Ändert sie sich im Panel, hängt die Vorschau
  // deshalb neu ein.
  const sortKey = model.sort === null ? "none" : `${model.sort.col}:${model.sort.dir}`;

  return (
    <div inert data-testid="table-preview" className="p-6">
      {/* `contentLanguage` braucht der Typ; die Leseansicht liest sie nicht. */}
      <TableWidget key={sortKey} contentLanguage="de_DE" tabledata={tabledata} />
    </div>
  );
}

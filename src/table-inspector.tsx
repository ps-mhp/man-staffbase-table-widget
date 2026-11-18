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
 * Das Panel „Tabelle“ rechts im Rahmen: was für die ganze Tabelle gilt und
 * nicht an einer Markierung hängt – erste Sortierung, sichtbare Zeilen,
 * Export, Bilder anpassen. Aufgebaut wie im Screen: ein Abschnitt für die
 * Sortierung, darunter die Felder einzeln, kleine Wahlen als Pills, der
 * Schalter als Zeile mit Hinweis.
 *
 * Früher standen diese Schalter zwischen den Zellwerkzeugen in den Reitern
 * „Daten“ und „Bilder“. Dort sahen sie aus, als wirkten sie auf die
 * Markierung; hier stehen sie für sich und bleiben auch in der Vorschau
 * sichtbar, wo man ihre Wirkung sieht.
 */

import * as React from "react";
import { ReactElement, useId } from "react";
import { Field } from "@man/config-ui/form/field";
import { FormSection } from "@man/config-ui/form/form-section";
import { Segmented, SegmentedOption } from "@man/config-ui/form/segmented";
import { InspectorPanel } from "@man/config-ui/inspector/inspector-panel";
import { Input } from "@man/config-ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@man/config-ui/primitives/select";
import { Switch } from "@man/config-ui/primitives/switch";

import { richTextToPlain } from "./rich-text";
import { columnLetters } from "./selection";
import { ExportMode, SortSpec, TableModel, setExportMode, setFitImages, setSort, setVisibleRows } from "./table-model";

/** See `webpack.common.ts`; `release.sh` bumps it before building. */
declare const __WIDGET_VERSION__: string;

export interface TableInspectorProps {
  value: TableModel;
  onChange: (model: TableModel) => void;
}

/** Radix verlangt für jeden Eintrag einen nicht leeren Wert. */
const NO_SORT = "none";

const DIRECTIONS: readonly SegmentedOption<SortSpec["dir"]>[] = [
  { id: "asc", label: "Aufsteigend" },
  { id: "desc", label: "Absteigend" },
];

const EXPORT_OPTIONS: readonly SegmentedOption<ExportMode>[] = [
  { id: "off", label: "Aus" },
  { id: "all", label: "Ganze Tabelle" },
  { id: "select", label: "Mit Zeilenauswahl" },
];

/** Die Beschriftung eines Felds ohne `<label>`, etwa über einer Pill-Gruppe. */
const LABEL = "text-[13px] font-semibold text-foreground";
const HINT = "text-[13px] text-muted-foreground";

/** „B · Umsatz“: der Buchstabe findet die Spalte im Gitter, die Überschrift erklärt sie. */
function columnLabel(header: string | undefined, col: number): string {
  const text = richTextToPlain(header ?? "").trim();
  return text === "" ? `Spalte ${columnLetters(col)}` : `${columnLetters(col)} · ${text}`;
}

function SortSettings({ value, onChange }: TableInspectorProps): ReactElement {
  const { sort } = value;
  const headers = value.data[0] ?? [];
  const chooseColumn = (key: string): void =>
    onChange(setSort(value, key === NO_SORT ? null : { col: Number(key), dir: sort?.dir ?? "asc" }));

  return (
    <FormSection
      title="Erste Sortierung"
      description="So ist die Tabelle beim Öffnen sortiert; Leser sortieren per Klick auf eine Überschrift um."
    >
      <Select value={sort === null ? NO_SORT : String(sort.col)} onValueChange={chooseColumn}>
        <Field label="Spalte">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
        </Field>
        <SelectContent position="popper">
          <SelectItem value={NO_SORT}>Keine</SelectItem>
          {headers.map((header, col) => (
            <SelectItem key={col} value={String(col)}>
              {columnLabel(header, col)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {sort !== null && (
        <Segmented
          aria-label="Richtung der ersten Sortierung"
          className="self-start"
          options={DIRECTIONS}
          value={sort.dir}
          onChange={(dir) => onChange(setSort(value, { col: sort.col, dir }))}
        />
      )}
    </FormSection>
  );
}

function VisibleRowsField({ value, onChange }: TableInspectorProps): ReactElement {
  return (
    <Field className="max-w-[200px]" label="Sichtbare Zeilen" hint="0 zeigt alle Zeilen; sonst klappt der Rest hinter einem Button ein.">
      <Input
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value.visibleRows}
        onChange={(event) => {
          // Ein geleertes Feld liest sich als NaN. Als 0 genommen, schaltete
          // es das Einklappen mitten im Tippen still ab – also warten, bis
          // eine Zahl dasteht.
          const next = event.target.valueAsNumber;
          if (Number.isFinite(next)) onChange(setVisibleRows(value, next));
        }}
      />
    </Field>
  );
}

/**
 * Pills statt Auswahlliste: drei Wahlen, alle auf einen Blick. Wie jede
 * Pill-Gruppe im Panel so breit wie ihr Inhalt (`self-start`), nicht über
 * die ganze Spalte gezogen.
 */
function ExportField({ value, onChange }: TableInspectorProps): ReactElement {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span className={LABEL}>
        Export
      </span>
      <Segmented
        aria-label="Export"
        aria-describedby={`${id}-hint`}
        className="self-start"
        options={EXPORT_OPTIONS}
        value={value.exportMode}
        onChange={(mode) => onChange(setExportMode(value, mode))}
      />
      <p id={`${id}-hint`} className={HINT}>
        Download als Excel- oder CSV-Datei über der Tabelle. In der Staffbase-App wird der Export nicht angezeigt.
      </p>
    </div>
  );
}

/** Ein Schalter als Zeile: Name und Hinweis links, der Schalter rechts. */
function FitImagesRow({ value, onChange }: TableInspectorProps): ReactElement {
  const id = useId();
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span id={`${id}-label`} className="text-sm font-semibold text-foreground">
          Bilder anpassen
        </span>
        <span id={`${id}-hint`} className={HINT}>
          Begrenzt Bilder auf die Breite der Tabelle; aus: jedes Bild in eigener Größe.
        </span>
      </div>
      <Switch
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        checked={value.fitImages}
        onCheckedChange={(checked) => onChange(setFitImages(value, checked))}
      />
    </div>
  );
}

/** Die Einstellungen der ganzen Tabelle; jede Änderung geht als neues Modell an `onChange`. */
export function TableInspector({ value, onChange }: TableInspectorProps): ReactElement {
  return (
    <InspectorPanel title="Tabelle">
      <div className="flex flex-col gap-6">
        <SortSettings value={value} onChange={onChange} />
        <VisibleRowsField value={value} onChange={onChange} />
        <ExportField value={value} onChange={onChange} />
        <FitImagesRow value={value} onChange={onChange} />
        {/* Die Version stand früher unter dem Gitter; wer einen Fehler meldet,
            findet sie hier. */}
        <p className="text-xs text-muted-foreground">{`Version ${__WIDGET_VERSION__}`}</p>
      </div>
    </InspectorPanel>
  );
}

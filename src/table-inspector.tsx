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
 * Export, Bilder anpassen.
 *
 * Früher standen diese Schalter zwischen den Zellwerkzeugen in den Reitern
 * „Daten“ und „Bilder“. Dort sahen sie aus, als wirkten sie auf die
 * Markierung; hier stehen sie für sich und bleiben auch in der Vorschau
 * sichtbar, wo man ihre Wirkung sieht.
 */

import * as React from "react";
import { ReactElement } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { Field } from "@man/config-ui/form/field";
import { FormSection } from "@man/config-ui/form/form-section";
import { Segmented, SegmentedOption } from "@man/config-ui/form/segmented";
import { InspectorPanel } from "@man/config-ui/inspector/inspector-panel";
import { Input } from "@man/config-ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@man/config-ui/primitives/select";
import { Switch } from "@man/config-ui/primitives/switch";

import { richTextToPlain } from "./rich-text";
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
  { id: "asc", label: "Aufsteigend", icon: ArrowUpNarrowWide },
  { id: "desc", label: "Absteigend", icon: ArrowDownWideNarrow },
];

const EXPORT_OPTIONS: ReadonlyArray<{ id: ExportMode; label: string }> = [
  { id: "off", label: "Aus" },
  { id: "all", label: "Ganze Tabelle" },
  { id: "select", label: "Mit Zeilenauswahl" },
];

const isExportMode = (value: string): value is ExportMode => EXPORT_OPTIONS.some((option) => option.id === value);

/** „Spalte 2 · Umsatz“: die Nummer findet die Spalte im Gitter, die Überschrift erklärt sie. */
function columnLabel(header: string | undefined, col: number): string {
  const text = richTextToPlain(header ?? "").trim();
  return text === "" ? `Spalte ${col + 1}` : `Spalte ${col + 1} · ${text}`;
}

function SortSettings({ value, onChange }: TableInspectorProps): ReactElement {
  const { sort } = value;
  const headers = value.data[0] ?? [];
  const chooseColumn = (key: string): void =>
    onChange(setSort(value, key === NO_SORT ? null : { col: Number(key), dir: sort?.dir ?? "asc" }));

  return (
    <FormSection title="Sortierung">
      <Select value={sort === null ? NO_SORT : String(sort.col)} onValueChange={chooseColumn}>
        <Field
          label="Erste Sortierung"
          hint="So ist die Tabelle beim Öffnen sortiert. Leser sortieren per Klick auf eine Überschrift um; die Kopfzeile bleibt oben."
        >
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
    <Field
      label="Sichtbare Zeilen"
      hint="Datenzeilen, die die Seite zeigt, bevor die Tabelle hinter einem Button einklappt. 0 zeigt alle Zeilen."
    >
      <Input
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        className="w-28"
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

function ExportField({ value, onChange }: TableInspectorProps): ReactElement {
  return (
    <Select
      value={value.exportMode}
      onValueChange={(mode) => {
        if (isExportMode(mode)) onChange(setExportMode(value, mode));
      }}
    >
      <Field
        label="Export"
        hint="Download als Excel- oder CSV-Datei über der Tabelle. In der Staffbase-App wird der Export nicht angezeigt."
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
      </Field>
      <SelectContent position="popper">
        {EXPORT_OPTIONS.map(({ id, label }) => (
          <SelectItem key={id} value={id}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PageSettings({ value, onChange }: TableInspectorProps): ReactElement {
  return (
    <FormSection title="Auf der Seite">
      <VisibleRowsField value={value} onChange={onChange} />
      <ExportField value={value} onChange={onChange} />
      <Field
        label="Bilder anpassen"
        hint="Begrenzt Bilder auf die Breite der Tabelle. Ausgeschaltet erscheint jedes Bild in seiner eigenen Größe."
      >
        <Switch checked={value.fitImages} onCheckedChange={(checked) => onChange(setFitImages(value, checked))} />
      </Field>
    </FormSection>
  );
}

/** Die Einstellungen der ganzen Tabelle; jede Änderung geht als neues Modell an `onChange`. */
export function TableInspector({ value, onChange }: TableInspectorProps): ReactElement {
  return (
    <InspectorPanel title="Tabelle">
      <div className="flex flex-col gap-6">
        <SortSettings value={value} onChange={onChange} />
        <PageSettings value={value} onChange={onChange} />
        {/* Die Version stand früher unter dem Gitter; wer einen Fehler meldet,
            findet sie hier. */}
        <p className="text-xs text-muted-foreground">{`Version ${__WIDGET_VERSION__}`}</p>
      </div>
    </InspectorPanel>
  );
}

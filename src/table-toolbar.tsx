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

import * as React from "react";
import { ReactElement, useRef } from "react";
import { Button } from "@man/config-ui/primitives/button";
import { ToolTab, ToolTabs } from "@man/config-ui/toolbar/tool-tabs";

import { TabId, TableToolbarProps } from "./toolbar/props";
import { AlignTab } from "./toolbar/tab-align";
import { CellsTab } from "./toolbar/tab-cells";
import { DataTab } from "./toolbar/tab-data";
import { FontTab } from "./toolbar/tab-font";
import { ImagesTab } from "./toolbar/tab-images";

export type { TableToolbarProps };

const TABS: readonly ToolTab<TabId>[] = [
  { id: "font", label: "Schrift" },
  { id: "align", label: "Ausrichtung" },
  { id: "cells", label: "Zellen" },
  { id: "images", label: "Bilder" },
  { id: "data", label: "Daten" },
  { id: "elements", label: "Icons" },
];

function ActiveTab({ tab, props }: { tab: TabId; props: TableToolbarProps }): ReactElement {
  switch (tab) {
    case "align":
      return <AlignTab {...props} />;
    case "cells":
      return <CellsTab {...props} />;
    case "images":
      return <ImagesTab {...props} />;
    case "data":
      return <DataTab {...props} />;
    case "elements":
      return <>{props.elementsToolbar}</>;
    default:
      return <FontTab {...props} />;
  }
}

/**
 * „Importieren“ rechts neben den Reitern: ersetzt die ganze Tabelle und hängt
 * deshalb an keinem Reiter, der von einer Markierung handelt.
 */
function ImportButton({ onUpload }: Pick<TableToolbarProps, "onUpload">): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.target.value = "";
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-3 text-[13px] font-semibold text-primary hover:text-primary motion-reduce:transition-none"
        data-testid="toolbar-upload-button"
        title="Tabelle hochladen (.csv, .xlsx) – ersetzt den Inhalt"
        onClick={() => fileInputRef.current?.click()}
      >
        Importieren (.csv, .xlsx)
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        tabIndex={-1}
        data-testid="toolbar-upload"
        aria-label="Tabelle hochladen"
        onChange={handleFile}
        className="hidden"
      />
    </>
  );
}

/**
 * The editor's toolbar: five tabs, each with its row of controls, and the
 * import next to the tabs.
 *
 * Every control is a projection of the props — the only state here is which
 * tab is open. The tab deliberately does not follow the selection: an author
 * who opened "Bilder" keeps working on images while clicking through cells.
 */
export const TableToolbar = (props: TableToolbarProps): ReactElement => {
  return (
    <ToolTabs aria-label="Werkzeuggruppen" tabs={TABS} value={props.tab} onChange={props.onTabChange} actions={<ImportButton onUpload={props.onUpload} />}>
      <ActiveTab tab={props.tab} props={props} />
    </ToolTabs>
  );
};

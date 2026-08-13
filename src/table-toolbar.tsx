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

import * as React from "react";
import { ReactElement, useState } from "react";

import { RibbonShell, RibbonTab } from "./toolbar/ribbon-shell";
import { TabId, TableToolbarProps } from "./toolbar/props";
import { AlignTab } from "./toolbar/tab-align";
import { CellsTab } from "./toolbar/tab-cells";
import { DataTab } from "./toolbar/tab-data";
import { FontTab } from "./toolbar/tab-font";
import { ImagesTab } from "./toolbar/tab-images";

export type { TableToolbarProps };

/**
 * The editor's toolbar: a save button beside five tabs.
 *
 * Every control is a projection of the props — the only state here is which
 * tab is open. The tab deliberately does not follow the selection: an author
 * who opened "Bilder" keeps working on images while clicking through cells.
 */
export const TableToolbar = (props: TableToolbarProps): ReactElement => {
  const [tab, setTab] = useState<TabId>("font");

  const tabs: RibbonTab[] = [
    { id: "font", label: "Schrift", render: () => <FontTab {...props} /> },
    { id: "align", label: "Ausrichtung", render: () => <AlignTab {...props} /> },
    { id: "cells", label: "Zellen", render: () => <CellsTab {...props} /> },
    { id: "images", label: "Bilder", render: () => <ImagesTab {...props} /> },
    { id: "data", label: "Daten", render: () => <DataTab {...props} /> },
  ];

  return (
    <RibbonShell
      tabs={tabs}
      activeTab={tab}
      onSelectTab={(id) => setTab(id as TabId)}
      onSave={props.onSave}
      onClose={props.onClose}
      dirty={props.dirty}
    />
  );
};

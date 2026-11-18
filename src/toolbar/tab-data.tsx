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
import { ReactElement } from "react";
import { Paintbrush, RemoveFormatting } from "lucide-react";
import { ToolButton } from "@man/config-ui/toolbar/tool-button";
import { ToolMenu, ToolMenuItem } from "@man/config-ui/toolbar/tool-menu";
import { Toolbar } from "@man/config-ui/toolbar/toolbar";

import { TableToolbarProps } from "./props";

export type DataTabProps = Pick<
  TableToolbarProps,
  "hasSelection" | "painterActive" | "onCopyFormat" | "onClearFormatting" | "hasClearTarget"
>;

/**
 * Formatierung übertragen und zurücksetzen. Importieren steht rechts neben
 * den Reitern; erste Sortierung, sichtbare Zeilen und Export sind
 * Einstellungen der ganzen Tabelle und stehen im Panel „Tabelle“ rechts.
 */
export function DataTab({
  hasSelection,
  painterActive,
  onCopyFormat,
  onClearFormatting,
  hasClearTarget,
}: DataTabProps): ReactElement {
  const suffix = hasClearTarget ? "der Markierung" : "der ganzen Tabelle";

  return (
    <Toolbar aria-label="Daten">
      {/* Gedrückt, solange der Format-Pinsel auf seine Zielzellen wartet. */}
      <ToolButton
        data-testid="toolbar-painter"
        label="Format kopieren"
        icon={Paintbrush}
        pressed={painterActive}
        disabled={!hasSelection && !painterActive}
        onClick={onCopyFormat}
      >
        Format
      </ToolButton>
      <ToolMenu
        testId="toolbar-clear-format"
        label="Formatierung entfernen"
        title={
          hasClearTarget
            ? "Formatierung der Markierung entfernen"
            : "Formatierung der ganzen Tabelle entfernen (nichts markiert)"
        }
        icon={RemoveFormatting}
        text="Formatierung"
      >
        {(close) => (
          <>
            <ToolMenuItem data-testid="toolbar-clear-format-all" onClick={() => { onClearFormatting("all"); close(); }}>
              {`Alles entfernen (${suffix})`}
            </ToolMenuItem>
            <ToolMenuItem data-testid="toolbar-clear-format-text" onClick={() => { onClearFormatting("text"); close(); }}>
              Nur Textformatierung entfernen
            </ToolMenuItem>
            <ToolMenuItem data-testid="toolbar-clear-format-images" onClick={() => { onClearFormatting("images"); close(); }}>
              Nur Bildgrößen zurücksetzen
            </ToolMenuItem>
          </>
        )}
      </ToolMenu>
    </Toolbar>
  );
}

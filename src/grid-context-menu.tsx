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
 * Das Kontextmenü des Gitters (Rechtsklick). Escape schließt es über Radix:
 * dessen Listener nimmt die Taste vor dem Rahmen weg (`preventDefault`), der
 * Rahmen lässt sie dann liegen.
 */

import * as React from "react";
import { ReactElement } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { ChevronRight } from "lucide-react";

import { CellFormat } from "./table-model";

const MENU_ITEM = "table-editor__menu-item";

/** Der Pfeil eines Untermenüs, rechts am Eintrag. */
const SubChevron = (): ReactElement => <ChevronRight aria-hidden className="table-editor__menu-chevron" />;

/** A Radix context-menu item with the shared styling. */
function MenuItem({
  children,
  onSelect,
  disabled,
  testId,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  testId?: string;
}): ReactElement {
  return (
    <ContextMenu.Item
      disabled={disabled}
      data-testid={testId}
      className={`${MENU_ITEM}${disabled ? ` ${MENU_ITEM}--disabled` : ""}`}
      onSelect={onSelect}
    >
      {children}
    </ContextMenu.Item>
  );
}

const Separator = (): ReactElement => <ContextMenu.Separator className="table-editor__menu-separator" />;

export interface GridMenuActions {
  insertRowAbove: () => void;
  insertRowBelow: () => void;
  insertColLeft: () => void;
  insertColRight: () => void;
  deleteRows: () => void;
  deleteCols: () => void;
  merge: () => void;
  unmerge: () => void;
  insertImage: () => void;
  /** Öffnet den Element Explorer für die Markierung. */
  insertElement: () => void;
  toggle: (key: "bold" | "italic" | "underline" | "strikethrough") => void;
  format: (patch: CellFormat) => void;
  sort: (dir: "asc" | "desc") => void;
  clearSort: () => void;
}

interface SubMenuProps {
  container: HTMLElement | null | undefined;
  actions: GridMenuActions;
  disabled: boolean;
}

function TextOptions({ container, actions }: SubMenuProps): ReactElement {
  const { toggle, format } = actions;
  return (
    <ContextMenu.Sub>
      <ContextMenu.SubTrigger className={MENU_ITEM} data-testid="text-options">Textoptionen<SubChevron /></ContextMenu.SubTrigger>
      <ContextMenu.Portal container={container}>
        <ContextMenu.SubContent className="table-editor__menu">
          <MenuItem testId="fmt-bold" onSelect={() => toggle("bold")}>Fett</MenuItem>
          <MenuItem testId="fmt-italic" onSelect={() => toggle("italic")}>Kursiv</MenuItem>
          <MenuItem testId="fmt-underline" onSelect={() => toggle("underline")}>Unterstrichen</MenuItem>
          <MenuItem testId="fmt-strike" onSelect={() => toggle("strikethrough")}>Durchgestrichen</MenuItem>
          <Separator />
          <MenuItem testId="align-left" onSelect={() => format({ align: "left" })}>Linksbündig</MenuItem>
          <MenuItem testId="align-center" onSelect={() => format({ align: "center" })}>Zentriert</MenuItem>
          <MenuItem testId="align-right" onSelect={() => format({ align: "right" })}>Rechtsbündig</MenuItem>
          <Separator />
          <MenuItem testId="valign-top" onSelect={() => format({ valign: "top" })}>Oben ausrichten</MenuItem>
          <MenuItem testId="valign-middle" onSelect={() => format({ valign: "middle" })}>Mittig ausrichten</MenuItem>
          <MenuItem testId="valign-bottom" onSelect={() => format({ valign: "bottom" })}>Unten ausrichten</MenuItem>
        </ContextMenu.SubContent>
      </ContextMenu.Portal>
    </ContextMenu.Sub>
  );
}

/** Setzt die erste Sortierung wie das Panel „Tabelle“ – hier nach der Spalte unter der Maus. */
function SortOptions({ container, actions, disabled }: SubMenuProps): ReactElement {
  return (
    <ContextMenu.Sub>
      <ContextMenu.SubTrigger className={MENU_ITEM} data-testid="sort-options">Sortierung<SubChevron /></ContextMenu.SubTrigger>
      <ContextMenu.Portal container={container}>
        <ContextMenu.SubContent className="table-editor__menu">
          <MenuItem testId="sort-asc" onSelect={() => actions.sort("asc")} disabled={disabled}>Aufsteigend (diese Spalte)</MenuItem>
          <MenuItem testId="sort-desc" onSelect={() => actions.sort("desc")} disabled={disabled}>Absteigend (diese Spalte)</MenuItem>
          <MenuItem testId="sort-clear" onSelect={actions.clearSort}>Sortierung entfernen</MenuItem>
        </ContextMenu.SubContent>
      </ContextMenu.Portal>
    </ContextMenu.Sub>
  );
}

export interface GridContextMenuProps {
  /**
   * Where the menus go: next to the editor in the config modal's shadow root,
   * with the editor's stylesheet — not `document.body`, where they would be
   * unstyled and every click in them would close the Studio's dialog.
   */
  container: HTMLElement | null | undefined;
  hasSelection: boolean;
  actions: GridMenuActions;
}

export function GridContextMenu({ container, hasSelection, actions }: GridContextMenuProps): ReactElement {
  const disabled = !hasSelection;
  return (
    <ContextMenu.Portal container={container}>
      <ContextMenu.Content className="table-editor__menu" data-testid="table-editor-menu">
        <MenuItem testId="insert-row-above" onSelect={actions.insertRowAbove} disabled={disabled}>Zeile oberhalb einfügen</MenuItem>
        <MenuItem testId="insert-row-below" onSelect={actions.insertRowBelow} disabled={disabled}>Zeile unterhalb einfügen</MenuItem>
        <MenuItem testId="insert-col-left" onSelect={actions.insertColLeft} disabled={disabled}>Spalte links einfügen</MenuItem>
        <MenuItem testId="insert-col-right" onSelect={actions.insertColRight} disabled={disabled}>Spalte rechts einfügen</MenuItem>
        <Separator />
        <MenuItem testId="delete-rows" onSelect={actions.deleteRows} disabled={disabled}>Zeile(n) löschen</MenuItem>
        <MenuItem testId="delete-cols" onSelect={actions.deleteCols} disabled={disabled}>Spalte(n) löschen</MenuItem>
        <Separator />
        <MenuItem testId="merge-cells" onSelect={actions.merge} disabled={disabled}>Zellen verbinden</MenuItem>
        <MenuItem testId="unmerge-cells" onSelect={actions.unmerge} disabled={disabled}>Verbindung aufheben</MenuItem>
        <Separator />
        <MenuItem testId="insert-image" onSelect={actions.insertImage} disabled={disabled}>Bild einfügen…</MenuItem>
        <MenuItem testId="insert-element" onSelect={actions.insertElement} disabled={disabled}>Element einfügen…</MenuItem>
        <Separator />
        <TextOptions container={container} actions={actions} disabled={disabled} />
        <SortOptions container={container} actions={actions} disabled={disabled} />
      </ContextMenu.Content>
    </ContextMenu.Portal>
  );
}

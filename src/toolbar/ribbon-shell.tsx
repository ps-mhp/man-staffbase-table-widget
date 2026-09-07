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

import { IconSave } from "./icons";
import ribbonCss from "../styles/ribbon.scss";
import { useHotStyle } from "@shared/hot-style";
import { Icon, Tabs, TabItem, useEditorStyles } from "@shared/editor-ui";

export interface RibbonTab {
  id: string;
  label: string;
  render: () => React.ReactNode;
}

export interface RibbonShellProps {
  tabs: RibbonTab[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  /** Omitted where the editor is not shown in a dialog that can be saved. */
  onSave?: () => void;
  /** Omitted with `onSave`; closing is the dialog's business, not the grid's. */
  onClose?: () => void;
  /** Shows that the draft holds edits the form field has not seen yet. */
  dirty?: boolean;
  /** Opens the help drawer over the grid. Independent of `onSave`/`onClose`. */
  onOpenHelp?: () => void;
}

/**
 * The toolbar's frame: a control bar with the dialog's buttons, the tab strip
 * below it, and the active tab's panel underneath.
 *
 * Nothing here writes to the widget's configuration: "Speichern" hands the
 * draft over, "Schließen" leaves it be. The note beside them is the only
 * clue that the two differ, so it stays visible for as long as they do.
 *
 * Only the active panel is rendered. Keeping the inactive ones mounted but
 * hidden would leave their buttons in the tab order, so a keyboard user would
 * walk through controls they cannot see.
 */
export function RibbonShell({ tabs, activeTab, onSelectTab, onSave, onClose, dirty, onOpenHelp }: RibbonShellProps): ReactElement {
  const hotRibbonCss = useHotStyle(ribbonCss, "table-widget", "styles/ribbon.scss");
  // Lädt das Stylesheet der Redaktionsebene (`Tabs` u.a.) referenzgezählt in
  // `document.head`. Das kollidiert nicht mit dem eigenen `<style>`-Blatt des
  // Editors weiter unten im Baum (siehe `table-editor.tsx`): jenes vermeidet
  // `document.head` nur, um beim Aushängen nichts im fremden Wirtsdokument zu
  // hinterlassen — genau das leistet `useEditorStyles()` selbst, durch seine
  // Referenzzählung.
  useEditorStyles();
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  const tabItems: readonly TabItem[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    // Ein Klick auf einen Reiter darf der gerade bearbeiteten
    // `contenteditable`-Zelle nicht den Fokus (und damit die native
    // Text-Selektion) nehmen — derselbe Grund wie bei `RibbonButton`
    // (`controls.tsx`). Beim Umbau auf die Primitive `Tabs` ging das
    // verloren; die Primitive trägt seither `TabItem.onMouseDown` genau für
    // diesen Fall (siehe `@shared/editor-ui`, Befund C3, Aufgabe 12).
    onMouseDown: (e) => e.preventDefault(),
  }));

  return (
    <div className="tw-rb" data-testid="table-toolbar">
      <style>{hotRibbonCss}</style>

      {(onSave || onOpenHelp) && (
        <div className="tw-rb__controls">
          {onSave && (
            <button
              type="button"
              className="tw-rb__ctl tw-rb__ctl--primary"
              data-testid="toolbar-done"
              title="Speichern"
              onClick={onSave}
            >
              <IconSave />
            </button>
          )}
          <div className="tw-rb__title" data-testid="toolbar-title">
            MAN Table Editor
          </div>
          {onOpenHelp && (
            <button
              type="button"
              className="tw-rb__ctl tw-rb__ctl-help"
              data-testid="toolbar-help"
              title="Hilfe"
              onClick={onOpenHelp}
            >
              <Icon name="info" size="md" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              className="tw-rb__ctl tw-rb__ctl-close"
              data-testid="toolbar-close"
              title="Schließen"
              onClick={onClose}
            >
              <Icon name="close" size="md" />
            </button>
          )}
          {dirty && (
            <span className="tw-rb__dirty" data-testid="toolbar-dirty">
              Ungespeicherte Änderungen
            </span>
          )}
        </div>
      )}

      <div className="tw-rb__tabs">
        <div className="tw-rb__tablist">
          <Tabs items={tabItems} activeId={active.id} onActiveIdChange={onSelectTab} label="Werkzeuggruppen" />
        </div>

        <div
          role="tabpanel"
          id={`${active.id}-panel`}
          aria-labelledby={`${active.id}-tab`}
          className="tw-rb__panel"
          data-testid="toolbar-panel"
        >
          {active.render()}
        </div>
      </div>
    </div>
  );
}

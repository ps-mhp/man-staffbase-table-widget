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
import { ReactElement } from "react";

import { IconClose, IconSave } from "./icons";
import { RIBBON_CSS } from "./ribbon-css";

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
export function RibbonShell({ tabs, activeTab, onSelectTab, onSave, onClose, dirty }: RibbonShellProps): ReactElement {
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  const onKeyDown = (event: React.KeyboardEvent): void => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === active.id);
    onSelectTab(tabs[(index + step + tabs.length) % tabs.length].id);
  };

  return (
    <div className="tw-rb" data-testid="table-toolbar">
      <style>{RIBBON_CSS}</style>

      {onSave && (
        <div className="tw-rb__controls">
          <button
            type="button"
            className="tw-rb__ctl tw-rb__ctl--primary"
            data-testid="toolbar-done"
            title="Speichern"
            onClick={onSave}
          >
            <IconSave />
          </button>
          <button
            type="button"
            className="tw-rb__ctl"
            data-testid="toolbar-close"
            title="Schließen"
            onClick={onClose}
          >
            <IconClose />
          </button>
          {dirty && (
            <span className="tw-rb__dirty" data-testid="toolbar-dirty">
              Ungespeicherte Änderungen
            </span>
          )}
        </div>
      )}

      <div className="tw-rb__tabs">
        <div className="tw-rb__tablist" role="tablist" aria-label="Werkzeuggruppen" onKeyDown={onKeyDown}>
          {tabs.map((tab) => {
            const selected = tab.id === active.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tw-rb-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`tw-rb-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                className={`tw-rb__tab${selected ? " tw-rb__tab--active" : ""}`}
                data-testid={`toolbar-tab-${tab.id}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelectTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`tw-rb-panel-${active.id}`}
          aria-labelledby={`tw-rb-tab-${active.id}`}
          className="tw-rb__panel"
          data-testid="toolbar-panel"
        >
          {active.render()}
        </div>
      </div>
    </div>
  );
}

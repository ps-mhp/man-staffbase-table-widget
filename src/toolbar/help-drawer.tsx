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
import { ReactElement, useEffect } from "react";

import helpDrawerCss from "../styles/help-drawer.scss";
import { IconClose } from "./icons";
import { HelpTab } from "./tab-help";
import { useHotStyle } from "@shared/hot-style";

export interface HelpDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The help drawer: opens as its own column beside the grid, which shrinks to
 * make room — not an overlay, so the author keeps working in the table while
 * it's open. It is mounted next to the grid, not inside `RibbonShell`,
 * because that's the box it shares space with; the toolbar only triggers it.
 *
 * Kept mounted while closed (`open: false`) with a collapsed width rather
 * than unmounted, so the open/close transition has something to animate.
 */
export function HelpDrawer({ open, onClose }: HelpDrawerProps): ReactElement {
  const hotHelpDrawerCss = useHotStyle(helpDrawerCss, "table-widget", "styles/help-drawer.scss");
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div className={`tw-rb__help-drawer${open ? " tw-rb__help-drawer--open" : ""}`}>
      <style>{hotHelpDrawerCss}</style>
      <div
        className="tw-rb__help-drawer-inner"
        role="complementary"
        aria-label="Hilfe"
        aria-hidden={!open}
        data-testid="help-drawer"
      >
        <div className="tw-rb__help-drawer-header">
          <h2 className="tw-rb__help-drawer-title">Hilfe</h2>
          <button
            type="button"
            className="tw-rb__help-drawer-close"
            data-testid="help-drawer-close"
            title="Hilfe schließen"
            onClick={onClose}
          >
            <IconClose />
          </button>
        </div>
        <div className="tw-rb__help-drawer-body">
          <HelpTab />
        </div>
      </div>
    </div>
  );
}

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
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
} from "lucide-react";
import { ToolButton } from "@man/config-ui/toolbar/tool-button";
import { ToolSeparator, Toolbar } from "@man/config-ui/toolbar/toolbar";

import { TableToolbarProps } from "./props";

export type AlignTabProps = Pick<
  TableToolbarProps,
  "hasSelection" | "activeFormat" | "onAlign" | "onVerticalAlign"
>;

/** Where the content sits inside its cell, horizontally and vertically. */
export function AlignTab({
  hasSelection,
  activeFormat,
  onAlign,
  onVerticalAlign,
}: AlignTabProps): ReactElement {
  const disabled = !hasSelection;

  return (
    <Toolbar aria-label="Ausrichtung">
      <ToolButton data-testid="toolbar-align-left" label="Linksbündig" icon={AlignLeft} disabled={disabled} pressed={activeFormat.align === "left"} onClick={() => onAlign("left")} />
      <ToolButton data-testid="toolbar-align-center" label="Zentriert" icon={AlignCenter} disabled={disabled} pressed={activeFormat.align === "center"} onClick={() => onAlign("center")} />
      <ToolButton data-testid="toolbar-align-right" label="Rechtsbündig" icon={AlignRight} disabled={disabled} pressed={activeFormat.align === "right"} onClick={() => onAlign("right")} />
      <ToolSeparator />
      <ToolButton data-testid="toolbar-valign-top" label="Oben ausrichten" icon={AlignVerticalJustifyStart} disabled={disabled} pressed={activeFormat.valign === "top"} onClick={() => onVerticalAlign("top")} />
      <ToolButton data-testid="toolbar-valign-middle" label="Mittig ausrichten" icon={AlignVerticalJustifyCenter} disabled={disabled} pressed={activeFormat.valign === "middle"} onClick={() => onVerticalAlign("middle")} />
      <ToolButton data-testid="toolbar-valign-bottom" label="Unten ausrichten" icon={AlignVerticalJustifyEnd} disabled={disabled} pressed={activeFormat.valign === "bottom"} onClick={() => onVerticalAlign("bottom")} />
    </Toolbar>
  );
}

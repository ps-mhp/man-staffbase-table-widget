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

import { RibbonButton } from "./controls";
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconVAlignBottom,
  IconVAlignMiddle,
  IconVAlignTop,
} from "./icons";
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
    <div className="tw-rb__rows">
      <div className="tw-rb__row">
        <RibbonButton testId="toolbar-align-left" variant="icon" title="Linksbündig" disabled={disabled} active={activeFormat.align === "left"} onClick={() => onAlign("left")}>
          <IconAlignLeft />
        </RibbonButton>
        <RibbonButton testId="toolbar-align-center" variant="icon" title="Zentriert" disabled={disabled} active={activeFormat.align === "center"} onClick={() => onAlign("center")}>
          <IconAlignCenter />
        </RibbonButton>
        <RibbonButton testId="toolbar-align-right" variant="icon" title="Rechtsbündig" disabled={disabled} active={activeFormat.align === "right"} onClick={() => onAlign("right")}>
          <IconAlignRight />
        </RibbonButton>
        <RibbonButton testId="toolbar-valign-top" variant="icon" title="Oben ausrichten" disabled={disabled} active={activeFormat.valign === "top"} onClick={() => onVerticalAlign("top")}>
          <IconVAlignTop />
        </RibbonButton>
        <RibbonButton testId="toolbar-valign-middle" variant="icon" title="Mittig ausrichten" disabled={disabled} active={activeFormat.valign === "middle"} onClick={() => onVerticalAlign("middle")}>
          <IconVAlignMiddle />
        </RibbonButton>
        <RibbonButton testId="toolbar-valign-bottom" variant="icon" title="Unten ausrichten" disabled={disabled} active={activeFormat.valign === "bottom"} onClick={() => onVerticalAlign("bottom")}>
          <IconVAlignBottom />
        </RibbonButton>
      </div>
    </div>
  );
}

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

/**
 * Whether a widget instance also keeps its table as translatable child content.
 *
 *  - `attribute` — the `tabledata` attribute only. What the widget always did.
 *    Survives everything except the translation pipeline, which neither
 *    translates it nor re-escapes its quotes.
 *  - `slots` — additionally writes the table as child nodes of the widget
 *    element, the shape Staffbase's own widgets use and the only one the
 *    translation touches.
 *
 * Reading never depends on the mode alone: slots win where they exist, the
 * attribute is always the fallback. A mode must never be able to blank the
 * page, so the question "which form was actually used?" is answered by the
 * `data-table-source` attribute the widget renders, not by a missing table.
 *
 * The attribute keeps being written in `slots` mode on purpose. If it turns out
 * that the editor does not persist child nodes, it is the only thing standing
 * between an author and permanent data loss.
 */
export const TABLE_MODES = ["attribute", "slots"] as const;

export type TableMode = (typeof TABLE_MODES)[number];

/**
 * Default for instances without the attribute — i.e. everything created before
 * the switch existed. Deliberately the old behaviour, so nothing changes until
 * an author opts in.
 */
export const DEFAULT_TABLE_MODE: TableMode = "attribute";

/**
 * Accepted but no longer offered: an earlier revision had a third option that
 * wrote both forms, which is what `slots` does anyway. Instances saved with it
 * keep working.
 */
const LEGACY_BOTH = "both";

export const isTableMode = (value: unknown): value is TableMode =>
  typeof value === "string" && (TABLE_MODES as readonly string[]).includes(value);

export const asTableMode = (value: unknown): TableMode => {
  if (value === LEGACY_BOTH) return "slots";
  return isTableMode(value) ? value : DEFAULT_TABLE_MODE;
};

/** True when this mode writes the table as translatable child content. */
export const writesSlots = (mode: TableMode): boolean => mode === "slots";

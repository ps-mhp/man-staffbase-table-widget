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

import { fillFromEdge, gridKeyAction, moveCell } from "./grid-keys";
import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
import { TableModel } from "./table-model";

const key = (k: string, mods: Partial<{ shift: boolean; alt: boolean; ctrl: boolean; meta: boolean }> = {}) => ({
  key: k,
  shiftKey: mods.shift ?? false,
  altKey: mods.alt ?? false,
  ctrlKey: mods.ctrl ?? false,
  metaKey: mods.meta ?? false,
});

const model = (): TableModel => ({
  data: Array.from({ length: 4 }, () => ["", "", "", ""]),
  merges: [{ row: 1, col: 1, rowSpan: 2, colSpan: 2 }],
  formats: {},
  sort: null,
  fitImages: true,
  visibleRows: DEFAULT_VISIBLE_ROWS,
  exportMode: "off",
});

describe("gridKeyAction", () => {
  it.each([
    [key("ArrowDown"), { type: "move", dir: "down", extend: false, jump: false }],
    [key("ArrowLeft", { shift: true }), { type: "move", dir: "left", extend: true, jump: false }],
    [key("ArrowRight", { meta: true }), { type: "move", dir: "right", extend: false, jump: true }],
    [key("Tab"), { type: "move", dir: "right", extend: false, jump: false }],
    [key("Tab", { shift: true }), { type: "move", dir: "left", extend: false, jump: false }],
    [key("Enter"), { type: "move", dir: "down", extend: false, jump: false }],
    [key("Enter", { shift: true }), { type: "move", dir: "up", extend: false, jump: false }],
    [key("Delete"), { type: "clear" }],
    [key("Backspace"), { type: "clear" }],
    [key("F2"), { type: "edit" }],
    [key("ä"), { type: "type", text: "ä" }],
    [key("A", { shift: true }), { type: "type", text: "A" }],
    [key(" ", { shift: true }), { type: "selectRow" }],
    [key(" ", { ctrl: true }), { type: "selectColumn" }],
    [key("a", { meta: true }), { type: "selectAll" }],
    [key("b", { ctrl: true }), { type: "format", key: "bold" }],
    [key("c", { meta: true }), { type: "copy" }],
    [key("x", { meta: true }), { type: "cut" }],
    [key("v", { meta: true }), { type: "paste" }],
    [key("d", { meta: true }), { type: "fill", dir: "down" }],
    [key("r", { meta: true }), { type: "fill", dir: "right" }],
    [key("Home"), { type: "home", toStart: false }],
    [key("Home", { meta: true }), { type: "home", toStart: true }],
  ])("%j → %j", (event, action) => {
    expect(gridKeyAction(event)).toEqual(action);
  });

  it.each([key("Escape"), key("Shift", { shift: true }), key("z", { meta: true }), key("s", { meta: true }), key("c", { alt: true })])(
    "lässt %j dem Rahmen oder Browser",
    (event) => {
      expect(gridKeyAction(event)).toBeNull();
    },
  );
});

describe("moveCell", () => {
  it("wandert über verbundene Zellen hinweg und landet auf deren Anker", () => {
    expect(moveCell(model(), [0, 1], "down", false)).toEqual([1, 1]);
    expect(moveCell(model(), [1, 1], "down", false)).toEqual([3, 1]);
    expect(moveCell(model(), [1, 1], "right", false)).toEqual([1, 3]);
    expect(moveCell(model(), [2, 0], "right", false)).toEqual([1, 1]);
  });

  it("bleibt am Rand stehen und springt mit ⌘ bis dorthin", () => {
    expect(moveCell(model(), [0, 0], "up", false)).toEqual([0, 0]);
    expect(moveCell(model(), [0, 0], "down", true)).toEqual([3, 0]);
    expect(moveCell(model(), [3, 3], "left", true)).toEqual([3, 0]);
  });
});

describe("fillFromEdge", () => {
  it("füllt aus der ersten Zeile oder, bei einer Zeile, aus der darüber", () => {
    expect(fillFromEdge({ top: 1, left: 0, bottom: 3, right: 1 }, "down")).toEqual({
      source: { top: 1, left: 0, bottom: 1, right: 1 },
      extension: { top: 2, left: 0, bottom: 3, right: 1 },
    });
    expect(fillFromEdge({ top: 2, left: 0, bottom: 2, right: 0 }, "down")?.source).toEqual({ top: 1, left: 0, bottom: 1, right: 0 });
    expect(fillFromEdge({ top: 0, left: 0, bottom: 0, right: 0 }, "down")).toBeNull();
    expect(fillFromEdge({ top: 0, left: 1, bottom: 0, right: 1 }, "right")?.source).toEqual({ top: 0, left: 0, bottom: 0, right: 0 });
  });
});

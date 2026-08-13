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
import { fireEvent, render, screen } from "@testing-library/react";

import { RibbonShell } from "./ribbon-shell";

const tabs = [
  { id: "a", label: "Alpha", render: () => <button data-testid="in-alpha">A</button> },
  { id: "b", label: "Beta", render: () => <button data-testid="in-beta">B</button> },
];

function Harness({ onDone }: { onDone?: () => void }): React.ReactElement {
  const [active, setActive] = React.useState("a");
  return <RibbonShell tabs={tabs} activeTab={active} onSelectTab={setActive} onDone={onDone} />;
}

describe("RibbonShell", () => {
  it("shows only the active tab's panel", () => {
    render(<Harness />);
    expect(screen.getByTestId("in-alpha")).toBeInTheDocument();
    expect(screen.queryByTestId("in-beta")).not.toBeInTheDocument();
  });

  it("switches panels when another tab is clicked", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("tab", { name: "Beta" }));
    expect(screen.getByTestId("in-beta")).toBeInTheDocument();
    expect(screen.queryByTestId("in-alpha")).not.toBeInTheDocument();
  });

  it("marks the active tab for assistive technology", () => {
    render(<Harness />);
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveAttribute("aria-selected", "false");
  });

  it("moves between tabs with the arrow keys and wraps around", () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "Alpha" }), { key: "ArrowRight" });
    expect(screen.getByTestId("in-beta")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Beta" }), { key: "ArrowRight" });
    expect(screen.getByTestId("in-alpha")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Alpha" }), { key: "ArrowLeft" });
    expect(screen.getByTestId("in-beta")).toBeInTheDocument();
  });

  it("shows the save button next to the tabs and calls back", () => {
    const onDone = jest.fn();
    render(<Harness onDone={onDone} />);
    fireEvent.click(screen.getByTestId("toolbar-done"));
    expect(onDone).toHaveBeenCalled();
  });

  it("omits the save button when no callback is given", () => {
    render(<Harness />);
    expect(screen.queryByTestId("toolbar-done")).not.toBeInTheDocument();
  });
});

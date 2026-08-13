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
import { fireEvent, render, screen } from "@testing-library/react";

import { HelpDrawer } from "./help-drawer";

describe("HelpDrawer", () => {
  it("marks itself hidden from assistive technology while closed", () => {
    render(<HelpDrawer open={false} onClose={jest.fn()} />);
    expect(screen.getByTestId("help-drawer")).toHaveAttribute("aria-hidden", "true");
  });

  it("marks itself visible once opened", () => {
    render(<HelpDrawer open onClose={jest.fn()} />);
    expect(screen.getByTestId("help-drawer")).toHaveAttribute("aria-hidden", "false");
  });

  it("renders the help content inside", () => {
    render(<HelpDrawer open onClose={jest.fn()} />);
    expect(screen.getByTestId("help-content")).toHaveTextContent("Schrift");
  });

  it("closes via its own close button", () => {
    const onClose = jest.fn();
    render(<HelpDrawer open onClose={onClose} />);
    fireEvent.click(screen.getByTestId("help-drawer-close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape while open", () => {
    const onClose = jest.fn();
    render(<HelpDrawer open onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("ignores Escape while closed", () => {
    const onClose = jest.fn();
    render(<HelpDrawer open={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders no backdrop — the grid stays clickable while open", () => {
    render(<HelpDrawer open onClose={jest.fn()} />);
    expect(screen.queryByTestId("help-drawer-backdrop")).not.toBeInTheDocument();
  });
});

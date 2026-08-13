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

import { HelpTab } from "./tab-help";

describe("HelpTab", () => {
  it("shows the category menu on the start page", () => {
    render(<HelpTab />);
    ["start", "font", "align", "cells", "images", "data"].forEach((id) => {
      expect(screen.getByTestId(`help-topic-${id}`)).toBeInTheDocument();
    });
    expect(screen.queryByTestId("help-content")).toHaveTextContent("Schrift");
  });

  it("shows only the 'Hilfe' breadcrumb on the start page", () => {
    render(<HelpTab />);
    expect(screen.getByTestId("help-crumb-home")).toBeInTheDocument();
    expect(screen.queryByTestId("help-crumb-current")).not.toBeInTheDocument();
  });

  it("opens a topic page when its menu entry is clicked", () => {
    render(<HelpTab />);
    fireEvent.click(screen.getByTestId("help-topic-images"));
    expect(screen.getByTestId("help-content")).toHaveTextContent("Bild einfügen");
    expect(screen.getByTestId("help-content")).not.toHaveTextContent("Zwischen Reitern wechseln");
  });

  it("adds the topic to the breadcrumbs once opened", () => {
    render(<HelpTab />);
    fireEvent.click(screen.getByTestId("help-topic-images"));
    expect(screen.getByTestId("help-crumb-current")).toHaveTextContent("Bilder");
  });

  it("goes back to the start menu via the 'Hilfe' breadcrumb", () => {
    render(<HelpTab />);
    fireEvent.click(screen.getByTestId("help-topic-images"));
    fireEvent.click(screen.getByTestId("help-crumb-home"));
    expect(screen.getByTestId("help-topic-font")).toBeInTheDocument();
  });

  it("finds a match by full text and lists it under its topic", () => {
    render(<HelpTab />);
    fireEvent.change(screen.getByTestId("help-search"), { target: { value: "Format-Pinsel" } });
    expect(screen.getByTestId("help-result-data-Format kopieren")).toBeInTheDocument();
  });

  it("navigates straight to the topic when a search result is clicked", () => {
    render(<HelpTab />);
    fireEvent.change(screen.getByTestId("help-search"), { target: { value: "Bildgröße" } });
    fireEvent.click(screen.getByTestId("help-result-images-Bildgröße angleichen"));
    expect(screen.getByTestId("help-content")).toHaveTextContent("Bildgröße angleichen");
    expect(screen.queryByTestId("help-search")).toHaveValue("");
  });

  it("highlights the matched text in search results", () => {
    render(<HelpTab />);
    fireEvent.change(screen.getByTestId("help-search"), { target: { value: "Sortieren" } });
    expect(screen.getByTestId("help-content").querySelector("mark")).toHaveTextContent("Sortieren");
  });

  it("shows a no-results message when nothing matches", () => {
    render(<HelpTab />);
    fireEvent.change(screen.getByTestId("help-search"), { target: { value: "xyz-nicht-vorhanden" } });
    expect(screen.getByTestId("help-no-results")).toBeInTheDocument();
  });
});

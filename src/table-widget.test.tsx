import React from "react";
import { screen, render } from "@testing-library/react";

import { TableWidget } from "./table-widget";
import { serializeTableData } from "./table-json";

describe("TableWidget", () => {
  it("renders the default table when no data is provided", () => {
    render(<TableWidget contentLanguage="de_DE" />);

    expect(screen.getByText("Spalte 1")).toBeInTheDocument();
    expect(screen.getByText("Zeile 1")).toBeInTheDocument();
  });

  it("renders provided table data as a table", () => {
    const data = [
      ["", "Q1", "Q2"],
      ["Umsatz", "100", "200"],
      ["Kosten", "50", "60"],
    ];

    render(<TableWidget contentLanguage="de_DE" tabledata={serializeTableData(data)} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Q1")).toBeInTheDocument();
    expect(screen.getByText("Umsatz")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("marks the first column cells as row headers", () => {
    const data = [
      ["", "Q1"],
      ["Umsatz", "100"],
    ];

    render(<TableWidget contentLanguage="de_DE" tabledata={serializeTableData(data)} />);

    const rowHeader = screen.getByRole("rowheader", { name: "Umsatz" });
    expect(rowHeader).toBeInTheDocument();
  });

  it("marks the first row cells as column headers", () => {
    const data = [
      ["", "Q1"],
      ["Umsatz", "100"],
    ];

    render(<TableWidget contentLanguage="de_DE" tabledata={serializeTableData(data)} />);

    const columnHeader = screen.getByRole("columnheader", { name: "Q1" });
    expect(columnHeader).toBeInTheDocument();
  });

  it("falls back to the default table for malformed JSON", () => {
    render(<TableWidget contentLanguage="de_DE" tabledata="not json" />);

    expect(screen.getByText("Spalte 1")).toBeInTheDocument();
  });
});

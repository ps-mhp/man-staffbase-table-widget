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

  it("caps the first column to 75% width and wraps its text", () => {
    const data = [
      ["", "Q1"],
      ["Ein sehr langer Zeilentitel der umbrechen muss", "100"],
    ];

    render(<TableWidget contentLanguage="de_DE" tabledata={serializeTableData(data)} />);

    const rowHeader = screen.getByRole("rowheader", {
      name: "Ein sehr langer Zeilentitel der umbrechen muss",
    });
    expect(rowHeader).toHaveStyle({ maxWidth: "75cqw", whiteSpace: "normal" });
  });

  it("falls back to the default table for malformed JSON", () => {
    render(<TableWidget contentLanguage="de_DE" tabledata="not json" />);

    expect(screen.getByText("Spalte 1")).toBeInTheDocument();
  });

  it("renders the table at full width of its container", () => {
    render(<TableWidget contentLanguage="de_DE" />);

    expect(screen.getByRole("table")).toHaveStyle({ width: "100%" });
  });

  it("renders merged cells with colSpan and skips covered cells", () => {
    const tabledata = JSON.stringify({
      data: [
        ["", "A", "B"],
        ["OBD", "x", "y"],
      ],
      merges: [{ row: 1, col: 1, rowSpan: 1, colSpan: 2 }],
    });

    render(<TableWidget contentLanguage="de_DE" tabledata={tabledata} />);

    const merged = screen.getByText("x").closest("td")!;
    expect(merged).toHaveAttribute("colspan", "2");
    // The covered cell's value must not be rendered.
    expect(screen.queryByText("y")).not.toBeInTheDocument();
  });

  it("applies per-cell formatting", () => {
    const tabledata = JSON.stringify({
      data: [
        ["", "A"],
        ["R", "1"],
      ],
      formats: { "1,1": { bold: true, color: "#ff0000" } },
    });

    render(<TableWidget contentLanguage="de_DE" tabledata={tabledata} />);

    expect(screen.getByText("1").closest("td")).toHaveStyle({
      fontWeight: "bold",
      color: "#ff0000",
    });
  });

  it("renders super/subscript markup in cells", () => {
    const tabledata = JSON.stringify({
      data: [
        ["", "A"],
        ["Fläche", "12 m<sup>2</sup>"],
      ],
    });

    const { container } = render(
      <TableWidget contentLanguage="de_DE" tabledata={tabledata} />,
    );

    expect(container.querySelector("sup")).toHaveTextContent("2");
  });

  it("renders line breaks within a cell", () => {
    const tabledata = JSON.stringify({
      data: [
        ["", "A"],
        ["Zeile", "oben<br>unten"],
      ],
    });

    const { container } = render(
      <TableWidget contentLanguage="de_DE" tabledata={tabledata} />,
    );

    expect(container.querySelector("br")).toBeInTheDocument();
  });

  it("applies a background color to a cell", () => {
    const tabledata = JSON.stringify({
      data: [
        ["", "A"],
        ["R", "1"],
      ],
      formats: { "1,1": { background: "#ffff00" } },
    });

    render(<TableWidget contentLanguage="de_DE" tabledata={tabledata} />);

    expect(screen.getByText("1").closest("td")).toHaveStyle({ background: "#ffff00" });
  });

  it("applies a preset sort on initial render", () => {
    const tabledata = JSON.stringify({
      data: [
        ["", "A"],
        ["B", "1"],
        ["A", "1"],
      ],
      sort: { col: 0, dir: "asc" },
    });

    render(<TableWidget contentLanguage="de_DE" tabledata={tabledata} />);

    const rowHeaders = screen.getAllByRole("rowheader").map((el) => el.textContent);
    expect(rowHeaders).toEqual(["A", "B"]);
  });
});

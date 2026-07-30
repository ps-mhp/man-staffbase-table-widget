import React from "react";
import { screen, render } from "@testing-library/react";

import { TableWidget } from "./table-widget";
import { serializeTableData } from "./table-json";
import { serializeTableModel, TableModel } from "./table-model";
import { tableModelToSlotMarkup } from "./table-dom";

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

  it("shows a notice instead of a placeholder table when the data is unreadable", () => {
    render(<TableWidget contentLanguage="de_DE" tabledata="not json" />);

    expect(screen.getByTestId("table-widget-unreadable")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    // The starter grid must not stand in for lost content.
    expect(screen.queryByText("Spalte 1")).not.toBeInTheDocument();
  });

  it("shows the notice for the truncated value a translated article delivers", () => {
    render(<TableWidget contentLanguage="de_DE" tabledata="{" />);

    expect(screen.getByTestId("table-widget-unreadable")).toBeInTheDocument();
  });

  it("renders a base64-encoded payload", () => {
    const data = [
      ["", 'Umsatz "netto"'],
      ["Q1", "100"],
    ];
    const tabledata = serializeTableModel({ data, merges: [], formats: {}, sort: null });

    render(<TableWidget contentLanguage="de_DE" tabledata={tabledata} />);

    expect(screen.getByText('Umsatz "netto"')).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders the table at full width of its container", () => {
    render(<TableWidget contentLanguage="de_DE" />);

    expect(screen.getByRole("table")).toHaveStyle({ width: "100%" });
  });

  it("separates columns with a transparent 8px gap (no coloured border)", () => {
    render(<TableWidget contentLanguage="de_DE" />);

    const table = screen.getByRole("table");
    expect(table).toHaveStyle({
      borderCollapse: "separate",
      borderSpacing: "8px 0",
      background: "transparent",
    });
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

  it("applies vertical alignment to the cell box", () => {
    const tabledata = JSON.stringify({
      data: [
        ["", "A"],
        ["R", "1"],
      ],
      formats: { "0,1": { valign: "bottom" }, "1,1": { valign: "top" } },
    });

    render(<TableWidget contentLanguage="de_DE" tabledata={tabledata} />);

    expect(screen.getByText("1").closest("td")).toHaveStyle({ verticalAlign: "top" });
    expect(screen.getByText("A").closest("th")).toHaveStyle({ verticalAlign: "bottom" });
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

  it("renders an embedded image at its stored width", () => {
    const tabledata = JSON.stringify({
      data: [
        ["", "Bild"],
        ["Logo", '<img src="https://cdn.example.com/logo.png" style="width:120px">'],
      ],
    });

    const { container } = render(
      <TableWidget contentLanguage="de_DE" tabledata={tabledata} />,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "https://cdn.example.com/logo.png");
    expect(img!.getAttribute("style")).toContain("width:120px");
    expect(img!.getAttribute("style")).toContain("max-width:100%");
  });

  it("does not render an image with an unsafe source", () => {
    const tabledata = JSON.stringify({
      data: [
        ["", "Bild"],
        ["X", '<img src="javascript:alert(1)">'],
      ],
    });

    const { container } = render(
      <TableWidget contentLanguage="de_DE" tabledata={tabledata} />,
    );

    expect(container.querySelector("img")).toBeNull();
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

describe("TableWidget storage modes", () => {
  const source: TableModel = {
    data: [["", "Criterio"], ["Consumo", "Igual"]],
    merges: [],
    formats: { "1,1": { bold: true } },
    sort: null,
  };
  const translated: TableModel = {
    ...source,
    data: [["", "Kriterium"], ["Verbrauch", "Gleich"]],
  };

  const attr = serializeTableModel(source);
  const slots = tableModelToSlotMarkup(translated);

  it("attribute mode ignores the slots even when they are present", () => {
    render(
      <TableWidget contentLanguage="de_DE" tablemode="attribute" tabledata={attr} tableslots={slots} />,
    );

    expect(screen.getByText("Criterio")).toBeInTheDocument();
    expect(screen.queryByText("Kriterium")).not.toBeInTheDocument();
  });

  it("slots mode renders the translated slots", () => {
    render(
      <TableWidget contentLanguage="de_DE" tablemode="slots" tabledata={attr} tableslots={slots} />,
    );

    expect(screen.getByText("Kriterium")).toBeInTheDocument();
    expect(screen.getByText("Verbrauch")).toBeInTheDocument();
    expect(screen.queryByText("Criterio")).not.toBeInTheDocument();
  });

  it("slots mode still renders the attribute when the slots are missing", () => {
    // A mode must never be able to blank the page.
    render(<TableWidget contentLanguage="de_DE" tablemode="slots" tabledata={attr} />);

    expect(screen.getByText("Criterio")).toBeInTheDocument();
    expect(screen.queryByTestId("table-widget-unreadable")).not.toBeInTheDocument();
  });

  it("reports which storage form was rendered", () => {
    const { unmount } = render(
      <TableWidget contentLanguage="de_DE" tablemode="slots" tabledata={attr} tableslots={slots} />,
    );
    expect(screen.getByRole("table").closest("[data-table-source]")).toHaveAttribute(
      "data-table-source",
      "slots",
    );
    unmount();

    render(<TableWidget contentLanguage="de_DE" tablemode="slots" tabledata={attr} />);
    expect(screen.getByRole("table").closest("[data-table-source]")).toHaveAttribute(
      "data-table-source",
      "attribute",
    );
  });

  it("accepts the retired \"both\" value as a synonym for slots", () => {
    render(
      <TableWidget contentLanguage="de_DE" tablemode="both" tabledata={attr} tableslots={slots} />,
    );

    expect(screen.getByText("Kriterium")).toBeInTheDocument();
  });

  it("defaults to attribute mode for instances saved before the switch existed", () => {
    render(<TableWidget contentLanguage="de_DE" tabledata={attr} tableslots={slots} />);

    expect(screen.getByText("Criterio")).toBeInTheDocument();
  });

  it("keeps formatting from the slots", () => {
    render(<TableWidget contentLanguage="de_DE" tablemode="slots" tableslots={slots} />);

    expect(screen.getByText("Gleich").closest("td")).toHaveStyle({ fontWeight: "bold" });
  });
});

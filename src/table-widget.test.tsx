import React from "react";
import { screen, render, fireEvent, waitFor, within } from "@testing-library/react";

import { TableWidget } from "./table-widget";
import { downloadFile } from "./download";
import { toXlsx } from "./table-export";
import { isNativeApp } from "@shared/staffbase/native-app";
import { serializeTableData } from "./table-json";
import { IMAGE_FIT_CLASS, IMAGE_NO_FIT_CLASS } from "./image-fit";

jest.mock("./download", () => ({
  ...jest.requireActual("./download"),
  downloadFile: jest.fn(),
}));
jest.mock("./table-export", () => {
  const actual = jest.requireActual("./table-export");
  return { ...actual, toXlsx: jest.fn(actual.toXlsx) };
});
jest.mock("@shared/staffbase/native-app", () => ({ isNativeApp: jest.fn(() => false) }));

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

  it("renders a collapsed table with no outer MAN-CI border/fill (no transparent column gap)", () => {
    render(<TableWidget contentLanguage="de_DE" />);

    const table = screen.getByRole("table");
    expect(table).toHaveStyle({
      borderCollapse: "collapse",
      background: "transparent",
    });
  });

  it("renders a saved cell with the retired lowercase mark without the class, text as typed", () => {
    // The editor no longer offers the `text-lowercase` mark, but saved tables
    // still carry it. man-theme styles the class globally
    // (`.page .text-lowercase { text-transform: lowercase !important }`), so
    // rendering it would keep forcing "MAN" to "man" on the page.
    const data = [
      ['<span class="text-lowercase">MAN</span> Truck', "m<sup class=\"text-lowercase\">2</sup>"],
      ["Zeile", "1"],
    ];

    const { container } = render(
      <TableWidget contentLanguage="de_DE" tabledata={serializeTableData(data)} />,
    );

    expect(container.querySelector(".text-lowercase")).toBeNull();
    expect(container.querySelector("[class*='lowercase']")).toBeNull();
    const head = screen.getByRole("columnheader", { name: "MAN Truck" });
    expect(head.querySelector("span")?.innerHTML).toBe("MAN Truck");
    expect(screen.getByText("2").tagName).toBe("SUP");
    expect(screen.getByText("2")).not.toHaveAttribute("class");
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
    expect(img!.getAttribute("style")).not.toContain("max-width");
  });

  it("caps images to the table's width by default", () => {
    const tabledata = JSON.stringify({
      data: [["", "Bild"], ["Logo", '<img src="https://cdn.example.com/logo.png">']],
    });

    const { container } = render(
      <TableWidget contentLanguage="de_DE" tabledata={tabledata} />,
    );

    const wrap = container.querySelector(".table-widget-scroll");
    expect(wrap).toHaveClass(IMAGE_FIT_CLASS);
    expect(container.querySelector("style")?.textContent).toContain("100cqw");
  });

  it("renders images unrestricted when the option is off", () => {
    const tabledata = JSON.stringify({
      data: [["", "Bild"], ["Logo", '<img src="https://cdn.example.com/logo.png">']],
      fitImages: false,
    });

    const { container } = render(
      <TableWidget contentLanguage="de_DE" tabledata={tabledata} />,
    );

    const wrap = container.querySelector(".table-widget-scroll");
    expect(wrap).not.toHaveClass(IMAGE_FIT_CLASS);
    expect(wrap).toHaveClass(IMAGE_NO_FIT_CLASS);
    // The host page caps article images, so "off" still needs a rule.
    expect(container.querySelector("style")?.textContent).toContain("max-width: none !important");
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

  describe("collapsing long tables", () => {
    /** A table with a header row plus `rows` data rows. */
    const longTable = (rows: number, extra: Record<string, unknown> = {}): string =>
      JSON.stringify({
        data: [
          ["", "Wert"],
          ...Array.from({ length: rows }, (_, i) => [`Zeile ${i + 1}`, String(i + 1)]),
        ],
        ...extra,
      });

    const rowLabels = (): string[] =>
      screen.getAllByRole("rowheader").map((el) => el.textContent ?? "");

    it("never scrolls vertically", () => {
      // The whole point: a scroll area nested in a scrolling page leaves the
      // reader guessing which one the wheel moves.
      const { container } = render(
        <TableWidget contentLanguage="de_DE" tabledata={longTable(20)} />,
      );

      const wrap = container.querySelector<HTMLElement>(".table-widget-scroll");
      expect(wrap?.style.maxHeight).toBe("");
      expect(wrap?.style.overflowY).toBe("");
    });

    it("shows only the first five rows", () => {
      render(<TableWidget contentLanguage="de_DE" tabledata={longTable(20)} />);

      expect(rowLabels()).toEqual(["Zeile 1", "Zeile 2", "Zeile 3", "Zeile 4", "Zeile 5"]);
    });

    it("names how many rows the button reveals", () => {
      render(<TableWidget contentLanguage="de_DE" tabledata={longTable(20)} />);

      expect(screen.getByTestId("table-rows-toggle")).toHaveTextContent(
        "Weitere 15 Zeilen einblenden",
      );
    });

    it("reveals the rest and folds them away again", () => {
      render(<TableWidget contentLanguage="de_DE" tabledata={longTable(20)} />);
      const toggle = screen.getByTestId("table-rows-toggle");

      fireEvent.click(toggle);
      expect(rowLabels()).toHaveLength(20);
      expect(toggle).toHaveTextContent("Weniger Zeilen anzeigen");
      expect(toggle).toHaveAttribute("aria-expanded", "true");

      fireEvent.click(toggle);
      expect(rowLabels()).toHaveLength(5);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    });

    it("points the button at the rows it governs", () => {
      const { container } = render(
        <TableWidget contentLanguage="de_DE" tabledata={longTable(20)} />,
      );

      const controls = screen.getByTestId("table-rows-toggle").getAttribute("aria-controls");
      expect(container.querySelector(`#${controls}`)?.tagName).toBe("TBODY");
    });

    it("keeps the button visible while a wide table scrolls sideways", () => {
      const { container } = render(
        <TableWidget contentLanguage="de_DE" tabledata={longTable(20)} />,
      );

      const wrap = container.querySelector(".table-widget-scroll");
      expect(wrap?.contains(screen.getByTestId("table-rows-toggle"))).toBe(false);
    });

    it("leaves a short table alone", () => {
      render(<TableWidget contentLanguage="de_DE" tabledata={longTable(5)} />);

      expect(rowLabels()).toHaveLength(5);
      expect(screen.queryByTestId("table-rows-toggle")).toBeNull();
    });

    it("honours a custom limit", () => {
      render(
        <TableWidget contentLanguage="de_DE" tabledata={longTable(20, { visibleRows: 2 })} />,
      );

      expect(rowLabels()).toEqual(["Zeile 1", "Zeile 2"]);
      expect(screen.getByTestId("table-rows-toggle")).toHaveTextContent(
        "Weitere 18 Zeilen einblenden",
      );
    });

    it("shows everything when the limit is zero", () => {
      render(
        <TableWidget contentLanguage="de_DE" tabledata={longTable(20, { visibleRows: 0 })} />,
      );

      expect(rowLabels()).toHaveLength(20);
      expect(screen.queryByTestId("table-rows-toggle")).toBeNull();
    });

    it("cuts the sorted order, not the stored order", () => {
      render(
        <TableWidget
          contentLanguage="de_DE"
          tabledata={longTable(20, { visibleRows: 2, sort: { col: 0, dir: "desc" } })}
        />,
      );

      expect(rowLabels()).toEqual(["Zeile 20", "Zeile 19"]);
    });

    it("keeps a merged cell from reaching past the cut", () => {
      // The merge starts in the last visible row and spans three rows; two of
      // them were cut away, so the browser would paint it past the table.
      const tabledata = JSON.stringify({
        data: [
          ["", "Wert"],
          ...Array.from({ length: 10 }, (_, i) => [`Zeile ${i + 1}`, String(i + 1)]),
        ],
        merges: [{ row: 5, col: 1, rowSpan: 3, colSpan: 1 }],
      });

      render(<TableWidget contentLanguage="de_DE" tabledata={tabledata} />);

      expect(screen.getByText("5").closest("td")).not.toHaveAttribute("rowspan");
    });

    it("restores the full merge once expanded", () => {
      const tabledata = JSON.stringify({
        data: [
          ["", "Wert"],
          ...Array.from({ length: 10 }, (_, i) => [`Zeile ${i + 1}`, String(i + 1)]),
        ],
        merges: [{ row: 5, col: 1, rowSpan: 3, colSpan: 1 }],
      });

      render(<TableWidget contentLanguage="de_DE" tabledata={tabledata} />);
      fireEvent.click(screen.getByTestId("table-rows-toggle"));

      expect(screen.getByText("5").closest("td")).toHaveAttribute("rowspan", "3");
    });
  });
});

describe("TableWidget row selection and export", () => {
  const data = [
    ["", "Q1"],
    ["Umsatz", "100"],
    ["Kosten", "50"],
    ["Gewinn", "50"],
  ];
  const table = (exportMode: string, extra: object = {}) =>
    JSON.stringify({ data, exportMode, ...extra });
  const downloaded = () => (downloadFile as jest.Mock).mock.calls.at(-1) as [string, string, string];
  const csvLines = () => downloaded()[0].replace("\uFEFF", "").trim().split("\r\n");

  beforeEach(() => {
    (downloadFile as jest.Mock).mockClear();
    (isNativeApp as jest.Mock).mockReturnValue(false);
  });

  it("offers neither checkboxes nor downloads when export is off", () => {
    render(<TableWidget contentLanguage="de_DE" tabledata={serializeTableData(data)} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /Excel/ })).toBeNull();
  });

  it("downloads the whole table in mode all, without counter or checkboxes", () => {
    render(<TableWidget contentLanguage="de_DE" tabledata={table("all")} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText(/ausgewählt/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ganze Tabelle als CSV exportieren" }));

    expect(csvLines()).toEqual([";Q1", "Umsatz;100", "Kosten;50", "Gewinn;50"]);
    expect(downloaded()[1]).toMatch(/^tabelle-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("selects rows, keeps the selection across sorting and exports only it", () => {
    render(<TableWidget contentLanguage="de_DE" tabledata={table("select")} />);
    const all = screen.getByRole("checkbox", { name: "Alle Zeilen auswählen" }) as HTMLInputElement;
    expect(screen.getByText("Keine Zeile ausgewählt")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Zeile auswählen: Kosten" }));

    expect(all.indeterminate).toBe(true);
    expect(all.checked).toBe(false);
    expect(screen.getByText("1 Zeile ausgewählt")).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Kosten" }).closest("tr")).toHaveClass("table-widget__row--selected");

    fireEvent.click(screen.getByRole("columnheader", { name: "Q1" }));
    expect(screen.getByRole("checkbox", { name: "Zeile auswählen: Kosten" })).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Auswahl (1 Zeile) als CSV exportieren" }));
    expect(csvLines()).toEqual([";Q1", "Kosten;50"]);
  });

  it("does not sort when the select-all header is clicked", () => {
    render(<TableWidget contentLanguage="de_DE" tabledata={table("select")} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Alle Zeilen auswählen" }));
    const titles = screen.getAllByRole("rowheader").map((cell) => cell.textContent);
    expect(titles).toEqual(["Umsatz", "Kosten", "Gewinn"]);
  });

  it("selects every row, collapsed ones included, and clears them again", () => {
    render(<TableWidget contentLanguage="de_DE" tabledata={table("select", { visibleRows: 1 })} />);
    const all = screen.getByRole("checkbox", { name: "Alle Zeilen auswählen" });

    fireEvent.click(all);
    expect(all).toBeChecked();
    expect(screen.getByText("3 Zeilen ausgewählt")).toBeInTheDocument();

    fireEvent.click(all);
    expect(all).not.toBeChecked();
    expect(screen.getByText("Keine Zeile ausgewählt")).toBeInTheDocument();
  });

  it("selects all from a partial selection", () => {
    render(<TableWidget contentLanguage="de_DE" tabledata={table("select")} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Zeile auswählen: Umsatz" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Alle Zeilen auswählen" }));
    expect(screen.getByText("3 Zeilen ausgewählt")).toBeInTheDocument();
  });

  it("shows no selection and no export inside the native app", () => {
    (isNativeApp as jest.Mock).mockReturnValue(true);
    render(<TableWidget contentLanguage="de_DE" tabledata={table("select")} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /exportieren/ })).toBeNull();
  });

  it("downloads an xlsx file", async () => {
    render(<TableWidget contentLanguage="de_DE" tabledata={table("all")} />);
    fireEvent.click(screen.getByRole("button", { name: "Ganze Tabelle als Excel exportieren" }));
    await waitFor(() => expect(downloadFile).toHaveBeenCalled());
    expect(downloaded()[1]).toMatch(/\.xlsx$/);
  });

  it("reports a failed export and frees the button", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    (toXlsx as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    render(<TableWidget contentLanguage="de_DE" tabledata={table("all")} />);
    const button = screen.getByRole("button", { name: "Ganze Tabelle als Excel exportieren" });

    fireEvent.click(button);

    expect(await screen.findByRole("alert")).toHaveTextContent("Export fehlgeschlagen. Bitte erneut versuchen.");
    expect(button).not.toBeDisabled();
    expect(downloadFile).not.toHaveBeenCalled();
    (console.error as jest.Mock).mockRestore();
  });

  it("puts the bar outside the scrolling wrapper", () => {
    const { container } = render(<TableWidget contentLanguage="de_DE" tabledata={table("select")} />);
    const bar = container.querySelector(".table-widget__export") as HTMLElement;
    expect(bar.closest(".table-widget-scroll")).toBeNull();
    expect(within(bar).getAllByRole("button")).toHaveLength(2);
    expect(container.firstElementChild).toHaveClass("table-widget--selectable");
  });
});

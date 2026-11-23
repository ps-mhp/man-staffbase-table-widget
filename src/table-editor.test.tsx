import React from "react";
import { act, screen, render, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigShellProvider, ConfigView } from "@man/config-ui/shell/shell-context";

import { TableEditor } from "./table-editor";
import { TableModel } from "./table-model";
import * as tableImport from "./table-import";
import { MediaClient, MediaItem } from "@shared/media/media-client";
import { CONFIG_MODAL_HOST_ATTRIBUTE, ConfigModal } from "@shared/ui/config-modal";
import { DEFAULT_IMAGE_WIDTH } from "./cell-image";
import { IMAGE_FIT_CLASS, IMAGE_NO_FIT_CLASS } from "./image-fit";

const mediaItem = (id: string): MediaItem => ({
  id,
  url: `https://cdn.example.com/${id}.png`,
  previewUrl: `https://cdn.example.com/${id}-preview.png`,
  fileName: `${id}.png`,
  type: "image",
  width: 640,
  height: 480,
});

/** Minimal MediaClient stub covering only what the editor exercises. */

import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
const stubMediaClient = (overrides: Partial<MediaClient> = {}): MediaClient =>
  ({
    listMedia: jest.fn(async () => ({ items: [mediaItem("a")], total: 1, nextOffset: null })),
    searchMedia: jest.fn(async () => ({ items: [], nextCursor: null })),
    uploadMedia: jest.fn(async () => mediaItem("up")),
    ensurePublicImageUrl: jest.fn(async (m: MediaItem) => `${m.url}?public=1`),
    currentUserId: jest.fn(async () => null),
    ...overrides,
  }) as unknown as MediaClient;

const model = (data: string[][], overrides: Partial<TableModel> = {}): TableModel => ({
  data,
  merges: [],
  formats: {},
  sort: null,
  fitImages: true,
  visibleRows: DEFAULT_VISIBLE_ROWS,
  exportMode: "off",
  ...overrides,
});

const sample = (): TableModel =>
  model([
    ["", "Q1", "Q2"],
    ["Umsatz", "100", "200"],
    ["Kosten", "50", "60"],
  ]);

const cellDiv = (label: string): HTMLElement => screen.getByLabelText(label);
const cellTd = (label: string): HTMLElement => cellDiv(label).closest("td")!;

/** Markierte Zellen tragen den Schleier aus `table-editor.scss` über diese Klasse. */
const SELECTED = "table-editor__cell--selected";
const CURRENT = "table-editor__cell--current";

/** Right-clicks a cell (after selecting it) and returns the context menu. */
const openMenuOnCell = (label: string): HTMLElement => {
  const td = cellTd(label);
  fireEvent.mouseDown(td);
  fireEvent.contextMenu(td);
  return screen.getByTestId("table-editor-menu");
};

const TOOLBAR_TAB: Record<string, string> = {
  "toolbar-fontsize": "Schrift",
  "toolbar-bold": "Schrift",
  "toolbar-bg": "Schrift",
  "toolbar-valign-bottom": "Ausrichtung",
  "toolbar-unmerge": "Zellen",
  "toolbar-insert": "Zellen",
  "toolbar-insert-menu": "Zellen",
  "toolbar-insert-row-above": "Zellen",
  "toolbar-insert-col-left": "Zellen",
  "toolbar-image-button": "Bilder",
  "toolbar-image-size": "Bilder",
  "toolbar-image-equal-height": "Bilder",
  "toolbar-image-equal-width": "Bilder",
  "toolbar-image-reset-size": "Bilder",
  "toolbar-painter": "Daten",
  "toolbar-upload": "Daten",
  "toolbar-clear-format": "Daten",
  "toolbar-clear-format-all": "Daten",
  "toolbar-clear-format-text": "Daten",
  "toolbar-clear-format-images": "Daten",
};

/** Opens the tab holding `testId` (if any) and returns the control. */
function toolbar(testId: string): HTMLElement {
  const label = TOOLBAR_TAB[testId];
  if (label) fireEvent.click(screen.getByRole("tab", { name: label }));
  return screen.getByTestId(testId);
}

describe("TableEditor", () => {
  it("renders an editable cell for every value", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    expect(cellDiv("Zeile 1, Spalte 2")).toHaveTextContent("Q1");
    expect(cellDiv("Zeile 2, Spalte 1")).toHaveTextContent("Umsatz");
  });

  it("calls onChange when a cell's content changes", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample()} onChange={onChange} />);
    const div = cellDiv("Zeile 2, Spalte 2");
    div.innerHTML = "150";
    fireEvent.input(div);
    const arg = onChange.mock.calls[0][0] as TableModel;
    expect(arg.data[1][1]).toBe("150");
  });

  it("selects a cell on mousedown", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    const td = cellTd("Zeile 2, Spalte 2");
    fireEvent.mouseDown(td);
    expect(td).toHaveClass(SELECTED);
  });

  it("selects a whole column via the column handle", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    fireEvent.click(screen.getByTestId("col-handle-1"));
    expect(cellTd("Zeile 1, Spalte 2")).toHaveClass(SELECTED);
    expect(cellTd("Zeile 2, Spalte 2")).toHaveClass(SELECTED);
  });

  describe("Rand und Statuszeile", () => {
    it("beschriftet Spalten mit Buchstaben und Zeilen mit Nummern", () => {
      render(<TableEditor value={sample()} onChange={jest.fn()} />);

      expect(screen.getByRole("button", { name: "Spalte B auswählen" })).toHaveTextContent("B");
      expect(screen.getByTestId("col-handle-2")).toHaveTextContent("C");
      expect(screen.getByRole("button", { name: "Zeile 3 auswählen" })).toHaveTextContent("3");
      expect(screen.getByTestId("col-handle-0").closest("th")).toHaveAttribute("scope", "col");
      expect(screen.getByTestId("row-handle-0").closest("th")).toHaveAttribute("scope", "row");
    });

    it("markiert über die Nummer eine Zeile und zeigt das am Rand", () => {
      render(<TableEditor value={sample()} onChange={jest.fn()} />);

      fireEvent.click(screen.getByTestId("row-handle-1"));

      expect(cellTd("Zeile 2, Spalte 1")).toHaveClass(SELECTED);
      expect(cellTd("Zeile 2, Spalte 3")).toHaveClass(SELECTED);
      expect(cellTd("Zeile 3, Spalte 1")).not.toHaveClass(SELECTED);
      expect(screen.getByTestId("row-handle-1").closest("th")).toHaveClass("table-editor__head--active");
      expect(screen.getByTestId("col-handle-1").closest("th")).not.toHaveClass("table-editor__head--active");
    });

    it("markiert über das Eckfeld die ganze Tabelle", () => {
      render(<TableEditor value={sample()} onChange={jest.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: "Alles auswählen" }));

      expect(cellTd("Zeile 1, Spalte 1")).toHaveClass(SELECTED);
      expect(cellTd("Zeile 3, Spalte 3")).toHaveClass(SELECTED);
      expect(screen.getByRole("status")).toHaveTextContent("Auswahl A1:C3");
    });

    it("markiert per Rechtsklick auf einen Buchstaben die Spalte für das Kontextmenü", () => {
      const onChange = jest.fn();
      render(<TableEditor value={sample()} onChange={onChange} />);

      fireEvent.contextMenu(screen.getByTestId("col-handle-2"));
      fireEvent.click(screen.getByTestId("delete-cols"));

      expect((onChange.mock.calls[0][0] as TableModel).data[0]).toEqual(["", "Q1"]);
    });

    it("rahmt die aktuelle Zelle, nicht den Rest der Markierung", () => {
      render(<TableEditor value={sample()} onChange={jest.fn()} />);

      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      fireEvent.mouseDown(cellTd("Zeile 3, Spalte 2"), { shiftKey: true });

      expect(cellTd("Zeile 2, Spalte 2")).toHaveClass(CURRENT);
      expect(cellTd("Zeile 3, Spalte 2")).not.toHaveClass(CURRENT);
      expect(cellTd("Zeile 3, Spalte 2")).toHaveClass(SELECTED);
    });

    it("zeigt Größe, Auswahl und einen Hinweis unter dem Gitter", () => {
      render(<TableEditor value={sample()} onChange={jest.fn()} />);
      const status = screen.getByTestId("table-editor-status");

      expect(status).toHaveTextContent("3 Zeilen · 3 Spalten");
      expect(status).toHaveTextContent("Zeile 1 und Spalte A sind Überschriften");
      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      fireEvent.mouseDown(cellTd("Zeile 3, Spalte 2"), { shiftKey: true });
      expect(status).toHaveTextContent("3 Zeilen · 3 Spalten · Auswahl B2:B3");

      fireEvent.doubleClick(cellTd("Zeile 2, Spalte 2"));
      expect(status).toHaveTextContent("Enter übernimmt · Esc verwirft · Alt+Enter neue Zeile");
    });

    it("setzt Kopfzeile und Zeilentitel fett wie auf der Seite", () => {
      render(<TableEditor value={sample()} onChange={jest.fn()} />);

      expect(cellTd("Zeile 1, Spalte 2")).toHaveClass("table-editor__cell--head");
      expect(cellTd("Zeile 2, Spalte 1")).toHaveClass("table-editor__cell--head");
      expect(cellTd("Zeile 2, Spalte 2")).not.toHaveClass("table-editor__cell--head");
    });
  });

  it("inserts a row below via the context menu", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample()} onChange={onChange} />);
    openMenuOnCell("Zeile 2, Spalte 1");
    fireEvent.click(screen.getByTestId("insert-row-below"));
    const arg = onChange.mock.calls[0][0] as TableModel;
    expect(arg.data.length).toBe(4);
  });

  it("deletes the selected column via the context menu", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample()} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("col-handle-2"));
    fireEvent.contextMenu(cellTd("Zeile 1, Spalte 3"));
    fireEvent.click(screen.getByTestId("delete-cols"));
    const arg = onChange.mock.calls[0][0] as TableModel;
    expect(arg.data[0]).toEqual(["", "Q1"]);
  });

  it("merges the selected range via the context menu", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample()} onChange={onChange} />);
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 3"), { shiftKey: true });
    fireEvent.contextMenu(cellTd("Zeile 2, Spalte 3"));
    fireEvent.click(screen.getByTestId("merge-cells"));
    const arg = onChange.mock.calls[0][0] as TableModel;
    expect(arg.merges).toEqual([{ row: 1, col: 1, rowSpan: 1, colSpan: 2 }]);
  });

  it("does not render the covered cell of a merge", () => {
    const merged = model([["", "Q1", "Q2"], ["Umsatz", "100", "200"]], {
      merges: [{ row: 1, col: 1, rowSpan: 1, colSpan: 2 }],
    });
    render(<TableEditor value={merged} onChange={jest.fn()} />);
    expect(screen.queryByLabelText("Zeile 2, Spalte 3")).not.toBeInTheDocument();
    expect(cellTd("Zeile 2, Spalte 2")).toHaveAttribute("colspan", "2");
  });

  // --- Toolbar ---

  it("toolbar controls are disabled until a cell is selected", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    expect(toolbar("toolbar-bold")).toBeDisabled();
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    expect(toolbar("toolbar-bold")).not.toBeDisabled();
  });

  it("reflects a cell's formatting visually in the editor", () => {
    const formatted = model([["", "Q1"], ["Umsatz", "100"]], {
      formats: { "1,1": { bold: true, align: "right", color: "#ff0000" } },
    });
    render(<TableEditor value={formatted} onChange={jest.fn()} />);

    const cell = cellDiv("Zeile 2, Spalte 2");
    expect(cell).toHaveStyle({ fontWeight: "bold", textAlign: "right", color: "#ff0000" });
  });

  it("scrolls only the grid, keeping the toolbar in place", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);

    expect(screen.getByTestId("table-editor")).toHaveStyle({
      display: "flex",
      flexDirection: "column",
    });
    const gridWrap = screen.getByTestId("table-editor-grid").parentElement!;
    expect(gridWrap).toHaveStyle({ overflow: "auto", flex: "1 1 auto" });
  });

  it("applies a vertical alignment via the toolbar to the selection", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample()} onChange={onChange} />);
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    fireEvent.click(toolbar("toolbar-valign-bottom"));
    const arg = onChange.mock.calls[0][0] as TableModel;
    expect(arg.formats["1,1"]).toEqual({ valign: "bottom" });
  });

  it("renders a cell's vertical alignment on the cell box", () => {
    const formatted = model([["", "Q1"], ["Umsatz", "100"]], {
      formats: { "1,1": { valign: "top" } },
    });
    render(<TableEditor value={formatted} onChange={jest.fn()} />);
    expect(cellTd("Zeile 2, Spalte 2")).toHaveStyle({ verticalAlign: "top" });
  });

  it("enables 'unmerge' only when the selection overlaps a merge", () => {
    const merged = model([["", "Q1", "Q2"], ["Umsatz", "100", "200"]], {
      merges: [{ row: 1, col: 1, rowSpan: 1, colSpan: 2 }],
    });
    render(<TableEditor value={merged} onChange={jest.fn()} />);

    // A plain header cell without a merge -> unmerge disabled.
    fireEvent.mouseDown(cellTd("Zeile 1, Spalte 2"));
    expect(toolbar("toolbar-unmerge")).toBeDisabled();

    // The merged cell -> unmerge enabled.
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    expect(toolbar("toolbar-unmerge")).not.toBeDisabled();
  });

  it("applies bold via the toolbar to the selection", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample()} onChange={onChange} />);
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    fireEvent.click(toolbar("toolbar-bold"));
    const arg = onChange.mock.calls[0][0] as TableModel;
    expect(arg.formats["1,1"]).toEqual({ bold: true });
  });

  it("applies a background colour via the toolbar", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample()} onChange={onChange} />);
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    fireEvent.change(toolbar("toolbar-bg"), { target: { value: "#ffff00" } });
    const arg = onChange.mock.calls[0][0] as TableModel;
    expect(arg.formats["1,1"]).toEqual({ background: "#ffff00" });
  });

  it("applies a font size via the toolbar", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample()} onChange={onChange} />);
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    fireEvent.click(toolbar("toolbar-fontsize"));
    fireEvent.click(screen.getByTestId("toolbar-fontsize-20"));
    const arg = onChange.mock.calls[0][0] as TableModel;
    expect(arg.formats["1,1"]).toEqual({ fontSize: 20 });
  });

  it("shows contextual insert (only column) when a full column is selected", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    fireEvent.click(screen.getByTestId("col-handle-1"));
    fireEvent.click(toolbar("toolbar-insert"));
    expect(toolbar("toolbar-insert-col-left")).toBeInTheDocument();
    expect(screen.queryByTestId("toolbar-insert-row-above")).not.toBeInTheDocument();
  });

  it("shows both insert options when nothing is selected", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    fireEvent.click(toolbar("toolbar-insert"));
    expect(toolbar("toolbar-insert-row-above")).toBeInTheDocument();
    expect(toolbar("toolbar-insert-col-left")).toBeInTheDocument();
  });

  it("closes a toolbar dropdown when clicking outside it", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    fireEvent.click(toolbar("toolbar-insert"));
    expect(toolbar("toolbar-insert-menu")).toBeInTheDocument();

    // A mousedown anywhere outside the dropdown closes it.
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId("toolbar-insert-menu")).not.toBeInTheDocument();
  });

  it("copies a format with the painter and applies it to the next selection", () => {
    const onChange = jest.fn();
    const withFormat = model(
      [["", "Q1", "Q2"], ["Umsatz", "100", "200"]],
      { formats: { "1,1": { bold: true, color: "#ff0000" } } },
    );
    render(<TableEditor value={withFormat} onChange={onChange} />);
    // Select the formatted source cell, arm the painter.
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    fireEvent.click(toolbar("toolbar-painter"));
    // Select a target cell and release -> format is applied.
    const target = cellTd("Zeile 2, Spalte 3");
    fireEvent.mouseDown(target);
    fireEvent.mouseUp(target);
    const arg = onChange.mock.calls.at(-1)![0] as TableModel;
    expect(arg.formats["1,2"]).toMatchObject({ bold: true, color: "#ff0000" });
  });

  it("imports an uploaded CSV file and replaces the model", async () => {
    const onChange = jest.fn();
    const spy = jest
      .spyOn(tableImport, "importTableFile")
      .mockResolvedValue(model([["", "X"], ["Y", "1"]]));
    render(<TableEditor value={sample()} onChange={onChange} />);

    const file = new File(["a,b\n1,2"], "table.csv", { type: "text/csv" });
    fireEvent.change(toolbar("toolbar-upload"), { target: { files: [file] } });

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const arg = onChange.mock.calls.at(-1)![0] as TableModel;
    expect(arg.data[0]).toEqual(["", "X"]);
    spy.mockRestore();
  });

  it("sets a preset sort via the context menu", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample()} onChange={onChange} />);
    openMenuOnCell("Zeile 1, Spalte 2");
    fireEvent.click(screen.getByTestId("sort-options"));
    fireEvent.click(screen.getByTestId("sort-asc"));
    const arg = onChange.mock.calls.at(-1)![0] as TableModel;
    expect(arg.sort).toEqual({ col: 1, dir: "asc" });
  });

  describe("images", () => {
    it("opens the media picker from the toolbar when a cell is selected", () => {
      const client = stubMediaClient();
      render(<TableEditor value={sample()} onChange={jest.fn()} mediaClient={client} />);
      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      fireEvent.click(toolbar("toolbar-image-button"));
      expect(screen.getByTestId("media-picker")).toBeInTheDocument();
    });

    it("inserts the selected image into the active cell", async () => {
      const onChange = jest.fn();
      const client = stubMediaClient();
      render(<TableEditor value={sample()} onChange={onChange} mediaClient={client} />);

      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      fireEvent.click(toolbar("toolbar-image-button"));
      fireEvent.click(await screen.findByTestId("media-picker-item-a"));

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      const arg = onChange.mock.calls.at(-1)![0] as TableModel;
      // "Zeile 2, Spalte 2" is data[1][1] (holds "100"); markup is appended.
      expect(arg.data[1][1]).toContain('<img src="https://cdn.example.com/a.png?public=1"');
      expect(arg.data[1][1]).toContain("100");
    });

    it("uploads and embeds an image pasted from the clipboard", async () => {
      const onChange = jest.fn();
      const client = stubMediaClient();
      render(<TableEditor value={sample()} onChange={onChange} mediaClient={client} />);

      const cell = cellDiv("Zeile 2, Spalte 2");
      const file = new File([new Uint8Array([1, 2])], "shot.png", { type: "image/png" });
      fireEvent.paste(cell, {
        clipboardData: { files: [file], items: [], getData: () => "" },
      });

      await waitFor(() => expect(client.uploadMedia).toHaveBeenCalled());
      await waitFor(() => expect(onChange).toHaveBeenCalled());
      const arg = onChange.mock.calls.at(-1)![0] as TableModel;
      expect(arg.data[1][1]).toContain('<img src="https://cdn.example.com/up.png?public=1"');
    });

    it("shows a resize handle when an image in an editing cell is clicked", () => {
      const withImage = model([
        ["", "Q1", "Q2"],
        ["Umsatz", '<img src="https://cdn.example.com/a.png" style="width:200px">', "200"],
        ["Kosten", "50", "60"],
      ]);
      render(<TableEditor value={withImage} onChange={jest.fn()} mediaClient={stubMediaClient()} />);

      const td = cellTd("Zeile 2, Spalte 2");
      fireEvent.doubleClick(td);
      const img = td.querySelector("img")!;
      fireEvent.click(img);

      expect(screen.getByTestId("image-resize-handle")).toBeInTheDocument();
    });

    it("stops resizing on mouseup even when a modal ancestor swallows the event", () => {
      const onChange = jest.fn();
      const withImage = model([
        ["", "Q1", "Q2"],
        ["Umsatz", '<img src="https://cdn.example.com/a.png" style="width:200px">', "200"],
        ["Kosten", "50", "60"],
      ]);
      render(<TableEditor value={withImage} onChange={onChange} mediaClient={stubMediaClient()} />);

      const td = cellTd("Zeile 2, Spalte 2");
      fireEvent.doubleClick(td);
      fireEvent.click(td.querySelector("img")!);

      // Mimic the config-dialog modal: a bubble-phase listener on document.body
      // that stops mouseup from ever reaching a bubble-phase document listener.
      const swallow = (event: Event): void => event.stopPropagation();
      document.body.addEventListener("mouseup", swallow);
      try {
        const handle = screen.getByTestId("image-resize-handle");
        fireEvent.mouseDown(handle, { clientX: 200 });
        fireEvent.mouseMove(document, { clientX: 260 });
        // Dispatched on the handle, so it bubbles up to (and is stopped at) body.
        fireEvent.mouseUp(handle, { clientX: 260 });

        // The capture-phase release handler still ran: one persisted change.
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg = onChange.mock.calls.at(-1)![0] as TableModel;
        expect(arg.data[1][1]).toMatch(/<img[^>]*width:\d+px/);

        // The drag is over: further movement no longer resizes.
        fireEvent.mouseMove(document, { clientX: 600 });
        expect(onChange).toHaveBeenCalledTimes(1);
      } finally {
        document.body.removeEventListener("mouseup", swallow);
      }
    });
  });

  describe("multi-selection and image sizing", () => {
    const imgCell = (name: string, width?: number): string =>
      `<img src="https://cdn.example.com/${name}.png"${width ? ` style="width:${width}px"` : ""}>`;

    /** Two images side by side: "a" (2:1, 300px wide) and "b" (1:1, 40px wide). */
    const withImages = (): TableModel =>
      model([
        ["", "Q1", "Q2"],
        ["Bilder", imgCell("a", 300), imgCell("b", 40)],
      ]);

    const natural: Record<string, { width: number; height: number }> = {
      "https://cdn.example.com/a.png": { width: 600, height: 300 },
      "https://cdn.example.com/b.png": { width: 200, height: 200 },
    };
    const measure = jest.fn(async (src: string) => natural[src] ?? null);

    /** Ctrl/Cmd-click adds a cell to the selection instead of replacing it. */
    const addToSelection = (label: string): void => {
      fireEvent.mouseDown(cellTd(label), { ctrlKey: true });
    };

    it("keeps earlier cells selected when Ctrl-clicking another one", () => {
      render(<TableEditor value={withImages()} onChange={jest.fn()} measure={measure} />);
      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      addToSelection("Zeile 2, Spalte 3");

      expect(cellTd("Zeile 2, Spalte 2")).toHaveClass(SELECTED);
      expect(cellTd("Zeile 2, Spalte 3")).toHaveClass(SELECTED);
    });

    it("applies a format to every cell of a multi-cell selection", () => {
      const onChange = jest.fn();
      render(<TableEditor value={withImages()} onChange={onChange} measure={measure} />);
      fireEvent.mouseDown(cellTd("Zeile 1, Spalte 2"));
      addToSelection("Zeile 2, Spalte 3");
      fireEvent.click(toolbar("toolbar-bold"));

      const arg = onChange.mock.calls.at(-1)![0] as TableModel;
      expect(arg.formats["0,1"]).toEqual({ bold: true });
      expect(arg.formats["1,2"]).toEqual({ bold: true });
    });

    it("enables the image size button as soon as one image is selected", () => {
      render(<TableEditor value={withImages()} onChange={jest.fn()} measure={measure} />);
      expect(toolbar("toolbar-image-size")).toBeDisabled();

      fireEvent.mouseDown(cellTd("Zeile 1, Spalte 2"));
      expect(toolbar("toolbar-image-size")).toBeDisabled();

      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      expect(toolbar("toolbar-image-size")).not.toBeDisabled();
    });

    it("caps images in the preview while the fit option is on", () => {
      const { container } = render(
        <TableEditor value={withImages()} onChange={jest.fn()} measure={measure} />,
      );

      expect(container.querySelector(".table-editor__fit-scope")).toHaveClass(IMAGE_FIT_CLASS);
    });

    it("drops the cap from the preview when the option is off", () => {
      const { container } = render(
        <TableEditor
          value={{ ...withImages(), fitImages: false }}
          onChange={jest.fn()}
          measure={measure}
        />,
      );

      const wrap = container.querySelector(".table-editor__fit-scope");
      expect(wrap).not.toHaveClass(IMAGE_FIT_CLASS);
      expect(wrap).toHaveClass(IMAGE_NO_FIT_CLASS);
    });

    it("keeps the container query off the grid frame", () => {
      // `container-type: inline-size` contains the inline axis, so a box
      // carrying it cannot derive its own width from its contents. Keeping it
      // off the grid frame leaves that frame free to size and scroll itself,
      // so the two responsibilities stay on separate elements.
      const { container } = render(
        <TableEditor value={withImages()} onChange={jest.fn()} measure={measure} />,
      );

      const scope = container.querySelector<HTMLElement>(".table-editor__fit-scope");
      const frame = container.querySelector<HTMLElement>(".table-editor__grid-wrap");
      const css = container.querySelector("style")?.textContent ?? "";

      // The rule lives in the stylesheet, so the check reads it there: exactly
      // one selector declares the containment, and it is the scope's.
      expect(css).toMatch(/\.table-editor__fit-scope\s*\{[^}]*container-type:\s*inline-size/);
      expect(css.match(/container-type/g)).toHaveLength(1);
      expect(frame?.className).not.toContain("fit-scope");
      expect(scope?.contains(frame)).toBe(true);
    });

    it("toggles the fit option from the panel without touching the cells", async () => {
      const onChange = jest.fn();
      render(<TableEditor value={withImages()} onChange={onChange} measure={measure} />);

      const toggle = screen.getByRole("switch", { name: "Bilder anpassen" });
      expect(toggle).toBeChecked();
      // Table-wide, so it works without a selection.
      await userEvent.click(toggle);

      const arg = onChange.mock.calls.at(-1)![0] as TableModel;
      expect(arg.fitImages).toBe(false);
      expect(arg.data).toEqual(withImages().data);
    });

    it("no longer offers the fit option in the Bilder tab", () => {
      render(<TableEditor value={withImages()} onChange={jest.fn()} measure={measure} />);
      fireEvent.click(screen.getByRole("tab", { name: "Bilder" }));

      expect(screen.queryByTestId("toolbar-image-fit")).toBeNull();
    });

    it("offers only the reset option while a single image is selected", () => {
      render(<TableEditor value={withImages()} onChange={jest.fn()} measure={measure} />);
      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      fireEvent.click(toolbar("toolbar-image-size"));

      expect(toolbar("toolbar-image-equal-height")).toBeDisabled();
      expect(toolbar("toolbar-image-equal-width")).toBeDisabled();
      expect(toolbar("toolbar-image-reset-size")).not.toBeDisabled();
    });

    it("scales the other images to the height of the first selected one", async () => {
      const onChange = jest.fn();
      render(<TableEditor value={withImages()} onChange={onChange} measure={measure} />);
      // "a" first: 300px wide at 2:1 -> 150px high. "b" is 1:1, so 150px wide.
      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      addToSelection("Zeile 2, Spalte 3");
      fireEvent.click(toolbar("toolbar-image-size"));
      fireEvent.click(toolbar("toolbar-image-equal-height"));

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      const arg = onChange.mock.calls.at(-1)![0] as TableModel;
      expect(arg.data[1][1]).toContain("width:300px");
      expect(arg.data[1][2]).toContain("width:150px");
    });

    it("takes the reference from the first image, whichever order it was clicked", async () => {
      const onChange = jest.fn();
      render(<TableEditor value={withImages()} onChange={onChange} measure={measure} />);
      // "b" first (40px wide): every image ends up 40px wide.
      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 3"));
      addToSelection("Zeile 2, Spalte 2");
      fireEvent.click(toolbar("toolbar-image-size"));
      fireEvent.click(toolbar("toolbar-image-equal-width"));

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      const arg = onChange.mock.calls.at(-1)![0] as TableModel;
      expect(arg.data[1][1]).toContain("width:40px");
      expect(arg.data[1][2]).toContain("width:40px");
    });

    it("equalizes images of a dragged range too", async () => {
      const onChange = jest.fn();
      render(<TableEditor value={withImages()} onChange={onChange} measure={measure} />);
      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 3"), { shiftKey: true });
      fireEvent.click(toolbar("toolbar-image-size"));
      fireEvent.click(toolbar("toolbar-image-equal-width"));

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      const arg = onChange.mock.calls.at(-1)![0] as TableModel;
      expect(arg.data[1][2]).toContain("width:300px");
    });

    it("resets every selected image to the default width without measuring", async () => {
      const onChange = jest.fn();
      const measureSpy = jest.fn(async () => null);
      render(<TableEditor value={withImages()} onChange={onChange} measure={measureSpy} />);
      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      addToSelection("Zeile 2, Spalte 3");
      fireEvent.click(toolbar("toolbar-image-size"));
      fireEvent.click(toolbar("toolbar-image-reset-size"));

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      const arg = onChange.mock.calls.at(-1)![0] as TableModel;
      expect(arg.data[1][1]).toContain(`width:${DEFAULT_IMAGE_WIDTH}px`);
      expect(arg.data[1][2]).toContain(`width:${DEFAULT_IMAGE_WIDTH}px`);
      expect(measureSpy).not.toHaveBeenCalled();
    });

    it("resets a single selected image too", async () => {
      const onChange = jest.fn();
      render(<TableEditor value={withImages()} onChange={onChange} measure={measure} />);
      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 3"));
      fireEvent.click(toolbar("toolbar-image-size"));
      fireEvent.click(toolbar("toolbar-image-reset-size"));

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      const arg = onChange.mock.calls.at(-1)![0] as TableModel;
      expect(arg.data[1][1]).toContain("width:300px");
      expect(arg.data[1][2]).toContain(`width:${DEFAULT_IMAGE_WIDTH}px`);
    });

    it("warns and changes nothing when no image can be measured", async () => {
      const onChange = jest.fn();
      const alert = jest.spyOn(window, "alert").mockImplementation(() => undefined);
      const unmeasurable = model([["", "Q1", "Q2"], ["Bilder", imgCell("a"), imgCell("b")]]);
      render(
        <TableEditor value={unmeasurable} onChange={onChange} measure={jest.fn(async () => null)} />,
      );
      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      addToSelection("Zeile 2, Spalte 3");
      fireEvent.click(toolbar("toolbar-image-size"));
      fireEvent.click(toolbar("toolbar-image-equal-height"));

      await waitFor(() => expect(alert).toHaveBeenCalled());
      expect(onChange).not.toHaveBeenCalled();
      alert.mockRestore();
    });
  });

  describe("clearing formatting", () => {
    const formatted = (): TableModel =>
      model(
        [
          ["", "Q1"],
          ["Zeile", 'm<sup>2</sup><img src="https://cdn.example.com/a.png" style="width:300px">'],
        ],
        { formats: { "0,1": { bold: true }, "1,1": { color: "#f00" } } },
      );

    const clearVia = (testId: string, value: TableModel): jest.Mock => {
      const onChange = jest.fn();
      render(<TableEditor value={value} onChange={onChange} />);
      fireEvent.click(toolbar("toolbar-clear-format"));
      fireEvent.click(screen.getByTestId(testId));
      return onChange;
    };

    it("resets the whole table when nothing is selected", () => {
      const onChange = clearVia("toolbar-clear-format-all", formatted());

      const arg = onChange.mock.calls.at(-1)![0] as TableModel;
      expect(arg.formats).toEqual({});
      expect(arg.data[1][1]).not.toContain("<sup>");
      expect(arg.data[1][1]).not.toContain("width:300px");
      expect(arg.data[1][1]).toContain("cdn.example.com/a.png");
    });

    it("keeps image widths when only text formatting is cleared", () => {
      const arg = clearVia("toolbar-clear-format-text", formatted()).mock.calls.at(-1)![0] as TableModel;

      expect(arg.formats).toEqual({});
      expect(arg.data[1][1]).toContain("width:300px");
      expect(arg.data[1][1]).not.toContain("<sup>");
    });

    it("keeps cell formats when only image sizes are reset", () => {
      const arg = clearVia("toolbar-clear-format-images", formatted()).mock.calls.at(-1)![0] as TableModel;

      expect(arg.formats).toEqual(formatted().formats);
      expect(arg.data[1][1]).toContain("<sup>2</sup>");
      expect(arg.data[1][1]).not.toContain("width:300px");
    });

    it("limits the reset to the selection", () => {
      const onChange = jest.fn();
      render(<TableEditor value={formatted()} onChange={onChange} />);

      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      fireEvent.click(toolbar("toolbar-clear-format"));
      fireEvent.click(toolbar("toolbar-clear-format-all"));

      const arg = onChange.mock.calls.at(-1)![0] as TableModel;
      expect(arg.formats).toEqual({ "0,1": { bold: true } });
      expect(arg.data[1][1]).not.toContain("<sup>");
    });

    it("stays available without a selection", () => {
      render(<TableEditor value={formatted()} onChange={jest.fn()} />);
      expect(toolbar("toolbar-clear-format")).not.toBeDisabled();
    });
  });

describe("row limit", () => {
  const measure = jest.fn(async () => null);

  const longModel = (rows: number): TableModel => ({
    data: [
      ["", "Wert"],
      ...Array.from({ length: rows }, (_, i) => [`Zeile ${i + 1}`, String(i + 1)]),
    ],
    merges: [],
    formats: {},
    sort: null,
    fitImages: true,
    visibleRows: DEFAULT_VISIBLE_ROWS,
    exportMode: "off",
  });

  it("shows the stored limit", () => {
    render(
      <TableEditor
        value={{ ...longModel(10), visibleRows: 3 }}
        onChange={jest.fn()}
        measure={measure}
      />,
    );

    expect(screen.getByLabelText("Sichtbare Zeilen")).toHaveValue(3);
  });

  it("reports a changed limit", () => {
    const onChange = jest.fn();
    render(<TableEditor value={longModel(10)} onChange={onChange} measure={measure} />);

    fireEvent.change(screen.getByLabelText("Sichtbare Zeilen"), { target: { value: "2" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ visibleRows: 2 }));
  });

  it("ignores an emptied field instead of reading it as zero", () => {
    // Mid-typing NaN must not silently switch collapsing off.
    const onChange = jest.fn();
    render(<TableEditor value={longModel(10)} onChange={onChange} measure={measure} />);

    fireEvent.change(screen.getByLabelText("Sichtbare Zeilen"), { target: { value: "" } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("never collapses the editing grid itself", () => {
    // The grid is a working surface — hiding rows someone is about to edit
    // would serve nothing.
    render(
      <TableEditor
        value={{ ...longModel(10), visibleRows: 2 }}
        onChange={jest.fn()}
        measure={measure}
      />,
    );

    expect(screen.getAllByTestId(/^row-handle-\d+$/)).toHaveLength(11);
    expect(screen.queryByTestId("table-rows-toggle")).toBeNull();
  });
});

  it("keeps the chosen toolbar tab when the cell selection changes", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Bilder" }));
    expect(toolbar("toolbar-image-button")).toBeInTheDocument();

    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    expect(toolbar("toolbar-image-button")).toBeInTheDocument();
    expect(screen.queryByTestId("toolbar-bold")).not.toBeInTheDocument();
  });

  it("lets the grid frame fill the available width", () => {
    render(<TableEditor value={model([["a"]])} onChange={jest.fn()} />);
    const frame = screen.getByTestId("table-editor-grid-wrap");
    expect(frame.style.alignSelf).toBe("");
  });
});

// The lowercase mark (`text-lowercase`) is gone from the editor. Saved tables
// may still carry it; loading them must not bring the class back, because
// man-theme styles it globally and would keep the text in lower case.
describe("retired lowercase mark", () => {
  it("offers no lowercase button in the font tab", () => {
    render(<TableEditor value={model([["MAN"]])} onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Schrift" }));
    expect(screen.queryByTestId("toolbar-lowercase")).toBeNull();
    expect(screen.queryByTitle("Versalien aufheben")).toBeNull();
  });

  it("loads a saved cell carrying the mark without the class, text as typed", () => {
    const { container } = render(
      <TableEditor
        value={model([
          ['<span class="text-lowercase">MAN</span> Truck', 'm<sup class="text-lowercase">2</sup>'],
        ])}
        onChange={jest.fn()}
      />,
    );

    expect(container.querySelector(".text-lowercase")).toBeNull();
    expect(cellDiv("Zeile 1, Spalte 1").innerHTML).toBe("MAN Truck");
    expect(cellDiv("Zeile 1, Spalte 2").innerHTML).toBe("m<sup>2</sup>");
  });
});

describe("export mode", () => {
  it("shows the stored mode in the panel and reports a changed one", async () => {
    const onChange = jest.fn();
    render(<TableEditor value={model([["", "A"], ["x", "1"]], { exportMode: "all" })} onChange={onChange} />);

    expect(screen.getByRole("radio", { name: "Ganze Tabelle" })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: "Mit Zeilenauswahl" }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ exportMode: "select" }));
  });

  it("no longer offers sorting, row limit or export in the Daten tab", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Daten" }));

    for (const testId of ["toolbar-sort", "toolbar-visible-rows", "toolbar-export-mode"]) {
      expect(screen.queryByTestId(testId)).toBeNull();
    }
    expect(screen.getByTestId("toolbar-upload")).toBeInTheDocument();
  });
});

describe("im Rahmen", () => {
  const inView = (view: ConfigView, value: TableModel): void => {
    render(
      <ConfigShellProvider value={{ view, setView: jest.fn(), preview: true, issuesVisible: false }}>
        <TableEditor value={value} onChange={jest.fn()} />
      </ConfigShellProvider>,
    );
  };

  it("zeichnet keine eigenen Knöpfe zum Speichern, Schließen oder für die Hilfe", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);

    for (const testId of ["toolbar-done", "toolbar-close", "toolbar-help", "toolbar-title", "toolbar-dirty", "help-drawer"]) {
      expect(screen.queryByTestId(testId)).toBeNull();
    }
    expect(screen.queryByText("MAN Table Editor")).toBeNull();
    expect(screen.queryByRole("button", { name: /^(Speichern|Schließen|Hilfe)$/ })).toBeNull();
  });

  it("zeigt im Editor Reiter, Gitter und das Panel „Tabelle“", () => {
    inView("editor", sample());

    expect(screen.getByRole("tablist", { name: "Werkzeuggruppen" })).toBeInTheDocument();
    expect(screen.getByTestId("table-editor-grid")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Tabelle" })).toBeInTheDocument();
    expect(screen.queryByTestId("table-preview")).toBeNull();
  });

  it("zeigt in der Ansicht Tablet den Entwurf als Leseansicht, das Panel bleibt", () => {
    inView("tablet", model([["", "Wert"], ["Entwurf", "42"]], { visibleRows: 0 }));

    const preview = screen.getByTestId("table-preview");
    expect(screen.getByRole("region", { name: "Vorschau Tablet" })).toContainElement(preview);
    expect(within(preview).getByRole("rowheader", { name: "Entwurf" })).toBeInTheDocument();
    expect(screen.queryByTestId("table-editor-grid")).toBeNull();
    expect(screen.getByRole("complementary", { name: "Tabelle" })).toBeInTheDocument();
  });
});

describe("in the config modal's shadow root", () => {
  it("opens the context menu next to the editor, not in document.body", async () => {
    render(
      <ConfigModal>
        <TableEditor value={sample()} onChange={jest.fn()} />
      </ConfigModal>,
    );
    const root = document.querySelector(`[${CONFIG_MODAL_HOST_ATTRIBUTE}]`)!.shadowRoot!;
    const td = root.querySelector<HTMLElement>('[aria-label="Zeile 2, Spalte 1"]')!.closest("td")!;

    await act(async () => {
      fireEvent.mouseDown(td);
      fireEvent.contextMenu(td);
    });

    const menu = root.querySelector('[data-testid="table-editor-menu"]');
    expect(menu).not.toBeNull();
    expect(root.querySelector(".man-ui")!.contains(menu)).toBe(true);
    expect(screen.queryByTestId("table-editor-menu")).toBeNull();
  });
});

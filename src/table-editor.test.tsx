import React from "react";
import { screen, render, fireEvent, waitFor } from "@testing-library/react";

import { TableEditor } from "./table-editor";
import { TableModel } from "./table-model";
import * as tableImport from "./table-import";
import { MediaClient, MediaItem } from "./media-client";

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
const stubMediaClient = (overrides: Partial<MediaClient> = {}): MediaClient =>
  ({
    listMedia: jest.fn(async () => ({ items: [mediaItem("a")], total: 1, nextOffset: null })),
    searchMedia: jest.fn(async () => ({ items: [], nextCursor: null })),
    uploadMedia: jest.fn(async () => mediaItem("up")),
    ensurePublicImageUrl: jest.fn(async (m: MediaItem) => `${m.url}?public=1`),
    ...overrides,
  }) as unknown as MediaClient;

const model = (data: string[][], overrides: Partial<TableModel> = {}): TableModel => ({
  data,
  merges: [],
  formats: {},
  sort: null,
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

/** Right-clicks a cell (after selecting it) and returns the context menu. */
const openMenuOnCell = (label: string): HTMLElement => {
  const td = cellTd(label);
  fireEvent.mouseDown(td);
  fireEvent.contextMenu(td);
  return screen.getByTestId("table-editor-menu");
};

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
    expect(td).toHaveStyle({ background: "#eaf4ff" });
  });

  it("selects a whole column via the column handle", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    fireEvent.click(screen.getByTestId("col-handle-1"));
    expect(cellTd("Zeile 1, Spalte 2")).toHaveStyle({ background: "#eaf4ff" });
    expect(cellTd("Zeile 2, Spalte 2")).toHaveStyle({ background: "#eaf4ff" });
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
    expect(screen.getByTestId("toolbar-bold")).toBeDisabled();
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    expect(screen.getByTestId("toolbar-bold")).not.toBeDisabled();
  });

  it("reflects a cell's formatting visually in the editor", () => {
    const formatted = model([["", "Q1"], ["Umsatz", "100"]], {
      formats: { "1,1": { bold: true, align: "right", color: "#ff0000" } },
    });
    render(<TableEditor value={formatted} onChange={jest.fn()} />);

    const cell = cellDiv("Zeile 2, Spalte 2");
    expect(cell).toHaveStyle({ fontWeight: "bold", textAlign: "right", color: "#ff0000" });
  });

  it("enables 'unmerge' only when the selection overlaps a merge", () => {
    const merged = model([["", "Q1", "Q2"], ["Umsatz", "100", "200"]], {
      merges: [{ row: 1, col: 1, rowSpan: 1, colSpan: 2 }],
    });
    render(<TableEditor value={merged} onChange={jest.fn()} />);

    // A plain header cell without a merge -> unmerge disabled.
    fireEvent.mouseDown(cellTd("Zeile 1, Spalte 2"));
    expect(screen.getByTestId("toolbar-unmerge")).toBeDisabled();

    // The merged cell -> unmerge enabled.
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    expect(screen.getByTestId("toolbar-unmerge")).not.toBeDisabled();
  });

  it("applies bold via the toolbar to the selection", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample()} onChange={onChange} />);
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    fireEvent.click(screen.getByTestId("toolbar-bold"));
    const arg = onChange.mock.calls[0][0] as TableModel;
    expect(arg.formats["1,1"]).toEqual({ bold: true });
  });

  it("applies a background colour via the toolbar", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample()} onChange={onChange} />);
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    fireEvent.change(screen.getByTestId("toolbar-bg"), { target: { value: "#ffff00" } });
    const arg = onChange.mock.calls[0][0] as TableModel;
    expect(arg.formats["1,1"]).toEqual({ background: "#ffff00" });
  });

  it("applies a font size via the toolbar", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample()} onChange={onChange} />);
    fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
    fireEvent.change(screen.getByTestId("toolbar-fontsize"), { target: { value: "20" } });
    const arg = onChange.mock.calls[0][0] as TableModel;
    expect(arg.formats["1,1"]).toEqual({ fontSize: 20 });
  });

  it("shows contextual insert (only column) when a full column is selected", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    fireEvent.click(screen.getByTestId("col-handle-1"));
    fireEvent.click(screen.getByTestId("toolbar-insert"));
    expect(screen.getByTestId("toolbar-insert-col-left")).toBeInTheDocument();
    expect(screen.queryByTestId("toolbar-insert-row-above")).not.toBeInTheDocument();
  });

  it("shows both insert options when nothing is selected", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    fireEvent.click(screen.getByTestId("toolbar-insert"));
    expect(screen.getByTestId("toolbar-insert-row-above")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar-insert-col-left")).toBeInTheDocument();
  });

  it("closes a toolbar dropdown when clicking outside it", () => {
    render(<TableEditor value={sample()} onChange={jest.fn()} />);
    fireEvent.click(screen.getByTestId("toolbar-insert"));
    expect(screen.getByTestId("toolbar-insert-menu")).toBeInTheDocument();

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
    fireEvent.click(screen.getByTestId("toolbar-painter"));
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
    fireEvent.change(screen.getByTestId("toolbar-upload"), { target: { files: [file] } });

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
      fireEvent.click(screen.getByTestId("toolbar-image-button"));
      expect(screen.getByTestId("media-picker")).toBeInTheDocument();
    });

    it("inserts the selected image into the active cell", async () => {
      const onChange = jest.fn();
      const client = stubMediaClient();
      render(<TableEditor value={sample()} onChange={onChange} mediaClient={client} />);

      fireEvent.mouseDown(cellTd("Zeile 2, Spalte 2"));
      fireEvent.click(screen.getByTestId("toolbar-image-button"));
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
});

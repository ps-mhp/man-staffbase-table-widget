import React from "react";
import { screen, render, fireEvent } from "@testing-library/react";

import { TableEditor } from "./table-editor";
import { TableData } from "./table-json";

describe("TableEditor", () => {
  const sample: TableData = [
    ["", "Q1", "Q2"],
    ["Umsatz", "100", "200"],
  ];

  it("renders an input for every cell", () => {
    render(<TableEditor value={sample} onChange={jest.fn()} />);

    expect(screen.getByLabelText("Zeile 1, Spalte 2")).toHaveValue("Q1");
    expect(screen.getByLabelText("Zeile 2, Spalte 1")).toHaveValue("Umsatz");
  });

  it("calls onChange with an updated cell value when typing", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Zeile 2, Spalte 2"), {
      target: { value: "150" },
    });

    expect(onChange).toHaveBeenCalledWith([
      ["", "Q1", "Q2"],
      ["Umsatz", "150", "200"],
    ]);
  });

  it("adds a row when clicking '+ Zeile'", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample} onChange={onChange} />);

    fireEvent.click(screen.getByText("+ Zeile"));

    expect(onChange).toHaveBeenCalledWith([
      ["", "Q1", "Q2"],
      ["Umsatz", "100", "200"],
      ["", "", ""],
    ]);
  });

  it("adds a column when clicking '+ Spalte'", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample} onChange={onChange} />);

    fireEvent.click(screen.getByText("+ Spalte"));

    expect(onChange).toHaveBeenCalledWith([
      ["", "Q1", "Q2", ""],
      ["Umsatz", "100", "200", ""],
    ]);
  });

  it("removes a non-header row via its remove button", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Zeile 2 entfernen"));

    expect(onChange).toHaveBeenCalledWith([["", "Q1", "Q2"]]);
  });

  it("removes a non-header column via its remove button", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Spalte 2 entfernen"));

    expect(onChange).toHaveBeenCalledWith([
      ["", "Q2"],
      ["Umsatz", "200"],
    ]);
  });

  it("does not render a remove button for the header row/column corner cell", () => {
    render(<TableEditor value={sample} onChange={jest.fn()} />);

    expect(screen.queryByLabelText("Zeile 1 entfernen")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Spalte 1 entfernen")).not.toBeInTheDocument();
  });

  it("parses a multi-cell paste and writes it via onChange", () => {
    const onChange = jest.fn();
    render(<TableEditor value={sample} onChange={onChange} />);

    const target = screen.getByLabelText("Zeile 2, Spalte 2");
    const clipboardData = {
      getData: () => "150\t250",
    };
    fireEvent.paste(target, { clipboardData });

    expect(onChange).toHaveBeenCalledWith([
      ["", "Q1", "Q2"],
      ["Umsatz", "150", "250"],
    ]);
  });
});

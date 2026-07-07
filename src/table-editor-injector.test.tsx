import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { startTableEditorInjector } from "./table-editor-injector";
import { configurationSchema, uiSchema } from "./configuration-schema";

describe("startTableEditorInjector", () => {
  it("injects a grid editor next to the tabledata textarea and hides the textarea", async () => {
    const { container } = render(
      <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} onSubmit={jest.fn()} />,
    );

    let stop = () => {};
    await act(async () => {
      stop = startTableEditorInjector(container);
    });

    const textarea = container.querySelector<HTMLTextAreaElement>("#root_tabledata")!;
    expect(textarea.style.display).toBe("none");
    expect(container.querySelector('[data-testid="table-editor"]')).not.toBeNull();

    await act(async () => {
      stop();
    });
  });

  it("seeds the injected editor from the textarea's existing value", async () => {
    const { container } = render(
      <Form
        schema={configurationSchema}
        uiSchema={uiSchema}
        validator={validator}
        formData={{ tabledata: JSON.stringify([["", "X"], ["Y", "1"]]) }}
        onSubmit={jest.fn()}
      />,
    );

    let stop = () => {};
    await act(async () => {
      stop = startTableEditorInjector(container);
    });

    expect(container.querySelector('input[aria-label="Zeile 1, Spalte 2"]')).toHaveValue("X");
    expect(container.querySelector('input[aria-label="Zeile 2, Spalte 1"]')).toHaveValue("Y");

    await act(async () => {
      stop();
    });
  });

  it("writes editor changes back into the textarea so RJSF picks them up on submit", async () => {
    const onSubmit = jest.fn();
    const { container } = render(
      <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} onSubmit={onSubmit} />,
    );

    let stop = () => {};
    await act(async () => {
      stop = startTableEditorInjector(container);
    });

    const cell = container.querySelector<HTMLInputElement>('input[aria-label="Zeile 2, Spalte 1"]')!;
    await act(async () => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )!.set!;
      nativeSetter.call(cell, "Geänderte Zeile");
      cell.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const formData = onSubmit.mock.calls[0][0].formData;
    const table = JSON.parse(formData.tabledata);
    expect(table[1][0]).toBe("Geänderte Zeile");

    await act(async () => {
      stop();
    });
  });

  it("does not double-inject when the DOM is scanned again for the same textarea", async () => {
    const { container } = render(
      <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} onSubmit={jest.fn()} />,
    );

    let stop = () => {};
    await act(async () => {
      stop = startTableEditorInjector(container);
    });

    await act(async () => {
      // Trigger additional, unrelated DOM mutations to force the MutationObserver callback
      // to run again; the textarea itself is untouched.
      const marker = document.createElement("span");
      container.appendChild(marker);
      marker.remove();
      await Promise.resolve();
    });

    expect(container.querySelectorAll('[data-testid="table-editor"]').length).toBe(1);

    await act(async () => {
      stop();
    });
  });

  it("does nothing and does not throw when the textarea never appears", () => {
    const detached = document.createElement("div");
    expect(() => startTableEditorInjector(detached)).not.toThrow();
  });

  it("cleanup unmounts the injected editor and restores nothing needed on the textarea", async () => {
    const { container } = render(
      <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} onSubmit={jest.fn()} />,
    );

    let stop = () => {};
    await act(async () => {
      stop = startTableEditorInjector(container);
    });
    expect(container.querySelector('[data-testid="table-editor"]')).not.toBeNull();

    await act(async () => {
      stop();
    });

    expect(container.querySelector('[data-testid="table-editor"]')).toBeNull();
  });
});

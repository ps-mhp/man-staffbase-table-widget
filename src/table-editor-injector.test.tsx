import React from "react";
import { render, act, waitFor, within } from "@testing-library/react";
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
    expect(document.body.querySelector('[data-testid="table-editor"]')).not.toBeNull();

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

    expect(document.body.querySelector('[aria-label="Zeile 1, Spalte 2"]')).toHaveTextContent("X");
    expect(document.body.querySelector('[aria-label="Zeile 2, Spalte 1"]')).toHaveTextContent("Y");

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

    const cell = document.body.querySelector<HTMLDivElement>('[aria-label="Zeile 2, Spalte 1"]')!;
    await act(async () => {
      cell.innerHTML = "Geänderte Zeile";
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

    expect(document.body.querySelectorAll('[data-testid="table-editor"]').length).toBe(1);

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
    expect(document.body.querySelector('[data-testid="table-editor"]')).not.toBeNull();

    await act(async () => {
      stop();
    });

    expect(document.body.querySelector('[data-testid="table-editor"]')).toBeNull();
  });

  it("opens the table editor in a large modal as soon as it is injected", async () => {
    const { container } = render(
      <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} onSubmit={jest.fn()} />,
    );

    let stop = () => {};
    await act(async () => {
      stop = startTableEditorInjector(container);
    });

    const modal = document.body.querySelector('[data-testid="table-editor-modal"]');
    expect(modal).not.toBeNull();
    expect(within(modal as HTMLElement).getByTestId("table-editor")).toBeInTheDocument();
    expect(within(modal as HTMLElement).getByTestId("toolbar-done")).toBeInTheDocument();

    await act(async () => {
      stop();
    });
  });

  it("renders the modal as a portal directly on document.body, not nested inside the form container", async () => {
    // Regression test for: Staffbase wraps the config dialog in a Radix
    // popover that sets `transform: translate(...)` on an ancestor. Per the
    // CSS spec, a `transform` on an ancestor makes it the containing block
    // for `position: fixed` descendants, so a modal nested inline inside the
    // form (as returned directly from InjectedEditor's render tree) gets
    // clipped to the small popover box instead of covering the viewport,
    // appearing as a blank white area. Rendering the modal as a React portal
    // to `document.body` escapes any such ancestor, keeping `position:
    // fixed` targeting the real viewport regardless of where the injector
    // mounts inside the form.
    const { container } = render(
      <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} onSubmit={jest.fn()} />,
    );

    let stop = () => {};
    await act(async () => {
      stop = startTableEditorInjector(container);
    });

    expect(container.querySelector('[data-testid="table-editor-modal"]')).toBeNull();

    const portaledModal = document.body.querySelector(
      ':scope > [data-testid="table-editor-modal"]',
    );
    expect(portaledModal).not.toBeNull();
    expect(within(portaledModal as HTMLElement).getByTestId("table-editor")).toBeInTheDocument();

    await act(async () => {
      stop();
    });

    expect(document.body.querySelector('[data-testid="table-editor-modal"]')).toBeNull();
  });

  it("does not let clicks inside the portaled modal bubble to a document-level outside-click dismiss handler", async () => {
    // Regression test for: Staffbase's Radix Popover determines "outside
    // clicks" via a real DOM-level, bubble-phase `pointerdown` listener on
    // `document`. It skips dismissal only when that pointerdown's *capture*
    // phase already passed through the popover's own DOM node (Radix wires
    // a capture-phase `onPointerDownCapture` handler directly on the
    // popover content div for this). Because our modal is portaled
    // directly onto `document.body` -- a DOM sibling of the popover, not a
    // descendant -- clicks inside it never pass through that capture
    // handler, so Radix's document listener used to see them as "outside"
    // and dismiss the whole popover, taking our injected editor down with
    // it.
    let capturedInsidePopoverDom = false;
    const popoverStandIn = document.createElement("div");
    popoverStandIn.setAttribute("data-testid", "popover-stand-in");
    // Mirrors Radix's `onPointerDownCapture` prop on the popover's own
    // content div: a capture-phase listener on that specific DOM node.
    popoverStandIn.addEventListener(
      "pointerdown",
      () => {
        capturedInsidePopoverDom = true;
      },
      true,
    );
    document.body.appendChild(popoverStandIn);

    const onDismiss = jest.fn();
    // Mirrors Radix's own document-level, bubble-phase dismiss listener.
    document.addEventListener("pointerdown", () => {
      if (!capturedInsidePopoverDom) {
        onDismiss();
      }
      capturedInsidePopoverDom = false;
    });

    const { container } = render(
      <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} onSubmit={jest.fn()} />,
    );
    popoverStandIn.appendChild(container);

    let stop = () => {};
    await act(async () => {
      stop = startTableEditorInjector(container);
    });

    const cell = document.body.querySelector<HTMLDivElement>(
      '[aria-label="Zeile 1, Spalte 1"]',
    )!;
    await act(async () => {
      cell.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }));
    });

    expect(onDismiss).not.toHaveBeenCalled();

    await act(async () => {
      stop();
    });
    popoverStandIn.remove();
  });

  it("does not let focusing an input inside the portaled modal bubble to a document-level focusin outside-dismiss handler", async () => {
    // Regression test for Radix `DismissableLayer`'s *second*, independent
    // dismiss mechanism: `useFocusOutside`. Separately from the
    // `pointerdown`-based outside-click detection, Radix also listens for
    // `focusin` bubbling to `document` and dismisses unless that focus
    // move was already seen by the popover's own capture-phase
    // `onFocusCapture` handler on its content div. Focusing one of our
    // portaled editor's `<input>` cells (e.g. via a click) moves focus but
    // never passes through that capture handler, so this path can dismiss
    // the popover even when the pointerdown path above is fully handled.
    let capturedInsidePopoverDom = false;
    const popoverStandIn = document.createElement("div");
    popoverStandIn.setAttribute("data-testid", "popover-stand-in");
    // Mirrors Radix's `onFocusCapture` prop on the popover's own content div.
    popoverStandIn.addEventListener(
      "focusin",
      () => {
        capturedInsidePopoverDom = true;
      },
      true,
    );
    document.body.appendChild(popoverStandIn);

    const onDismiss = jest.fn();
    // Mirrors Radix's own document-level `useFocusOutside` listener.
    document.addEventListener("focusin", () => {
      if (!capturedInsidePopoverDom) {
        onDismiss();
      }
      capturedInsidePopoverDom = false;
    });

    const { container } = render(
      <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} onSubmit={jest.fn()} />,
    );
    popoverStandIn.appendChild(container);

    let stop = () => {};
    await act(async () => {
      stop = startTableEditorInjector(container);
    });

    const cell = document.body.querySelector<HTMLDivElement>(
      '[aria-label="Zeile 1, Spalte 1"]',
    )!;
    await act(async () => {
      cell.focus();
    });

    expect(onDismiss).not.toHaveBeenCalled();

    await act(async () => {
      stop();
    });
    popoverStandIn.remove();
  });

  it("closes the modal and shows a placeholder button when Fertig is clicked", async () => {
    const { container } = render(
      <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} onSubmit={jest.fn()} />,
    );

    let stop = () => {};
    await act(async () => {
      stop = startTableEditorInjector(container);
    });

    await act(async () => {
      within(document.body.querySelector('[data-testid="table-editor-modal"]') as HTMLElement)
        .getByTestId("toolbar-done")
        .click();
    });

    expect(document.body.querySelector('[data-testid="table-editor-modal"]')).toBeNull();
    const reopenButton = container.querySelector('[data-testid="table-editor-reopen"]');
    expect(reopenButton).not.toBeNull();
    expect(reopenButton?.textContent).toContain("Tabelle bearbeiten");

    await act(async () => {
      stop();
    });
  });

  it("reopens the modal, keeping prior edits, when the placeholder button is clicked", async () => {
    const { container } = render(
      <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} onSubmit={jest.fn()} />,
    );

    let stop = () => {};
    await act(async () => {
      stop = startTableEditorInjector(container);
    });

    const cell = document.body.querySelector<HTMLDivElement>('[aria-label="Zeile 2, Spalte 1"]')!;
    await act(async () => {
      cell.innerHTML = "Bearbeitete Zeile";
      cell.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      within(document.body.querySelector('[data-testid="table-editor-modal"]') as HTMLElement)
        .getByTestId("toolbar-done")
        .click();
    });

    await act(async () => {
      (container.querySelector('[data-testid="table-editor-reopen"]') as HTMLButtonElement).click();
    });

    const modal = document.body.querySelector('[data-testid="table-editor-modal"]');
    expect(modal).not.toBeNull();
    expect(
      within(modal as HTMLElement).getByLabelText("Zeile 2, Spalte 1"),
    ).toHaveTextContent("Bearbeitete Zeile");

    await act(async () => {
      stop();
    });
  });
});

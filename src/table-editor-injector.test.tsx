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

/**
 * Der Tabellen-Editor im gemeinsamen Rahmen von `@man/config-ui`: Kopf,
 * Status, Übernehmen, Rückgängig, Hilfe und Rückfrage kommen vom Rahmen; der
 * Editor zeichnet keine eigenen Knöpfe dafür mehr.
 */

import React from "react";
import { render, act, waitFor, within } from "@testing-library/react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { startTableEditorInjector, tableEditorShell } from "./table-editor-injector";
import { configurationSchema, uiSchema } from "./configuration-schema";
import { TableModel, parseTableModel } from "./table-model";
import { DEFAULT_VISIBLE_ROWS } from "./row-collapse";
import { modalRoot, queryAllInModal, queryDeep, queryInModal, settleModal, settleEditor } from "@shared/ui/config-modal.testing";

const EDITOR_SELECTOR = '[data-testid="table-editor"]';
const EDITOR_ROUNDS = 5;

async function open(formData?: { tabledata: string }): Promise<{ container: HTMLElement; stop: () => void }> {
  const { container } = render(
    <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} formData={formData} onSubmit={jest.fn()} />,
  );
  let stop = (): void => {};
  await act(async () => {
    stop = startTableEditorInjector(container);
  });
  await settleEditor(EDITOR_SELECTOR, EDITOR_ROUNDS);
  return { container, stop };
}

/** Tippt in eine Zelle, wie es das `input`-Ereignis des Browsers meldet. */
async function typeIntoCell(label: string, html: string): Promise<void> {
  const cell = queryInModal<HTMLDivElement>(`[aria-label="${label}"]`)!;
  await act(async () => {
    cell.innerHTML = html;
    cell.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const clickInModal = async (testId: string): Promise<void> => {
  await act(async () => {
    queryInModal<HTMLButtonElement>(`[data-testid="${testId}"]`)!.click();
  });
};

const fieldValue = (container: HTMLElement): string =>
  container.querySelector<HTMLTextAreaElement>("#root_tabledata")!.value;

describe("startTableEditorInjector", () => {
  it("injects a grid editor next to the tabledata textarea and hides the textarea", async () => {
    const { container, stop } = await open();

    const textarea = container.querySelector<HTMLTextAreaElement>("#root_tabledata")!;
    expect(textarea.style.display).toBe("none");
    expect(queryInModal('[data-testid="table-editor"]')).not.toBeNull();

    await act(async () => stop());
  });

  it("seeds the injected editor from the textarea's existing value", async () => {
    const { stop } = await open({ tabledata: JSON.stringify([["", "X"], ["Y", "1"]]) });

    expect(queryInModal('[aria-label="Zeile 1, Spalte 2"]')).toHaveTextContent("X");
    expect(queryInModal('[aria-label="Zeile 2, Spalte 1"]')).toHaveTextContent("Y");

    await act(async () => stop());
  });

  it("writes applied editor changes back into the textarea so RJSF picks them up on submit", async () => {
    const onSubmit = jest.fn();
    const { container } = render(
      <Form schema={configurationSchema} uiSchema={uiSchema} validator={validator} onSubmit={onSubmit} />,
    );
    let stop = (): void => {};
    await act(async () => {
      stop = startTableEditorInjector(container);
    });
    await settleEditor(EDITOR_SELECTOR, EDITOR_ROUNDS);

    await typeIntoCell("Zeile 2, Spalte 1", "Geänderte Zeile");
    // Edits stay in the modal's draft until they are applied.
    await clickInModal("config-shell-apply");

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const formData = onSubmit.mock.calls[0][0].formData;
    // The attribute is written as an encoded payload, never as raw JSON — see
    // `@shared/payload` for why.
    expect(formData.tabledata.startsWith("b64:")).toBe(true);
    expect(parseTableModel(formData.tabledata).data[1][0]).toBe("Geänderte Zeile");

    await act(async () => stop());
  });

  it("does not double-inject when the DOM is scanned again for the same textarea", async () => {
    const { container, stop } = await open();

    await act(async () => {
      // Trigger additional, unrelated DOM mutations to force the MutationObserver callback
      // to run again; the textarea itself is untouched.
      const marker = document.createElement("span");
      container.appendChild(marker);
      marker.remove();
      await Promise.resolve();
    });

    expect(queryAllInModal('[data-testid="table-editor"]').length).toBe(1);

    await act(async () => stop());
  });

  it("does nothing and does not throw when the textarea never appears", () => {
    const detached = document.createElement("div");
    expect(() => startTableEditorInjector(detached)).not.toThrow();
  });

  it("cleanup unmounts the injected editor and restores nothing needed on the textarea", async () => {
    const { stop } = await open();
    expect(queryInModal('[data-testid="table-editor"]')).not.toBeNull();

    await act(async () => stop());

    expect(queryInModal('[data-testid="table-editor"]')).toBeNull();
  });

  it("öffnet den Editor im Rahmen mit Widget-Name, Titel und Ansicht-Umschalter", async () => {
    const { stop } = await open();

    expect(modalRoot()!.textContent).toContain("Tabelle");
    expect(modalRoot()!.querySelector("h1")).toHaveTextContent("Tabelle bearbeiten");
    expect(queryInModal('[aria-label="Ansicht"]')).not.toBeNull();
    expect(queryInModal('[data-testid="config-shell-apply"]')).toBeDisabled();
    expect(queryInModal('aside[aria-label="Tabelle"]')).not.toBeNull();

    await act(async () => stop());
  });

  it("zeichnet keine eigenen Knöpfe zum Speichern, Schließen oder für die Hilfe mehr", async () => {
    const { stop } = await open();

    for (const testId of ["toolbar-done", "toolbar-close", "toolbar-help", "toolbar-title", "help-drawer"]) {
      expect(queryInModal(`[data-testid="${testId}"]`)).toBeNull();
    }
    expect(modalRoot()!.textContent).not.toContain("MAN Table Editor");
    expect(modalRoot()!.textContent).not.toContain("Ungespeicherte Änderungen");

    await act(async () => stop());
  });

  it("nennt im Status, wie viele Zellen sich geändert haben", async () => {
    const { stop } = await open();

    await typeIntoCell("Zeile 2, Spalte 1", "Neu");

    expect(queryInModal('[role="status"]')).toHaveTextContent("1 Zelle geändert");

    await act(async () => stop());
  });

  it("zeigt in der Hilfe des Rahmens die Hilfe der Tabelle", async () => {
    const { stop } = await open();

    await clickInModal("config-shell-help");
    await settleModal();

    const help = queryInModal('aside[aria-label="Hilfe"]');
    expect(help).toHaveTextContent("Zellen verbinden und lösen");
    expect(help).toHaveTextContent("Tasten");

    await act(async () => stop());
  });

  it("renders the modal into a shadow root on its own host, not nested inside the form container", async () => {
    // Staffbase's config dialog sets `transform` and `filter` on its popover;
    // a modal nested inline in the form would be clipped to that small box.
    // The modal's host lives outside the form — here on `document.body`, in
    // the Studio in the dialog's top layer.
    const { container, stop } = await open();

    expect(container.querySelector("[data-man-config-modal-host]")).toBeNull();
    expect(document.body.querySelector(":scope > [data-man-config-modal-host]")).not.toBeNull();
    expect(within(queryInModal('[data-testid="table-editor-modal"]') as HTMLElement).getByTestId("table-editor")).toBeInTheDocument();

    await act(async () => stop());

    expect(queryInModal('[data-testid="table-editor-modal"]')).toBeNull();
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
    await settleEditor(EDITOR_SELECTOR, EDITOR_ROUNDS);

    const cell = queryInModal<HTMLDivElement>(
      '[aria-label="Zeile 1, Spalte 1"]',
    )!;
    await act(async () => {
      cell.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true, composed: true }));
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
    await settleEditor(EDITOR_SELECTOR, EDITOR_ROUNDS);

    const cell = queryInModal<HTMLDivElement>(
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

  it("closes the modal and shows a placeholder button when Übernehmen is clicked", async () => {
    const { container, stop } = await open();

    await typeIntoCell("Zeile 2, Spalte 1", "Neu");
    await clickInModal("config-shell-apply");

    expect(queryInModal('[data-testid="table-editor-modal"]')).toBeNull();
    const reopenButton = queryDeep(container, '[data-testid="table-editor-reopen"]');
    expect(reopenButton).not.toBeNull();
    expect(reopenButton?.textContent).toContain("Tabelle bearbeiten");
    expect(parseTableModel(fieldValue(container)).data[1][0]).toBe("Neu");

    await act(async () => stop());
  });

  it("reopens the modal, keeping prior edits, when the placeholder button is clicked", async () => {
    const { container, stop } = await open();

    await typeIntoCell("Zeile 2, Spalte 1", "Bearbeitete Zeile");
    await clickInModal("config-shell-apply");

    await act(async () => {
      (queryDeep(container, '[data-testid="table-editor-reopen"]') as HTMLButtonElement).click();
    });
    await settleEditor(EDITOR_SELECTOR, EDITOR_ROUNDS);

    const modal = queryInModal('[data-testid="table-editor-modal"]');
    expect(modal).not.toBeNull();
    expect(within(modal as HTMLElement).getByLabelText("Zeile 2, Spalte 1")).toHaveTextContent("Bearbeitete Zeile");

    await act(async () => stop());
  });
});

describe("tableEditorShell", () => {
  const saved: TableModel = {
    data: [
      ["", "Q1"],
      ["Umsatz", "100"],
    ],
    merges: [],
    formats: {},
    sort: null,
    fitImages: true,
    visibleRows: DEFAULT_VISIBLE_ROWS,
    exportMode: "off",
  };

  it("meldet sich als Tabelle mit Vorschau und ohne eigene Prüfung", () => {
    expect(tableEditorShell.widgetName).toBe("Tabelle");
    expect(tableEditorShell.title).toBe("Tabelle bearbeiten");
    expect(tableEditorShell.preview).toBe(true);
    expect(tableEditorShell.icon).toBeDefined();
    expect(tableEditorShell.validate).toBeUndefined();
  });

  it("zählt im Status, was sich gegenüber dem übernommenen Stand geändert hat", () => {
    const draft = { ...saved, data: [saved.data[0], ["Umsatz", "110"]] };

    expect(tableEditorShell.statusText?.(draft, saved)).toBe("1 Zelle geändert");
    expect(tableEditorShell.statusText?.({ ...saved, exportMode: "all" }, saved)).toBe("Einstellungen geändert");
  });
});

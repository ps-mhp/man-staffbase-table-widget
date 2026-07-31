import { showGrowl } from "./growl";

const growls = (): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-testid="table-widget-growl"]'));

describe("showGrowl", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    // `runAllTimers`, not `runOnlyPendingTimers`: the fade schedules the actual
    // removal in a nested timer, and only the removal clears the module's
    // "already showing this message" guard. Leaving it set would make the next
    // test's identical message collapse into nothing.
    jest.runAllTimers();
    jest.useRealTimers();
    document.body.innerHTML = "";
  });

  it("renders an accessible growl in the platform's markup shape", () => {
    showGrowl("Etwas ging schief.");

    const [growl] = growls();
    expect(growl.getAttribute("role")).toBe("alert");
    expect(growl.getAttribute("aria-live")).toBe("polite");
    expect(growl.className).toContain("ds-growl");
    expect(growl.className).toContain("ds-growl--warning");
    expect(growl.textContent).toBe("Etwas ging schief.");
  });

  it("appends into the platform's own container when one exists", () => {
    document.body.innerHTML = `<div id="host"><div class="ds-growl ds-growl--success">Widget URL copied</div></div>`;

    showGrowl("Etwas ging schief.");

    expect(growls()[0].parentElement?.id).toBe("host");
    // The platform styles it; no inline colours are imposed on top.
    expect(growls()[0].style.backgroundColor).toBe("");
  });

  it("creates its own positioned container when the platform has none", () => {
    showGrowl("Etwas ging schief.");

    const container = growls()[0].parentElement!;
    expect(container.id).toBe("table-widget-growls");
    expect(container.style.position).toBe("fixed");
    // Self-hosted growls have to be visible without the platform stylesheet.
    expect(growls()[0].style.backgroundColor).not.toBe("");
  });

  it("collapses repeats of the same message", () => {
    showGrowl("Gleiche Meldung.");
    showGrowl("Gleiche Meldung.");
    showGrowl("Andere Meldung.");

    expect(growls()).toHaveLength(2);
  });

  it("removes itself after the given duration", () => {
    showGrowl("Etwas ging schief.", { durationMs: 1000 });
    expect(growls()).toHaveLength(1);

    jest.advanceTimersByTime(1000 + 300);
    expect(growls()).toHaveLength(0);
  });

  it("can be dismissed early, and the message can then be shown again", () => {
    const dismiss = showGrowl("Etwas ging schief.");
    dismiss();
    expect(growls()).toHaveLength(0);

    dismiss(); // second call is a no-op
    showGrowl("Etwas ging schief.");
    expect(growls()).toHaveLength(1);
  });
});

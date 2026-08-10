/*!
 * Copyright 2026, Staffbase SE and contributors.
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

import {
  IMAGE_FIT_BASE_MAX_WIDTH,
  IMAGE_FIT_CLASS,
  IMAGE_FIT_CSS,
  IMAGE_FIT_STEPS,
  IMAGE_NO_FIT_CLASS,
  IMAGE_NO_FIT_CSS,
  imageFitMaxWidth,
} from "./image-fit";

describe("imageFitMaxWidth", () => {
  it("caps below the first breakpoint too", () => {
    // The phone case: without a cap here a pasted 400px image alone is
    // wider than half the screen and the table scrolls sideways.
    expect(imageFitMaxWidth(479)).toBe(IMAGE_FIT_BASE_MAX_WIDTH);
    expect(imageFitMaxWidth(320)).toBe(160);
  });

  it("caps at the step that the container width reaches", () => {
    expect(imageFitMaxWidth(480)).toBe(240);
    expect(imageFitMaxWidth(639)).toBe(240);
    expect(imageFitMaxWidth(640)).toBe(320);
    expect(imageFitMaxWidth(1023)).toBe(320);
    expect(imageFitMaxWidth(1024)).toBe(480);
    expect(imageFitMaxWidth(1279)).toBe(480);
    expect(imageFitMaxWidth(1280)).toBe(640);
    expect(imageFitMaxWidth(2560)).toBe(640);
  });

  it("shrinks a typical pasted image on a narrow viewport", () => {
    // Regression: a 768px viewport leaves the widget about 720px, and a
    // 400px image used to pass through untouched because the cap there
    // was 480px.
    expect(imageFitMaxWidth(720)).toBeLessThan(400);
  });

  it("keeps the cap near half the container", () => {
    for (const width of [320, 480, 640, 1024, 1280, 1920]) {
      const cap = imageFitMaxWidth(width);
      expect(cap).toBeLessThanOrEqual(width * 0.55);
      expect(cap).toBeGreaterThanOrEqual(Math.min(width, 1280) * 0.33);
    }
  });

  it("never exceeds the container itself", () => {
    for (const width of [100, 200, 640, 900, 1024, 1400]) {
      expect(imageFitMaxWidth(width)).toBeLessThanOrEqual(width);
    }
  });

  it("caps monotonically as the container grows", () => {
    const steps = [...IMAGE_FIT_STEPS].map((step) => step.from);
    expect(steps).toEqual([...steps].sort((a, b) => a - b));

    const caps = [IMAGE_FIT_BASE_MAX_WIDTH, ...IMAGE_FIT_STEPS.map((s) => s.maxWidth)];
    expect(caps).toEqual([...caps].sort((a, b) => a - b));
  });
});

describe("IMAGE_FIT_CSS", () => {
  it("scopes every rule to the fit class", () => {
    const selectors = IMAGE_FIT_CSS.match(/\.[a-z.-]+ img/g) ?? [];
    expect(selectors.length).toBeGreaterThan(0);
    selectors.forEach((selector) =>
      expect(selector).toBe(`.${IMAGE_FIT_CLASS}.${IMAGE_FIT_CLASS} img`),
    );
  });

  it("outranks a single-class rule from the host page", () => {
    // Staffbase's article styles (`.content img { max-width: 100% }`) load
    // after the widget, so equal specificity would lose.
    expect(IMAGE_FIT_CSS).toContain(`.${IMAGE_FIT_CLASS}.${IMAGE_FIT_CLASS} img`);
    expect(IMAGE_FIT_CSS).toContain("!important");
  });

  it("measures the container, not the cell", () => {
    // A percentage would resolve against the auto-layout cell width and let
    // the column squeeze the image; `cqw` resolves against the wrapper.
    expect(IMAGE_FIT_CSS).toContain("100cqw");
    expect(IMAGE_FIT_CSS).toContain(`min(100cqw, ${IMAGE_FIT_BASE_MAX_WIDTH}px)`);
    expect(IMAGE_FIT_CSS).not.toMatch(/max-width:\s*\d+%/);
  });

  it("keeps the aspect ratio", () => {
    expect(IMAGE_FIT_CSS).toContain("height: auto");
  });

  it("has a container query per step", () => {
    IMAGE_FIT_STEPS.forEach(({ from, maxWidth }) => {
      expect(IMAGE_FIT_CSS).toContain(`@container (min-width: ${from}px)`);
      expect(IMAGE_FIT_CSS).toContain(`min(100cqw, ${maxWidth}px)`);
    });
  });
});

describe("IMAGE_NO_FIT_CSS", () => {
  it("lifts any cap the host page would impose", () => {
    expect(IMAGE_NO_FIT_CSS).toContain(`.${IMAGE_NO_FIT_CLASS}.${IMAGE_NO_FIT_CLASS} img`);
    expect(IMAGE_NO_FIT_CSS).toContain("max-width: none !important");
  });

  it("uses a class of its own", () => {
    expect(IMAGE_NO_FIT_CLASS).not.toBe(IMAGE_FIT_CLASS);
    expect(IMAGE_NO_FIT_CSS).not.toContain(IMAGE_FIT_CLASS);
  });
});

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
  IMAGE_FIT_CLASS,
  IMAGE_FIT_CSS,
  IMAGE_FIT_STEPS,
  imageFitMaxWidth,
} from "./image-fit";

describe("imageFitMaxWidth", () => {
  it("allows the full container below the first breakpoint", () => {
    expect(imageFitMaxWidth(320)).toBe(320);
    expect(imageFitMaxWidth(639)).toBe(639);
  });

  it("caps at the step that the container width reaches", () => {
    expect(imageFitMaxWidth(640)).toBe(480);
    expect(imageFitMaxWidth(1023)).toBe(480);
    expect(imageFitMaxWidth(1024)).toBe(640);
    expect(imageFitMaxWidth(1279)).toBe(640);
    expect(imageFitMaxWidth(1280)).toBe(768);
    expect(imageFitMaxWidth(2560)).toBe(768);
  });

  it("never exceeds the container itself", () => {
    for (const width of [200, 640, 900, 1024, 1400]) {
      expect(imageFitMaxWidth(width)).toBeLessThanOrEqual(width);
    }
  });

  it("caps monotonically as the container grows", () => {
    const steps = [...IMAGE_FIT_STEPS].map((step) => step.from);
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
  });
});

describe("IMAGE_FIT_CSS", () => {
  it("scopes every rule to the fit class", () => {
    const selectors = IMAGE_FIT_CSS.match(/\.[a-z-]+ img/g) ?? [];
    expect(selectors.length).toBeGreaterThan(0);
    selectors.forEach((selector) => expect(selector).toBe(`.${IMAGE_FIT_CLASS} img`));
  });

  it("measures the container, not the cell", () => {
    // A percentage would resolve against the auto-layout cell width and let
    // the column squeeze the image; `cqw` resolves against the wrapper.
    expect(IMAGE_FIT_CSS).toContain("100cqw");
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

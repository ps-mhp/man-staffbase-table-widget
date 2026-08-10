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

/**
 * The optional cap that keeps inline images from blowing up the table's
 * layout, expressed purely in CSS so the stored image width stays untouched
 * and the option can be switched off without losing anything.
 *
 * The cap deliberately measures the **table's own container**, not the cell:
 * a percentage `max-width` on a cell resolves against a width that auto table
 * layout derives from the content, and browsers break that circularity by
 * shrinking the image — which is what made an image in a header-less column
 * collapse. Container query units (`cqw`) resolve against the scroll wrapper,
 * which has a width of its own, so no such cycle exists.
 */

/**
 * Cap steps, keyed by the container width they start at. The thresholds are
 * Tailwind's breakpoints (`sm`, `lg`, `xl`), used here as a familiar,
 * already-tuned ladder rather than as a dependency — the project ships no
 * Tailwind.
 *
 * Below the first threshold the image may use the full container; from there
 * on it is additionally capped in pixels, so a wide screen shows a readable
 * image next to the remaining columns instead of one that fills the row.
 */
export interface ImageFitStep {
  /** Container width, in pixels, from which this cap applies. */
  from: number;
  /** Largest rendered image width, in pixels, at that size. */
  maxWidth: number;
}

export const IMAGE_FIT_STEPS: ReadonlyArray<ImageFitStep> = [
  { from: 640, maxWidth: 480 },
  { from: 1024, maxWidth: 640 },
  { from: 1280, maxWidth: 768 },
];

/**
 * Class that enables the cap. It is set on the element that also carries
 * `container-type: inline-size`, so `100cqw` inside it is exactly the width
 * available to the table.
 */
export const IMAGE_FIT_CLASS = "tw-fit-images";

/**
 * Scoped stylesheet implementing the cap. `min()` combines the two rules —
 * never wider than the container, and never wider than the step — so a single
 * declaration covers both; the container queries then only have to lower the
 * pixel half of it.
 *
 * `height:auto` is what makes the width cap keep the aspect ratio: the
 * markup only ever stores a width, so the height follows.
 */
export const IMAGE_FIT_CSS = [
  `.${IMAGE_FIT_CLASS} img { max-width: 100cqw; height: auto; }`,
  ...IMAGE_FIT_STEPS.map(
    ({ from, maxWidth }) =>
      `@container (min-width: ${from}px) { .${IMAGE_FIT_CLASS} img { max-width: min(100cqw, ${maxWidth}px); } }`,
  ),
].join("\n");

/**
 * The cap that applies at a given container width — the same value the
 * stylesheet resolves to, exposed for tests and for callers that need the
 * number rather than the rule.
 */
export function imageFitMaxWidth(containerWidth: number): number {
  const step = [...IMAGE_FIT_STEPS]
    .reverse()
    .find(({ from }) => containerWidth >= from);
  return step ? Math.min(containerWidth, step.maxWidth) : containerWidth;
}

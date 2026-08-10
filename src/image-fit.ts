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
 *
 * Both rule sets have to win against the host page. Staffbase ships article
 * styles like `.content img { max-width: 100% }`, which have the same
 * specificity as a single class of ours and are loaded after the widget, so
 * they would otherwise take over — and being a percentage, they reintroduce
 * exactly the cell-derived shrinking described above: two identical images
 * end up different sizes because their columns hold different amounts of
 * text. The selectors therefore repeat the class (raising specificity
 * without inventing markup) and mark `max-width` as `!important`.
 */

/**
 * Cap steps, keyed by the container width they start at. Each cap is roughly
 * half the container it applies to, which is what actually keeps a table
 * readable: an image may dominate its own column but never the whole row,
 * so the remaining columns still have room and the table fits the viewport.
 *
 * The thresholds are Tailwind's breakpoints (`xs`, `sm`, `lg`, `xl`), used
 * as a familiar, already-tuned ladder rather than as a dependency — the
 * project ships no Tailwind.
 *
 * An earlier ladder started at 480px and only tightened from there, which
 * made it useless in practice: the images people paste are around 400px
 * wide, so they never reached any cap and tables kept overflowing on
 * narrow viewports.
 */
export interface ImageFitStep {
  /** Container width, in pixels, from which this cap applies. */
  from: number;
  /** Largest rendered image width, in pixels, at that size. */
  maxWidth: number;
}

/**
 * Cap below the first threshold. It is the base rule rather than a step,
 * because a container query can only ask for a *minimum* width.
 */
export const IMAGE_FIT_BASE_MAX_WIDTH = 160;

export const IMAGE_FIT_STEPS: ReadonlyArray<ImageFitStep> = [
  { from: 480, maxWidth: 240 },
  { from: 640, maxWidth: 320 },
  { from: 1024, maxWidth: 480 },
  { from: 1280, maxWidth: 640 },
];

/**
 * Class that enables the cap. It is set on the element that also carries
 * `container-type: inline-size`, so `100cqw` inside it is exactly the width
 * available to the table.
 */
export const IMAGE_FIT_CLASS = "tw-fit-images";

/**
 * Counterpart for a table with the option switched off. It still needs a
 * rule of its own: without one, the host page's `max-width: 100%` applies
 * and images would keep being squeezed by their column — the very thing the
 * option is supposed to turn off.
 */
export const IMAGE_NO_FIT_CLASS = "tw-unfit-images";

/** Repeated class, so a single-class host rule cannot outrank ours. */
const scope = (className: string): string => `.${className}.${className} img`;

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
  `${scope(IMAGE_FIT_CLASS)} { max-width: min(100cqw, ${IMAGE_FIT_BASE_MAX_WIDTH}px) !important; height: auto; }`,
  ...IMAGE_FIT_STEPS.map(
    ({ from, maxWidth }) =>
      `@container (min-width: ${from}px) { ${scope(IMAGE_FIT_CLASS)} { max-width: min(100cqw, ${maxWidth}px) !important; } }`,
  ),
].join("\n");

/** Stylesheet for the option switched off: render at the stored size. */
export const IMAGE_NO_FIT_CSS = `${scope(IMAGE_NO_FIT_CLASS)} { max-width: none !important; height: auto; }`;

/**
 * The cap that applies at a given container width — the same value the
 * stylesheet resolves to, exposed for tests and for callers that need the
 * number rather than the rule.
 */
export function imageFitMaxWidth(containerWidth: number): number {
  const step = [...IMAGE_FIT_STEPS]
    .reverse()
    .find(({ from }) => containerWidth >= from);
  return Math.min(containerWidth, step ? step.maxWidth : IMAGE_FIT_BASE_MAX_WIDTH);
}

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

import { sanitizeRichText } from "./rich-text";

/**
 * DOM-free helpers for building and manipulating the inline `<img>` markup a
 * cell may contain. All output is funneled through {@link sanitizeRichText}
 * so it is guaranteed to be safe and in the canonical shape the renderers
 * expect; these helpers only concern themselves with *constructing* that
 * input. Keeping the logic here (instead of inline in the editor component)
 * makes it independently unit-testable.
 */

/** Smallest and largest width, in pixels, an inline image may be resized to. */
export const MIN_IMAGE_WIDTH = 24;
export const MAX_IMAGE_WIDTH = 2000;

/** Clamps a (possibly fractional) pixel width into the allowed range. */
export const clampImageWidth = (width: number): number =>
  Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, Math.round(width)));

export interface ImageMarkupOptions {
  src: string;
  alt?: string;
  /** Initial display width in pixels; omitted means intrinsic/auto width. */
  width?: number;
}

/**
 * Builds sanitized `<img>` markup for a cell. The result is already passed
 * through the trusted sanitizer, so an unsafe `src` yields an empty string
 * (the caller can treat that as "nothing to insert").
 */
export function buildImageMarkup({ src, alt, width }: ImageMarkupOptions): string {
  const altAttr = alt ? ` alt="${alt.replace(/"/g, "&quot;")}"` : "";
  const widthAttr =
    typeof width === "number" && Number.isFinite(width)
      ? ` style="width:${clampImageWidth(width)}px"`
      : "";
  return sanitizeRichText(`<img src="${src}"${widthAttr}${altAttr}>`);
}

/** True if the given cell string contains at least one inline image. */
export const cellHasImage = (html: string | null | undefined): boolean =>
  !!html && /<img\b/i.test(html);

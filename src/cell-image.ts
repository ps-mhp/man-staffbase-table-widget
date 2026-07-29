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

/**
 * On-screen width, in pixels, a freshly inserted image gets — and the width
 * the "Standardgröße" toolbar action resets images back to.
 */
export const DEFAULT_IMAGE_WIDTH = 320;

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

/** Number of inline images in a cell. Cheap (regex) — safe for render paths. */
export const countCellImages = (html: string | null | undefined): number =>
  html ? (html.match(/<img\b/gi) ?? []).length : 0;

const parseBody = (html: string): HTMLElement =>
  new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;

/**
 * Reads an image's explicit pixel width from its inline `style="width:Npx"`
 * or its `width` attribute; `null` means it renders at its intrinsic width.
 */
const readWidth = (img: HTMLElement): number | null => {
  const fromStyle = /^(\d+(?:\.\d+)?)px$/.exec(img.style.width ?? "");
  const raw = fromStyle ? fromStyle[1] : img.getAttribute("width");
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
};

export interface CellImage {
  /** Position of the `<img>` inside its cell, in document order. */
  index: number;
  src: string;
  /** Explicit pixel width, or `null` when the image renders intrinsically. */
  width: number | null;
}

/** Lists the inline images of a cell in document order. */
export function listCellImages(html: string | null | undefined): CellImage[] {
  if (!cellHasImage(html)) return [];
  return Array.from(parseBody(html as string).querySelectorAll("img")).map((img, index) => ({
    index,
    src: img.getAttribute("src") ?? "",
    width: readWidth(img),
  }));
}

/**
 * Returns the cell markup with the i-th image's width set to `widths[i]`.
 * An `undefined` entry leaves that image untouched. The result is sanitized,
 * so it is safe to store back into the model.
 */
export function setCellImageWidths(
  html: string | null | undefined,
  widths: ReadonlyArray<number | undefined>,
): string {
  if (!cellHasImage(html)) return sanitizeRichText(html);
  const body = parseBody(html as string);
  Array.from(body.querySelectorAll("img")).forEach((img, index) => {
    const width = widths[index];
    if (typeof width !== "number" || !Number.isFinite(width)) return;
    img.removeAttribute("width");
    img.style.width = `${clampImageWidth(width)}px`;
  });
  return sanitizeRichText(body.innerHTML);
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface SizedImage {
  /** Explicit pixel width from the markup, or `null` for intrinsic size. */
  width: number | null;
  /** Intrinsic size, or `null` when it could not be measured. */
  natural: ImageSize | null;
}

const hasArea = (size: ImageSize | null): size is ImageSize =>
  !!size && size.width > 0 && size.height > 0;

/**
 * Widths that bring a set of images to a common size, with the **first**
 * image acting as the reference:
 *
 * - `"width"` — every image gets the reference's rendered width.
 * - `"height"` — every image gets the width that makes it as tall as the
 *   reference, derived from its own intrinsic aspect ratio (only the width is
 *   persisted in the markup; the height follows via `height:auto`).
 *
 * An image whose intrinsic size is unknown (and that therefore can't be
 * converted) yields `undefined`, i.e. it is left as it is.
 */
export function equalizedWidths(
  mode: "height" | "width",
  images: ReadonlyArray<SizedImage>,
): Array<number | undefined> {
  const reference = images[0];
  if (!reference) return [];
  const referenceWidth = reference.width ?? (hasArea(reference.natural) ? reference.natural.width : null);
  if (referenceWidth === null) return images.map(() => undefined);

  if (mode === "width") return images.map(() => clampImageWidth(referenceWidth));

  if (!hasArea(reference.natural)) return images.map(() => undefined);
  const referenceHeight = (referenceWidth * reference.natural.height) / reference.natural.width;
  return images.map((image) =>
    hasArea(image.natural)
      ? clampImageWidth((referenceHeight * image.natural.width) / image.natural.height)
      : undefined,
  );
}

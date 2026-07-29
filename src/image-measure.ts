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

import { ImageSize } from "./cell-image";

/**
 * Resolves an image's intrinsic (natural) size, or `null` when it can't be
 * loaded. Equalizing image heights needs each image's aspect ratio, which the
 * cell markup doesn't carry — only a width is persisted there.
 */
export type MeasureImage = (src: string) => Promise<ImageSize | null>;

const cache = new Map<string, ImageSize>();

const sizeOf = (img: HTMLImageElement): ImageSize => ({
  width: img.naturalWidth,
  height: img.naturalHeight,
});

/**
 * Prefers an already-decoded `<img>` on the page (the grid renders every cell
 * image, so this is the common case and costs no network round trip) and only
 * falls back to loading a detached probe image. Results are cached per `src`
 * for the lifetime of the page.
 */
export const measureImage: MeasureImage = (src: string): Promise<ImageSize | null> => {
  if (!src) return Promise.resolve(null);
  const cached = cache.get(src);
  if (cached) return Promise.resolve(cached);

  const live = Array.from(document.images ?? []).find(
    (img) => img.getAttribute("src") === src && img.complete && img.naturalWidth > 0,
  );
  if (live) {
    const size = sizeOf(live);
    cache.set(src, size);
    return Promise.resolve(size);
  }

  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => {
      const size = sizeOf(probe);
      if (size.width > 0 && size.height > 0) cache.set(src, size);
      resolve(size.width > 0 && size.height > 0 ? size : null);
    };
    probe.onerror = () => resolve(null);
    probe.src = src;
  });
};

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
 * Sets webpack's runtime `publicPath` so that lazily loaded chunks (e.g. the
 * ExcelJS import used for `.xlsx` upload) are fetched from the SAME location
 * as this bundle rather than from the hosting page's origin.
 *
 * The widget bundle is served from a CDN (jsDelivr) but embedded into pages on
 * a completely different origin (e.g. `*.staffbase.rocks`). Without this,
 * webpack's default `publicPath: "auto"` can resolve the chunk URL against the
 * page origin, so the chunk request 404s ("Loading chunk NNN failed").
 *
 * Must run before any dynamic `import()` executes, so this module is imported
 * first in the entry point. Setting `__webpack_public_path__` updates
 * `__webpack_require__.p` at runtime.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare let __webpack_public_path__: string;

/** Derives the directory URL that this bundle's own script was loaded from. */
function resolveBundleBaseUrl(): string | undefined {
  if (typeof document === "undefined") return undefined;

  const urls: string[] = [];

  // `document.currentScript` points at this bundle while it executes
  // synchronously as a classic <script>.
  const current = document.currentScript as HTMLScriptElement | null;
  if (current && current.src) urls.push(current.src);

  // Fallback: find our bundle among all script tags (covers cases where
  // `currentScript` is null, e.g. deferred/programmatic injection).
  const scripts = Array.from(document.getElementsByTagName("script"));
  for (const script of scripts) {
    if (script.src && /man\.table-widget\.js(\?|#|$)/.test(script.src)) {
      urls.push(script.src);
    }
  }

  for (const url of urls) {
    const lastSlash = url.lastIndexOf("/");
    if (lastSlash !== -1) return url.slice(0, lastSlash + 1);
  }
  return undefined;
}

const baseUrl = resolveBundleBaseUrl();
if (baseUrl) {
  __webpack_public_path__ = baseUrl;
}

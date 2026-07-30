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

import { injectSlotsIntoContent } from "./tinymce-bridge";
import { log } from "./debug-log";

/**
 * Fills the widget's translatable content into the page save request itself.
 *
 * The last resort, and the only station that cannot be bypassed. Everything
 * upstream depends on host internals with no contract behind them: which window
 * the bundle lands in, when the editor is loaded, whether the host serializes
 * through `getContent` at all, whether its own handlers run after ours. Each of
 * those was tried and each left the element empty on the wire.
 *
 * This works on the request body, so it is independent of all of it. It is not
 * elegant and it is not how a widget should have to store its content — see
 * `tinymce-bridge.ts` for why the documented channel cannot.
 *
 * Deliberately narrow: only JSON bodies that already mention the widget are
 * touched, only string values inside them are rewritten, and any failure passes
 * the original body through untouched. A defect here must never cost an author
 * their save.
 */

const WIDGET_MARKER = "<table-widget";

/** Recursively rewrites every string in a parsed JSON value. */
const mapStrings = (value: unknown, rewrite: (text: string) => string): unknown => {
  if (typeof value === "string") return rewrite(value);
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, rewrite));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        mapStrings(item, rewrite),
      ]),
    );
  }
  return value;
};

/**
 * Returns the body with every widget element filled in, or the body unchanged.
 *
 * Goes through `JSON.parse`/`JSON.stringify` rather than editing the raw text:
 * inside a JSON string the widget's attribute quotes are backslash-escaped, so
 * pattern-matching the serialized form would corrupt them. Parsing hands over
 * the real HTML and re-escapes correctly on the way back.
 *
 * Exported for tests.
 */
export function injectIntoRequestBody(body: string): string {
  if (!body.includes(WIDGET_MARKER)) return body;
  try {
    const parsed: unknown = JSON.parse(body);
    let changed = false;
    const rewritten = mapStrings(parsed, (text) => {
      if (!text.includes(WIDGET_MARKER)) return text;
      const filled = injectSlotsIntoContent(text);
      if (filled !== text) changed = true;
      return filled;
    });
    if (!changed) return body;
    log("save request: filled widget content");
    return JSON.stringify(rewritten);
  } catch {
    // Not JSON, or not rewritable. The author's save matters more than this.
    return body;
  }
}

type FetchArgs = Parameters<typeof fetch>;

/**
 * Wraps `fetch` and `XMLHttpRequest.send` so a page save carries the widget's
 * content no matter which of them the host uses.
 *
 * @returns a cleanup function restoring both originals.
 */
export function startSaveInterceptor(): () => void {
  const originalFetch = window.fetch;
  const originalSend = XMLHttpRequest.prototype.send;

  window.fetch = function patchedFetch(...args: FetchArgs): Promise<Response> {
    const [input, init] = args;
    try {
      if (typeof init?.body === "string") {
        const filled = injectIntoRequestBody(init.body);
        if (filled !== init.body) {
          return originalFetch.call(window, input, { ...init, body: filled });
        }
      } else if (typeof Request !== "undefined" && input instanceof Request && input.body !== null) {
        // A body carried by the Request has to be read out, which is async —
        // hence the promise chain rather than a direct call.
        return input
          .clone()
          .text()
          .then((text) => {
            const filled = injectIntoRequestBody(text);
            if (filled === text) return originalFetch.call(window, input, init);
            return originalFetch.call(window, new Request(input, { body: filled }), init);
          });
      }
    } catch {
      // Fall through to the untouched call below.
    }
    return originalFetch.apply(window, args);
  };

  XMLHttpRequest.prototype.send = function patchedSend(
    this: XMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null,
  ): void {
    if (typeof body === "string") {
      try {
        return originalSend.call(this, injectIntoRequestBody(body));
      } catch {
        // Fall through to the untouched call below.
      }
    }
    return originalSend.call(this, body);
  };

  log("save interceptor installed");

  return () => {
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.send = originalSend;
  };
}

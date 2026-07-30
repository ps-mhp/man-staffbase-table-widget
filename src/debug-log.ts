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

const PREFIX = "[table-widget]";
const QUIET_KEY = "table-widget-quiet";

/**
 * Reports what the editor workarounds (`tinymce-bridge.ts`,
 * `save-interceptor.ts`) actually managed to do.
 *
 * Deliberately on by default and deliberately in production. Those two modules
 * depend on host internals that no contract covers — which window the bundle
 * lands in, when the host loads its editor, how it serializes content — and
 * every one of those can fail silently, leaving nothing behind but a save
 * payload that looks like the feature was never built. A log line at each step
 * is the difference between reading the answer and guessing at it.
 *
 * Silence it per browser with:
 *   localStorage.setItem("table-widget-quiet", "1")
 */
export function log(message: string, detail?: unknown): void {
  try {
    if (window.localStorage?.getItem(QUIET_KEY)) return;
  } catch {
    // Storage access can throw (blocked cookies, sandboxed frame). Log anyway.
  }
  if (detail === undefined) console.info(`${PREFIX} ${message}`);
  else console.info(`${PREFIX} ${message}`, detail);
}

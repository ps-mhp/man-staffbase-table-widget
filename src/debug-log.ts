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
 * Reports what the translation interceptor actually managed to do.
 *
 * Deliberately on by default and deliberately in production. The interceptor
 * hangs off a host request/response contract that no public API covers, and it
 * can fail silently — the only visible symptom would be a translated article
 * whose table is still in the source language. A log line at each step is the
 * difference between reading the answer and guessing at it.
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

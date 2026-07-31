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
 * Encoding of the widget's `tabledata` attribute value.
 *
 * The table model is JSON, and JSON is full of `"`. Stored raw, the attribute
 * only survives as long as every consumer of the page HTML re-escapes those
 * quotes. Staffbase's content translation does not: it re-serializes the
 * article HTML and emits the inner quotes unescaped, so the attribute is cut
 * off at the first one and the widget receives `tabledata="{"` — observed in a
 * translated article. The JSON is then unparseable and the table renders as
 * the placeholder default, i.e. looks empty.
 *
 * Base64 removes the failure mode at the source: the stored value is a single
 * run of `A–Z a–z 0–9 + / =` behind a short marker, so it contains nothing
 * that HTML attribute quoting, entity escaping or a machine-translation pass
 * can act on.
 */

/**
 * Marks an encoded value. JSON can never start with this, which is what makes
 * detection unambiguous and lets legacy raw-JSON attributes keep working.
 */
export const PAYLOAD_PREFIX = "b64:";

/** Anything a valid encoded payload may consist of after the marker. */
const BASE64_ONLY = /^[A-Za-z0-9+/]*={0,2}$/;

/** True when `raw` claims to be an encoded payload (it may still be corrupt). */
export const isTablePayload = (raw: string): boolean => raw.startsWith(PAYLOAD_PREFIX);

/**
 * Base64 of the UTF-8 bytes of `text`. Hand-rolled rather than via
 * `TextEncoder` so it works identically in every browser the widget supports
 * and in jsdom, and needs nothing beyond `btoa`.
 */
const utf8ToBase64 = (text: string): string =>
  btoa(
    encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    ),
  );

const base64ToUtf8 = (base64: string): string =>
  decodeURIComponent(
    Array.from(atob(base64), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(
      "",
    ),
  );

/**
 * Wraps a JSON string for storage in the `tabledata` attribute.
 *
 * Never throws: if `btoa` is unavailable the JSON is returned unchanged, which
 * a reader still understands (see {@link decodeTablePayload}). Losing the
 * hardening is bad, losing the author's table would be worse.
 */
export function encodeTablePayload(json: string): string {
  if (typeof btoa !== "function") return json;
  try {
    return `${PAYLOAD_PREFIX}${utf8ToBase64(json)}`;
  } catch {
    return json;
  }
}

/**
 * Reverses {@link encodeTablePayload}.
 *
 * @returns the JSON string, or `null` if `raw` is not an encoded payload or is
 * a corrupt one. Callers distinguish the two via {@link isTablePayload}: a
 * value without the marker is legacy raw JSON and should be read as-is, while
 * a marked value that fails to decode is genuinely broken data.
 */
export function decodeTablePayload(raw: string): string | null {
  if (!isTablePayload(raw)) return null;
  const base64 = raw.slice(PAYLOAD_PREFIX.length);
  if (!BASE64_ONLY.test(base64)) return null;
  if (typeof atob !== "function") return null;
  try {
    return base64ToUtf8(base64);
  } catch {
    return null;
  }
}

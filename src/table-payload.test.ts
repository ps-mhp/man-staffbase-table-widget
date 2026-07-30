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

import {
  PAYLOAD_PREFIX,
  decodeTablePayload,
  encodeTablePayload,
  isTablePayload,
} from "./table-payload";

describe("encodeTablePayload", () => {
  it("round-trips JSON", () => {
    const json = JSON.stringify([["", "A"], ["R", "1"]]);
    expect(decodeTablePayload(encodeTablePayload(json))).toBe(json);
  });

  it("round-trips non-ASCII text and inline image markup", () => {
    const json = JSON.stringify([
      ["Größe", "Fläche in m²"],
      ["Zeile", '<img src="https://cdn.example.com/a.png" style="width:320px">'],
    ]);
    expect(decodeTablePayload(encodeTablePayload(json))).toBe(json);
  });

  it("emits nothing an HTML attribute or a sanitizer could act on", () => {
    const json = JSON.stringify({ data: [["", 'He said "hi" <b>& left</b>']] });
    const encoded = encodeTablePayload(json);
    expect(encoded).not.toMatch(/["'<>&]/);
    expect(encoded.startsWith(PAYLOAD_PREFIX)).toBe(true);
    expect(encoded.slice(PAYLOAD_PREFIX.length)).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
  });

  it("survives being written into and read back out of an HTML attribute", () => {
    // The regression this encoding exists for: a raw-JSON value is cut off at
    // its first quote when the surrounding HTML is re-serialized without
    // escaping, which is what a translated article did.
    const json = JSON.stringify({ data: [["", "Umsatz"], ["Q1", "100"]] });
    const host = document.createElement("div");
    host.innerHTML = `<table-widget tabledata="${encodeTablePayload(json)}"></table-widget>`;
    const attr = host.firstElementChild!.getAttribute("tabledata")!;
    expect(decodeTablePayload(attr)).toBe(json);

    host.innerHTML = `<table-widget tabledata="${json}"></table-widget>`;
    expect(host.firstElementChild!.getAttribute("tabledata")).toBe("{");
  });
});

describe("decodeTablePayload", () => {
  it("returns null for unmarked values so legacy raw JSON is read as-is", () => {
    expect(decodeTablePayload('[["","A"]]')).toBeNull();
    expect(isTablePayload('[["","A"]]')).toBe(false);
  });

  it("returns null for a marked but corrupt value", () => {
    expect(decodeTablePayload(`${PAYLOAD_PREFIX}not base64!!`)).toBeNull();
    expect(isTablePayload(`${PAYLOAD_PREFIX}not base64!!`)).toBe(true);
  });

  it("returns null when the base64 decodes to invalid UTF-8", () => {
    // Valid base64 alphabet, but not a valid UTF-8 byte sequence.
    expect(decodeTablePayload(`${PAYLOAD_PREFIX}////`)).toBeNull();
  });
});

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

import { injectIntoRequestBody, startSaveInterceptor } from "./save-interceptor";
import { serializeTableModel } from "./table-model";
import { parseSlotMarkup } from "./table-dom";

const MODEL = {
  data: [
    ["", "Spalte 1", "Spalte 2"],
    ["Zeile 1", "Car", "Bus"],
  ],
  merges: [],
  formats: {},
  sort: null,
};

const payload = (): string => serializeTableModel(MODEL);

/** The shape the page editor actually posts, as observed in production. */
const saveBody = (): string =>
  JSON.stringify({
    contents: {
      en_US: {
        title: "Table Test",
        content: `<table-widget tabledata="${payload()}" tablemode="slots"></table-widget><p>&nbsp;</p>`,
      },
    },
  });

const contentOf = (body: string): string =>
  (JSON.parse(body) as { contents: { en_US: { content: string } } }).contents.en_US.content;

describe("injectIntoRequestBody", () => {
  it("leaves a body without the widget untouched", () => {
    const body = JSON.stringify({ contents: { en_US: { content: "<p>Hello</p>" } } });
    expect(injectIntoRequestBody(body)).toBe(body);
  });

  it("fills the widget inside the save payload", () => {
    const filled = injectIntoRequestBody(saveBody());
    expect(parseSlotMarkup(contentOf(filled))?.data).toEqual(MODEL.data);
  });

  it("keeps every other field intact", () => {
    const parsed = JSON.parse(injectIntoRequestBody(saveBody())) as {
      contents: { en_US: { title: string; content: string } };
    };
    expect(parsed.contents.en_US.title).toBe("Table Test");
    expect(parsed.contents.en_US.content).toContain("<p>&nbsp;</p>");
    expect(parsed.contents.en_US.content).toContain('tablemode="slots"');
  });

  it("survives the JSON escaping of the attribute quotes", () => {
    // The reason this goes through JSON.parse instead of editing the raw text:
    // in the body the quotes are `\"`, so pattern-matching the escaped form
    // would read a broken attribute value.
    const filled = injectIntoRequestBody(saveBody());
    expect(filled).not.toContain('\\\\"');
    expect(contentOf(filled)).toContain(`tabledata="${payload()}"`);
  });

  it("is idempotent", () => {
    const once = injectIntoRequestBody(saveBody());
    expect(injectIntoRequestBody(once)).toBe(once);
  });

  it("passes a non-JSON body through unchanged", () => {
    const body = "content=%3Ctable-widget%3E";
    expect(injectIntoRequestBody(body)).toBe(body);
  });

  it("passes a malformed JSON body through unchanged", () => {
    const body = '{"contents": <table-widget';
    expect(injectIntoRequestBody(body)).toBe(body);
  });
});

describe("startSaveInterceptor", () => {
  it("rewrites a fetch body and restores fetch on stop", async () => {
    const original = jest.fn(() => Promise.resolve({} as Response));
    window.fetch = original as unknown as typeof fetch;

    const stop = startSaveInterceptor();
    await window.fetch("/api/pages/1", { method: "PUT", body: saveBody() });

    const sent = original.mock.calls[0] as unknown as [string, { body: string }];
    expect(parseSlotMarkup(contentOf(sent[1].body))?.data).toEqual(MODEL.data);

    stop();
    expect(window.fetch).toBe(original);
  });

  it("leaves unrelated fetch calls alone", async () => {
    const original = jest.fn(() => Promise.resolve({} as Response));
    window.fetch = original as unknown as typeof fetch;

    const stop = startSaveInterceptor();
    const body = JSON.stringify({ hello: "world" });
    await window.fetch("/api/other", { method: "POST", body });

    const sent = original.mock.calls[0] as unknown as [string, { body: string }];
    expect(sent[1].body).toBe(body);

    stop();
  });

  it("rewrites an XHR body and restores send on stop", () => {
    const original = jest.fn();
    XMLHttpRequest.prototype.send = original;

    const stop = startSaveInterceptor();
    const request = new XMLHttpRequest();
    request.open("PUT", "/api/pages/1");
    request.send(saveBody());

    const sent = original.mock.calls[0][0] as string;
    expect(parseSlotMarkup(contentOf(sent))?.data).toEqual(MODEL.data);

    stop();
    expect(XMLHttpRequest.prototype.send).toBe(original);
  });

  it("passes a non-string XHR body straight through", () => {
    const original = jest.fn();
    XMLHttpRequest.prototype.send = original;

    const stop = startSaveInterceptor();
    const form = new FormData();
    new XMLHttpRequest().send(form);

    expect(original.mock.calls[0][0]).toBe(form);
    stop();
  });
});

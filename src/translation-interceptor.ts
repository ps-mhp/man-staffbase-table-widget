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

import { log } from "./debug-log";
import { collectStrings, findStringByKey, mapStrings } from "./json-strings";
import { TableModel, encodeTableAttribute, parseTableModel } from "./table-model";
import {
  SELF_REQUEST_HEADER,
  TRANSLATIONS_PATH,
  translateTableModel,
} from "./translation-client";
import { WidgetTag, containsWidget, findWidgetTags, replaceWidgetTags, withTabledata } from "./widget-html";

/**
 * Carries the table through Staffbase's content translation.
 *
 * The problem: the widget's content lives in the `tabledata` attribute,
 * because attributes are the only storage the widget SDK offers, and
 * `POST /api/translations` translates text nodes while leaving attributes
 * alone. So an author who adds a language gets every paragraph translated and
 * a table still in the source language.
 *
 * The fix, in one place: when the editor asks the API to translate an article
 * that contains this widget, a *second* request is sent alongside it with just
 * the table's cell text (see `translation-payload.ts`), and the translated
 * cells are written into the `tabledata` attribute of the response before the
 * editor ever sees it. The editor then puts that response into the target
 * language's tab exactly as it always does, and the author's save persists it —
 * no editor internals, no DOM surgery, no second storage format.
 *
 * The one thing it does depend on is that the editor uses `fetch`. If it ever
 * uses `XMLHttpRequest` instead, patching a response is a different and far
 * more invasive job, so that case is detected and reported loudly rather than
 * half-handled — see {@link diagnostics}.
 *
 * Every failure path returns the host's own response untouched. An article
 * whose table stayed in the source language is a missing feature; an article
 * the editor could not load is a broken one.
 */

/** A widget found in the request body, with the model it currently holds. */
interface SourceWidget {
  readonly tag: WidgetTag;
  readonly model: TableModel;
}

/**
 * What the interceptor has actually managed to do, readable in the browser
 * console via `window.__tableWidgetTranslation`.
 *
 * This hangs off a host request/response contract that nothing documents, and
 * it fails invisibly: the only symptom of a broken step is a table that stayed
 * in the source language, which looks exactly like the feature never shipped.
 */
export const diagnostics = {
  /** True once `fetch` is wrapped. */
  installed: false,
  /** Translation calls seen on `fetch`. */
  requestsSeen: 0,
  /** Of those, the ones whose body contained at least one widget. */
  requestsWithWidget: 0,
  /** Widget tables this bundle sent for translation. */
  tablesTranslated: 0,
  /** Widget tables whose translation failed and were left in the source language. */
  tablesFailed: 0,
  /** Responses this bundle rewrote before handing them on. */
  responsesPatched: 0,
  /** Translation calls seen on `XMLHttpRequest` — see the module comment. */
  xhrRequestsSeen: 0,
  /** Why the last request was passed through untouched, if it was. */
  lastSkipReason: null as string | null,
  /** Language pair of the last handled request. */
  lastLanguages: null as string | null,
};

const publishDiagnostics = (): void => {
  (window as unknown as Record<string, unknown>).__tableWidgetTranslation = diagnostics;
};

const skip = (reason: string): null => {
  diagnostics.lastSkipReason = reason;
  log(`translation passed through: ${reason}`);
  return null;
};

/* ------------------------------------------------------------------ *
 * Request / response plumbing                                        *
 * ------------------------------------------------------------------ */

const urlOf = (input: RequestInfo | URL): string => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

const methodOf = (input: RequestInfo | URL, init?: RequestInit): string =>
  (init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET") ?? "GET")
    .toUpperCase();

/** True when the caller already marked the request as this bundle's own. */
const isSelfRequest = (input: RequestInfo | URL, init?: RequestInit): boolean => {
  const fromInit = new Headers(init?.headers ?? undefined).has(SELF_REQUEST_HEADER);
  if (fromInit) return true;
  return typeof input === "object" && "headers" in input
    ? input.headers.has(SELF_REQUEST_HEADER)
    : false;
};

/**
 * The request body as text, or `null` when it cannot be read without
 * disturbing the request the host is about to send.
 */
const readRequestBody = async (input: RequestInfo | URL, init?: RequestInit): Promise<string | null> => {
  if (typeof init?.body === "string") return init.body;
  if (typeof Request !== "undefined" && input instanceof Request && input.body !== null) {
    try {
      return await input.clone().text();
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Rebuilds a response around a new body, preserving status and headers.
 * `Content-Length` is dropped rather than recomputed: the rewritten body has a
 * different byte length, and a stale value is worse than none.
 */
const withBody = (response: Response, body: string): Response => {
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

/* ------------------------------------------------------------------ *
 * The rewrite itself                                                 *
 * ------------------------------------------------------------------ */

/** Every widget in a parsed request body, in traversal order. */
export function collectSourceWidgets(body: unknown): SourceWidget[] {
  return collectStrings(body)
    .filter(containsWidget)
    .flatMap(findWidgetTags)
    .map((tag) => ({ tag, model: parseTableModel(tag.tabledata) }));
}

/**
 * Writes the translated models into the widget tags of a parsed response body.
 *
 * The rewritten opening tag is built from the tag as it appeared in the
 * **request**, not the response: the translation service is known to
 * re-serialize attribute values without re-escaping them, so the response's
 * copy of the tag may already be corrupt. Only the widget count has to match —
 * anything else means the response is not the article that was sent, and the
 * body is returned untouched.
 *
 * @returns the rewritten body, or `null` when nothing could be matched up.
 */
export function patchResponseBody(
  body: unknown,
  sources: readonly SourceWidget[],
  translated: ReadonlyArray<TableModel | null>,
): { readonly body: unknown } | null {
  const responseTags = collectStrings(body).filter(containsWidget).flatMap(findWidgetTags);
  if (responseTags.length !== sources.length) return null;

  let cursor = 0;
  let patched = false;

  const next = mapStrings(body, (text) => {
    if (!containsWidget(text)) return text;
    const tags = findWidgetTags(text);
    const replacements = tags.map((_, index) => {
      const model = translated[cursor + index];
      if (!model) return null;
      patched = true;
      return withTabledata(sources[cursor + index].tag, encodeTableAttribute(model));
    });
    cursor += tags.length;
    return replaceWidgetTags(text, tags, replacements);
  });

  return patched ? { body: next } : null;
}

/* ------------------------------------------------------------------ *
 * Orchestration                                                      *
 * ------------------------------------------------------------------ */

export interface TranslationInterceptorOptions {
  /** Endpoint to watch for. Defaults to {@link TRANSLATIONS_PATH}. */
  readonly path?: string;
  /** Injectable translator, so the orchestration is testable on its own. */
  readonly translate?: typeof translateTableModel;
}

/**
 * Prepares everything that can be known from the request alone.
 *
 * @returns the work to do, or `null` when this request is none of our
 * business — in which case the caller must not touch it at all.
 */
async function planFor(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  path: string,
): Promise<{ sources: SourceWidget[]; sourceLanguage: string; targetLanguage: string } | null> {
  if (!urlOf(input).includes(path)) return null;
  if (methodOf(input, init) !== "POST") return null;
  if (isSelfRequest(input, init)) return null;

  diagnostics.requestsSeen += 1;

  const raw = await readRequestBody(input, init);
  if (raw === null) return skip("request body not readable");
  if (!containsWidget(raw)) return skip("no table widget in request");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return skip("request body is not JSON");
  }

  const sources = collectSourceWidgets(body);
  if (sources.length === 0) return skip("no widget tag parsed from request");
  diagnostics.requestsWithWidget += 1;

  const sourceLanguage = findStringByKey(body, "sourceLanguage");
  const targetLanguage = findStringByKey(body, "targetLanguage");
  if (!sourceLanguage || !targetLanguage) return skip("language pair missing from request");
  if (sourceLanguage === targetLanguage) return skip("source and target language are equal");

  diagnostics.lastLanguages = `${sourceLanguage} → ${targetLanguage}`;
  diagnostics.lastSkipReason = null;
  return { sources, sourceLanguage, targetLanguage };
}

/**
 * Starts intercepting the editor's translation calls.
 *
 * Safe to call unconditionally at module load: on a live content page the
 * endpoint is never called, so the wrapper only ever forwards.
 *
 * @returns a cleanup function restoring the original `fetch` and `XMLHttpRequest.open`.
 */
export function startTranslationInterceptor({
  path = TRANSLATIONS_PATH,
  translate = translateTableModel,
}: TranslationInterceptorOptions = {}): () => void {
  const originalFetch = window.fetch;
  const originalOpen = XMLHttpRequest.prototype.open;

  window.fetch = async function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    let plan: Awaited<ReturnType<typeof planFor>> = null;
    try {
      plan = await planFor(input, init, path);
    } catch (error) {
      log("translation plan failed; passing request through", error);
    }
    if (plan === null) return originalFetch.call(window, input, init);

    const { sources, sourceLanguage, targetLanguage } = plan;
    log(`translating ${sources.length} table(s)`, { sourceLanguage, targetLanguage });

    // The table translations run alongside the editor's own request rather
    // than after it: they are independent calls to the same endpoint, and
    // serializing them would add their full latency to a spinner the author is
    // already waiting on.
    const tables = Promise.all(
      sources.map(async ({ model }) => {
        try {
          const result = await translate({ model, sourceLanguage, targetLanguage });
          diagnostics.tablesTranslated += 1;
          return result;
        } catch (error) {
          diagnostics.tablesFailed += 1;
          log("table translation failed; leaving it in the source language", error);
          return null;
        }
      }),
    );

    const response = await originalFetch.call(window, input, init);
    const translated = await tables;

    if (translated.every((model) => model === null)) {
      diagnostics.lastSkipReason = "no table could be translated";
      return response;
    }
    if (!response.ok || response.status === 204) {
      diagnostics.lastSkipReason = `response not patchable (HTTP ${response.status})`;
      return response;
    }

    try {
      const text = await response.clone().text();
      const patched = patchResponseBody(JSON.parse(text), sources, translated);
      if (patched === null) {
        diagnostics.lastSkipReason = "response did not match the request's widgets";
        log("translation response left untouched", diagnostics.lastSkipReason);
        return response;
      }
      diagnostics.responsesPatched += 1;
      log("translation response patched");
      return withBody(response, JSON.stringify(patched.body));
    } catch (error) {
      diagnostics.lastSkipReason = "response could not be rewritten";
      log("translation response left untouched", error);
      return response;
    }
  };

  // Diagnostic only. Patching an XHR *response* means faking readyState,
  // status and every event on the instance, which is not worth building
  // speculatively — but silently doing nothing would be indistinguishable from
  // a bug, so the case is made visible instead.
  // `open` is overloaded (with and without the async/credentials tail), so the
  // trailing arguments are forwarded untyped rather than picking one overload
  // and dropping whatever the caller actually passed.
  const forwardOpen = originalOpen as unknown as (
    this: XMLHttpRequest,
    ...args: unknown[]
  ) => void;

  XMLHttpRequest.prototype.open = function patchedOpen(
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ): void {
    if (String(url).includes(path) && method.toUpperCase() === "POST") {
      diagnostics.xhrRequestsSeen += 1;
      log("translation request went through XMLHttpRequest — table not translated", String(url));
    }
    forwardOpen.call(this, method, url, ...rest);
  } as typeof XMLHttpRequest.prototype.open;

  diagnostics.installed = true;
  publishDiagnostics();
  log("translation interceptor installed", { path });

  return () => {
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalOpen;
    diagnostics.installed = false;
  };
}

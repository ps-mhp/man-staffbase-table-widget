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
  containsContentDocumentWidget,
  findContentDocumentBlocks,
  blockPathKey,
  withContentDocumentValues,
} from "@shared/translation/content-document";
import { log } from "@shared/translation/debug-log";
import { showGrowl } from "@shared/translation/growl";
import { collectStrings, findStringByKey, mapStrings } from "@shared/translation/json-strings";
import { WidgetAttributeRef } from "@shared/translation/types";
import {
  WidgetTag, containsWidget, findWidgetTags, replaceWidgetTags, withValue,
} from "@shared/translation/widget-html";
import { TableModel, encodeTableAttribute, parseTableModel } from "./table-model";
import { SELF_REQUEST_HEADER, TRANSLATIONS_PATH } from "@shared/translation/client";
import { translateTableModel } from "./translation-payload";

/** Where this widget keeps its translatable content. */
const TABLE_REF: WidgetAttributeRef = { tagName: "table-widget", attribute: "tabledata" };

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
 * Both editors are served: the classic one sends the page as an HTML string
 * with the widget's element in it (`widget-html.ts`), the new one (Content
 * Designer) sends a tree of blocks with the widget as a `customBlock`
 * (`content-document.ts`). Same endpoint, same language pair, same response
 * rewrite — only *where the table sits in the body* differs, which is what
 * {@link TableCarrier} abstracts over.
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
 * How one body format carries tables: the models found in the request, and how
 * to write the translated ones back into the response.
 *
 * Everything else about the interception — language pair, headers, warnings,
 * failure handling — is identical for both editors, so the format-specific part
 * is confined to this one interface and the two functions that build it.
 */
interface TableCarrier {
  /** Which editor's body shape this is, for the diagnostics. */
  readonly format: "html" | "content-document";
  /** The tables in the request, in the order the translations come back in. */
  readonly models: readonly TableModel[];
  /**
   * Writes the translated models into a parsed response body.
   *
   * @returns the rewritten body, or `null` when nothing could be matched up —
   * in which case the host's own response is handed on untouched.
   */
  patch(body: unknown, translated: ReadonlyArray<TableModel | null>): { readonly body: unknown } | null;
}

/**
 * What the author is told when the table did not make it through.
 *
 * Every one of these ends the same way, because from the author's side the
 * outcome is identical and actionable in only one way: the translated article
 * has a table in the wrong language, and it has to be filled in by hand. The
 * differences between them are a matter for the console and the diagnostics.
 *
 * Silence is not an option here — the editor reports a successful translation
 * either way, so an author who is not told has no reason to check.
 */
const STAYS_IN_SOURCE = "Sie bleibt in der Ausgangssprache und muss manuell übersetzt werden.";

export const MESSAGES = {
  translationFailed: `Tabellen-Widget: Die Tabelle konnte nicht übersetzt werden. ${STAYS_IN_SOURCE}`,
  notInserted: `Tabellen-Widget: Die übersetzte Tabelle konnte nicht eingefügt werden. ${STAYS_IN_SOURCE}`,
  notReadable: `Tabellen-Widget: Die Tabelle konnte nicht zur Übersetzung übergeben werden. ${STAYS_IN_SOURCE}`,
  unsupportedTransport: `Tabellen-Widget: Die Übersetzung der Tabelle wird von dieser Editor-Version nicht unterstützt. ${STAYS_IN_SOURCE}`,
} as const;

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
  /**
   * Whether the editor's last translation request carried `x-csrf-token`. It is
   * copied onto this bundle's own call; without it the endpoint answers 403.
   */
  hostCsrfTokenSeen: false,
  /** Why the last request was passed through untouched, if it was. */
  lastSkipReason: null as string | null,
  /** Language pair of the last handled request. */
  lastLanguages: null as string | null,
  /**
   * Which editor sent the last request carrying a table: `html` for the classic
   * editor, `content-document` for the Content Designer. The first thing to
   * check when the table translates in one editor and not in the other.
   */
  lastFormat: null as "html" | "content-document" | null,
  /** Warnings surfaced to the author. */
  warningsShown: 0,
  /** The last message the author was shown. */
  lastWarning: null as string | null,
};

const publishDiagnostics = (): void => {
  (window as unknown as Record<string, unknown>).__tableWidgetTranslation = diagnostics;
};

/**
 * How the author is told. Replaced at install time by
 * {@link TranslationInterceptorOptions.notify} so the orchestration can be
 * tested without a DOM assertion in every case.
 */
let notifyAuthor: (message: string) => void = (message) => {
  showGrowl(message, { kind: "warning" });
};

const warn = (message: string): void => {
  diagnostics.warningsShown += 1;
  diagnostics.lastWarning = message;
  log(`warning shown: ${message}`);
  try {
    notifyAuthor(message);
  } catch (error) {
    // A failure to render the warning must not take the article's translation
    // down with it.
    log("could not show the warning", error);
  }
};

/**
 * Passes the request through, recording why.
 *
 * `warning` is given only for the cases where a table provably was in the
 * request and provably will not be translated. The everyday reasons — no
 * widget in the content, source and target language equal — are not failures
 * and must stay silent, or the author is warned on every save.
 */
const skip = (reason: string, warning?: string): null => {
  diagnostics.lastSkipReason = reason;
  log(`translation passed through: ${reason}`);
  if (warning !== undefined) warn(warning);
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

/**
 * The headers the editor is about to send, following the Fetch spec's own
 * precedence: `init.headers` replaces a `Request`'s headers rather than
 * merging with them.
 *
 * They are reused verbatim for this bundle's own call — `x-csrf-token` in
 * particular, without which the endpoint answers 403. See `buildHeaders` in
 * `translation-client.ts`.
 */
const hostHeadersOf = (input: RequestInfo | URL, init?: RequestInit): Headers => {
  if (init?.headers !== undefined) return new Headers(init.headers);
  if (typeof input === "object" && "headers" in input) return new Headers(input.headers);
  return new Headers();
};

/** True when the caller already marked the request as this bundle's own. */
const isSelfRequest = (input: RequestInfo | URL, init?: RequestInit): boolean =>
  hostHeadersOf(input, init).has(SELF_REQUEST_HEADER);

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
    .filter((s) => containsWidget(s, TABLE_REF))
    .flatMap((s) => findWidgetTags(s, TABLE_REF))
    .map((tag) => ({ tag, model: parseTableModel(tag.value) }));
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
  const responseTags = collectStrings(body).filter((s) => containsWidget(s, TABLE_REF)).flatMap((s) => findWidgetTags(s, TABLE_REF));
  if (responseTags.length !== sources.length) return null;

  let cursor = 0;
  let patched = false;

  const next = mapStrings(body, (text) => {
    if (!containsWidget(text, TABLE_REF)) return text;
    const tags = findWidgetTags(text, TABLE_REF);
    const replacements = tags.map((_, index) => {
      const model = translated[cursor + index];
      if (!model) return null;
      patched = true;
      return withValue(sources[cursor + index].tag, TABLE_REF, encodeTableAttribute(model));
    });
    cursor += tags.length;
    return replaceWidgetTags(text, tags, replacements);
  });

  return patched ? { body: next } : null;
}

/**
 * The carrier for the classic editor: the page as an HTML string, the widget
 * as its own element inside it.
 */
const htmlCarrier = (body: unknown): TableCarrier | null => {
  const sources = collectSourceWidgets(body);
  if (sources.length === 0) return null;
  return {
    format: "html",
    models: sources.map(({ model }) => model),
    patch: (responseBody, translated) => patchResponseBody(responseBody, sources, translated),
  };
};

/**
 * The carrier for the new editor: the page as a block tree, the widget as a
 * `customBlock` whose `tabledata` is a JSON string rather than an attribute.
 *
 * Blocks are matched by their path (which contains the block's own id), so a
 * response that no longer holds a given block simply leaves that table in the
 * source language instead of writing it somewhere else.
 */
const contentDocumentCarrier = (body: unknown): TableCarrier | null => {
  const tables = findContentDocumentBlocks(body, TABLE_REF);
  if (tables.length === 0) return null;

  return {
    format: "content-document",
    models: tables.map(({ value }) => parseTableModel(value)),
    patch: (responseBody, translated) => {
      const values = new Map<string, string>();
      tables.forEach((table, index) => {
        const model = translated[index];
        if (model) values.set(blockPathKey(table), encodeTableAttribute(model));
      });
      if (values.size === 0) return null;

      const { body: next, applied } = withContentDocumentValues(responseBody, TABLE_REF, values);
      return applied === 0 ? null : { body: next };
    },
  };
};

/**
 * The carrier for whatever the editor just sent, or `null` when the body holds
 * no table this bundle owns.
 */
export function carrierFor(body: unknown): TableCarrier | null {
  return htmlCarrier(body) ?? contentDocumentCarrier(body);
}

/* ------------------------------------------------------------------ *
 * Orchestration                                                      *
 * ------------------------------------------------------------------ */

export interface TranslationInterceptorOptions {
  /** Endpoint to watch for. Defaults to {@link TRANSLATIONS_PATH}. */
  readonly path?: string;
  /** Injectable translator, so the orchestration is testable on its own. */
  readonly translate?: typeof translateTableModel;
  /** How to tell the author. Defaults to a growl; see `growl.ts`. */
  readonly notify?: (message: string) => void;
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
): Promise<{
  carrier: TableCarrier;
  sourceLanguage: string;
  targetLanguage: string;
  hostHeaders: Headers;
} | null> {
  if (!urlOf(input).includes(path)) return null;
  if (methodOf(input, init) !== "POST") return null;
  if (isSelfRequest(input, init)) return null;

  diagnostics.requestsSeen += 1;

  const raw = await readRequestBody(input, init);
  if (raw === null) return skip("request body not readable");
  if (!containsWidget(raw, TABLE_REF) && !containsContentDocumentWidget(raw, TABLE_REF)) {
    return skip("no table widget in request");
  }

  // From here on a widget is provably in the request, so anything that goes
  // wrong costs the author a translated table and has to be said out loud.
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return skip("request body is not JSON", MESSAGES.notReadable);
  }

  const carrier = carrierFor(body);
  if (carrier === null) return skip("no widget parsed from request", MESSAGES.notReadable);
  diagnostics.requestsWithWidget += 1;
  diagnostics.lastFormat = carrier.format;

  const sourceLanguage = findStringByKey(body, "sourceLanguage");
  const targetLanguage = findStringByKey(body, "targetLanguage");
  if (!sourceLanguage || !targetLanguage) {
    return skip("language pair missing from request", MESSAGES.notReadable);
  }
  if (sourceLanguage === targetLanguage) return skip("source and target language are equal");

  const hostHeaders = hostHeadersOf(input, init);
  diagnostics.lastLanguages = `${sourceLanguage} → ${targetLanguage}`;
  diagnostics.hostCsrfTokenSeen = hostHeaders.has("x-csrf-token");
  diagnostics.lastSkipReason = null;
  return { carrier, sourceLanguage, targetLanguage, hostHeaders };
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
  notify,
}: TranslationInterceptorOptions = {}): () => void {
  const originalFetch = window.fetch;
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalNotify = notifyAuthor;
  if (notify) notifyAuthor = notify;

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

    const { carrier, sourceLanguage, targetLanguage, hostHeaders } = plan;
    log(`translating ${carrier.models.length} table(s) from a ${carrier.format} body`, {
      sourceLanguage,
      targetLanguage,
      // The endpoint answers 403 without it, so its absence is the first thing
      // to check when a translation fails.
      csrfToken: hostHeaders.has("x-csrf-token"),
    });

    // The table translations run alongside the editor's own request rather
    // than after it: they are independent calls to the same endpoint, and
    // serializing them would add their full latency to a spinner the author is
    // already waiting on.
    const tables = Promise.all(
      carrier.models.map(async (model) => {
        try {
          const result = await translate({
            model,
            sourceLanguage,
            targetLanguage,
            hostHeaders,
          });
          diagnostics.tablesTranslated += 1;
          return result;
        } catch (error) {
          diagnostics.tablesFailed += 1;
          log("table translation failed; leaving it in the source language", error);
          // Identical messages collapse into one growl, so several failed
          // tables in one article do not stack up the same sentence.
          warn(MESSAGES.translationFailed);
          return null;
        }
      }),
    );

    const response = await originalFetch.call(window, input, init);
    const translated = await tables;

    if (translated.every((model) => model === null)) {
      // Already warned per table above; saying it twice adds nothing.
      diagnostics.lastSkipReason = "no table could be translated";
      return response;
    }
    if (!response.ok || response.status === 204) {
      // The editor's own call failed, so it will show its own error. Ours would
      // only add noise about a table nobody is going to see translated anyway.
      diagnostics.lastSkipReason = `response not patchable (HTTP ${response.status})`;
      return response;
    }

    try {
      const text = await response.clone().text();
      const patched = carrier.patch(JSON.parse(text), translated);
      if (patched === null) {
        diagnostics.lastSkipReason = "response did not match the request's widgets";
        log("translation response left untouched", diagnostics.lastSkipReason);
        warn(MESSAGES.notInserted);
        return response;
      }
      diagnostics.responsesPatched += 1;
      log("translation response patched");
      return withBody(response, JSON.stringify(patched.body));
    } catch (error) {
      diagnostics.lastSkipReason = "response could not be rewritten";
      log("translation response left untouched", error);
      warn(MESSAGES.notInserted);
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
      warn(MESSAGES.unsupportedTransport);
    }
    forwardOpen.call(this, method, url, ...rest);
  } as typeof XMLHttpRequest.prototype.open;

  diagnostics.installed = true;
  publishDiagnostics();
  log("translation interceptor installed", { path });

  return () => {
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalOpen;
    notifyAuthor = originalNotify;
    diagnostics.installed = false;
  };
}

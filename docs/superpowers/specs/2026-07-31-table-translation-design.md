# Table translation via `POST /api/translations`

Status: implemented, unverified against a live tenant.
Date: 2026-07-31

## Problem

The widget stores its table in the `tabledata` attribute, because attributes are
the only storage the widget SDK offers. Staffbase's content translation
(`POST /api/translations`) translates **text nodes and leaves attributes alone**.
An author who adds a language therefore gets every paragraph translated and a
table still in the source language.

Two facts observed on a tenant, both load-bearing here:

1. Attributes are not translated. A `tabledata` full of Spanish prose came back
   untouched while its sibling text was translated.
2. The service re-serializes the article and does **not** re-escape `&quot;`, so
   a raw-JSON attribute is cut off at its first `"`. The widget then receives
   `tabledata="{"` and renders the empty placeholder.

## Rejected: table as child content

An earlier attempt (branch reset at `6420fc1`) wrote the table as child nodes of
`<table-widget>` so the normal translation would reach it. That required
teaching TinyMCE's schema to keep the children, hooking `GetContent`/
`PostProcess`, and finally patching the page **save** request, because the
editor serializes an external widget from tag plus attributes and drops runtime
children. Roughly 600 lines hanging off undocumented host internals, and it
broke the table. Not revisited.

## Design

Keep the attribute as the single storage. Give the table its own translation
call, and put the result into the response the editor is already waiting for.

```
POST /api/translations                 (editor)
   │  intercept the request body
   ├─► find <table-widget tabledata=…>, parse the model
   ├─► POST /api/translations          (ours, cell text only)
   │      <td data-cell="1,1">Auto</td> → <td data-cell="1,1">Car</td>
   ▼
  await the editor's own response
   └─► rebuild the widget's opening tag with the translated tabledata
   ▼
  editor puts the patched HTML into the target language tab
```

Nothing is persisted at that point — the editor only fills the tab, and the
author's save writes it. That is exactly what is wanted: the attribute is part
of the widget's serialized form, which the save provably keeps.

### Modules

| File | Role |
| --- | --- |
| `table-payload.ts` | `b64:` encoding of the attribute value |
| `translation-payload.ts` | model ⇄ translatable HTML with `data-cell` coordinates |
| `translation-client.ts` | the second `POST /api/translations` |
| `widget-html.ts` | find/rewrite `<table-widget>` opening tags in an HTML string |
| `content-document.ts` | find/rewrite the widget's `customBlock` in the new editor's block tree |
| `json-strings.ts` | shape-agnostic access to a JSON body's string leaves |
| `translation-interceptor.ts` | wraps `fetch`, orchestrates, reports diagnostics |

## Addendum: the new editor (Content Designer)

Verified on a live tenant on 2026-07-31 (`/studio/content/page/:id/edit`).

**Storage.** A page is a block tree, not an HTML string. The widget is a
`customBlock` and its attributes are JSON:

```json
"95edb914-…": { "type": "customBlock", "config": { "settings": { "content": {
  "selectedBlock": {
    "customElementName": "table-widget",
    "url": "https://cdn.jsdelivr.net/…/man.table-widget.js",
    "properties": { "tabledata": "b64:…" }
  } } } } }
```

**Rendering needs nothing.** The published page's HTML (`GET /api/pages/:id`)
carries `<sb-custom-block custom-block="{…}">`, which loads the bundle and
mounts `<table-widget tabledata="b64:…">` inside a shadow root. A page that
looks blank in the new editor is an unpublished draft — the live route always
serves the last *published* version.

**Translation needed a second carrier.** The editor calls the same endpoint with
`Content-Type: application/vnd.staffbase.translations.content_document.v1+json`
and a body of `{sourceLanguage, targetLanguage, document: {content, blocks}}`,
and the service returns the document with every `customBlock` untouched —
confirmed by probing it with `tabledata` as `b64:`, as raw JSON, and as HTML,
plus an extra plain-text property: none of them came back translated. So the
interception is the only mechanism, and `translation-interceptor.ts` now picks
its carrier from the body shape: article HTML → `widget-html.ts`, block tree →
`content-document.ts`. Blocks are matched by **path** (which contains the block
id), so a table is written back into its own block or not at all.

**Known limitation.** Studio loads a custom block's bundle only when the block's
config dialog is opened — not on page load, block selection, the add-block
panel, or the preview tab. The interceptor is therefore installed during an
"add language and translate automatically" run only if the author opened the
table's config earlier in the same session. In the classic editor the bundle is
loaded on every admin page, so it always applies there.

### Decisions

**`tabledata` is now written base64-encoded (`b64:…`).** The encoded value
contains nothing HTML attribute quoting, entity escaping or a translation pass
can act on, which removes failure (2) at the source. Reading stays tolerant:
`parseTableModel` accepts `b64:`, the JSON object form, and the legacy
`string[][]` array, so existing instances keep working and heal on next write.

**Cell coordinates ride in `data-cell="row,col"`.** Attributes are not
translated, so coordinates survive; text does not, so it is the cell content.
Merges, formats and the preset sort are keyed by those same coordinates and
never leave the client.

**The rewritten opening tag is built from the tag in the _request_,** not the
response — the response's copy may already be mangled by failure (2).

**Patching is at the `fetch` layer, not the DOM.** The alternative (find the
language tabs, locate the widget, `setAttribute`) needs editor internals and
re-introduces the coupling the rejected design died of.

**The second request reuses the editor's own headers.** A hand-assembled
`Content-Type` + marker call is answered with **403**: the endpoint requires
`x-csrf-token`, and the editor also sends `staffbase-app` and
`x-staffbase-app-version` on every call. Enumerating those here would mean
re-discovering the list whenever Staffbase adds a required header, so whatever
the editor just sent is copied wholesale — same endpoint, same session, correct
by construction. Overridden: `Content-Type` and `Accept` (`application/json`),
plus the self-request marker. Dropped: `x-request-id`, a per-call tracing id
that must not label two different calls. Headers the Fetch spec forbids a
caller to set (`cookie`, `origin`, `sec-*`, `content-length`, …) need no
handling — the browser drops them and sets its own.

**Only `fetch` is handled.** Faking an `XMLHttpRequest` response means faking
`readyState`, `status` and every event on the instance. If the editor ever uses
XHR for this call, `diagnostics.xhrRequestsSeen` counts it and a console line
says so, rather than the feature silently doing nothing.

### Failure behaviour

Every path returns the host's own response untouched: unreadable body, non-JSON
body, missing language pair, failed table translation, non-2xx response, widget
count mismatch between request and response. A table left in the source language
is a missing feature; an article the editor cannot load is a broken one.

**And every one of them that costs the author a translated table says so.** The
editor reports a successful translation either way, so an author who is not
warned has no reason to check the table and finds out after publishing.
Staffbase exposes no documented API for its toasts, so `growl.ts` builds the
platform's own markup (`role="alert" aria-live="polite" class="ds-growl …"`) and
appends it to the platform's growl container when one is in the DOM; otherwise
it creates and positions its own, and adds fallback inline styles so the message
is visible even if the modifier class does not exist. If the real API is ever
identified, `showGrowl` is the single place to redirect.

Warned (message in `MESSAGES`):

| Case | Message |
| --- | --- |
| second API call failed | `translationFailed` |
| response could not be rewritten / widget mismatch | `notInserted` |
| body not JSON, no widget parsed, language pair missing | `notReadable` |
| call went through `XMLHttpRequest` | `unsupportedTransport` |

Deliberately silent: no widget in the article, source and target language equal
(both are everyday states, not failures), and a non-2xx response to the
editor's own call — the editor surfaces that itself, and a second toast about
the table would only add noise. Repeated identical messages collapse into one
growl, so five widgets failing in one article produce one warning.

Translated cells are re-sanitized through `rich-text.ts` before they reach the
model — the string has been through a third-party service and ends up in
`dangerouslySetInnerHTML`. A cell the service emptied keeps its source value.

## Verifying on a dev tenant

`window.__tableWidgetTranslation` reports what actually happened:

```js
{ installed, requestsSeen, requestsWithWidget, tablesTranslated,
  tablesFailed, responsesPatched, xhrRequestsSeen, hostCsrfTokenSeen,
  warningsShown, lastWarning, lastSkipReason, lastLanguages }
```

Console lines are prefixed `[table-widget]`; silence them with
`localStorage.setItem("table-widget-quiet", "1")`.

Expected on a successful run: `requestsWithWidget` and `tablesTranslated` and
`responsesPatched` all incremented by one per added language, `lastSkipReason`
`null`, and a second `POST /api/translations` in the network panel carrying the
`X-Table-Widget-Translation: 1` header.

Diagnosis by symptom:

| Symptom | Meaning |
| --- | --- |
| `requestsSeen` stays 0, `xhrRequestsSeen` rises | editor uses XHR; the fetch hook cannot help |
| `requestsSeen` stays 0, `xhrRequestsSeen` too | different endpoint path, or the bundle is in another frame than the editor |
| `lastSkipReason: "no table widget in request"` | the editor does not send the widget markup for translation |
| `tablesFailed` rises, second call is 403 | `x-csrf-token` missing — check `hostCsrfTokenSeen` |
| `tablesFailed` rises | the second API call is rejected — check its response |
| `responsesPatched` rises but the tab is unchanged | the editor does not take the tab content from this response |

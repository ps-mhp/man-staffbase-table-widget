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
| `json-strings.ts` | shape-agnostic access to a JSON body's string leaves |
| `translation-interceptor.ts` | wraps `fetch`, orchestrates, reports diagnostics |

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

**Only `fetch` is handled.** Faking an `XMLHttpRequest` response means faking
`readyState`, `status` and every event on the instance. If the editor ever uses
XHR for this call, `diagnostics.xhrRequestsSeen` counts it and a console line
says so, rather than the feature silently doing nothing.

### Failure behaviour

Every path returns the host's own response untouched: unreadable body, non-JSON
body, missing language pair, failed table translation, non-2xx response, widget
count mismatch between request and response. A table left in the source language
is a missing feature; an article the editor cannot load is a broken one.

Translated cells are re-sanitized through `rich-text.ts` before they reach the
model — the string has been through a third-party service and ends up in
`dangerouslySetInnerHTML`. A cell the service emptied keeps its source value.

## Verifying on a dev tenant

`window.__tableWidgetTranslation` reports what actually happened:

```js
{ installed, requestsSeen, requestsWithWidget, tablesTranslated,
  tablesFailed, responsesPatched, xhrRequestsSeen, lastSkipReason, lastLanguages }
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
| `tablesFailed` rises | the second API call is rejected — check its response |
| `responsesPatched` rises but the tab is unchanged | the editor does not take the tab content from this response |

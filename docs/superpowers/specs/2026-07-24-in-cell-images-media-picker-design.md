# In-Cell Images with Staffbase Media Picker — Design

**Date:** 2026-07-24
**Status:** Auto-approved under autopilot (user delegated decisions and is unavailable).

## Problem

Authors need to place images inside individual table cells. Images may come
from the clipboard (paste) or from the Staffbase media library, which should be
browsable/searchable through an in-widget "explorer". Any inserted image must be
resizable. Images picked from the library that are not yet public must be
published so that page readers (who have no editing session) can see them.

## Constraints & Findings

- The widget has **no backend**. The whole table is serialized into the single
  `tabledata` config string (see `table-model.ts` / `table-json.ts`).
- `@staffbase/widget-sdk` (v3.18) exposes **no media API** (only theme, users,
  integrations, tokens). Media access therefore uses the **same-origin
  Staffbase REST API** via the editor's session cookie. This is unofficial and
  can break on Staffbase updates; it is **not testable outside a real Staffbase
  instance** (explicitly accepted by the user).
- Relevant REST endpoints (from the provided OpenAPI specs):
  - `GET /api/media?limit&offset` — list media.
  - `GET /api/media/search?query&limit&sort&cursor` — search media (Beta).
  - `POST /api/media` — upload (multipart: `file`, optional `metadata`).
  - `PUT /api/media/publish` — make secure media URLs public (returns
    tokenized public URLs).
- Cells are already rendered from a **string of restricted inline markup**
  (`rich-text.ts` allows only `<sup>`/`<sub>`) via `innerHTML` in both the
  read-only widget (`table-widget.tsx`) and the editor (`table-editor.tsx`).

## Decisions

- **D1 — Media source:** Use the **Media API** (`/api/media`,
  `/api/media/search`). It is the simplest self-contained surface (list +
  search + upload + publish), works with the session cookie, and is not
  feature-gated like the File Manager (`/api/medialibrary/*`, EditorialToken).
- **D2 — Storage:** Embed **hosted, published image URLs** as `<img>` markup in
  the cell string. Not base64 — that would bloat `tabledata` and would not be
  visible to readers. Flow: obtain medium (upload or pick) → publish its URL →
  embed the public URL.
- **D3 — Cell model:** Keep the single-string cell. Extend the allowed inline
  markup to include a sanitized `<img>` (validated `src`, `alt`, pixel
  `width`). Images coexist with text. Fully backward compatible; both renderers
  pick it up automatically.
- **D4 — Resize:** Store width as inline style on the `<img>`
  (`width:Npx;height:auto;max-width:100%`). In the editor, selecting an image
  shows a bottom-right drag handle; dragging updates the width and persists it
  back into the cell markup. Aspect ratio preserved (height auto).
- **D5 — Clipboard paste:** In the cell paste handler, detect image items in
  `clipboardData`. If present, upload → publish → insert `<img>`. Text paste is
  unchanged.
- **D6 — Explorer UI:** A `MediaPicker` modal (portaled to `document.body`,
  like the editor overlay). Debounced search box (empty query → list endpoint),
  scrollable thumbnail grid (uses `transformations.t_preview` preview when
  available, else `resourceInfo.url`), "load more" (offset/cursor), and an
  upload button. Selecting a thumbnail publishes and inserts. Robust
  loading/error/empty states because it cannot be tested against real
  Staffbase.
- **D7 — Auth/base URL:** Same-origin relative URLs (`/api/media`), `fetch`
  with `credentials: "same-origin"`. No configuration. Publish is documented as
  admin-scoped; on failure we still insert the best URL we have and warn
  (console) rather than blocking the author.
- **D8 — Non-image media:** The picker filters to images (`resourceInfo.type
  === "image"`); videos/PDFs are ignored for insertion in this iteration
  (YAGNI).

## Architecture

New, focused modules (each independently testable):

- **`media-client.ts`** — thin wrapper over `fetch` for the Media API:
  `listMedia`, `searchMedia`, `uploadMedia`, `publishUrls`, and a convenience
  `ensurePublicImageUrl(medium)`. `fetch` and base path are injectable so the
  module is unit-testable with a mocked `fetch`. Normalizes the API's
  `MediumSchema` into a small `MediaItem { id, url, previewUrl, fileName,
  width, height }`.
- **`cell-image.ts`** — pure helpers: `buildImageMarkup({src, alt, width})`,
  `withImageWidth(html, ...)`, and width clamping. Keeps DOM-free logic testable.
- **`rich-text.ts`** — extend the sanitizer to allow `<img>` with a validated
  `src` (`https:` or root-relative `/…`), escaped `alt`, and a numeric pixel
  `width` re-emitted as `width:Npx;height:auto;max-width:100%`. Everything else
  on the tag is dropped. `richTextToPlain` treats an image as empty text (with
  its `alt` used for sorting/plain output).
- **`media-picker.tsx`** — the explorer modal component (search, grid, upload,
  select), depending only on an injected `MediaClient`.
- **`table-editor.tsx`** — adds a toolbar "Bild einfügen" action that opens the
  picker for the active cell, wires clipboard image paste, inserts `<img>` into
  the cell markup, and hosts the in-cell resize handle (in `EditableCell`).
- **`table-toolbar.tsx`** — new `onInsertImage` button.
- **`table-widget.tsx`** — no logic change needed; images render via the
  extended sanitizer. Add `height:auto;max-width:100%` safety (already emitted
  by the sanitizer).

## Data Flow

1. **Paste image:** cell paste → `uploadMedia(file)` → `ensurePublicImageUrl` →
   `buildImageMarkup` → inserted at caret → `onInput` persists sanitized HTML.
2. **Pick from library:** toolbar → `MediaPicker` (list/search) → select item →
   `ensurePublicImageUrl` → insert markup into the active cell.
3. **Resize:** select img in editor → drag handle → `img.style.width` updated →
   on release, sanitized HTML written back via `onInput`.
4. **Render (reader):** widget sanitizes the cell string; `<img>` renders at its
   stored width, capped to the cell width.

## Error Handling

- Network/list/search/upload failures surface inline in the picker (message +
  retry); the modal never crashes the editor.
- Publish failure: insert the medium's secure URL and `console.warn` (best
  effort; reader visibility may be limited without admin rights).
- Sanitizer rejects unsafe `src` (e.g. `javascript:`, `data:`) → the image is
  dropped, no XSS surface (consistent with the existing trusted-sanitizer model).

## Testing

- `media-client.test.ts` — mocked `fetch`: URL/params, multipart upload body,
  publish payload, `ensurePublicImageUrl` happy/fallback paths, error mapping.
- `rich-text.test.ts` — `<img>` allowed with safe src + width; unsafe src and
  extra attributes stripped; plain-text extraction uses `alt`.
- `cell-image.test.ts` — markup building and width clamp/replacement.
- `media-picker.test.tsx` — renders items from a mocked client, search debounce,
  select → publish → `onSelect`, error state.
- `table-editor.test.tsx` — toolbar opens picker; inserting an image updates the
  model; (light) resize persists width.

## Out of Scope (YAGNI)

- Browsing the File Manager collections (`/api/medialibrary/*`).
- Non-image media (video/PDF) insertion.
- Cropping/rotation/alt-text editing UI.
- Configurable API base/domain (same-origin only).

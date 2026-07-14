# Search Bar Placement Widget — Design

## Purpose

Provide a second, independent Staffbase widget in this repository (alongside the
existing table widget). The widget is a simple block that drops a text marker
`[[SEARCH_BAR_PLACEMENT]]` into the page content. A bundled script then relocates
the hosting application's search bar (`#search-input`) to the marker's position
and removes the marker.

The result must be built as its own file in `dist/`
(`dist/man.search-bar-widget.js`) without overwriting or altering the existing
`dist/man.table-widget.js`.

## Constraints & Decisions

- **Placeholder token:** fixed constant `SEARCH_BAR_PLACEHOLDER = "[[SEARCH_BAR_PLACEMENT]]"`.
  Not configurable via the widget config dialog.
- **Relocation robustness:** robust. Wait for both the placeholder and
  `#search-input` via a `MutationObserver`; null-guard both lookups; use
  `moveBefore` when supported and fall back to `insertBefore` otherwise.
- **Scope:** production `dist` build only. No dev-server / preview-harness
  wiring for the new widget.
- **Isolation:** no changes to any table-widget source file or its dist output.
  The only edit to an existing file is a single added entry line in
  `webpack.common.ts`. Everything else is additive (new files).

## Architecture

The repo uses a multi-entry webpack build. Each entry maps to one self-contained
`dist/<name>.js` bundle, and each bundle registers a Staffbase custom-element
block via `window.defineBlock(...)`. The existing table widget is entry
`man.table-widget` → `dist/man.table-widget.js`.

The new widget is added as a second entry. Because webpack entries are
independent, the existing bundle is emitted unchanged.

```
webpack.common.ts
  entry:
    "man.table-widget":      "./src/index.tsx"           (unchanged)
    "man.search-bar-widget": "./src/search-bar-index.tsx" (new)
        |
        v
dist/man.search-bar-widget.js  (new, self-contained)
```

## Components

All new source files live flat in `src/` to match the existing layout and the
`tsconfig.json` `include: ["src/*"]` glob (which is not recursive).

### 1. `src/search-bar-index.tsx` — block definition & registration

- Defines the shared constant `SEARCH_BAR_PLACEHOLDER = "[[SEARCH_BAR_PLACEMENT]]"`.
  (Exported so the relocator and tests reuse it.)
- `BlockFactory` returns a class implementing `BaseBlock`. `renderBlock(container)`
  writes the marker with plain DOM: `container.textContent = SEARCH_BAR_PLACEHOLDER`.
  No React is imported, keeping the bundle minimal.
- Starts the relocator once as a module side-effect, mirroring the existing
  `startTableEditorInjector` pattern in `src/index.tsx`:
  `export const stopSearchBarRelocator = startSearchBarRelocator();`
  (Exported only so tests can dispose the observer.)
- `BlockDefinition`: `name: "search-bar-widget"`, `blockLevel: "block"`,
  `label: "Search Bar Placement"`, empty `configurationSchema`/`uiSchema`,
  `iconUrl` = an inline data-URI SVG string (declared in-file; no `.svg` import,
  to avoid the existing repo's overlapping `.svg` webpack loader rules).
- Wraps in `ExternalBlockDefinition` (author/version from `package.json`) and
  calls `window.defineBlock(...)`.

### 2. `src/search-bar-relocator.ts` — relocation logic

Signature: `startSearchBarRelocator(root: ParentNode = document): () => void`
returning a cleanup function (disconnects the observer). The `root` parameter is
exposed for testing, matching the `startTableEditorInjector` convention.

Behavior of the internal `scan()`:

1. Find the placeholder element via a `findPlaceholder(root)` helper: it uses
   XPath `//*[text()='[[SEARCH_BAR_PLACEMENT]]']` (via `document.evaluate`,
   `FIRST_ORDERED_NODE_TYPE`) when `document.evaluate` is available (production
   browsers), and otherwise falls back to walking elements and matching exact
   text content. The fallback keeps the relocator testable under jsdom, which
   does not implement XPath.
2. Find the search bar via `root.querySelector('#search-input')`.
3. If **either** is missing, return (keep observing).
4. Otherwise relocate: move the search bar to just before the placeholder in the
   placeholder's parent, then `placeholder.remove()`.
   - Move strategy: if `typeof parent.moveBefore === "function"`, call
     `parent.moveBefore(searchBar, placeholder)` inside a `try`; on any throw,
     fall back to `parent.insertBefore(searchBar, placeholder)`. If `moveBefore`
     is absent, use `insertBefore` directly.
5. After a successful relocation, disconnect the observer (work is done).

Lifecycle:

- Run `scan()` once synchronously (the placeholder or search bar may already be
  present).
- Then install a `MutationObserver` on `document.body` with
  `{ childList: true, subtree: true, characterData: true }` (characterData so a
  `textContent` write to the marker is observed) and re-run `scan()` on
  mutations.
- Safe/idempotent: on pages that never contain `#search-input`, the observer
  simply never triggers a relocation (a harmless idle observer), matching the
  safety guarantees documented for `startTableEditorInjector`.

### 3. Tests

- `src/search-bar-relocator.test.ts`:
  - Relocates `#search-input` before the placeholder and removes the placeholder
    when both are present.
  - Waits (no throw, no change) when the search bar is missing, then relocates
    once it appears (observer path).
  - Falls back to `insertBefore` when `moveBefore` is unavailable.
  - Cleanup function disconnects the observer.
- `src/search-bar-index.test.tsx`:
  - Registering/appending the `search-bar-widget` element renders the marker
    text `[[SEARCH_BAR_PLACEMENT]]`.

## Data Flow

```
bundle load ─▶ startSearchBarRelocator() ─▶ MutationObserver on document.body
                                                     │
block placed on page ─▶ renderBlock ─▶ container.textContent = marker
                                                     │  (DOM mutation)
                                                     ▼
                                              scan(): marker + #search-input present?
                                                     │ yes
                                                     ▼
                       move #search-input before marker (moveBefore|insertBefore)
                                                     ▼
                                          remove marker; disconnect observer
```

## Error Handling

- Missing placeholder or missing `#search-input`: no-op; keep observing.
- `moveBefore` unsupported or throwing: fall back to `insertBefore`.
- No search bar on the page: observer stays idle; nothing is moved or removed.

## Testing Strategy

Unit tests via the existing Jest + jsdom setup (`jest.config.js`,
`testEnvironment: "jsdom"`). No new test tooling. Since jsdom does not implement
`document.evaluate`/XPath or `moveBefore`, the relocator isolates these behind
the `findPlaceholder` helper (XPath-with-text-content-fallback) and the
`moveBefore`/`insertBefore` strategy, both of which are exercised under jsdom via
the fallback paths and, where needed, small API stubs.

## Out of Scope

- Configurable placeholder token.
- Dev-server/preview-harness integration for the new widget.
- Any change to the table widget's behavior, source, or output bundle.

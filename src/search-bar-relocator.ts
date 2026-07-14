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
 * The literal text marker rendered by the search-bar block (see
 * `search-bar-index.tsx`). The relocator looks for exactly this string to
 * decide where the hosting application's search bar should be moved to.
 */
export const SEARCH_BAR_PLACEHOLDER = "[[SEARCH_BAR_PLACEMENT]]";

/**
 * The id of the hosting application's search input. It lives in the page
 * chrome (outside this widget) and is relocated to the marker's position.
 */
export const SEARCH_INPUT_SELECTOR = "#search-input";

/**
 * A `ParentNode` that may support the DOM Atomic Move API
 * (`Node.prototype.moveBefore`, baseline 2025). Unlike `insertBefore`,
 * `moveBefore` relocates a connected node without unloading/reloading it, so
 * the search bar keeps its state (focus, event wiring, any embedded frame).
 */
type ParentWithMove = ParentNode & {
  moveBefore?: (node: Node, child: Node | null) => void;
};

/**
 * Locates the marker element.
 *
 * In real browsers this uses XPath (`document.evaluate`) to match an element
 * whose direct text is exactly {@link SEARCH_BAR_PLACEHOLDER} — the same query
 * described in the original relocation snippet. XPath `text()=` only inspects
 * direct text-node children, so it naturally returns the innermost element
 * that renders the marker rather than one of its ancestors.
 *
 * jsdom does not implement `document.evaluate`, so a fallback walks the
 * elements under `root` and returns the first *leaf* element whose text equals
 * the marker (a leaf, so an ancestor whose recursive `textContent` merely
 * contains the marker is not matched — mirroring the XPath semantics).
 */
export function findPlaceholder(root: ParentNode = document): Element | null {
  const doc: Document = (root as Node).ownerDocument ?? (root as Document);

  if (typeof doc.evaluate === "function") {
    const result = doc.evaluate(
      `.//*[text()='${SEARCH_BAR_PLACEHOLDER}']`,
      root as Node,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    );
    return (result.singleNodeValue as Element | null) ?? null;
  }

  for (const element of Array.from(root.querySelectorAll("*"))) {
    if (element.children.length === 0 && element.textContent === SEARCH_BAR_PLACEHOLDER) {
      return element;
    }
  }
  return null;
}

/**
 * Moves `searchBar` to sit immediately before `placeholder`.
 *
 * Prefers `moveBefore` (state-preserving atomic move) when the parent supports
 * it, and falls back to `insertBefore` if it is unavailable or throws (e.g. on
 * browsers without the API, or when the atomic-move preconditions are not met).
 */
function moveSearchBar(searchBar: Node, placeholder: Element): void {
  const parent = placeholder.parentNode as ParentWithMove | null;
  if (!parent) return;

  if (typeof parent.moveBefore === "function") {
    try {
      parent.moveBefore(searchBar, placeholder);
      return;
    } catch {
      // Atomic move not possible here — fall back to a plain move below.
    }
  }

  (parent as ParentNode & Node).insertBefore(searchBar, placeholder);
}

/**
 * Starts watching the DOM for both the search-bar marker and the hosting
 * application's search input. As soon as both are present, the search input is
 * moved to the marker's position, the marker is removed, and watching stops.
 *
 * The relocation happens exactly once. Until both elements exist the observer
 * simply keeps waiting, so this is safe to start on bundle load regardless of
 * ordering (the marker is rendered by the block after load) and harmless on
 * pages that have no search bar at all (the observer never fires a move).
 *
 * @param root the subtree to search/observe; defaults to `document`. Exposed
 * for testing so a test can scope the observer to a detached container.
 * @returns a cleanup function that disconnects the observer.
 */
export function startSearchBarRelocator(root: ParentNode = document): () => void {
  let done = false;
  let observer: MutationObserver | null = null;

  const disconnect = (): void => {
    observer?.disconnect();
    observer = null;
  };

  const scan = (): void => {
    if (done) return;

    const placeholder = findPlaceholder(root);
    if (!placeholder) return;

    const searchBar = root.querySelector<HTMLElement>(SEARCH_INPUT_SELECTOR);
    if (!searchBar) return;

    moveSearchBar(searchBar, placeholder);
    placeholder.remove();

    done = true;
    disconnect();
  };

  scan();

  if (!done) {
    const target: Node | null =
      root === document ? (root as Document).body : (root as Element);
    if (target) {
      observer = new MutationObserver(scan);
      observer.observe(target, { childList: true, subtree: true, characterData: true });
    }
  }

  return (): void => {
    done = true;
    disconnect();
  };
}

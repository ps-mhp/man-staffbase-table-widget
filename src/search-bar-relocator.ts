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
 * Default marker text rendered by the block until the search bar takes its
 * place. Also the default value of the block's `placeholder` attribute.
 */
export const SEARCH_BAR_PLACEHOLDER = "[[SEARCH_BAR_PLACEMENT]]";

/** The custom element tag this widget registers. */
export const SEARCH_BAR_WIDGET_TAG = "search-bar-widget";

/**
 * The id of the hosting application's search input. It lives in the page
 * chrome (outside this widget) and is relocated to the block's position.
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
 * Moves `searchBar` to sit immediately before `reference`.
 *
 * Prefers `moveBefore` (state-preserving atomic move) when the parent supports
 * it, and falls back to `insertBefore` if it is unavailable or throws (e.g. on
 * browsers without the API, or when the atomic-move preconditions are not met).
 */
function moveSearchBar(searchBar: Node, reference: Element): void {
  const parent = reference.parentNode as ParentWithMove | null;
  if (!parent) return;

  if (typeof parent.moveBefore === "function") {
    try {
      parent.moveBefore(searchBar, reference);
      return;
    } catch {
      // Atomic move not possible here — fall back to a plain move below.
    }
  }

  (parent as ParentNode & Node).insertBefore(searchBar, reference);
}

/**
 * Starts watching the DOM for a `<search-bar-widget>` block and the hosting
 * application's search input. As soon as both are present, the search input is
 * moved to the block's position, the (now redundant) block is removed, and
 * watching stops.
 *
 * The relocation happens exactly once. Until both elements exist the observer
 * simply keeps waiting, so this is safe to start on bundle load regardless of
 * ordering (the block is rendered after load) and harmless on pages that have
 * no search bar at all (the observer never fires a move).
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

    const widget = root.querySelector(SEARCH_BAR_WIDGET_TAG);
    if (!widget) return;

    const searchBar = root.querySelector<HTMLElement>(SEARCH_INPUT_SELECTOR);
    if (!searchBar) return;

    moveSearchBar(searchBar, widget);
    widget.remove();

    done = true;
    disconnect();
  };

  scan();

  if (!done) {
    const target: Node | null =
      root === document ? (root as Document).body : (root as Element);
    if (target) {
      observer = new MutationObserver(scan);
      observer.observe(target, { childList: true, subtree: true });
    }
  }

  return (): void => {
    done = true;
    disconnect();
  };
}

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
 * Schedules `run` for when the page is ready enough to safely relocate the
 * search bar.
 *
 * The hosting application (a React app) attaches the search bar's event
 * handlers *after* the `#search-input` element is in the DOM. Moving the input
 * before that wiring is complete leaves it non-functional — even though the
 * move itself preserves the node (moving the same input manually once the page
 * has finished loading keeps the search fully working). So we defer the move
 * until the document has finished loading and then yield two animation frames,
 * giving the host a chance to finish binding its handlers first.
 *
 * @param run the relocation to perform once ready.
 * @returns a function that cancels a still-pending schedule.
 */
export function whenPageReady(run: () => void): () => void {
  let cancelled = false;

  const afterFrames = (): void => {
    if (cancelled) return;
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        if (cancelled) return;
        requestAnimationFrame(() => {
          if (!cancelled) run();
        });
      });
    } else {
      setTimeout(() => {
        if (!cancelled) run();
      }, 0);
    }
  };

  if (document.readyState === "complete") {
    afterFrames();
  } else {
    window.addEventListener("load", afterFrames, { once: true });
  }

  return (): void => {
    cancelled = true;
    window.removeEventListener("load", afterFrames);
  };
}

/**
 * Starts watching the DOM for a `<search-bar-widget>` block and the hosting
 * application's search input. As soon as both are present *and the page is
 * ready* (see {@link whenPageReady}), the search input is moved to the block's
 * position, the (now redundant) block is removed, and watching stops.
 *
 * The relocation happens exactly once. Until both elements exist the observer
 * simply keeps waiting, so this is safe to start on bundle load regardless of
 * ordering (the block is rendered after load) and harmless on pages that have
 * no search bar at all (the observer never fires a move).
 *
 * @param root the subtree to search/observe; defaults to `document`. Exposed
 * for testing so a test can scope the observer to a detached container.
 * @param schedule how to defer the move until the page is ready; defaults to
 * {@link whenPageReady}. Exposed for testing so a test can run the move
 * synchronously (or control exactly when it happens).
 * @returns a cleanup function that disconnects the observer and cancels any
 * pending move.
 */
export function startSearchBarRelocator(
  root: ParentNode = document,
  schedule: (run: () => void) => () => void = whenPageReady,
): () => void {
  let done = false;
  let disposed = false;
  let observer: MutationObserver | null = null;
  let cancelSchedule: (() => void) | null = null;

  const disconnect = (): void => {
    observer?.disconnect();
    observer = null;
  };

  /**
   * Performs the actual relocation. Re-queries both elements at move time (the
   * host may have re-rendered and replaced the search input between the moment
   * both were first seen and the moment the page became ready), so we always
   * move the live node.
   */
  const relocate = (): void => {
    if (disposed) return;

    const widget = root.querySelector(SEARCH_BAR_WIDGET_TAG);
    const searchBar = root.querySelector<HTMLElement>(SEARCH_INPUT_SELECTOR);
    if (!widget || !searchBar) return;

    moveSearchBar(searchBar, widget);
    widget.remove();
  };

  const scan = (): void => {
    if (done) return;

    const widget = root.querySelector(SEARCH_BAR_WIDGET_TAG);
    if (!widget) return;

    const searchBar = root.querySelector<HTMLElement>(SEARCH_INPUT_SELECTOR);
    if (!searchBar) return;

    // Both present: stop scanning and defer the move until the page is ready.
    done = true;
    disconnect();
    cancelSchedule = schedule(relocate);
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
    disposed = true;
    done = true;
    disconnect();
    cancelSchedule?.();
  };
}

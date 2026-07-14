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

import { startSearchBarRelocator } from "./search-bar-relocator";

/** Flushes the microtask queue (MutationObserver callbacks) plus a macrotask. */
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const makeContainer = (html: string): HTMLElement => {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
};

describe("startSearchBarRelocator", () => {
  let stop: () => void = () => {};

  afterEach(() => {
    stop();
    stop = () => {};
    document.body.innerHTML = "";
  });

  it("moves the search bar to the block and removes the block when both are present", () => {
    const container = makeContainer(`
      <header><input id="search-input" /></header>
      <section id="target"><search-bar-widget id="w">[[SEARCH_BAR_PLACEMENT]]</search-bar-widget></section>
    `);

    stop = startSearchBarRelocator(container);

    expect(container.querySelector("search-bar-widget")).toBeNull();
    const searchBar = container.querySelector<HTMLElement>("#search-input");
    expect(searchBar).not.toBeNull();
    expect(searchBar?.parentElement?.id).toBe("target");
  });

  it("waits until the search bar appears, then relocates", async () => {
    const container = makeContainer(`<section id="target"><search-bar-widget>[[SEARCH_BAR_PLACEMENT]]</search-bar-widget></section>`);

    stop = startSearchBarRelocator(container);

    // No search bar yet: the block is left untouched.
    expect(container.querySelector("search-bar-widget")).not.toBeNull();

    const input = document.createElement("input");
    input.id = "search-input";
    container.appendChild(input);
    await flush();

    expect(container.querySelector("search-bar-widget")).toBeNull();
    expect(container.querySelector<HTMLElement>("#search-input")?.parentElement?.id).toBe("target");
  });

  it("uses moveBefore when the parent supports it", () => {
    const container = makeContainer(`
      <header><input id="search-input" /></header>
      <section id="target"><search-bar-widget>[[SEARCH_BAR_PLACEMENT]]</search-bar-widget></section>
    `);
    const target = container.querySelector<HTMLElement>("#target")!;
    const moveBefore = jest.fn(function (this: Node, node: Node, ref: Node | null): void {
      this.insertBefore(node, ref);
    });
    (target as unknown as { moveBefore: unknown }).moveBefore = moveBefore;

    stop = startSearchBarRelocator(container);

    expect(moveBefore).toHaveBeenCalledTimes(1);
    const [movedNode, refNode] = moveBefore.mock.calls[0];
    expect((movedNode as HTMLElement).id).toBe("search-input");
    expect((refNode as HTMLElement).tagName.toLowerCase()).toBe("search-bar-widget");
    expect(container.querySelector("search-bar-widget")).toBeNull();
  });

  it("falls back to insertBefore when moveBefore throws", () => {
    const container = makeContainer(`
      <header><input id="search-input" /></header>
      <section id="target"><search-bar-widget>[[SEARCH_BAR_PLACEMENT]]</search-bar-widget></section>
    `);
    const target = container.querySelector<HTMLElement>("#target")!;
    const moveBefore = jest.fn(() => {
      throw new Error("atomic move not possible here");
    });
    (target as unknown as { moveBefore: unknown }).moveBefore = moveBefore;

    stop = startSearchBarRelocator(container);

    expect(moveBefore).toHaveBeenCalledTimes(1);
    // The insertBefore fallback still relocated the search bar and removed the block.
    expect(container.querySelector("search-bar-widget")).toBeNull();
    expect(container.querySelector<HTMLElement>("#search-input")?.parentElement?.id).toBe("target");
  });

  it("stops relocating after the cleanup function is called", async () => {
    const container = makeContainer(`<section id="target"><search-bar-widget>[[SEARCH_BAR_PLACEMENT]]</search-bar-widget></section>`);

    stop = startSearchBarRelocator(container);
    stop();

    const input = document.createElement("input");
    input.id = "search-input";
    container.appendChild(input);
    await flush();

    // Observer was disconnected, so nothing was moved or removed.
    expect(container.querySelector("search-bar-widget")).not.toBeNull();
    expect(container.querySelector("#search-input")).not.toBeNull();
  });
});

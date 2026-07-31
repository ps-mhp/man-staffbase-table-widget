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
 * Shape-agnostic access to the string leaves of a parsed JSON value.
 *
 * The translation API's request and response bodies are the host's, not
 * this widget's: the observed request nests the article under
 * `contents.value`, but nothing documents that, and a field being added or
 * renamed must not silently switch the table translation off. So the payloads
 * are treated as "a JSON tree that has HTML somewhere in it" and located by
 * content instead of by path.
 *
 * Traversal order is a depth-first walk in `Object.entries` order and is the
 * same for {@link collectStrings} and {@link mapStrings}, so an index taken
 * from one is valid in the other.
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** Every string leaf, in traversal order. */
export function collectStrings(value: unknown): string[] {
  const out: string[] = [];
  const visit = (node: unknown): void => {
    if (typeof node === "string") {
      out.push(node);
    } else if (Array.isArray(node)) {
      node.forEach(visit);
    } else if (isRecord(node)) {
      Object.values(node).forEach(visit);
    }
  };
  visit(value);
  return out;
}

/**
 * Returns a copy of `value` with every string leaf passed through `rewrite`,
 * which receives the string and its index in traversal order.
 */
export function mapStrings(
  value: unknown,
  rewrite: (text: string, index: number) => string,
): unknown {
  let index = 0;
  const visit = (node: unknown): unknown => {
    if (typeof node === "string") {
      const next = rewrite(node, index);
      index += 1;
      return next;
    }
    if (Array.isArray(node)) return node.map(visit);
    if (isRecord(node)) {
      return Object.fromEntries(Object.entries(node).map(([key, item]) => [key, visit(item)]));
    }
    return node;
  };
  return visit(value);
}

/**
 * The first string found under `key`, at any depth. Used for the language
 * codes, which the observed body carries at the top level but which are
 * meaningful wherever they appear.
 */
export function findStringByKey(value: unknown, key: string): string | null {
  let found: string | null = null;
  const visit = (node: unknown): void => {
    if (found !== null) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
    } else if (isRecord(node)) {
      const direct = node[key];
      if (typeof direct === "string" && direct !== "") {
        found = direct;
        return;
      }
      Object.values(node).forEach(visit);
    }
  };
  visit(value);
  return found;
}

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
 * Tells the author when something went wrong, in the shape of Staffbase's own
 * toast ("growl").
 *
 * A silent failure is the worst outcome this feature has: the editor reports a
 * successful translation, every paragraph is translated, and the table quietly
 * is not. The author has no reason to look, and finds out after publishing.
 *
 * Staffbase exposes no documented API for triggering its toasts, so the
 * element is built to match the platform's own markup —
 *
 *   <div role="alert" aria-live="polite" class="ds-growl ds-growl--success …">…</div>
 *
 * — and appended to the platform's growl container when one can be found, so
 * it stacks and positions natively. When no container exists (the platform
 * only mounts one while a toast is showing), a own container is created and
 * positioned instead. In that case the growl also carries a small set of
 * inline styles, because a class alone would leave it invisible if the tenant's
 * stylesheet names its modifiers differently — being seen matters more than
 * matching the house style exactly.
 *
 * If the real API is ever identified, `showGrowl` is the single place to
 * redirect; every caller already speaks in messages, not DOM.
 */

export type GrowlKind = "success" | "warning" | "error";

/** How long a growl stays before fading out. Long enough to read a sentence. */
const VISIBLE_MS = 8000;
const FADE_MS = 300;

/** Max 32-bit z-index, matching the editor modal, so nothing can cover it. */
const Z_INDEX = 2147483647;

/** Set by {@link showGrowl} so the same message cannot stack up. */
const showing = new Set<string>();

const platformClasses = (kind: GrowlKind): string[] => [
  "ds-growl",
  `ds-growl--${kind}`,
  "transition-all",
  "duration-300",
];

const FALLBACK_COLORS: Record<GrowlKind, { background: string; color: string }> = {
  success: { background: "#1f7a3f", color: "#fff" },
  warning: { background: "#8a5a00", color: "#fff" },
  error: { background: "#9b2226", color: "#fff" },
};

/**
 * The platform's own growl container, if one is currently in the DOM.
 *
 * Found via an existing growl rather than by guessing a container class name:
 * the growl's own class is the one piece of the platform's markup that is
 * known (it was read off a live toast), and its parent is by definition the
 * right place to append to.
 */
const findPlatformContainer = (root: ParentNode): HTMLElement | null => {
  const existing = root.querySelector(".ds-growl");
  const parent = existing?.parentElement ?? null;
  // An existing growl that is its own container's only child is still a valid
  // anchor; what must be excluded is `<body>` itself, which would place the
  // growl wherever the document happens to end.
  return parent && parent !== document.body ? parent : null;
};

const OWN_CONTAINER_ID = "table-widget-growls";

const ownContainer = (): HTMLElement => {
  const existing = document.getElementById(OWN_CONTAINER_ID);
  if (existing) return existing;

  const container = document.createElement("div");
  container.id = OWN_CONTAINER_ID;
  Object.assign(container.style, {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    zIndex: String(Z_INDEX),
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "flex-end",
    pointerEvents: "none",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(container);
  return container;
};

export interface ShowGrowlOptions {
  readonly kind?: GrowlKind;
  /** Milliseconds before the growl fades out. */
  readonly durationMs?: number;
  /** Subtree to look for the platform container in. Exposed for tests. */
  readonly root?: ParentNode;
}

/**
 * Shows a growl and removes it again after {@link ShowGrowlOptions.durationMs}.
 *
 * Identical messages are collapsed: one failed translation per table would
 * otherwise stack five copies of the same sentence.
 *
 * @returns a function that dismisses the growl immediately. Calling it twice,
 * or after the growl faded on its own, is a no-op.
 */
export function showGrowl(message: string, options: ShowGrowlOptions = {}): () => void {
  const { kind = "warning", durationMs = VISIBLE_MS, root = document } = options;

  if (showing.has(message)) return () => {};
  showing.add(message);

  const platform = findPlatformContainer(root);
  const container = platform ?? ownContainer();

  const growl = document.createElement("div");
  growl.setAttribute("role", "alert");
  growl.setAttribute("aria-live", "polite");
  growl.setAttribute("data-testid", "table-widget-growl");
  growl.classList.add(...platformClasses(kind));
  growl.textContent = message;
  growl.style.opacity = "1";

  if (platform === null) {
    // Self-hosted: the platform's modifier classes may not exist, so the growl
    // has to be able to stand on its own.
    Object.assign(growl.style, {
      ...FALLBACK_COLORS[kind],
      maxWidth: "376px",
      padding: "12px 16px",
      borderRadius: "4px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
      font: '14px/1.4 -apple-system, "Segoe UI", sans-serif',
      pointerEvents: "auto",
      transition: `opacity ${FADE_MS}ms`,
    } satisfies Partial<CSSStyleDeclaration>);
  }

  container.appendChild(growl);

  let removed = false;
  const remove = (): void => {
    if (removed) return;
    removed = true;
    showing.delete(message);
    growl.remove();
  };

  const fadeTimer = setTimeout(() => {
    growl.style.opacity = "0";
    setTimeout(remove, FADE_MS);
  }, durationMs);

  return () => {
    clearTimeout(fadeTimer);
    remove();
  };
}

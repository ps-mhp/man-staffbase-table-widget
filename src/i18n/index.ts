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

import { MessageKey, Messages } from "./messages";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { it } from "./locales/it";
import { nl } from "./locales/nl";
import { pl } from "./locales/pl";
import { pt } from "./locales/pt";

export type { Messages, MessageKey };

/**
 * The languages the authoring UI ships. Region variants resolve to their base
 * language (`pt-BR` → `pt`), which is all the granularity these strings need.
 */
export const SUPPORTED_LOCALES = ["de", "en", "es", "fr", "it", "nl", "pl", "pt"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Used for any browser language that isn't one of {@link SUPPORTED_LOCALES}. */
export const FALLBACK_LOCALE: Locale = "en";

const CATALOGUES: Record<Locale, Messages> = { de, en, es, fr, it, nl, pl, pt };

const isLocale = (value: string): value is Locale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

/**
 * Picks the first supported language out of an ordered list of BCP 47 tags
 * (most preferred first), comparing only the primary subtag — so `de-AT`,
 * `DE` and `de` all resolve to `de`. Falls back to {@link FALLBACK_LOCALE}
 * when nothing matches.
 */
export function resolveLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const primary = tag.split("-")[0]?.toLowerCase() ?? "";
    if (isLocale(primary)) return primary;
  }
  return FALLBACK_LOCALE;
}

/**
 * The UI language derived from the browser. Per the Staffbase SDK the *UI*
 * language is the browser's (the widget's `contentLanguage` describes the
 * edited content instead), so `navigator.languages` is the right source.
 */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return FALLBACK_LOCALE;
  const preferred =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : [];
  return resolveLocale(preferred);
}

/**
 * Resolved lazily on first use rather than at module load, so that a caller
 * (or a test) can pin the locale via {@link setLocale} before anything reads
 * it, and so importing this module has no side effects.
 */
let current: Locale | null = null;

export function getLocale(): Locale {
  return (current ??= detectLocale());
}

/** Overrides the detected locale. Mainly for tests and manual previews. */
export function setLocale(locale: Locale): void {
  current = locale;
}

/** Drops the override so the next {@link getLocale} re-detects. */
export function resetLocale(): void {
  current = null;
}

const interpolate = (template: string, params?: Record<string, string | number>): string =>
  params === undefined
    ? template
    : template.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in params ? String(params[name]) : match,
      );

/**
 * Translates `key` into the current locale and substitutes any `{placeholder}`
 * tokens from `params` (see {@link Messages} for each key's placeholders).
 * Unknown placeholders are left untouched so a mistake is visible rather than
 * silently swallowed.
 */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const catalogue = CATALOGUES[getLocale()];
  return interpolate(catalogue[key] ?? CATALOGUES[FALLBACK_LOCALE][key], params);
}

/** The whole catalogue of a locale — used by the i18n tests. */
export const messagesFor = (locale: Locale): Messages => CATALOGUES[locale];

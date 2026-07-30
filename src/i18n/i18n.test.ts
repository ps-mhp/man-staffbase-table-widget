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

import {
  FALLBACK_LOCALE,
  Locale,
  SUPPORTED_LOCALES,
  detectLocale,
  getLocale,
  messagesFor,
  resetLocale,
  resolveLocale,
  setLocale,
  t,
} from "./index";
import { de } from "./locales/de";

/** Replaces `navigator.language(s)` for the duration of a test. */
const withNavigatorLanguages = (languages: string[] | undefined, run: () => void): void => {
  const proto = Object.getPrototypeOf(navigator) as object;
  const original = {
    languages: Object.getOwnPropertyDescriptor(proto, "languages"),
    language: Object.getOwnPropertyDescriptor(proto, "language"),
  };
  Object.defineProperty(navigator, "languages", {
    value: languages ?? [],
    configurable: true,
  });
  Object.defineProperty(navigator, "language", {
    value: languages?.[0] ?? "",
    configurable: true,
  });
  try {
    run();
  } finally {
    // Deleting the own property falls back to the prototype's accessor again.
    delete (navigator as unknown as Record<string, unknown>).languages;
    delete (navigator as unknown as Record<string, unknown>).language;
    if (original.languages) Object.defineProperty(proto, "languages", original.languages);
    if (original.language) Object.defineProperty(proto, "language", original.language);
  }
};

afterEach(() => {
  // The shared jest setup pins "de"; restore it for the other suites.
  setLocale("de");
});

describe("resolveLocale", () => {
  it("matches on the primary subtag, ignoring region and case", () => {
    expect(resolveLocale(["de-DE"])).toBe("de");
    expect(resolveLocale(["PT-BR"])).toBe("pt");
    expect(resolveLocale(["nl"])).toBe("nl");
  });

  it("prefers the first supported language in the list", () => {
    expect(resolveLocale(["tr", "ja", "pl-PL", "en"])).toBe("pl");
  });

  it("falls back for unsupported and empty inputs", () => {
    expect(resolveLocale(["tr-TR", "ja"])).toBe(FALLBACK_LOCALE);
    expect(resolveLocale([])).toBe(FALLBACK_LOCALE);
  });
});

describe("detectLocale", () => {
  it("reads the browser's preferred languages", () => {
    withNavigatorLanguages(["fr-CA", "en-US"], () => {
      expect(detectLocale()).toBe("fr");
    });
  });

  it("falls back to navigator.language when the list is empty", () => {
    withNavigatorLanguages(undefined, () => {
      expect(detectLocale()).toBe(FALLBACK_LOCALE);
    });
  });

  it("is used lazily, so a pinned locale is never overwritten", () => {
    withNavigatorLanguages(["it-IT"], () => {
      resetLocale();
      expect(getLocale()).toBe("it");
      setLocale("nl");
      expect(getLocale()).toBe("nl");
    });
  });
});

describe("t", () => {
  it("translates into the active locale", () => {
    setLocale("de");
    expect(t("save")).toBe("Speichern");
    setLocale("pl");
    expect(t("save")).toBe("Zapisz");
  });

  it("substitutes placeholders", () => {
    setLocale("en");
    expect(t("cellAria", { row: 2, col: 3 })).toBe("Row 2, column 3");
    expect(t("selectColumn", { n: 4 })).toBe("Select column 4");
    expect(t("errUnsupportedFile", { name: "notes.pdf" })).toBe(
      "Unsupported file format: notes.pdf",
    );
  });

  it("leaves unknown placeholders untouched instead of blanking them", () => {
    setLocale("en");
    expect(t("cellAria", { row: 1 })).toBe("Row 1, column {col}");
  });
});

describe("catalogues", () => {
  const keys = Object.keys(de) as Array<keyof typeof de>;

  it.each(SUPPORTED_LOCALES)("%s covers every message key with a non-empty value", (locale) => {
    const messages = messagesFor(locale as Locale);
    expect(Object.keys(messages).sort()).toEqual(keys.slice().sort());
    for (const key of keys) {
      expect(messages[key].trim().length).toBeGreaterThan(0);
    }
  });

  it.each(SUPPORTED_LOCALES)("%s keeps the placeholders of every message", (locale) => {
    const messages = messagesFor(locale as Locale);
    const placeholders = (value: string): string[] => (value.match(/\{\w+\}/g) ?? []).sort();
    for (const key of keys) {
      expect(placeholders(messages[key])).toEqual(placeholders(de[key]));
    }
  });

  it.each(SUPPORTED_LOCALES)("%s uses a single-character formatting glyph", (locale) => {
    const messages = messagesFor(locale as Locale);
    expect(messages.boldGlyph).toHaveLength(1);
    expect(messages.italicGlyph).toHaveLength(1);
    expect(messages.underlineGlyph).toHaveLength(1);
    expect(messages.strikethroughGlyph).toHaveLength(1);
  });
});

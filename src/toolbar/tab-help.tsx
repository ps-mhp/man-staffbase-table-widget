/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
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

import * as React from "react";
import { ReactElement, useMemo, useState } from "react";

import { EmptyState, SearchField, useEditorStyles } from "@shared/editor-ui";
import { HELP_TOPICS, HelpEntry, HelpTopic } from "./help-content";
import { highlightMatches } from "./help-highlight";

/** True if `query` occurs in `text`, case-insensitively. */
function matches(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

function entryMatches(entry: HelpEntry, query: string): boolean {
  return matches(entry.title, query) || matches(entry.text, query);
}

interface SearchHit {
  topic: HelpTopic;
  entry: HelpEntry;
}

/** Every entry (across all topics) whose title or body matches `query`. */
function searchEntries(query: string): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const topic of HELP_TOPICS) {
    for (const entry of topic.entries) {
      if (entryMatches(entry, query)) hits.push({ topic, entry });
    }
  }
  return hits;
}

/**
 * The editor's built-in manual, opened as a menu you drill into: a start
 * page lists every topic (the same names as the toolbar's own tabs); picking
 * one shows that topic's page. A permanently visible search field sits above
 * a breadcrumb trail, so a reader can search from anywhere and — once inside
 * a topic — find the way back without hunting for a "home" button.
 *
 * The search itself ignores the current page: it always looks across every
 * topic's entries, and a hit is a link straight to its topic rather than a
 * filter on whatever page happens to be open.
 *
 * `MenuItem` (`@shared/editor-ui`) passt nicht auf die Knöpfe hier unten
 * (Startmenü, Suchtreffer, „Hilfe"-Breadcrumb): `MenuItem` trägt fest
 * `role="menuitem"` und einen Tabulatorstopp von `-1`, weil sie ausschließlich
 * innerhalb eines `<Menu>` (`role="menu"`) Sinn ergibt, das die Pfeiltasten-
 * Navigation und den Fokuseinstieg selbst übernimmt (siehe `Menu.tsx`-
 * Kopfkommentar). Diese Knöpfe hier sind aber eine gewöhnliche Seitennavigation
 * in normaler Tab-Reihenfolge, kein Aufklappmenü — mit `MenuItem` verlöre jeder
 * einzelne seinen eigenen Tabulatorstopp und wäre nur noch über Pfeiltasten
 * *innerhalb* eines `role="menu"` erreichbar, das hier gar nicht existiert.
 * Das wäre eine stille Tastatur-Regression, keine Verbesserung — deshalb
 * bleiben es einfache `<button>`.
 */
export function HelpTab(): ReactElement {
  // Lädt das Stylesheet der Redaktionsebene (`SearchField`, `EmptyState`),
  // referenzgezählt in `document.head` — siehe RibbonShell für dieselbe
  // Begründung.
  useEditorStyles();
  const [query, setQuery] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);

  const trimmed = query.trim();
  const searching = trimmed !== "";
  const hits = useMemo(() => (searching ? searchEntries(trimmed) : []), [searching, trimmed]);

  const topic = topicId ? HELP_TOPICS.find((candidate) => candidate.id === topicId) ?? null : null;

  const goHome = (): void => {
    setTopicId(null);
    setQuery("");
  };
  const openTopic = (id: string): void => {
    setTopicId(id);
    setQuery("");
  };

  return (
    <div className="tw-rb__help">
      {/*
        N1 (Koordinator): `SearchField` leert sich bei Escape über einen
        eigenen `onKeyDown` am `<input>` (Bubble-Phase); danach blubbert das
        native Ereignis weiter bis zu `document`, wo der Schliessen-Zuhörer
        der Schublade hängt (`help-drawer.tsx`). Ohne Gegenmassnahme löst ein
        Escape in der Suche also *beides* aus: leeren *und* die Schublade
        schliessen — gemessen mit dem Test "keeps the drawer open when
        Escape empties the search field" in `help-drawer.test.tsx`, der ohne
        diese Hülle tatsächlich fehlschlug.

        Ein `onKeyDownCapture` **auf** `<SearchField>` wäre die naheliegende
        erste Idee, greift aber zu früh: React ruft Fang- und Bubble-Phase
        desselben Knotens als **eine** zusammenhängende Traversierung auf,
        `stopPropagation` in der Fangphase unterbindet dort auch schon den
        eigenen Bubble-Handler von `SearchField` **am selben Knoten** — die
        Suche würde dann gar nicht mehr leeren (ebenfalls gemessen). Der
        Riegel muss deshalb eine Ebene **höher** sitzen, an einer echten
        Vorfahren-Hülle: dort ist `SearchField`s eigener Bubble-Handler am
        `<input>` bereits gelaufen, bevor das Ereignis hier ankommt.
      */}
      <div
        className="tw-rb__help-search-guard"
        onKeyDown={(event) => {
          if (event.key === "Escape") event.stopPropagation();
        }}
      >
        <SearchField
          className="tw-rb__help-search"
          data-testid="help-search"
          placeholder="Hilfe durchsuchen …"
          label="Hilfe durchsuchen"
          value={query}
          onValueChange={setQuery}
        />
      </div>

      <nav className="tw-rb__help-breadcrumbs" aria-label="Hilfe-Navigation">
        <button
          type="button"
          className="tw-rb__help-crumb"
          data-testid="help-crumb-home"
          onClick={goHome}
        >
          Hilfe
        </button>
        {searching && (
          <>
            <span className="tw-rb__help-crumb-sep" aria-hidden>›</span>
            <span className="tw-rb__help-crumb tw-rb__help-crumb--current" data-testid="help-crumb-current">
              Suche
            </span>
          </>
        )}
        {!searching && topic && (
          <>
            <span className="tw-rb__help-crumb-sep" aria-hidden>›</span>
            <span className="tw-rb__help-crumb tw-rb__help-crumb--current" data-testid="help-crumb-current">
              {topic.label}
            </span>
          </>
        )}
      </nav>

      <div className="tw-rb__help-content" data-testid="help-content">
        {searching ? (
          hits.length === 0 ? (
            // N3 (Koordinator): kein `icon` — keins aus dem MAN-Katalog passt
            // zu "keine Treffer" ohne etwas Falsches zu behaupten (siehe
            // `EmptyState`-Kopfkommentar). Die Hülle ist jetzt ein `<div>`
            // statt `<p>`, der Text steckt in einem Kind-`<p>` — die einzige
            // Prüfung im Testcode ist `toBeInTheDocument()`, die übersteht das.
            <EmptyState
              className="tw-rb__help-empty"
              data-testid="help-no-results"
              title="Keine Treffer."
            />
          ) : (
            <ul className="tw-rb__help-results">
              {hits.map(({ topic: hitTopic, entry }) => (
                <li key={`${hitTopic.id}-${entry.title}`}>
                  <button
                    type="button"
                    className="tw-rb__help-result"
                    data-testid={`help-result-${hitTopic.id}-${entry.title}`}
                    onClick={() => openTopic(hitTopic.id)}
                  >
                    <span className="tw-rb__help-result-topic">{hitTopic.label}</span>
                    <span className="tw-rb__help-entry-title">{highlightMatches(entry.title, trimmed)}</span>
                    <span className="tw-rb__help-entry-text">{highlightMatches(entry.text, trimmed)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : topic ? (
          <>
            <h3 className="tw-rb__help-heading">{topic.label}</h3>
            {topic.entries.map((entry) => (
              <div key={entry.title} className="tw-rb__help-entry">
                <h4 className="tw-rb__help-entry-title">{entry.title}</h4>
                <p className="tw-rb__help-entry-text">{entry.text}</p>
              </div>
            ))}
          </>
        ) : (
          <ul className="tw-rb__help-menu">
            {HELP_TOPICS.map((candidate) => (
              <li key={candidate.id}>
                <button
                  type="button"
                  className="tw-rb__help-menu-item"
                  data-testid={`help-topic-${candidate.id}`}
                  onClick={() => openTopic(candidate.id)}
                >
                  {candidate.label}
                  <span className="tw-rb__help-menu-chevron" aria-hidden>›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

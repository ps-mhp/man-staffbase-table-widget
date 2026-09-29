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
 */
export function HelpTab(): ReactElement {
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
      <input
        type="search"
        className="tw-rb__help-search"
        data-testid="help-search"
        placeholder="Hilfe durchsuchen …"
        aria-label="Hilfe durchsuchen"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

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
            <p className="tw-rb__help-empty" data-testid="help-no-results">
              Keine Treffer.
            </p>
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

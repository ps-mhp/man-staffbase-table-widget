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

/**
 * Die Hilfe des Tabellen-Editors in der Leiste des Rahmens. Tasten und den
 * Satz zu „Übernehmen“ ergänzt der Rahmen selbst.
 *
 * Ein aufklappbarer Abschnitt je Thema, in der Reihenfolge der Reiter: die
 * Leiste ist schmal, und wer „Wie verbinde ich Zellen?“ sucht, öffnet
 * „Zellen“ und liest nur das. Der Text steht als Daten in `help-content.ts`.
 */

import * as React from "react";
import { ReactElement } from "react";

import { HELP_TOPICS } from "./toolbar/help-content";

export function TableEditorHelp(): ReactElement {
  return (
    <div className="flex flex-col gap-2" data-testid="table-editor-help">
      {HELP_TOPICS.map((topic, index) => (
        <details key={topic.id} className="rounded-md border px-3" open={index === 0}>
          <summary className="flex min-h-10 cursor-pointer items-center text-[13px] font-semibold text-foreground">
            {topic.label}
          </summary>
          <dl className="flex flex-col gap-2 pb-3">
            {topic.entries.map((entry) => (
              <div key={entry.title}>
                <dt className="font-semibold text-foreground">{entry.title}</dt>
                <dd className="text-muted-foreground">{entry.text}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </div>
  );
}

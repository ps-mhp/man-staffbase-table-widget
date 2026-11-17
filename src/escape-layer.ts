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

import { RefObject, useEffect } from "react";

import { eventRootOf } from "@shared/shadow-dom";

/**
 * Escape für eine Ebene über dem Editor – Ribbon-Menü, Medienauswahl: solange
 * `active`, schließt Escape diese Ebene und nicht den Rahmen.
 *
 * Der Rahmen von `@man/config-ui` schließt auf Escape an seiner Wurzel und
 * lässt nur Ereignisse aus, die schon behandelt sind (`defaultPrevented`).
 * Ein `onKeyDown` an der Ebene reichte nicht: steht der Fokus woanders – auf
 * dem Knopf, der die Ebene öffnete, oder nirgends –, käme Escape dort nie an.
 * Deshalb hört die Ebene in der Capture-Phase an der Wurzel des Editors (im
 * Config-Modal dessen Shadow Root, nie `document`) und ist damit vor dem
 * Rahmen dran. Wie bei Radix gilt ein schon behandeltes Escape als vergeben.
 *
 * @param anchor ein Element im Editor; daran wird die Wurzel bestimmt.
 * @param onEscape sollte stabil sein (`useCallback`), sonst meldet sich der
 *   Listener bei jedem Rendern neu an.
 */
export function useEscapeLayer(
  active: boolean,
  anchor: RefObject<Node | null>,
  onEscape: () => void,
): void {
  useEffect(() => {
    if (!active) return;
    const root = eventRootOf(anchor.current);
    const onKeyDown = (event: Event): void => {
      const key = event as KeyboardEvent;
      if (key.key !== "Escape" || key.defaultPrevented || key.isComposing) return;
      key.preventDefault();
      onEscape();
    };
    root.addEventListener("keydown", onKeyDown, true);
    return () => root.removeEventListener("keydown", onKeyDown, true);
  }, [active, anchor, onEscape]);
}

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
 * Eine Zelle des Gitters als Ablagezone für Bilder aus der Mediathek-Leiste.
 *
 * Eine Zone je Zelle, weil jede ihr eigenes „Wird übernommen …“ braucht: bis
 * das abgelegte Bild veröffentlicht ist, vergeht eine Anfrage, und in der
 * Zeit darf man weiterarbeiten oder ein zweites Bild auf eine andere Zelle
 * ziehen.
 */

import * as React from "react";
import { ReactElement } from "react";
import { DropZone, dropStateOf } from "@man/config-ui/drop/drop-zone";
import { useDropZone } from "@man/config-ui/drop/use-drop-zone";
import { iconById } from "@shared/icons/catalog";
import { ICON_DRAG_TYPE, parseIconDragPayload } from "@shared/icons/icon-drag";
import { InlineIcon as InlineElement } from "@shared/icons/icon-markup";
import { MediaClient } from "@shared/media/media-client";
import { PickedImage } from "@shared/media/media-picker";
import { useMediaDrop } from "@shared/media/use-media-drop";

export interface CellDropZoneProps {
  client: MediaClient;
  /**
   * Bekommt das veröffentlichte Bild. Kommt nach einer Anfrage an den Server
   * an – es muss also über Zeile und Spalte in den jüngsten Stand schreiben,
   * nicht in den, der beim Ablegen galt.
   */
  onImage: (image: PickedImage) => void;
  /** Ein Element, aus dem Explorer auf die Zelle gezogen. */
  onElement: (element: InlineElement) => void;
  children: React.ReactNode;
}

/** Bündig in der Zelle, wie die Zone für Bilder (siehe unten). */
const flushRing = (state: string): string => (state === "ready" ? "rounded-none outline-none" : "rounded-none outline-offset-[-3px]");

/** Nimmt gezogene Elemente an; ohne Anfrage an den Server, also sofort. */
function ElementDropZone({ onElement, children }: Pick<CellDropZoneProps, "onElement" | "children">): ReactElement {
  const zone = useDropZone<InlineElement>({
    type: ICON_DRAG_TYPE,
    parse: parseIconDragPayload,
    onDrop: onElement,
    announce: (element) => `${element.label || (iconById(element.id)?.name ?? "Icon")} eingefügt.`,
  });
  return (
    <DropZone zone={zone} data-element-zone="" label="Hier einfügen" className={flushRing(dropStateOf(zone, false))}>
      {children}
    </DropZone>
  );
}

export function CellDropZone({ client, onImage, onElement, children }: CellDropZoneProps): ReactElement {
  const drop = useMediaDrop({ client, accept: "images", onPick: onImage });
  const state = dropStateOf(drop, drop.busy);
  return (
    <DropZone
      zone={drop}
      busy={drop.busy}
      label="Hier ablegen"
      busyLabel="Lädt …"
      className={
        // Bündig in der Zelle statt abgerundet und abgesetzt: die Nachbarn
        // stoßen direkt an. Den Ring „bereit“ trüge sonst jede Zelle
        // zugleich – im Gitter ist jede ein Ziel, der Hinweis sagte nichts.
        state === "ready" ? "rounded-none outline-none" : "rounded-none outline-offset-[-3px]"
      }
    >
      <ElementDropZone onElement={onElement}>{children}</ElementDropZone>
      {drop.error !== null && (
        <p role="alert" className="px-2 pb-1 text-xs text-destructive">
          {drop.error}
        </p>
      )}
    </DropZone>
  );
}

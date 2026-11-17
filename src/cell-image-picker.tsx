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
 * Die Medienauswahl für ein Bild in einer Zelle – die einzige Stelle, an der
 * der Tabellen-Editor sie öffnet. Wird die Auswahl später zum Panel des
 * Rahmens (`openMedia`), ändert sich nur diese Datei.
 */

import * as React from "react";
import { ReactElement, RefObject } from "react";

import { MediaClient } from "@shared/media/media-client";
import { MediaPicker, PickedImage } from "@shared/media/media-picker";
import { useEscapeLayer } from "./escape-layer";

export interface CellImagePickerProps {
  client: MediaClient;
  /** Ein Element des Editors; an seiner Wurzel hört Escape. */
  anchor: RefObject<Node | null>;
  onPick: (image: PickedImage) => void;
  /** Sollte stabil sein (`useCallback`), siehe `useEscapeLayer`. */
  onClose: () => void;
}

export function CellImagePicker({ client, anchor, onPick, onClose }: CellImagePickerProps): ReactElement {
  // Die Auswahl selbst kennt kein Escape. Ohne diese Ebene schlösse Escape
  // den ganzen Rahmen samt Rückfrage statt nur die Auswahl.
  useEscapeLayer(true, anchor, onClose);
  return <MediaPicker client={client} onSelect={onPick} onClose={onClose} />;
}

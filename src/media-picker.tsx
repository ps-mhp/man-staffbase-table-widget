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
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { MediaClient, MediaItem } from "./media-client";
import mediaPickerCss from "./styles/media-picker.scss";
import { useHotStyle } from "@shared/hot-style";

/** The image an author picked/uploaded, ready to embed in a cell. */
export interface PickedImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface MediaPickerProps {
  client: MediaClient;
  onSelect: (image: PickedImage) => void;
  onClose: () => void;
}

/** Marks a control that is waiting on the server; see `styles/media-picker.scss`. */
const busyClass = (busy: boolean): string => (busy ? " tw-mp__busy" : "");

const DEBOUNCE_MS = 300;
const IMAGE_ACCEPT = "image/*";

const iconSvgProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Upload / "from computer" glyph. */
const IconUpload = (): ReactElement => (
  <svg {...iconSvgProps}>
    <path d="M8 10.5V3M5 5.5L8 2.5l3 3" />
    <path d="M3 11.5v1.5h10v-1.5" />
  </svg>
);

/** Close (×) glyph. */
const IconClose = (): ReactElement => (
  <svg {...iconSvgProps}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

/**
 * The "Staffbase Medien" explorer: a modal that lists and searches the
 * platform's media (via the injected {@link MediaClient}), lets the author
 * upload a new image, and — on selection — makes the image public and hands
 * the resulting URL back to the caller for embedding.
 *
 * Only image media are shown; the picker degrades gracefully (typed error
 * banners, empty state) because the underlying same-origin API cannot be
 * exercised outside a real Staffbase instance.
 */
export function MediaPicker({ client, onSelect, onClose }: MediaPickerProps): ReactElement {
  const hotMediaPickerCss = useHotStyle(mediaPickerCss, "table-widget", "styles/media-picker.scss");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const uploadInputRef = useRef<HTMLInputElement>(null);
  // Guards against out-of-order responses when the query changes quickly.
  const requestSeq = useRef(0);

  const onlyImages = (list: MediaItem[]): MediaItem[] => list.filter((m) => m.type === "image");

  const runFirstLoad = useCallback(
    async (q: string): Promise<void> => {
      const seq = ++requestSeq.current;
      setLoading(true);
      setError(null);
      try {
        if (q.trim() === "") {
          const res = await client.listMedia({ offset: 0 });
          if (seq !== requestSeq.current) return;
          setItems(onlyImages(res.items));
          setNextOffset(res.nextOffset);
          setNextCursor(null);
        } else {
          const res = await client.searchMedia({ query: q.trim() });
          if (seq !== requestSeq.current) return;
          setItems(onlyImages(res.items));
          setNextCursor(res.nextCursor);
          setNextOffset(null);
        }
      } catch (err) {
        if (seq !== requestSeq.current) return;
        setItems([]);
        setError(err instanceof Error ? err.message : "Medien konnten nicht geladen werden.");
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    },
    [client],
  );

  // Debounced (re)load whenever the query changes; also drives the first load.
  useEffect(() => {
    const handle = setTimeout(() => {
      void runFirstLoad(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, runFirstLoad]);

  const loadMore = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      if (nextOffset !== null) {
        const res = await client.listMedia({ offset: nextOffset });
        setItems((prev) => [...prev, ...onlyImages(res.items)]);
        setNextOffset(res.nextOffset);
      } else if (nextCursor !== null) {
        const res = await client.searchMedia({ query: query.trim(), cursor: nextCursor });
        setItems((prev) => [...prev, ...onlyImages(res.items)]);
        setNextCursor(res.nextCursor);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Weitere Medien konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  const selectItem = async (item: MediaItem): Promise<void> => {
    setBusyId(item.id);
    setError(null);
    try {
      const url = await client.ensurePublicImageUrl(item);
      onSelect({ url, width: item.width, height: item.height, alt: item.fileName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bild konnte nicht eingefügt werden.");
    } finally {
      setBusyId(null);
    }
  };

  const handleUpload = async (file: File): Promise<void> => {
    setUploading(true);
    setError(null);
    try {
      const item = await client.uploadMedia(file);
      const url = await client.ensurePublicImageUrl(item);
      onSelect({ url, width: item.width, height: item.height, alt: item.fileName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  };

  const hasMore = nextOffset !== null || nextCursor !== null;
  const busy = loading || uploading || busyId !== null;

  return (
    <div
      className="tw-mp"
      data-testid="media-picker"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* The picker brings its own stylesheet: it is mounted into the host's
          dialog and should leave nothing behind in `document.head`. */}
      <style>{hotMediaPickerCss}</style>
      <div className="tw-mp__panel" role="dialog" aria-label="Staffbase Medien">
        <div className="tw-mp__header">
          <input
            type="search"
            value={query}
            placeholder="Medien durchsuchen…"
            aria-label="Medien durchsuchen"
            data-testid="media-picker-search"
            className="tw-mp__search"
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className={`tw-mp__icon-button${busyClass(uploading)}`}
            data-testid="media-picker-upload"
            title="Bild hochladen"
            aria-label="Bild hochladen"
            disabled={uploading}
            onClick={() => uploadInputRef.current?.click()}
          >
            <IconUpload />
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            data-testid="media-picker-upload-input"
            aria-label="Bild hochladen"
            className="tw-mp__file-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleUpload(file);
            }}
          />
          <button
            type="button"
            className="tw-mp__icon-button"
            data-testid="media-picker-close"
            title="Schließen"
            aria-label="Schließen"
            onClick={onClose}
          >
            <IconClose />
          </button>
        </div>

        <div className="tw-mp__body">
          {error !== null && (
            <div className="tw-mp__state tw-mp__state--error" data-testid="media-picker-error">
              {error}
            </div>
          )}

          {items.length > 0 && (
            <div className="tw-mp__grid">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`tw-mp__tile${busyClass(busyId === item.id)}`}
                  data-testid={`media-picker-item-${item.id}`}
                  title={item.fileName}
                  disabled={busy}
                  onClick={() => void selectItem(item)}
                >
                  <img
                    src={item.previewUrl}
                    alt={item.fileName}
                    className="tw-mp__thumb"
                    loading="lazy"
                  />
                  <span className="tw-mp__caption">{item.fileName}</span>
                </button>
              ))}
            </div>
          )}

          {loading && items.length === 0 && (
            <div className="tw-mp__state" data-testid="media-picker-loading">
              Medien werden geladen…
            </div>
          )}

          {!loading && error === null && items.length === 0 && (
            <div className="tw-mp__state" data-testid="media-picker-empty">
              Keine Medien gefunden.
            </div>
          )}

          {hasMore && items.length > 0 && (
            <div className="tw-mp__more">
              <button
                type="button"
                className="tw-mp__button"
                data-testid="media-picker-more"
                disabled={busy}
                onClick={() => void loadMore()}
              >
                {loading ? "Lädt…" : "Mehr laden"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

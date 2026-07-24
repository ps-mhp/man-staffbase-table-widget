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

import * as React from "react";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { MediaClient, MediaItem } from "./media-client";

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

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2147483647,
};

const panelStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "8px",
  width: "min(880px, 92vw)",
  height: "min(640px, 88vh)",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  boxShadow: "0 8px 40px rgba(0, 0, 0, 0.35)",
  overflow: "hidden",
  color: "#1f2933",
  font: "14px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "14px 18px",
  borderBottom: "1px solid #e5e8ec",
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  fontSize: "14px",
  border: "1px solid #cfd4da",
  borderRadius: "6px",
  outline: "none",
  color: "#1f2933",
  background: "#fff",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 14px",
  fontSize: "13px",
  border: "1px solid #cfd4da",
  borderRadius: "6px",
  background: "#fafbfc",
  color: "#1f2933",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const bodyStyle: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: "16px 18px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: "12px",
};

const tileStyle: React.CSSProperties = {
  border: "1px solid #e0e4e8",
  borderRadius: "6px",
  background: "#fff",
  color: "#1f2933",
  padding: "6px",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  alignItems: "stretch",
  font: "inherit",
};

const thumbStyle: React.CSSProperties = {
  width: "100%",
  height: "104px",
  objectFit: "contain",
  background:
    "repeating-conic-gradient(#f2f4f6 0% 25%, #ffffff 0% 50%) 50% / 16px 16px",
  borderRadius: "4px",
};

const captionStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#4a525b",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const stateStyle: React.CSSProperties = {
  padding: "40px 0",
  textAlign: "center",
  color: "#6b7480",
  fontSize: "14px",
};

const DEBOUNCE_MS = 300;
const IMAGE_ACCEPT = "image/*";

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
      style={overlayStyle}
      data-testid="media-picker"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={panelStyle} role="dialog" aria-label="Staffbase Medien">
        <div style={headerStyle}>
          <input
            type="search"
            value={query}
            placeholder="Medien durchsuchen…"
            aria-label="Medien durchsuchen"
            data-testid="media-picker-search"
            style={searchInputStyle}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            style={buttonStyle}
            data-testid="media-picker-upload"
            disabled={uploading}
            onClick={() => uploadInputRef.current?.click()}
          >
            {uploading ? "Lädt hoch…" : "Hochladen"}
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            data-testid="media-picker-upload-input"
            aria-label="Bild hochladen"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleUpload(file);
            }}
          />
          <button
            type="button"
            style={buttonStyle}
            data-testid="media-picker-close"
            onClick={onClose}
          >
            Schließen
          </button>
        </div>

        <div style={bodyStyle}>
          {error !== null && (
            <div style={{ ...stateStyle, color: "#b42318" }} data-testid="media-picker-error">
              {error}
            </div>
          )}

          {items.length > 0 && (
            <div style={gridStyle}>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  style={{ ...tileStyle, opacity: busyId === item.id ? 0.5 : 1 }}
                  data-testid={`media-picker-item-${item.id}`}
                  title={item.fileName}
                  disabled={busy}
                  onClick={() => void selectItem(item)}
                >
                  <img src={item.previewUrl} alt={item.fileName} style={thumbStyle} loading="lazy" />
                  <span style={captionStyle}>{item.fileName}</span>
                </button>
              ))}
            </div>
          )}

          {loading && items.length === 0 && (
            <div style={stateStyle} data-testid="media-picker-loading">
              Medien werden geladen…
            </div>
          )}

          {!loading && error === null && items.length === 0 && (
            <div style={stateStyle} data-testid="media-picker-empty">
              Keine Medien gefunden.
            </div>
          )}

          {hasMore && items.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button
                type="button"
                style={buttonStyle}
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

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

/**
 * Thin, dependency-light wrapper around the Staffbase **Media API**
 * (`/api/media`). The widget has no backend and the widget SDK exposes no
 * media access, so — while the config dialog runs inside Staffbase — the
 * editor's own session cookie is used to talk to the same-origin REST API
 * directly (`credentials: "same-origin"`). This is unofficial and cannot be
 * exercised outside a real Staffbase instance, so every method is written to
 * fail loudly with a typed error and the whole client takes its `fetch`
 * implementation and base path via injection to stay unit-testable.
 *
 * Endpoints used (see the Media API OpenAPI spec):
 *  - `GET  /media?limit&offset`               list media
 *  - `GET  /media/search?query&limit&sort&cursor`  search media (Beta)
 *  - `POST /media`  (multipart `file`,`metadata`)  upload
 *  - `PUT  /media/publish`  ({ urls })         make media URLs public
 */

/** Normalized, renderer-friendly view of a Media API `MediumSchema`. */
export interface MediaItem {
  id: string;
  /** Best full-size, authenticated resource URL. */
  url: string;
  /** Preview/thumbnail URL when the server pre-rendered one; else `url`. */
  previewUrl: string;
  fileName: string;
  /** File kind reported by the media server: "image" | "video" | "raw" | … */
  type: string;
  width?: number;
  height?: number;
}

export interface MediaListResult {
  items: MediaItem[];
  total: number;
  /** Offset to pass for the next page, or `null` when the list is exhausted. */
  nextOffset: number | null;
}

export interface MediaSearchResult {
  items: MediaItem[];
  /** Opaque cursor for the next page, or `null` when exhausted. */
  nextCursor: string | null;
}

export type MediaSort = "relevance_desc" | "created_asc" | "created_desc";

/** Error thrown for any non-2xx response or transport failure. */
export class MediaApiError extends Error {
  public constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "MediaApiError";
  }
}

interface ResourceInfo {
  type?: string;
  url?: string;
  width?: number;
  height?: number;
}

interface RawMedium {
  id?: string;
  fileName?: string;
  resourceInfo?: ResourceInfo;
  transformations?: {
    t_preview?: { resourceInfo?: ResourceInfo };
  };
}

const toMediaItem = (m: RawMedium): MediaItem | null => {
  const info = m.resourceInfo ?? {};
  const url = info.url ?? "";
  if (!m.id || !url) return null;
  const preview = m.transformations?.t_preview?.resourceInfo?.url ?? url;
  return {
    id: m.id,
    url,
    previewUrl: preview,
    fileName: m.fileName ?? m.id,
    type: info.type ?? "raw",
    width: info.width,
    height: info.height,
  };
};

export interface MediaClientOptions {
  /** Base path for the media API. Defaults to the same-origin `/api/media`. */
  basePath?: string;
  /** Injectable `fetch` (defaults to the global). */
  fetchImpl?: typeof fetch;
}

/**
 * Creates a {@link MediaClient}. All requests are sent with the ambient
 * session cookie; no token handling happens here.
 */
export function createMediaClient(options: MediaClientOptions = {}): MediaClient {
  return new MediaClient(options);
}

export class MediaClient {
  private readonly basePath: string;
  private readonly fetchImpl: typeof fetch;

  public constructor({ basePath = "/api/media", fetchImpl }: MediaClientOptions = {}) {
    this.basePath = basePath.replace(/\/$/, "");
    // Bind to preserve the correct `this` when calling the global fetch.
    this.fetchImpl = fetchImpl ?? ((...args) => fetch(...args));
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.basePath}${path}`, {
        credentials: "same-origin",
        ...init,
      });
    } catch (err) {
      throw new MediaApiError(
        err instanceof Error ? err.message : "Netzwerkfehler bei der Medienanfrage.",
      );
    }
    if (!res.ok) {
      throw new MediaApiError(
        `Medienanfrage fehlgeschlagen (HTTP ${res.status}).`,
        res.status,
      );
    }
    return res;
  }

  /** Lists media (newest first), paged by offset. */
  public async listMedia(params: { limit?: number; offset?: number } = {}): Promise<MediaListResult> {
    const limit = params.limit ?? 40;
    const offset = params.offset ?? 0;
    const res = await this.request(`?limit=${limit}&offset=${offset}`);
    const body = (await res.json()) as {
      data?: RawMedium[];
      total?: number;
      offset?: number;
      limit?: number;
    };
    const items = (body.data ?? []).map(toMediaItem).filter((x): x is MediaItem => x !== null);
    const total = body.total ?? offset + items.length;
    const consumed = offset + (body.data?.length ?? 0);
    return { items, total, nextOffset: consumed < total && items.length > 0 ? consumed : null };
  }

  /** Searches media by free-text query (filename/content/type). */
  public async searchMedia(params: {
    query: string;
    limit?: number;
    sort?: MediaSort;
    cursor?: string | null;
  }): Promise<MediaSearchResult> {
    const search = new URLSearchParams();
    search.set("query", params.query);
    search.set("limit", String(params.limit ?? 40));
    if (params.sort) search.set("sort", params.sort);
    if (params.cursor) search.set("cursor", params.cursor);
    const res = await this.request(`/search?${search.toString()}`);
    const body = (await res.json()) as {
      data?: RawMedium[];
      cursor?: string | null;
      nextCursor?: string | null;
    };
    const items = (body.data ?? []).map(toMediaItem).filter((x): x is MediaItem => x !== null);
    return { items, nextCursor: body.nextCursor ?? body.cursor ?? null };
  }

  /** Uploads a single file and returns it as a normalized {@link MediaItem}. */
  public async uploadMedia(file: File, fileName?: string): Promise<MediaItem> {
    const form = new FormData();
    form.append("metadata", JSON.stringify({ type: "image", fileName: fileName ?? file.name }));
    form.append("file", file, fileName ?? file.name);
    const res = await this.request("", { method: "POST", body: form });
    const item = toMediaItem((await res.json()) as RawMedium);
    if (!item) throw new MediaApiError("Upload lieferte kein gültiges Medium zurück.");
    return item;
  }

  /**
   * Makes the given (authenticated) media URLs public and returns the
   * tokenized public URLs in the same order.
   */
  public async publishUrls(urls: string[]): Promise<string[]> {
    const res = await this.request("/publish", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });
    const body = (await res.json()) as { urls?: string[] };
    return body.urls ?? [];
  }

  /**
   * Returns a publicly accessible URL for an image medium, publishing it if
   * necessary. On any publish failure the item's own (authenticated) URL is
   * returned as a best-effort fallback and a warning is logged, so inserting
   * an image never hard-fails on the publish step.
   */
  public async ensurePublicImageUrl(item: MediaItem): Promise<string> {
    try {
      const [publicUrl] = await this.publishUrls([item.url]);
      return publicUrl && publicUrl.length > 0 ? publicUrl : item.url;
    } catch (err) {
      console.warn("Medium konnte nicht veröffentlicht werden; verwende gesicherte URL.", err);
      return item.url;
    }
  }
}

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

import { createMediaClient, MediaApiError } from "./media-client";

/** Builds a minimal `fetch`-like mock returning `body` as JSON with `status`. */
const jsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

const medium = (id: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  id,
  fileName: `${id}.png`,
  resourceInfo: {
    type: "image",
    url: `https://cdn.example.com/${id}.png`,
    width: 100,
    height: 80,
  },
  ...extra,
});

describe("MediaClient.listMedia", () => {
  it("requests /api/media with limit+offset and normalizes items", async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse({ total: 3, offset: 0, limit: 2, data: [medium("a"), medium("b")] }),
    );
    const client = createMediaClient({ fetchImpl });

    const result = await client.listMedia({ limit: 2, offset: 0 });

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/media?limit=2&offset=0",
      expect.objectContaining({ credentials: "same-origin" }),
    );
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: "a",
      url: "https://cdn.example.com/a.png",
      previewUrl: "https://cdn.example.com/a.png",
      type: "image",
      width: 100,
      height: 80,
    });
    expect(result.total).toBe(3);
    expect(result.nextOffset).toBe(2);
  });

  it("prefers the t_preview transformation for previewUrl", async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse({
        total: 1,
        data: [
          medium("a", {
            transformations: {
              t_preview: { resourceInfo: { url: "https://cdn.example.com/a-preview.jpg" } },
            },
          }),
        ],
      }),
    );
    const client = createMediaClient({ fetchImpl });
    const { items } = await client.listMedia();
    expect(items[0].previewUrl).toBe("https://cdn.example.com/a-preview.jpg");
  });

  it("reports no next page when the list is exhausted", async () => {
    const fetchImpl = jest.fn(async () => jsonResponse({ total: 1, offset: 0, data: [medium("a")] }));
    const client = createMediaClient({ fetchImpl });
    const { nextOffset } = await client.listMedia();
    expect(nextOffset).toBeNull();
  });

  it("skips media without a usable url", async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse({ total: 2, data: [medium("a"), { id: "b" }] }),
    );
    const client = createMediaClient({ fetchImpl });
    const { items } = await client.listMedia();
    expect(items.map((i) => i.id)).toEqual(["a"]);
  });
});

describe("MediaClient.searchMedia", () => {
  it("encodes the query and returns the next cursor", async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse({ data: [medium("a")], nextCursor: "CURSOR2" }),
    );
    const client = createMediaClient({ fetchImpl });

    const result = await client.searchMedia({ query: "logo & co", cursor: "CURSOR1" });

    const calledUrl = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[0];
    expect(calledUrl).toContain("/api/media/search?");
    expect(calledUrl).toContain("query=logo+%26+co");
    expect(calledUrl).toContain("cursor=CURSOR1");
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe("CURSOR2");
  });
});

describe("MediaClient.uploadMedia", () => {
  it("POSTs a multipart body and normalizes the result", async () => {
    const fetchImpl = jest.fn(async () => jsonResponse(medium("new")));
    const client = createMediaClient({ fetchImpl });
    const file = new File([new Uint8Array([1, 2, 3])], "pic.png", { type: "image/png" });

    const item = await client.uploadMedia(file);

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/media",
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    );
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
    expect(item.id).toBe("new");
  });
});

describe("MediaClient.publishUrls / ensurePublicImageUrl", () => {
  it("PUTs the urls and returns the public ones", async () => {
    const fetchImpl = jest.fn(async () => jsonResponse({ urls: ["https://cdn/x?token=1"] }));
    const client = createMediaClient({ fetchImpl });

    const urls = await client.publishUrls(["https://cdn/x"]);

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/media/publish",
      expect.objectContaining({ method: "PUT" }),
    );
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(init.body as string)).toEqual({ urls: ["https://cdn/x"] });
    expect(urls).toEqual(["https://cdn/x?token=1"]);
  });

  it("returns the published url from ensurePublicImageUrl", async () => {
    const fetchImpl = jest.fn(async () => jsonResponse({ urls: ["https://cdn/x?token=1"] }));
    const client = createMediaClient({ fetchImpl });
    const url = await client.ensurePublicImageUrl({
      id: "x",
      url: "https://cdn/x",
      previewUrl: "https://cdn/x",
      fileName: "x.png",
      type: "image",
    });
    expect(url).toBe("https://cdn/x?token=1");
  });

  it("falls back to the secure url when publish fails", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchImpl = jest.fn(async () => jsonResponse({ message: "no" }, 403));
    const client = createMediaClient({ fetchImpl });

    const url = await client.ensurePublicImageUrl({
      id: "x",
      url: "https://cdn/x",
      previewUrl: "https://cdn/x",
      fileName: "x.png",
      type: "image",
    });

    expect(url).toBe("https://cdn/x");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("MediaClient error handling", () => {
  it("throws MediaApiError with the status for a non-2xx response", async () => {
    const fetchImpl = jest.fn(async () => jsonResponse({ message: "bad" }, 401));
    const client = createMediaClient({ fetchImpl });
    await expect(client.listMedia()).rejects.toMatchObject({
      name: "MediaApiError",
      status: 401,
    });
  });

  it("wraps transport failures in MediaApiError", async () => {
    const fetchImpl = jest.fn(async () => {
      throw new Error("offline");
    });
    const client = createMediaClient({ fetchImpl });
    await expect(client.listMedia()).rejects.toBeInstanceOf(MediaApiError);
  });
});

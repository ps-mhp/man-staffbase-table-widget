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

import React from "react";
import { screen, render, fireEvent, waitFor } from "@testing-library/react";

import { MediaPicker } from "./media-picker";
import { MediaClient, MediaItem, MediaListResult, MediaSearchResult } from "./media-client";

const item = (id: string): MediaItem => ({
  id,
  url: `https://cdn.example.com/${id}.png`,
  previewUrl: `https://cdn.example.com/${id}-preview.png`,
  fileName: `${id}.png`,
  type: "image",
  width: 200,
  height: 150,
});

/** Builds a partial MediaClient stub with only the methods the picker uses. */
const stubClient = (overrides: Partial<MediaClient>): MediaClient => {
  const base: Partial<MediaClient> = {
    listMedia: jest.fn(async (): Promise<MediaListResult> => ({ items: [], total: 0, nextOffset: null })),
    searchMedia: jest.fn(async (): Promise<MediaSearchResult> => ({ items: [], nextCursor: null })),
    uploadMedia: jest.fn(),
    ensurePublicImageUrl: jest.fn(async (m: MediaItem) => `${m.url}?public=1`),
  };
  return { ...base, ...overrides } as MediaClient;
};

describe("MediaPicker", () => {
  it("lists media on open", async () => {
    const client = stubClient({
      listMedia: jest.fn(async () => ({ items: [item("a"), item("b")], total: 2, nextOffset: null })),
    });
    render(<MediaPicker client={client} onSelect={jest.fn()} onClose={jest.fn()} />);

    expect(await screen.findByTestId("media-picker-item-a")).toBeInTheDocument();
    expect(screen.getByTestId("media-picker-item-b")).toBeInTheDocument();
    expect(client.listMedia).toHaveBeenCalled();
  });

  it("publishes and returns the public url when an item is selected", async () => {
    const onSelect = jest.fn();
    const client = stubClient({
      listMedia: jest.fn(async () => ({ items: [item("a")], total: 1, nextOffset: null })),
    });
    render(<MediaPicker client={client} onSelect={onSelect} onClose={jest.fn()} />);

    fireEvent.click(await screen.findByTestId("media-picker-item-a"));

    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(client.ensurePublicImageUrl).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://cdn.example.com/a.png?public=1", alt: "a.png", width: 200 }),
    );
  });

  it("searches when the query changes", async () => {
    const searchMedia = jest.fn(async () => ({ items: [item("q")], nextCursor: null }));
    const client = stubClient({ searchMedia });
    render(<MediaPicker client={client} onSelect={jest.fn()} onClose={jest.fn()} />);

    fireEvent.change(screen.getByTestId("media-picker-search"), { target: { value: "logo" } });

    expect(await screen.findByTestId("media-picker-item-q")).toBeInTheDocument();
    expect(searchMedia).toHaveBeenCalledWith(expect.objectContaining({ query: "logo" }));
  });

  it("uploads a file then selects it", async () => {
    const onSelect = jest.fn();
    const uploadMedia = jest.fn(async () => item("up"));
    const client = stubClient({ uploadMedia });
    render(<MediaPicker client={client} onSelect={onSelect} onClose={jest.fn()} />);

    const file = new File([new Uint8Array([1])], "up.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("media-picker-upload-input"), { target: { files: [file] } });

    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(uploadMedia).toHaveBeenCalledWith(file);
  });

  it("shows an error banner when loading fails", async () => {
    const client = stubClient({
      listMedia: jest.fn(async () => {
        throw new Error("boom");
      }),
    });
    render(<MediaPicker client={client} onSelect={jest.fn()} onClose={jest.fn()} />);

    expect(await screen.findByTestId("media-picker-error")).toHaveTextContent("boom");
  });

  it("shows an empty state when there are no media", async () => {
    const client = stubClient({});
    render(<MediaPicker client={client} onSelect={jest.fn()} onClose={jest.fn()} />);
    expect(await screen.findByTestId("media-picker-empty")).toBeInTheDocument();
  });

  it("closes when the close button is clicked", async () => {
    const onClose = jest.fn();
    const client = stubClient({});
    render(<MediaPicker client={client} onSelect={jest.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("media-picker-close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("gives its controls an explicit dark text colour (readable on the host)", () => {
    const client = stubClient({});
    render(<MediaPicker client={client} onSelect={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByTestId("media-picker-close")).toHaveStyle({ color: "#1f2933" });
    expect(screen.getByTestId("media-picker-upload")).toHaveStyle({ color: "#1f2933" });
    expect(screen.getByTestId("media-picker-search")).toHaveStyle({ color: "#1f2933" });
  });

  it("loads more media via the cursor/offset", async () => {
    const listMedia = jest
      .fn()
      .mockResolvedValueOnce({ items: [item("a")], total: 2, nextOffset: 1 })
      .mockResolvedValueOnce({ items: [item("b")], total: 2, nextOffset: null });
    const client = stubClient({ listMedia });
    render(<MediaPicker client={client} onSelect={jest.fn()} onClose={jest.fn()} />);

    fireEvent.click(await screen.findByTestId("media-picker-more"));

    expect(await screen.findByTestId("media-picker-item-b")).toBeInTheDocument();
    expect(listMedia).toHaveBeenCalledTimes(2);
  });
});

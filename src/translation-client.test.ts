import { TableModel } from "./table-model";
import {
  SELF_REQUEST_HEADER,
  TRANSLATIONS_PATH,
  TranslationApiError,
  extractTranslatedHtml,
  translateTableModel,
} from "./translation-client";
import { CELL_ATTRIBUTE } from "./translation-payload";

const model: TableModel = {
  data: [["", "Spalte 1"], ["Zeile 1", "Auto"]],
  merges: [],
  formats: {},
  sort: null,
  fitImages: true,
};

const input = { model, sourceLanguage: "de_DE", targetLanguage: "en_US" };

/** A response whose table came back translated, in the observed body shape. */
const translatedBody = (): unknown => ({
  contents: {
    value:
      `<div data-tw-table="1"><table><tbody>` +
      `<tr><th ${CELL_ATTRIBUTE}="0,0"></th><th ${CELL_ATTRIBUTE}="0,1">Column 1</th></tr>` +
      `<tr><td ${CELL_ATTRIBUTE}="1,0">Row 1</td><td ${CELL_ATTRIBUTE}="1,1">Car</td></tr>` +
      `</tbody></table></div>`,
  },
});

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(body), { status: 200, ...init });

/** Explicit, so the recorded calls keep their argument types. */
type FetchMock = jest.Mock<Promise<Response>, [RequestInfo | URL, RequestInit?]>;

const mockFetch = (impl: () => Promise<Response>): FetchMock =>
  jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>(impl);

describe("extractTranslatedHtml", () => {
  it("finds the table at any depth and in any field", () => {
    const html = extractTranslatedHtml({ a: [{ b: { c: `<td ${CELL_ATTRIBUTE}="0,0">x</td>` } }] });
    expect(html).toContain(CELL_ATTRIBUTE);
  });

  it("returns null when the response carries no table", () => {
    expect(extractTranslatedHtml({ contents: { value: "<p>hi</p>" } })).toBeNull();
  });
});

describe("translateTableModel", () => {
  it("posts the cell text and returns the model with translated cells", async () => {
    const fetchImpl = mockFetch(async () => jsonResponse(translatedBody()));

    const result = await translateTableModel(input, { fetchImpl: fetchImpl as unknown as typeof fetch });

    expect(result.data).toEqual([["", "Column 1"], ["Row 1", "Car"]]);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(TRANSLATIONS_PATH);
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("same-origin");
    const body = JSON.parse(init?.body as string);
    expect(body.sourceLanguage).toBe("de_DE");
    expect(body.targetLanguage).toBe("en_US");
    expect(body.contents.value).toContain(`${CELL_ATTRIBUTE}="1,1"`);
  });

  it("marks the request as its own so the interceptor skips it", async () => {
    const fetchImpl = mockFetch(async () => jsonResponse(translatedBody()));
    await translateTableModel(input, { fetchImpl: fetchImpl as unknown as typeof fetch });

    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.get(SELF_REQUEST_HEADER)).toBe("1");
  });

  it("reuses the editor's headers, which is what keeps the endpoint from 403ing", async () => {
    const fetchImpl = mockFetch(async () => jsonResponse(translatedBody()));

    await translateTableModel(
      {
        ...input,
        hostHeaders: {
          "x-csrf-token": "CSRF_d7op7pvzznc0qu9e8h90",
          "staffbase-app": "mansales; version=2026.3.113; platform=web",
          "x-staffbase-app-version": "2026.3.113",
          "x-request-id": "mansales-6978d8019d4dda7218979ae8-GXiGm",
          accept: "*/*",
        },
      },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    );

    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.get("x-csrf-token")).toBe("CSRF_d7op7pvzznc0qu9e8h90");
    expect(headers.get("staffbase-app")).toContain("mansales");
    expect(headers.get("x-staffbase-app-version")).toBe("2026.3.113");
    // Overridden rather than inherited.
    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("content-type")).toBe("application/json");
    // A tracing id must not be reused for a second, different call.
    expect(headers.has("x-request-id")).toBe(false);
  });

  it("throws on a non-2xx status", async () => {
    const fetchImpl = mockFetch(async () => new Response("nope", { status: 503 }));
    await expect(
      translateTableModel(input, { fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toBeInstanceOf(TranslationApiError);
  });

  it("throws on a transport failure", async () => {
    const fetchImpl = mockFetch(async () => {
      throw new Error("offline");
    });
    await expect(
      translateTableModel(input, { fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toThrow("offline");
  });

  it("throws rather than returning an empty table when the response carries none", async () => {
    const fetchImpl = mockFetch(async () => jsonResponse({ contents: { value: "<p>hi</p>" } }));
    await expect(
      translateTableModel(input, { fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toThrow(/keine Tabelle/);
  });
});

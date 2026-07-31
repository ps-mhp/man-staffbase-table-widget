import { TableModel, parseTableModel } from "./table-model";
import { encodeTablePayload } from "./table-payload";
import { SELF_REQUEST_HEADER, TRANSLATIONS_PATH, translateTableModel } from "./translation-client";
import { diagnostics, startTranslationInterceptor } from "./translation-interceptor";

/** The table as an author's widget carries it in the article. */
const SOURCE_MODEL: TableModel = {
  data: [["", "Spalte 1"], ["Zeile 1", "Auto"]],
  merges: [],
  formats: { "0,1": { bold: true } },
  sort: null,
};

const widgetTag = (tabledata: string): string => `<table-widget tabledata="${tabledata}"></table-widget>`;

const SOURCE_TABLEDATA = encodeTablePayload(
  JSON.stringify({
    data: SOURCE_MODEL.data,
    merges: SOURCE_MODEL.merges,
    formats: SOURCE_MODEL.formats,
    sort: SOURCE_MODEL.sort,
  }),
);

const articleHtml = (tabledata: string, paragraph: string): string =>
  `<p>${paragraph}</p>${widgetTag(tabledata)}<p>&nbsp;</p>`;

const requestBody = (): string =>
  JSON.stringify({
    sourceLanguage: "de_DE",
    targetLanguage: "en_US",
    contents: { value: articleHtml(SOURCE_TABLEDATA, "Hallo") },
  });

/** What Staffbase returns: prose translated, the widget attribute untouched. */
const responseBody = (tabledata: string = SOURCE_TABLEDATA): string =>
  JSON.stringify({ contents: { value: articleHtml(tabledata, "Hello") } });

/** A translator that renames every cell, standing in for the second API call. */
const fakeTranslate = jest.fn(
  async ({ model }: { model: TableModel }): Promise<TableModel> => ({
    ...model,
    data: model.data.map((row) => row.map((cell) => (cell === "" ? "" : `${cell}-en`))),
  }),
);

/** Reads the widget's model back out of a patched response body. */
const modelFromResponse = async (response: Response): Promise<TableModel> => {
  const value = JSON.parse(await response.text()).contents.value as string;
  const attribute = /tabledata="([^"]*)"/.exec(value)?.[1] ?? "";
  return parseTableModel(attribute);
};

describe("startTranslationInterceptor", () => {
  let hostFetch: jest.Mock<Promise<Response>, [RequestInfo | URL, RequestInit?]>;
  let stop: () => void;

  beforeEach(() => {
    fakeTranslate.mockClear();
    hostFetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>(
      async () => new Response(responseBody(), { status: 200 }),
    );
    window.fetch = hostFetch as unknown as typeof fetch;
    stop = startTranslationInterceptor({
      translate: fakeTranslate as unknown as typeof translateTableModel,
    });
  });

  afterEach(() => {
    stop();
  });

  it("translates the table and writes it into the response the editor receives", async () => {
    const response = await window.fetch(TRANSLATIONS_PATH, {
      method: "POST",
      body: requestBody(),
    });

    expect(fakeTranslate).toHaveBeenCalledTimes(1);
    expect(fakeTranslate.mock.calls[0][0]).toMatchObject({
      sourceLanguage: "de_DE",
      targetLanguage: "en_US",
    });

    const model = await modelFromResponse(response);
    expect(model.data).toEqual([["", "Spalte 1-en"], ["Zeile 1-en", "Auto-en"]]);
    // Coordinates-keyed state rides along untouched.
    expect(model.formats).toEqual({ "0,1": { bold: true } });
  });

  it("keeps the rest of the translated article exactly as the host sent it", async () => {
    const response = await window.fetch(TRANSLATIONS_PATH, { method: "POST", body: requestBody() });
    const value = JSON.parse(await response.text()).contents.value as string;

    expect(value.startsWith("<p>Hello</p>")).toBe(true);
    expect(value.endsWith("</table-widget><p>&nbsp;</p>")).toBe(true);
  });

  it("rebuilds the attribute even when the service mangled it in the response", async () => {
    // The failure this whole feature exists for: the service re-serializes the
    // article and cuts the attribute short. The source tag is the one rebuilt,
    // so the response's broken copy never matters.
    hostFetch.mockResolvedValueOnce(new Response(responseBody("{"), { status: 200 }));

    const model = await modelFromResponse(
      await window.fetch(TRANSLATIONS_PATH, { method: "POST", body: requestBody() }),
    );
    expect(model.data).toEqual([["", "Spalte 1-en"], ["Zeile 1-en", "Auto-en"]]);
  });

  it("passes the response through untouched when the table translation fails", async () => {
    fakeTranslate.mockRejectedValueOnce(new Error("service down"));
    const original = responseBody();
    hostFetch.mockResolvedValueOnce(new Response(original, { status: 200 }));

    const response = await window.fetch(TRANSLATIONS_PATH, { method: "POST", body: requestBody() });

    expect(await response.text()).toBe(original);
  });

  it("passes the response through untouched when the host call fails", async () => {
    hostFetch.mockResolvedValueOnce(new Response("nope", { status: 500 }));

    const response = await window.fetch(TRANSLATIONS_PATH, { method: "POST", body: requestBody() });

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("nope");
  });

  it("leaves the response alone when its widgets do not match the request's", async () => {
    hostFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          contents: { value: `${widgetTag("b64:AA")}${widgetTag("b64:BB")}` },
        }),
        { status: 200 },
      ),
    );

    const response = await window.fetch(TRANSLATIONS_PATH, { method: "POST", body: requestBody() });

    expect(JSON.parse(await response.text()).contents.value).toContain('tabledata="b64:AA"');
    expect(diagnostics.lastSkipReason).toBe("response did not match the request's widgets");
  });

  it("does not translate a request without a widget", async () => {
    await window.fetch(TRANSLATIONS_PATH, {
      method: "POST",
      body: JSON.stringify({
        sourceLanguage: "de_DE",
        targetLanguage: "en_US",
        contents: { value: "<p>Hallo</p>" },
      }),
    });

    expect(fakeTranslate).not.toHaveBeenCalled();
  });

  it("does not translate when source and target language are the same", async () => {
    await window.fetch(TRANSLATIONS_PATH, {
      method: "POST",
      body: JSON.stringify({
        sourceLanguage: "de_DE",
        targetLanguage: "de_DE",
        contents: { value: articleHtml(SOURCE_TABLEDATA, "Hallo") },
      }),
    });

    expect(fakeTranslate).not.toHaveBeenCalled();
    expect(diagnostics.lastSkipReason).toBe("source and target language are equal");
  });

  it("never recurses into its own translation request", async () => {
    await window.fetch(TRANSLATIONS_PATH, {
      method: "POST",
      headers: { [SELF_REQUEST_HEADER]: "1" },
      body: requestBody(),
    });

    expect(fakeTranslate).not.toHaveBeenCalled();
    expect(hostFetch).toHaveBeenCalledTimes(1);
  });

  it("ignores requests to other endpoints and non-POST calls", async () => {
    await window.fetch("/api/media?limit=1");
    await window.fetch(TRANSLATIONS_PATH);

    expect(fakeTranslate).not.toHaveBeenCalled();
    expect(hostFetch).toHaveBeenCalledTimes(2);
  });

  it("reads the body of a Request object too", async () => {
    await window.fetch(new Request(`https://tenant.example${TRANSLATIONS_PATH}`, {
      method: "POST",
      body: requestBody(),
    }));

    expect(fakeTranslate).toHaveBeenCalledTimes(1);
  });

  it("reports a translation call that went through XMLHttpRequest", () => {
    const seen = diagnostics.xhrRequestsSeen;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", TRANSLATIONS_PATH);

    expect(diagnostics.xhrRequestsSeen).toBe(seen + 1);
  });

  it("restores the original fetch on cleanup", () => {
    stop();
    expect(window.fetch).toBe(hostFetch);
    stop = () => {};
  });
});

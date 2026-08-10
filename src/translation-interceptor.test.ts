import { TableModel, parseTableModel } from "./table-model";
import { encodeTablePayload } from "./table-payload";
import {
  SELF_REQUEST_HEADER,
  TRANSLATIONS_PATH,
  TranslateTableInput,
  translateTableModel,
} from "./translation-client";
import { MESSAGES, diagnostics, startTranslationInterceptor } from "./translation-interceptor";

/** The table as an author's widget carries it in the article. */
const SOURCE_MODEL: TableModel = {
  data: [["", "Spalte 1"], ["Zeile 1", "Auto"]],
  merges: [],
  formats: { "0,1": { bold: true } },
  sort: null,
  fitImages: true,
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
const fakeTranslate = jest.fn<Promise<TableModel>, [TranslateTableInput]>(
  async ({ model }): Promise<TableModel> => ({
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

/** Stands in for the growl, so the warning paths are asserted on messages. */
const notify = jest.fn<void, [string]>();

describe("startTranslationInterceptor", () => {
  let hostFetch: jest.Mock<Promise<Response>, [RequestInfo | URL, RequestInit?]>;
  let stop: () => void;

  beforeEach(() => {
    fakeTranslate.mockClear();
    notify.mockClear();
    hostFetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>(
      async () => new Response(responseBody(), { status: 200 }),
    );
    window.fetch = hostFetch as unknown as typeof fetch;
    stop = startTranslationInterceptor({
      translate: fakeTranslate as unknown as typeof translateTableModel,
      notify,
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

  it("hands the editor's own headers to the table translation", async () => {
    await window.fetch(TRANSLATIONS_PATH, {
      method: "POST",
      headers: { "x-csrf-token": "CSRF_abc", "staffbase-app": "mansales; platform=web" },
      body: requestBody(),
    });

    const headers = new Headers(fakeTranslate.mock.calls[0][0].hostHeaders);
    expect(headers.get("x-csrf-token")).toBe("CSRF_abc");
    expect(headers.get("staffbase-app")).toBe("mansales; platform=web");
    expect(diagnostics.hostCsrfTokenSeen).toBe(true);
  });

  it("takes the headers off a Request object too", async () => {
    await window.fetch(
      new Request(`https://tenant.example${TRANSLATIONS_PATH}`, {
        method: "POST",
        headers: { "x-csrf-token": "CSRF_from_request" },
        body: requestBody(),
      }),
    );

    const headers = new Headers(fakeTranslate.mock.calls[0][0].hostHeaders);
    expect(headers.get("x-csrf-token")).toBe("CSRF_from_request");
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

  describe("warning the author", () => {
    it("warns when the table translation fails", async () => {
      fakeTranslate.mockRejectedValueOnce(new Error("service down"));

      await window.fetch(TRANSLATIONS_PATH, { method: "POST", body: requestBody() });

      expect(notify).toHaveBeenCalledWith(MESSAGES.translationFailed);
    });

    it("warns when the translated table could not be inserted", async () => {
      hostFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ contents: { value: "<p>Hello</p>" } }), { status: 200 }),
      );

      await window.fetch(TRANSLATIONS_PATH, { method: "POST", body: requestBody() });

      expect(notify).toHaveBeenCalledWith(MESSAGES.notInserted);
    });

    it("warns when the request carries a widget it cannot read", async () => {
      await window.fetch(TRANSLATIONS_PATH, {
        method: "POST",
        body: `not json, but it mentions ${widgetTag("b64:AA")}`,
      });

      expect(notify).toHaveBeenCalledWith(MESSAGES.notReadable);
    });

    it("warns when the language pair is missing", async () => {
      await window.fetch(TRANSLATIONS_PATH, {
        method: "POST",
        body: JSON.stringify({ contents: { value: articleHtml(SOURCE_TABLEDATA, "Hallo") } }),
      });

      expect(notify).toHaveBeenCalledWith(MESSAGES.notReadable);
    });

    it("warns when the call goes through XMLHttpRequest", () => {
      new XMLHttpRequest().open("POST", TRANSLATIONS_PATH);

      expect(notify).toHaveBeenCalledWith(MESSAGES.unsupportedTransport);
    });

    it("stays silent on a successful translation", async () => {
      await window.fetch(TRANSLATIONS_PATH, { method: "POST", body: requestBody() });

      expect(notify).not.toHaveBeenCalled();
    });

    it("stays silent for an article without a widget", async () => {
      await window.fetch(TRANSLATIONS_PATH, {
        method: "POST",
        body: JSON.stringify({
          sourceLanguage: "de_DE",
          targetLanguage: "en_US",
          contents: { value: "<p>Hallo</p>" },
        }),
      });

      expect(notify).not.toHaveBeenCalled();
    });

    it("stays silent when the editor's own call failed — it reports that itself", async () => {
      hostFetch.mockResolvedValueOnce(new Response("nope", { status: 500 }));

      await window.fetch(TRANSLATIONS_PATH, { method: "POST", body: requestBody() });

      expect(notify).not.toHaveBeenCalled();
    });
  });

  /**
   * The new editor (Content Designer) sends the page as a block tree instead of
   * article HTML — same endpoint, same language pair, different body. Payload
   * shape taken from a real `POST /api/translations` of a `/studio/content/page/…`
   * page.
   */
  describe("a content document from the new editor", () => {
    const BLOCK_ID = "95edb914-821f-445a-92c7-be185b579c3c";

    const contentDocument = (tabledata: string): Record<string, unknown> => ({
      content: ["08a81a63"],
      blocks: {
        "08a81a63": { type: "section", children: [BLOCK_ID] },
        [BLOCK_ID]: {
          type: "customBlock",
          config: {
            settings: {
              content: {
                selectedBlock: {
                  customElementName: "table-widget",
                  name: "Table Widget",
                  url: "https://cdn.jsdelivr.net/gh/ps-mhp/man-staffbase-table-widget@1.4.0/dist/man.table-widget.js",
                  properties: { tabledata },
                  version: "1.0.0",
                },
              },
            },
          },
        },
      },
    });

    const documentRequestBody = (): string =>
      JSON.stringify({
        sourceLanguage: "de_DE",
        targetLanguage: "en_US",
        document: contentDocument(SOURCE_TABLEDATA),
      });

    /** What the service returns: the document echoed, the widget untouched. */
    const documentResponseBody = (): string =>
      JSON.stringify({
        sourceLanguage: "de_DE",
        targetLanguage: "en_US",
        document: contentDocument(SOURCE_TABLEDATA),
      });

    const modelFromDocumentResponse = async (response: Response): Promise<TableModel> => {
      const body = JSON.parse(await response.text());
      const properties = body.document.blocks[BLOCK_ID].config.settings.content.selectedBlock
        .properties as { tabledata: string };
      return parseTableModel(properties.tabledata);
    };

    beforeEach(() => {
      hostFetch.mockResolvedValue(new Response(documentResponseBody(), { status: 200 }));
    });

    it("translates the table and writes it back into its own block", async () => {
      const response = await window.fetch(TRANSLATIONS_PATH, {
        method: "POST",
        body: documentRequestBody(),
      });

      expect(fakeTranslate).toHaveBeenCalledTimes(1);
      expect(fakeTranslate.mock.calls[0][0]).toMatchObject({
        sourceLanguage: "de_DE",
        targetLanguage: "en_US",
      });

      const model = await modelFromDocumentResponse(response);
      expect(model.data).toEqual([["", "Spalte 1-en"], ["Zeile 1-en", "Auto-en"]]);
      expect(model.formats).toEqual({ "0,1": { bold: true } });
      expect(diagnostics.lastFormat).toBe("content-document");
    });

    it("keeps the rest of the document exactly as the host sent it", async () => {
      const response = await window.fetch(TRANSLATIONS_PATH, {
        method: "POST",
        body: documentRequestBody(),
      });
      const body = JSON.parse(await response.text());

      expect(body.document.content).toEqual(["08a81a63"]);
      expect(body.document.blocks["08a81a63"]).toEqual({ type: "section", children: [BLOCK_ID] });
      expect(
        body.document.blocks[BLOCK_ID].config.settings.content.selectedBlock.customElementName,
      ).toBe("table-widget");
    });

    it("leaves the response alone when its block is gone, and says so", async () => {
      const original = JSON.stringify({
        sourceLanguage: "de_DE",
        targetLanguage: "en_US",
        document: { content: [], blocks: {} },
      });
      hostFetch.mockResolvedValueOnce(new Response(original, { status: 200 }));

      const response = await window.fetch(TRANSLATIONS_PATH, {
        method: "POST",
        body: documentRequestBody(),
      });

      expect(await response.text()).toBe(original);
      expect(notify).toHaveBeenCalledWith(MESSAGES.notInserted);
    });

    it("does not translate a document without the widget", async () => {
      await window.fetch(TRANSLATIONS_PATH, {
        method: "POST",
        body: JSON.stringify({
          sourceLanguage: "de_DE",
          targetLanguage: "en_US",
          document: { content: ["a"], blocks: { a: { type: "text", content: "Hallo" } } },
        }),
      });

      expect(fakeTranslate).not.toHaveBeenCalled();
      expect(notify).not.toHaveBeenCalled();
    });
  });

  it("restores the original fetch on cleanup", () => {
    stop();
    expect(window.fetch).toBe(hostFetch);
    stop = () => {};
  });
});

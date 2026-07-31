import {
  containsWidget,
  findWidgetTags,
  replaceWidgetTags,
  withTabledata,
} from "./widget-html";

describe("findWidgetTags", () => {
  it("finds a widget and decodes its tabledata attribute", () => {
    const html = '<p>x</p><table-widget tabledata="[[&quot;a&quot;]]"></table-widget>';
    const [tag] = findWidgetTags(html);

    expect(tag.tabledata).toBe('[["a"]]');
    expect(html.slice(tag.start, tag.end)).toBe(tag.source);
  });

  it("does not truncate on a '>' inside a quoted attribute value", () => {
    // A legacy raw-JSON attribute contains whatever the author typed, and an
    // HTML serializer is not required to escape '>' inside attribute values.
    const html = '<table-widget tabledata="[[&quot;a > b&quot;]]" data-x="1"></table-widget>';
    const [tag] = findWidgetTags(html);

    expect(tag.tabledata).toBe('[["a > b"]]');
    expect(tag.source.endsWith('data-x="1">')).toBe(true);
  });

  it("finds several widgets in document order", () => {
    const html =
      '<table-widget tabledata="b64:AA"></table-widget><div></div><table-widget tabledata="b64:BB"></table-widget>';
    expect(findWidgetTags(html).map((t) => t.tabledata)).toEqual(["b64:AA", "b64:BB"]);
  });

  it("matches the self-closed form and a widget without the attribute", () => {
    expect(findWidgetTags("<table-widget />")).toHaveLength(1);
    expect(findWidgetTags("<table-widget></table-widget>")[0].tabledata).toBeNull();
  });

  it("returns nothing for content without a widget", () => {
    expect(containsWidget("<p>hello</p>")).toBe(false);
    expect(findWidgetTags("<p>hello</p>")).toEqual([]);
  });
});

describe("withTabledata", () => {
  it("replaces the attribute and keeps every other one", () => {
    const [tag] = findWidgetTags('<table-widget tabledata="old" tablemode="x" id="y"></table-widget>');
    expect(withTabledata(tag, "b64:NEW")).toBe('<table-widget tablemode="x" id="y" tabledata="b64:NEW">');
  });

  it("adds the attribute when the tag had none", () => {
    const [tag] = findWidgetTags("<table-widget></table-widget>");
    expect(withTabledata(tag, "b64:NEW")).toBe('<table-widget tabledata="b64:NEW">');
  });
});

describe("replaceWidgetTags", () => {
  it("replaces tags right to left and leaves nulls untouched", () => {
    const html = '<p>a</p><table-widget tabledata="1"></table-widget>b<table-widget tabledata="2"></table-widget>';
    const tags = findWidgetTags(html);

    const out = replaceWidgetTags(html, tags, [null, '<table-widget tabledata="b64:Z">']);

    expect(out).toBe('<p>a</p><table-widget tabledata="1"></table-widget>b<table-widget tabledata="b64:Z"></table-widget>');
  });

  it("returns the input unchanged when the counts do not line up", () => {
    const html = '<table-widget tabledata="1"></table-widget>';
    expect(replaceWidgetTags(html, findWidgetTags(html), [])).toBe(html);
  });
});

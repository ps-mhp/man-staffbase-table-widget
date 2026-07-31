import {
  PAYLOAD_PREFIX,
  decodeTablePayload,
  encodeTablePayload,
  isTablePayload,
} from "./table-payload";

describe("table payload encoding", () => {
  it("round-trips JSON through the encoded form", () => {
    const json = JSON.stringify({ data: [["a", 'He said "hi"'], ["ü", "<sup>2</sup>"]] });
    const encoded = encodeTablePayload(json);

    expect(encoded.startsWith(PAYLOAD_PREFIX)).toBe(true);
    expect(decodeTablePayload(encoded)).toBe(json);
  });

  it("produces a value with nothing an HTML attribute or translation can act on", () => {
    const encoded = encodeTablePayload('{"data":[["a & b","<c>"]]}');
    expect(encoded.slice(PAYLOAD_PREFIX.length)).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
  });

  it("survives non-ASCII content", () => {
    const json = JSON.stringify([["Größe", "日本語", "emoji 🚚"]]);
    expect(decodeTablePayload(encodeTablePayload(json))).toBe(json);
  });

  it("reports raw JSON as not being a payload", () => {
    expect(isTablePayload('[["a"]]')).toBe(false);
    expect(decodeTablePayload('[["a"]]')).toBeNull();
  });

  it("returns null for a corrupt payload instead of throwing", () => {
    expect(decodeTablePayload("b64:not base64!!")).toBeNull();
  });
});

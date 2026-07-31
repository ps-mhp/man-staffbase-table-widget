/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
// CommonJS on purpose: Jest loads a custom test environment through `require`,
// before any transform is applied.
const JSDOMEnvironment = require("jest-environment-jsdom").default;

/**
 * Globals jsdom does not implement but the browser does. Node has had all of
 * them since v18, so they are handed into the sandbox rather than shimmed —
 * a real implementation catches things a fake one would wave through
 * (`Response` body consumption, `Headers` name normalization).
 *
 * Needed because the translation interceptor wraps `fetch` and rebuilds the
 * host's `Response`; see `src/translation-interceptor.ts`.
 */
const FETCH_API_GLOBALS = [
  "fetch",
  "Request",
  "Response",
  "Headers",
  "ReadableStream",
  "TextEncoderStream",
  "TextDecoderStream",
];

module.exports = class JsdomWithFetchEnvironment extends JSDOMEnvironment {
  constructor(...args) {
    super(...args);
    for (const name of FETCH_API_GLOBALS) {
      if (this.global[name] === undefined && globalThis[name] !== undefined) {
        this.global[name] = globalThis[name];
      }
    }
  }
};

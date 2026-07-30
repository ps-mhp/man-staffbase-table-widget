import "@testing-library/jest-dom";
import { setLocale } from "../src/i18n";

// The editor's UI language follows the browser, which in jsdom is en-US. Pin it
// to German so assertions on labels stay deterministic regardless of the
// environment; tests that care about other locales call `setLocale` themselves.
setLocale("de");

// Radix UI primitives rely on Pointer Events and a few layout APIs that jsdom
// does not implement. Polyfill just enough for the components to open/close in
// tests without throwing.
if (typeof window.PointerEvent === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).PointerEvent = class PointerEvent extends MouseEvent {};
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

import "@testing-library/jest-dom";

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

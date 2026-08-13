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

/**
 * Excel-like ribbon styling. Inline styles can't express `:hover`/`:active`
 * and this widget's Webpack build has no CSS loader, so the toolbar renders
 * this scoped stylesheet (everything namespaced under `.tw-rb`) as a `<style>`
 * element in its own markup — always in sync with the component and correct
 * across HMR without touching `document.head`.
 */
export const RIBBON_CSS = `
.tw-rb {
  display: flex;
  flex-direction: column;
  gap: 0;
  /* Never shrinks away inside the editor's flex column, and stays pinned to
     the top should the editor ever sit in a scrolling container instead. */
  flex: 0 0 auto;
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 6px 8px 7px;
  border: 1px solid #e3e7ec;
  /* The grid starts flush underneath, so the toolbar keeps square corners and
     a shared edge on that side instead of a rounded, floating one. */
  border-radius: 10px 10px 0 0;
  border-bottom: none;
  background: #fbfcfd;
  margin-bottom: 0;
  font-size: 13px;
  color: #1f2d3a;
  box-sizing: border-box;
}

/* Every control is one pill of the same height, laid out in a single line.
   Grouping used to be vertical (Excel's stacked rows); with only a handful of
   controls per tab a flat row reads faster and leaves the panel half as tall. */
.tw-rb__rows,
.tw-rb__row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}
.tw-rb__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 30px;
  min-width: 30px;
  padding: 0 10px;
  border: 1px solid #dde2e8;
  border-radius: 7px;
  background: #fff;
  color: #34414d;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
}
.tw-rb__btn:hover:not(:disabled) { background: #f1f5f9; border-color: #c3ccd6; color: #1f2d3a; }
.tw-rb__btn:focus-visible { outline: none; border-color: #7fb3e3; box-shadow: 0 0 0 3px rgba(0, 116, 217, 0.18); }
.tw-rb__btn:active:not(:disabled) { background: #e6ecf3; }
.tw-rb__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.tw-rb__btn--active,
.tw-rb__btn--active:hover:not(:disabled) {
  background: #e8f2fc;
  border-color: #9ecbf0;
  color: #0a63b0;
}
.tw-rb__btn--icon { width: 30px; min-width: 30px; padding: 0; }
.tw-rb__btn--step { width: 34px; min-width: 34px; padding: 0; gap: 1px; }

/* Formerly the stacked "big" button with the label under its icon. It now
   matches the small buttons in height and puts the label beside the icon, so
   labelled and unlabelled controls sit on one baseline. */
.tw-rb__big {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #dde2e8;
  border-radius: 7px;
  background: #fff;
  color: #34414d;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
}
.tw-rb__big svg { width: 16px; height: 16px; }
.tw-rb__big:hover:not(:disabled) { background: #f1f5f9; border-color: #c3ccd6; color: #1f2d3a; }
.tw-rb__big:focus-visible { outline: none; border-color: #7fb3e3; box-shadow: 0 0 0 3px rgba(0, 116, 217, 0.18); }
.tw-rb__big:active:not(:disabled) { background: #e6ecf3; }
.tw-rb__big:disabled { opacity: 0.4; cursor: not-allowed; }

/* Toggle for table-wide options. Unlike the action buttons it shows a state,
   so it renders as a switch rather than lighting up like a pressed button. */
.tw-rb__switch {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #dde2e8;
  border-radius: 7px;
  background: #fff;
  color: #34414d;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
  transition: background 120ms ease, border-color 120ms ease;
}
.tw-rb__switch:hover:not(:disabled) { background: #f1f5f9; border-color: #c3ccd6; }
.tw-rb__switch:focus-visible { outline: none; border-color: #7fb3e3; box-shadow: 0 0 0 3px rgba(0, 116, 217, 0.18); }
.tw-rb__switch-track {
  position: relative;
  width: 28px;
  height: 16px;
  border-radius: 999px;
  background: #ccd4dc;
  transition: background 140ms ease;
  flex: 0 0 auto;
}
.tw-rb__switch-track::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.25);
  transition: transform 140ms ease;
}
.tw-rb__switch[aria-checked="true"] { border-color: #9ecbf0; background: #f2f8fd; color: #0a63b0; }
.tw-rb__switch[aria-checked="true"] .tw-rb__switch-track { background: #0074d9; }
.tw-rb__switch[aria-checked="true"] .tw-rb__switch-track::after { transform: translateX(12px); }

.tw-rb__rows-limit {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #dde2e8;
  border-radius: 7px;
  background: #fff;
  color: #34414d;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
}
.tw-rb__rows-limit input {
  width: 46px;
  height: 22px;
  padding: 0 4px;
  border: 1px solid #dde2e8;
  border-radius: 5px;
  font: inherit;
  font-size: 12px;
  text-align: center;
  color: inherit;
  background: #fff;
  box-sizing: border-box;
}
.tw-rb__rows-limit input:focus-visible { outline: none; border-color: #7fb3e3; box-shadow: 0 0 0 3px rgba(0, 116, 217, 0.18); }

.tw-rb__select {
  -webkit-appearance: none;
  appearance: none;
  height: 30px;
  border: 1px solid #dde2e8;
  border-radius: 7px;
  background-color: #fff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%236b7684' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 4.5L6 8l3-3.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 11px;
  color: #34414d;
  padding: 0 26px 0 10px;
  font-size: 13px;
  cursor: pointer;
  min-width: 92px;
  box-sizing: border-box;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.tw-rb__select:hover:not(:disabled) { border-color: #c3ccd6; }
.tw-rb__select:focus-visible { outline: none; border-color: #7fb3e3; box-shadow: 0 0 0 3px rgba(0, 116, 217, 0.18); }
.tw-rb__select:disabled { opacity: 0.4; cursor: not-allowed; }

/* Colour picker and its options menu read as one control, so they share a
   pill outline and only the seam between them is drawn. */
.tw-rb__color {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 30px;
  width: 32px;
  min-width: 32px;
  padding: 3px 0 0;
  border: 1px solid #dde2e8;
  border-right: none;
  border-radius: 7px 0 0 7px;
  background: #fff;
  color: #34414d;
  cursor: pointer;
  line-height: 1;
  box-sizing: border-box;
  transition: background 120ms ease;
}
.tw-rb__color:hover:not(:disabled) { background: #f1f5f9; }
.tw-rb__color:disabled { opacity: 0.4; cursor: not-allowed; }
.tw-rb__color-bar {
  width: 18px;
  height: 4px;
  margin-top: 3px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
}
.tw-rb__caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  width: 20px;
  padding: 0;
  border: 1px solid #dde2e8;
  border-radius: 0 7px 7px 0;
  background: #fff;
  color: #6b7684;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 120ms ease, border-color 120ms ease;
}
.tw-rb__caret:hover:not(:disabled) { background: #f1f5f9; border-color: #c3ccd6; }
.tw-rb__caret:disabled { opacity: 0.4; cursor: not-allowed; }

.tw-rb__menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  min-width: 194px;
  background: #fff;
  border: 1px solid #e3e7ec;
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(16, 24, 40, 0.14);
  padding: 5px;
  z-index: 20;
}
.tw-rb__menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 8px 10px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13px;
  color: #34414d;
  transition: background 110ms ease;
}
.tw-rb__menu-item:hover:not(:disabled) { background: #f1f5f9; }
.tw-rb__menu-item:focus-visible { outline: none; background: #e8f2fc; }
.tw-rb__menu-item:disabled { opacity: 0.4; cursor: not-allowed; }
.tw-rb__swatch { width: 16px; height: 16px; border: 1px solid #cfd4da; border-radius: 4px; flex: 0 0 auto; }

.tw-rb__controls {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #eaeef2;
  margin-bottom: 4px;
}
.tw-rb__ctl {
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid #dde2e8;
  border-radius: 7px;
  background: #fff;
  color: #34414d;
  font: inherit;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  box-sizing: border-box;
  transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
}
.tw-rb__ctl svg { width: 14px; height: 14px; }
.tw-rb__ctl:hover:not(:disabled) { background: #f1f5f9; border-color: #c3ccd6; }
.tw-rb__ctl:focus-visible { outline: none; border-color: #7fb3e3; box-shadow: 0 0 0 3px rgba(0, 116, 217, 0.18); }
.tw-rb__ctl--primary { color: #fff; background: #0074d9; border-color: #0068c2; }
.tw-rb__ctl--primary:hover:not(:disabled) { background: #0068c2; border-color: #005aa8; }
.tw-rb__dirty { font-size: 11px; color: #b45309; white-space: nowrap; }

.tw-rb__tabs { display: flex; flex-direction: column; min-width: 0; }
/* Tabs take only the room their labels need; the strip's rule runs on to the
   right so the row reads as one edge rather than five stretched buttons. */
.tw-rb__tablist {
  display: flex;
  justify-content: flex-start;
  gap: 2px;
  border-bottom: 1px solid #eaeef2;
  margin-bottom: 6px;
}
.tw-rb__tab {
  flex: 0 0 auto;
  width: auto;
  border: none;
  background: transparent;
  padding: 5px 12px;
  border-radius: 7px 7px 0 0;
  font: inherit;
  font-size: 12px;
  color: #5b6672;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: background 110ms ease, color 110ms ease;
}
.tw-rb__tab:hover { background-color: #eef3f8 !important; color: #1f2d3a; }
.tw-rb__tab:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(0, 116, 217, 0.18); }
.tw-rb__tab--active { color: #0a63b0; border-bottom-color: #0074d9; font-weight: 600; }
/* One line of controls, wrapping only where the panel really is too narrow. */
.tw-rb__panel {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 30px;
  padding: 0;
}
`;

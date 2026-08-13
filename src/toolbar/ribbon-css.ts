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
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0;
  /* Never shrinks away inside the editor's flex column, and stays pinned to
     the top should the editor ever sit in a scrolling container instead. */
  flex: 0 0 auto;
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 5px 3px;
  border: 1px solid #d9dee3;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
  margin-bottom: 10px;
  font-size: 13px;
  color: #1f2d3a;
  box-sizing: border-box;
}
.tw-rb__rows { display: flex; flex-direction: column; justify-content: center; gap: 4px; align-items: flex-start; }
.tw-rb__row { display: flex; align-items: stretch; gap: 3px; }
.tw-rb__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 28px;
  min-width: 28px;
  padding: 0 7px;
  border: 1px solid #dbe0e5;
  border-radius: 5px;
  background: #fff;
  color: #2b3742;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
  transition: background 110ms ease, border-color 110ms ease, color 110ms ease, box-shadow 110ms ease;
}
.tw-rb__btn:hover:not(:disabled) { background: #eef3f8; border-color: #b9c2cc; }
.tw-rb__btn:focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(0, 116, 217, 0.4); }
.tw-rb__btn:active:not(:disabled) { background: #e1e7ee; }
.tw-rb__btn:disabled { opacity: 0.45; cursor: not-allowed; }
.tw-rb__btn--active,
.tw-rb__btn--active:hover:not(:disabled) {
  background: #0074d9;
  border-color: #0068c2;
  color: #fff;
}
.tw-rb__btn--icon { width: 43px; min-width: 43px; padding: 0; }
.tw-rb__btn--step { width: 42px; min-width: 42px; padding: 0; gap: 1px; }
.tw-rb__btn--block { width: 100%; }
.tw-rb__big {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 100%;
  width: 76px;
  min-width: 76px;
  padding: 5px 4px;
  border: 1px solid #dbe0e5;
  border-radius: 6px;
  background: #fff;
  color: #2b3742;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
  transition: background 110ms ease, border-color 110ms ease;
}
.tw-rb__big:hover:not(:disabled) { background: #eef3f8; border-color: #b9c2cc; }
.tw-rb__big:disabled { opacity: 0.45; cursor: not-allowed; }
.tw-rb__big--primary {
  color: #fff;
  background: #0074d9;
  border-color: #0068c2;
}
.tw-rb__big--primary:hover:not(:disabled) { background: #0068c2; border-color: #005aa8; }
/* Toggle for table-wide options. Unlike the action buttons it shows a state,
   so it renders as a switch rather than lighting up like a pressed button. */
.tw-rb__switch {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 100%;
  width: 76px;
  min-width: 76px;
  padding: 5px 4px;
  border: 1px solid #dbe0e5;
  border-radius: 6px;
  background: #fff;
  color: #2b3742;
  cursor: pointer;
  font-size: 11px;
  line-height: 1.15;
  text-align: center;
  box-sizing: border-box;
  transition: background 110ms ease, border-color 110ms ease;
}
.tw-rb__switch:hover:not(:disabled) { background: #eef3f8; border-color: #b9c2cc; }
.tw-rb__switch:focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(0, 116, 217, 0.4); }
.tw-rb__switch-track {
  position: relative;
  width: 30px;
  height: 16px;
  border-radius: 8px;
  background: #c6ced6;
  transition: background 110ms ease;
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
  transition: transform 110ms ease;
}
.tw-rb__switch[aria-checked="true"] { border-color: #9dc7ea; background: #f2f8fd; }
.tw-rb__switch[aria-checked="true"] .tw-rb__switch-track { background: #0074d9; }
.tw-rb__switch[aria-checked="true"] .tw-rb__switch-track::after { transform: translateX(14px); }
.tw-rb__rows-limit {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 100%;
  width: 76px;
  min-width: 76px;
  padding: 5px 4px;
  border: 1px solid #dbe0e5;
  border-radius: 6px;
  background: #fff;
  color: #2b3742;
  font-size: 11px;
  line-height: 1.15;
  text-align: center;
  box-sizing: border-box;
}
.tw-rb__rows-limit input {
  width: 46px;
  min-height: 22px;
  padding: 2px 4px;
  border: 1px solid #dbe0e5;
  border-radius: 4px;
  font: inherit;
  font-size: 12px;
  text-align: center;
  color: inherit;
  background: #fff;
  box-sizing: border-box;
}
.tw-rb__rows-limit input:focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(0, 116, 217, 0.4); }
.tw-rb__select {
  -webkit-appearance: none;
  appearance: none;
  min-height: 28px;
  border: 1px solid #dbe0e5;
  border-radius: 5px;
  background-color: #fff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%236b7684' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 4.5L6 8l3-3.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 7px center;
  background-size: 11px;
  color: #2b3742;
  padding: 0 24px 0 8px;
  font-size: 13px;
  cursor: pointer;
  min-width: 88px;
  box-sizing: border-box;
}
.tw-rb__select:hover:not(:disabled) { border-color: #b9c2cc; }
.tw-rb__select:disabled { opacity: 0.45; cursor: not-allowed; }
.tw-rb__color {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 28px;
  width: 30px;
  min-width: 30px;
  padding: 2px 0 0;
  border: 1px solid #dbe0e5;
  border-right: none;
  border-radius: 5px 0 0 5px;
  background: #fff;
  color: #2b3742;
  cursor: pointer;
  line-height: 1;
  box-sizing: border-box;
}
.tw-rb__color:hover:not(:disabled) { background: #eef3f8; }
.tw-rb__color:disabled { opacity: 0.45; cursor: not-allowed; }
.tw-rb__color-bar {
  width: 18px;
  height: 4px;
  margin-top: 2px;
  border-radius: 1px;
  border: 1px solid rgba(0,0,0,0.12);
  box-sizing: border-box;
}
.tw-rb__caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  width: 18px;
  padding: 0;
  border: 1px solid #dbe0e5;
  border-radius: 0 5px 5px 0;
  background: #fff;
  color: #6b7684;
  cursor: pointer;
  box-sizing: border-box;
}
.tw-rb__caret:hover:not(:disabled) { background: #eef3f8; border-color: #b9c2cc; }
.tw-rb__caret:disabled { opacity: 0.45; cursor: not-allowed; }
.tw-rb__menu {
  position: absolute;
  top: calc(100% + 3px);
  left: 0;
  min-width: 190px;
  background: #fff;
  border: 1px solid #d9dee3;
  border-radius: 8px;
  box-shadow: 0 8px 26px rgba(16, 24, 40, 0.16);
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
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #2b3742;
}
.tw-rb__menu-item:hover:not(:disabled) { background: #eef3f8; }
.tw-rb__menu-item:disabled { opacity: 0.45; cursor: not-allowed; }
.tw-rb__swatch { width: 16px; height: 16px; border: 1px solid #cfd4da; border-radius: 3px; flex: 0 0 auto; }
.tw-rb__save { height: auto; align-self: stretch; margin-right: 10px; flex: 0 0 auto; }
.tw-rb__tabs { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; }
.tw-rb__tablist { display: flex; gap: 2px; border-bottom: 1px solid #e6e9ed; margin-bottom: 6px; }
.tw-rb__tab {
  border: none;
  background: transparent;
  padding: 6px 12px;
  border-radius: 6px 6px 0 0;
  font: inherit;
  font-size: 13px;
  color: #5b6672;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.tw-rb__tab:hover { background: #f2f6fa; color: #1f2d3a; }
.tw-rb__tab:focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(0, 116, 217, 0.4); }
.tw-rb__tab--active { color: #0a6ec4; border-bottom-color: #0074d9; font-weight: 600; }
/* Tabs differ in height. Reserving the tallest one keeps the grid below from
   jumping every time the user switches. */
.tw-rb__panel { display: flex; align-items: stretch; gap: 4px; min-height: 72px; padding: 2px 0; }
`;


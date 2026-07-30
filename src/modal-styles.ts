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

import { CSSProperties } from "react";

/**
 * Styles for the full-screen table editor overlay, shared by the two places it
 * is opened from: the widget's config dialog (`table-editor-injector.ts`) and
 * the page editor itself (`tinymce-bridge.ts`).
 */

export const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  // Max 32-bit z-index so the editor always sits above the hosting app's own
  // config dialog / modals (Staffbase renders the widget's settings dialog on
  // top of the page; without this the editor would be hidden behind it).
  zIndex: 2147483647,
};

export const panelStyle: CSSProperties = {
  background: "#fff",
  borderRadius: "6px",
  width: "90vw",
  height: "90vh",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
};

/**
 * Holds the editor at exactly the panel's remaining height and does *not*
 * scroll itself — the editor scrolls its grid internally so the toolbar stays
 * put no matter how long the table is. `minHeight: 0` is required for a flex
 * item to be allowed to shrink below its content size.
 */
export const panelBodyStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  overflow: "hidden",
};

export const reopenButtonStyle: CSSProperties = {
  border: "1px dashed #b7bcc3",
  background: "#fafbfc",
  color: "#3a4148",
  cursor: "pointer",
  padding: "8px 16px",
  borderRadius: "4px",
  fontSize: "13px",
};

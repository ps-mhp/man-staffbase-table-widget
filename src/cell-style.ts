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

import * as React from "react";
import { CellFormat } from "./table-model";

/**
 * Translates a {@link CellFormat} into inline CSS. Only properties the author
 * actually set are emitted, so cells without formatting keep their default
 * look (and legacy tables render unchanged). Shared by both the rendered
 * widget and the editor so the editor is a true WYSIWYG preview.
 */
export function formatToStyle(format: CellFormat): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (format.bold) style.fontWeight = "bold";
  if (format.italic) style.fontStyle = "italic";
  const decorations = [
    format.underline ? "underline" : "",
    format.strikethrough ? "line-through" : "",
  ]
    .filter(Boolean)
    .join(" ");
  if (decorations) style.textDecoration = decorations;
  if (format.align) style.textAlign = format.align;
  if (format.color) style.color = format.color;
  if (format.background) style.background = format.background;
  if (typeof format.fontSize === "number") style.fontSize = `${format.fontSize}px`;
  return style;
}

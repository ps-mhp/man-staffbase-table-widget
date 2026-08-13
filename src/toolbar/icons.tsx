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
import { ReactElement } from "react";

const svgBase = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconSave = (): ReactElement => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M8 3v5h6V3" />
    <path d="M8 21v-6h8v6" />
  </svg>
);

export const IconSuperscript = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <path d="M2 13L8 5M8 13L2 5" />
    <path d="M11 3.5c0-.6.5-1 1.2-1s1.3.4 1.3 1c0 .5-.3.8-.9 1.2L11 7h3" strokeWidth={1.2} />
  </svg>
);

export const IconSubscript = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <path d="M2 11L8 3M8 11L2 3" />
    <path d="M11 10.5c0-.6.5-1 1.2-1s1.3.4 1.3 1c0 .5-.3.8-.9 1.2L11 14h3" strokeWidth={1.2} />
  </svg>
);

export const IconAlignLeft = (): ReactElement => (
  <svg {...svgBase} aria-hidden><path d="M2 4h12M2 8h8M2 12h10" /></svg>
);
export const IconAlignCenter = (): ReactElement => (
  <svg {...svgBase} aria-hidden><path d="M2 4h12M4 8h8M3 12h10" /></svg>
);
export const IconAlignRight = (): ReactElement => (
  <svg {...svgBase} aria-hidden><path d="M2 4h12M6 8h8M4 12h10" /></svg>
);

export const IconVAlignTop = (): ReactElement => (
  <svg {...svgBase} aria-hidden><path d="M2 3h12M5 6h6M5 9h6" /></svg>
);
export const IconVAlignMiddle = (): ReactElement => (
  <svg {...svgBase} aria-hidden><path d="M5 4h6M2 8h12M5 12h6" /></svg>
);
export const IconVAlignBottom = (): ReactElement => (
  <svg {...svgBase} aria-hidden><path d="M5 4h6M5 7h6M2 13h12" /></svg>
);

export const IconInsert = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <rect x="2" y="2" width="12" height="12" rx="1" opacity="0.5" />
    <path d="M8 5v6M5 8h6" />
  </svg>
);
export const IconDelete = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <rect x="2" y="2" width="12" height="12" rx="1" opacity="0.5" />
    <path d="M5 8h6" />
  </svg>
);
export const IconSort = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <path d="M4 3v10M2 11l2 2 2-2" />
    <path d="M9 5h5M9 8h4M9 11h3" strokeWidth={1.2} />
  </svg>
);
export const IconPainter = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <path d="M4 9l6-6 3 3-6 6z" />
    <path d="M4 9l-1 4 4-1" />
  </svg>
);
export const IconUpload = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <path d="M8 11V3M5 6l3-3 3 3" />
    <path d="M3 12v1h10v-1" />
  </svg>
);
export const IconImage = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <rect x="2" y="3" width="12" height="10" rx="1.5" />
    <circle cx="5.5" cy="6.5" r="1" />
    <path d="M3 12l3.5-3.5L9 11l2-2 2 2" />
  </svg>
);
/** Two images plus size arrows — the "equalize image size" action. */
export const IconImageSize = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <rect x="1.5" y="4" width="5.5" height="8" rx="1" />
    <rect x="9" y="6" width="5.5" height="4" rx="1" />
    <path d="M8 2.5v11" strokeWidth={1.1} strokeDasharray="1.5 1.5" />
  </svg>
);
export const IconClearFormat = (): ReactElement => (
  <svg {...svgBase} aria-hidden>
    <path d="M6 3h7M9.5 3L7 13" />
    <path d="M2 7l4 4M6 7l-4 4" />
  </svg>
);
export const IconChevron = (): ReactElement => (  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 4.5L6 8l3-3.5" />
  </svg>
);


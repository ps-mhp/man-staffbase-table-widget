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

import { UiSchema } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";
import { t } from "./i18n";
import { DEFAULT_TABLE_MODE } from "./table-mode";

/**
 * schema used for generation of the configuration dialog
 * see https://rjsf-team.github.io/react-jsonschema-form/docs/ for documentation
 *
 * The `tabledata` field stores the table content as a JSON string
 * (a 2D array of strings, see `table-json.ts`). It is normally edited
 * through the custom grid editor that is injected into this dialog
 * (see `table-editor-injector.ts`); the plain textarea rendered by RJSF
 * acts as a fallback/backing field in case the injection fails to mount.
 *
 * `tablemode` selects where the table is stored — see `table-mode.ts`. It is a
 * plain author-facing choice so that the attribute form and the translatable
 * slot form can be verified against a live Staffbase instance one at a time.
 */
export const configurationSchema: JSONSchema7 = {
  properties: {
    tabledata: {
      type: "string",
      title: t("configTableDataTitle"),
    },
    tablemode: {
      type: "string",
      title: t("configTableModeTitle"),
      default: DEFAULT_TABLE_MODE,
      oneOf: [
        { const: "attribute", title: t("configTableModeAttribute") },
        { const: "slots", title: t("configTableModeSlots") },
      ],
    },
  },
};

/**
 * schema to add more customization to the form's look and feel
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema
 */
export const uiSchema: UiSchema = {
  tabledata: {
    "ui:widget": "textarea",
    "ui:help": t("configTableDataHelp"),
  },
  tablemode: {
    "ui:help": t("configTableModeHelp"),
  },
};

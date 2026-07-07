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

/**
 * schema used for generation of the configuration dialog
 * see https://rjsf-team.github.io/react-jsonschema-form/docs/ for documentation
 *
 * The `tabledata` field stores the table content as a JSON string
 * (a 2D array of strings, see `table-json.ts`). It is normally edited
 * through the custom grid editor that is injected into this dialog
 * (see `table-editor-injector.ts`); the plain textarea rendered by RJSF
 * acts as a fallback/backing field in case the injection fails to mount.
 */
export const configurationSchema: JSONSchema7 = {
  properties: {
    tabledata: {
      type: "string",
      title: "Tabellendaten",
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
    "ui:help": "Wird über den Tabellen-Editor oberhalb bearbeitet.",
  },
};

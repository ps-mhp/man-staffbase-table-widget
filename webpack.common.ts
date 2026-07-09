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

import * as webpack from "webpack";

const config: webpack.Configuration = {
  entry: {
    "man.table-widget": "./src/index.tsx",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ["babel-loader"],
        exclude: /.*\/node_modules/,
      },
      {
        test: /\.svg$/i,
        use: [{ loader: "@svgr/webpack", options: { icon: true } }],
      },
      {
        test: /table-widget\.svg$/,
        use: [
          {
            loader: "url-loader",
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/dist",
  },
  optimization: {
    // Ship a single self-contained bundle: no split chunks and no separate
    // runtime file. The widget is loaded by the hosting app (often by id, not
    // by path), so lazily loaded chunks can't be resolved reliably — keeping
    // everything (incl. exceljs used for .xlsx import) in one file avoids any
    // "Loading chunk failed" errors.
    splitChunks: false,
    runtimeChunk: false,
  },
};

export default config;

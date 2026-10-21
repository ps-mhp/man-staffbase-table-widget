/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
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

import { downloadFile, exportFileName } from "./download";

describe("exportFileName", () => {
  it("names the file by local date", () => {
    expect(exportFileName("csv", new Date(2026, 9, 1))).toBe("tabelle-2026-10-01.csv");
    expect(exportFileName("xlsx", new Date(2026, 11, 31, 23, 59))).toBe("tabelle-2026-12-31.xlsx");
  });
});

describe("downloadFile", () => {
  it("downloads through a temporary link and frees the blob later", () => {
    jest.useFakeTimers();
    const create = jest.fn(() => "blob:x");
    const revoke = jest.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe("t.csv");
      expect(this.getAttribute("href")).toBe("blob:x");
    });

    downloadFile("a;b", "t.csv", "text/csv");

    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector("a[download]")).toBeNull();
    expect(revoke).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(revoke).toHaveBeenCalledWith("blob:x");
    click.mockRestore();
    jest.useRealTimers();
  });
});

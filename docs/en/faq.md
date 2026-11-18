# FAQ

**Question:** Instead of the table editor, I only see a text field with
cryptic content that starts with `b64:`.

Answer: This is the **Table Data** field—the stored version of the
table that the editor normally covers. Never edit this text manually. Clicking **Edit Table** or reopening the
dialog box will bring back the editor. The encoding protects the table from being
corrupted by automatic page translation.

**Question:** My changes are gone after closing the editor.

Answer: **Close** does not save changes. If there are unsaved changes, the
editor will prompt you—select **Apply** there, not **Discard**. As long as the
title says “… – not saved,” something is still open. Afterward, save the page in
Studio by clicking **Save**.

**Question:** How do I type in a cell?

Answer: **Double-click** the cell, then type. A single click
only selects the cell (for formatting); it does not open it for
editing.

**Question:** I can’t delete the first row or the first column.

Answer: This is by design: The first row is the header row, and the first
column is the row label. If you don’t need them, just leave them
blank.

**Question:** Which file formats can I import?

Answer: `.csv` as well as `.xlsx`/`.xls`. For CSV files, semicolons and commas are
automatically recognized as delimiters. For Excel files, the first worksheet
is imported, including merged cells, text formatting, colors, font sizes,
and alignment. An import **always replaces the entire table**.

**Question:** “Import failed” appears.

Answer: The file could not be read. Check whether it is actually a
`.csv`, `.xlsx`, or `.xls` file (not, for example, a renamed or
password-protected file) and whether it contains any data. If necessary,
save it again as `.xlsx` in Excel.

**Question:** Not all rows are displayed on the page.

Answer: This is the **Visible Rows** setting (in the “Table” panel on the right),
set by default to 5 data rows. The rest can be viewed by clicking the button below
the table. If you want all rows to be visible from the start, set the value to `0`
.

**Question:** Why don’t I see an export option in the app?

Answer: In the Staffbase app (iOS/Android), the table intentionally hides the export option and
the row selection checkboxes because downloads do not
work reliably there. In the browser—even on a phone—the export option
is available.

**Question:** An image is stretching the entire table.

Answer: On the right side of the **Table** panel, toggle the **Adjust Images** switch on.
This limits all images to the table’s width. When turned off, each
image appears in its original size.

**Question:** Several images are different sizes.

Answer: Select all image cells and, in the **Images** tab, under
**Image Size** tab, select “Same height as first image” or “Same width as first
image.” At least two images must be selected.

**Question:** A reader has sorted the table differently than how I saved
it.

Answer: On the published page, any reader can reorder the table themselves by clicking
on a column header. This applies only to their view
and does not change the saved table. The **Initial
Sort** set in the editor (the “Table” panel) remains the default view.

**Question:** Can I insert a link into a cell?

Answer: No. Cells can contain text, images, and superscript/subscript,
but not links. Links belong in a text element next to the table.

**Question:** Is there an “Undo” option?

Answer: No. Therefore, save your work periodically when making major changes—and
remember before importing that the import will replace the entire table.

**Question:** What happens to my table when the page is automatically translated?

Answer: Only the cell contents are translated. Merged cells,
formatting, images, and sorting remain unchanged.

**Question:** The table is too wide on my phone.

Answer: You can scroll sideways. For narrow screens, it helps to
merge columns, use shorter headings, or remove large
images from the cells.

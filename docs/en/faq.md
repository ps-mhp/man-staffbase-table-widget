# FAQ

**Question:** Instead of the table editor, I only see a text field with
cryptic content that begins with `b64:`.

Answer: This is the **Table Data** field—the stored form of the
table that the editor normally covers. Never edit this text manually.
Clicking **Edit Table** or reopening the
dialog box will bring back the editor. The encoding protects the table from
being corrupted by automatic page translation.

**Question:** My changes are gone after closing.

Answer: **Close** does not save. Always click
**Save** before closing—as long as “Unsaved changes” appears next to the buttons,
something is still open.

**Question:** How do I type in a cell?

Answer: **Double-click** the cell, then type. A single click
only selects the cell (for formatting); it does not open it for
editing.

**Question:** I can’t delete the first row or the first column.

Answer: This is by design: The first row is the header row, and the first
column is the row label. If you don’t need them, just leave them
blank.

**Question:** Which file formats can I import?

Answer: `.csv` and `.xlsx`/`.xls`. For CSV files, semicolons and commas are
automatically recognized as delimiters. For Excel files, the first worksheet
is imported, including merged cells, text formatting, colors, font sizes,
and alignment. An import **always replaces the entire table**.

**Question:** “Import failed” appears.

Answer: The file could not be read. Check whether it is actually a
`.csv`, `.xlsx`, or `.xls` file (not, for example, a renamed or
password-protected file) and whether it contains any data. If necessary,
save it again as a `.xlsx` file in Excel.

**Question:** Not all rows are displayed on the page.

Answer: This is the **Visible Rows** setting (on the “Data” tab),
set by default to 5 data rows. The rest can be viewed using the button below
the table. If you want all rows to be visible from the start, set the value to `0`
.

**Question:** An image is stretching the entire table.

Answer: On the **Pictures** tab, turn on the **Fit Pictures** checkbox.
This limits all images to the width of the table. When turned off, each
image appears in its original size.

**Question:** Several images are different sizes.

Answer: Select all image cells and, in the **Images** tab under
**Image Size**, choose “Same height as first image” or “Same width as first
image.” At least two images must be selected.

**Question:** A reader has sorted the table differently than how I saved
it.

Answer: On the published page, any reader can reorder the table themselves by clicking
on a column header. This applies only to their view
and does not change the saved table. The sort order you set in the editor
remains the default view.

**Question:** Can I insert a link into a cell?

Answer: No. Cells can contain text, images, and superscript/subscript,
but no links. Links belong in a text element next to the table.

**Question:** Is there an “Undo” function?

Answer: No. That’s why you should save periodically when making major changes—and
remember before importing that it will replace the entire table.

**Question:** My text appears entirely in uppercase, even though I
wrote it normally.

Answer: This is due to the page’s design, not the table. Select the
affected cells and click **Unset Capitalization** in the **Font** tab.

**Question:** What happens to my table when the page is automatically translated
?

Answer: Only the cell contents are translated. Merged cells,
formatting, images, and sorting remain unchanged.

**Question:** The table is too wide on my phone.

Answer: You can scroll sideways through it. For narrow screens, it helps to
merge columns, use shorter headings, or remove large
images from the cells.

# FAQ

**Question:** In the configuration dialog, instead of the table editor, I only see
an empty text field with cryptic content—is the table corrupted?

Answer: No. The text field is purely a backup field that the editor
normally hides; the cryptic content (starting with `b64:`) is the
table in encoded form. This encoding prevents automatic
translations of the page from corrupting the table. Reloading the dialog
usually suffices to make the editor reappear.

**Question:** Which file formats can be imported?

Answer: `.csv` as well as `.xlsx`/`.xls`. When importing from Excel, linked
cells, cell formatting (bold/italic/colors/alignment), and superscript/
subscript; an import always replaces the entire current
table content.

**Question:** Why aren’t all rows displayed in a long table?

Answer: This is the “Visible Rows” setting (on the “Data” tab)—
Visitors initially see only the specified number of data rows and
can use a “Show All” button to display the rest. When set to `0`,
the table shows all rows from the start.

**Question:** An image in a cell makes the entire table overflow—what should I do?

Answer: Enable the “Fit Images” toggle (under the “Images” tab)—it
limits all images to the width of the table. If it’s turned off,
each image is displayed in its original size.

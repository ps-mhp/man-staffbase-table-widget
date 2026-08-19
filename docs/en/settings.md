# Settings

Technically, the widget has only one field in the configuration dialog
("Table Data"), which stores the entire table content. However, it is
never edited directly as text, but rather via the table editor, which
opens automatically above this field. The actual settings are located
in its toolbar:

| Tab | What it does |
| --- | --- |
| Font | Font size, bold/italic/underlined/strikethrough, superscript/subscript, text and background color, as well as “Cancel All Caps” (cancels the page’s automatic capitalization for highlighting). |
| Alignment | Horizontal (left/center/right) and vertical (top/center/bottom) alignment of cell content. |
| Cells | Merge/unmerge cells; insert or delete rows and columns. |
| Images | Insert an image into the selected cell; resize or reset the sizes of multiple selected images. |
| Data | Sort by column, Format Painter, number of visible rows, remove formatting, import table from `.csv`/`.xlsx`/`.xls`. |

Additional settings outside the toolbar:

| Setting | Description |
| --- | --- |
| Visible Rows | Determines how many data rows are displayed on the published page before the table collapses behind a “Show All” button. `0` always shows all rows. Configurable via the “Data” tab. |

“Save” applies the current settings to the widget; “Close” does not
discard anything on its own, but exits the dialog without saving—
a note next to the two buttons indicates any unsaved changes. A
separate “Help” tab in the editor explains each function in detail.

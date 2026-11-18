## The Editor at a Glance

The table editor opens with the widget's settings and fills
the entire window.

- **Header bar:** **Close** on the left, next to it the title **Edit Table
  ** and the status—it indicates whether and what changes haven’t been saved yet,
  such as “3 cells changed,” “Structure changed” (rows, columns, merged
  cells) or “Settings changed.” In the center are the toggles **Editor** · **Desktop** ·
  **Tablet** · **Mobile**. On the right: **Undo**, **Redo**, and
  **Help**; on the far right: **Cancel** and **Apply**.
- **Below that are the tabs** **Font**, **Alignment**, **Cells**, **Images**
  and **Data**; to the right of those, **Import (.csv, .xlsx)**. Below the
  tabs are the tools for the selected tab, followed by the table with
  column letters (A, B, C …) and row numbers (1, 2, 3 …) just like in Excel.
- **Below the table is the status bar:** Table size and the selection,
  such as “4 rows · 3 columns · Selection B2:B4,” with a note on the right.
- **On the right, the “Table” panel:** settings that apply to the entire table—
  **Primary Sort**, **Visible Rows**, **Export**, and **Adjust Images**.
  **
- **Desktop**, **Tablet**, and **Mobile** show the table as readers
  see it—with collapse options, export buttons, and primary sort. The panel
  remains next to it; you’ll see any changes you make there immediately. **Editor**
  takes you back to editing.

**Apply** writes the table to the widget dialog and closes the
editor. It is not saved until you click **Save** in Studio. If you close with
unsaved changes, you’ll be asked: **Discard**, **Continue editing**, or
**Apply**.

### Keys

| Key | Effect |
| --- | --- |
| Esc | Closes whatever is currently open: cell editing, context menu, a tab menu, the media library bar, Help—and only then the editor (with a confirmation prompt). |
| ⌘/Ctrl S | Apply; the editor remains open |
| ⌘/Ctrl ↵ | Apply and close |
| ⌘/Ctrl Z | Undo. In a cell where you’re currently typing, it only undoes what you’ve just typed. |
| ⇧ ⌘/Ctrl Z, Ctrl Y | Redo |
| F1 | Help on/off |

## Creating Your First Table

1. Place the **Table** widget on the page and open the widget settings
  . The **Table Editor** appears automatically above the
   “Table Data” field.
2. **Double-click** a cell and type in the text. Clicking
   another cell or pressing **Esc** confirms the entry.
3. Fill in the **first row** with the column headers.
4. If rows or columns are missing: **Cells** tab → **Insert** → e.g., “Row
   below” or “Column to the right.”
5. Click **Apply** in the upper-right corner. Only then will the table appear in the
   widget.
6. Save the page in Studio.

If the title says **“… – not applied”**, something is still pending. Clicking
**Undo** reverses the last step.

## Import an Existing Table from Excel or CSV

1. In the table editor, to the right of the tabs, click **Import (.csv,
   .xlsx)** and select the file (`.csv`, `.xlsx`, or `.xls`).
2. Check the result: The import **replaces the entire table**;
   nothing is appended. From Excel, merged cells, bold/italic/
   underlined text, colors, font sizes, alignment, and superscript and
   subscript formatting are preserved. For an Excel workbook, the **first
   worksheet** is used. If you selected the wrong file: **Undo**.
3. **Apply**.

Alternatively, you can also **copy and paste** cells directly from Excel:
double-click in a cell and paste—the block will be distributed across multiple cells
starting from that point.

## Formatting Cells

1. Select the cells to be formatted: click, drag while holding down the mouse button,
   use **Shift** to select a range, or use **Ctrl/Cmd**
   to include additional ranges. Clicking a column letter or
   a row number selects the entire column or row; clicking the top-left
   corner cell selects the entire table; right-clicking there selects it and opens the
   context menu.
2. The **Font** tab for font size, bold, italics, underline,
   strikethrough, superscript/subscript, and font and background colors.
3. The **Alignment** tab for left/centered/right and top/middle/bottom.
4. **Apply**.

To apply formatting to additional cells:

1. Select a cell that has already been formatted.
2. Click the **Data** tab → **Format**.
3. Select the target cells—they will adopt the format.

## Merge Cells

1. Select the cells you want to merge.
2. **Cells** tab → **Merge**.
3. Undo with **Unmerge**.

## Insert an Image into a Cell

1. Select the cell.
2. Click the **Pictures** tab → **Picture**. The media library opens on the right as a bar
   labeled “Picture for Cell B3”; select an existing picture or upload a new
   one. Press **Esc** to close it without inserting anything. A faster
   way is to drag: drag an image from the panel directly onto any
   cell and drop it there.
3. If multiple images are different sizes: select all image cells and
   use **Image Size** to select either “Same height as first image” or “Same
   width as first image” (this requires at least two images).
   **Default Size** resets them.
4. If an image extends beyond the table, enable the
   **Fit Images** switch on the right side of the **Table** panel—this ensures all images remain within the
   table width.

## Sorting the Table

1. In the **Table** panel on the right, under **Primary Sort**, select the column.
2. Below that, select **Ascending** or **Descending**. **None** cancels the
   sort.
3. **Apply**. This sort order is the default for all
   readers; the header row always remains at the top.

Quick shortcut for the column under the mouse: Right-click in the column →
**Sort** → “Ascending (this column)” or “Descending (this
column).”

## Collapse a Long Table

1. On the right side of the **Table** panel, under **Visible Rows**, enter the number of
   data rows you want to see immediately. The default
   is 5; `0` always shows all rows.
2. Use **Desktop** or **Mobile** in the header bar to check how it looks.
3. **Apply**. A button will then appear below the table on the page
   labeled “Show N More Rows” or “Show Fewer Rows.”

## Make the Table Available for Download

1. On the right side of the **Table** panel, select **Export**:
   - **Entire Table** — Readers will always download the entire table.
   - **With Row Selection** — There is a checkbox before each row;
    the selected rows are exported; if nothing is selected, the entire table is exported.
2. **Apply**. The “Excel (.xlsx)” and
   “CSV” buttons appear above the table. The Excel file retains formatting and linked cells and can
   be imported back here; the CSV file opens directly in German Excel
  .

The export is not displayed in the Staffbase app—files cannot be
reliably downloaded there. It is available in the mobile browser.

## Remove Formatting

1. Select the relevant cells.
2. Go to the **Data** tab → **Formatting** and select the appropriate option:
   remove everything, remove only text formatting, or remove only image sizes.
3. **Apply**.

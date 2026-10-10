# Sassy v0.4.7

Unzip this package and double-click data-step-lab.html in desktop Chrome or Edge. No server, Python, account, or internet connection is needed. Keep the old version if you want an easy rollback.

The Program, Output, and Log tabs share the main workspace. WORK datasets stay on the left; clicking one opens its current table in Output. Use New, Open program, Save, or Save as alongside the program filename. Run executes the editor; Ctrl+Enter also runs it. Source and Expanded code are views within Program. Program and project-folder controls, including Supported syntax, share a compact box at the top right.

Output accumulates final dataset snapshots from successful runs. Choose an earlier run in the Session output dropdown to review or download its table even after a later run replaces that WORK dataset. The log appends run starts, file reads, notes, errors, and file actions. Successful runs open Output; failed runs open Log. Clear output removes output history without deleting WORK datasets. Clear log removes only log text. Both histories are held in this tab and reset on reload; the program recovery draft and remembered folder remain separate.

To keep memory bounded, output retains up to 100 table/chart snapshots or 250,000 rows/plotted values, preserving at least the newest snapshot. Older snapshots are removed with a log note. The log trims oldest entries beyond one million characters. Export important results before closing. These are session histories, not disk backups.

SAS syntax colors use bundled PrismJS 1.30.0: blue statements/functions, red strings, green comments, amber numbers, and purple macro variables. Typing, selection, copying, and saving use a plain text editor; coloring never changes the program. Programs over 100,000 characters use plain text coloring to keep editing responsive. Coloring recognizes more SAS syntax than this interpreter supports; it does not validate programs or add language features.

For a ready-to-test file workflow, choose the included demo-project folder, click Browse files, open project-demo.sas, and Run. It imports claims.csv and saves reviewed.csv. See project-files.md for relative paths, permission/reconnection rules, overwrite behavior, and the current PROC IMPORT/EXPORT subset.

This patch adds Chart.js plots, titles, and PNG downloads. Open charts-demo.sas from the included demo-project folder and Run to create five charts; it needs no folder connection. Choose each chart in the Session output dropdown. Chart.js is bundled inside the HTML and works offline. See charts.md for supported syntax and limits. Permanent JSON libraries and the SPI logo are included. Open library-demo.sas from the included demo-project folder to create a native table. See native-tables.md for the file schema, library syntax and limits. Folder permission rules remain unchanged. Further small releases can use v0.4.7, v0.4.7, and so on; a major milestone can be cut when agreed.

## Contextual syntax guide

On the Program tab, click **Syntax guide**, or press **Ctrl+Space** in Source. The right panel follows the cursor inside a supported procedure or function and shows implemented syntax, options and limits. Close it to restore the full editor width. Tab still indents; this release does not provide a completion popup.

The catalog has five procedures (SORT, IMPORT, EXPORT, SGPLOT, SGPIE), all 35 DATA step functions, 20 format families, and DATA/LIBNAME/FILENAME/TITLE/CALL STREAMINIT/macro references. Search or select an entry to browse independently; check **Follow cursor** to resume contextual help. **Insert template at cursor** inserts a procedure skeleton or function example, replacing only an explicitly selected range. Surrounding source remains. Edit example names before Run; insertion never runs code or accesses files. Format entries are reference-only.

The tolerant scanner skips comments and quoted strings. It examines source before the caret, without expanding macros or validating the whole program; macro-generated procedures and incomplete/ambiguous syntax may need manual catalog selection. This is the supported Sassy subset, not the complete SAS documentation. Source catalog: dist/syntax-help.mjs, embedded in the standalone build. Added HTML size is approximately 24 KB (1.6%); no runtime dependencies or network calls.

## Code & export demo

Click **Code & export** in the upper-right project controls to view the current SAS program, actual JavaScript runtime or Node/Python wrappers. **Export runnable demo ZIP** packages the current program and all current WORK snapshots. Export never executes code. External CSV/native project files are not copied; use `--project folder` when running to locate them.

To try it, open demo-project/portable-demo.sas and export. Extract the package and run `node run.mjs`, or `python run.py` with Node.js 24+ and Python installed. The README explains calling it from Python and interpreting returned JSON tables. The standalone browser app requires neither runtime installed. Chart data models are returned, not rendered images. See portable-demo.md for scope and filesystem behavior.

## PROC MEANS and example programs

Click **Examples** in the upper-right header. Preview eight programs, download a .sas snippet, or **Open in editor**. Opening never runs code; unsaved edits prompt before replacement. Programs cover generated DATA/SORT/MERGE, MT32 uniform draws, all five charts, PROC MEANS, macros, CSV project files, permanent libraries and formats. The CSV/library examples require the included demo-project folder; the others generate their own inputs.

PROC MEANS saves overall totals and each CLASS subset by default using _TYPE_ bit flags and _FREQ_. NWAY removes those rows when requested. Inactive character classes are blank; numeric classes are missing. OUTPUT without statistic requests uses five _STAT_ rows. Reports appear in session Output; saved tables appear in Libraries. See means.md for statistics/options, missing values, naming and limits. The included means-validation ZIP contains deterministic SAS programs and Sassy result CSVs for the next actual SAS comparison.

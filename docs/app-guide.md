# Sassy v0.4.4

Unzip this package and double-click data-step-lab.html in desktop Chrome or Edge. No server, Python, account, or internet connection is needed. Keep the old version if you want an easy rollback.

The Program, Output, and Log tabs share the main workspace. WORK datasets stay on the left; clicking one opens its current table in Output. Use New, Open program, Save, or Save as alongside the program filename. Run executes the editor; Ctrl+Enter also runs it. Source and Expanded code are views within Program. Program and project-folder controls, including Supported syntax, share a compact box at the top right.

Output accumulates final dataset snapshots from successful runs. Choose an earlier run in the Session output dropdown to review or download its table even after a later run replaces that WORK dataset. The log appends run starts, file reads, notes, errors, and file actions. Successful runs open Output; failed runs open Log. Clear output removes output history without deleting WORK datasets. Clear log removes only log text. Both histories are held in this tab and reset on reload; the program recovery draft and remembered folder remain separate.

To keep memory bounded, output retains up to 100 table/chart snapshots or 250,000 rows/plotted values, preserving at least the newest snapshot. Older snapshots are removed with a log note. The log trims oldest entries beyond one million characters. Export important results before closing. These are session histories, not disk backups.

SAS syntax colors use bundled PrismJS 1.30.0: blue statements/functions, red strings, green comments, amber numbers, and purple macro variables. Typing, selection, copying, and saving use a plain text editor; coloring never changes the program. Programs over 100,000 characters use plain text coloring to keep editing responsive. Coloring recognizes more SAS syntax than this interpreter supports; it does not validate programs or add language features.

For a ready-to-test file workflow, choose the included demo-project folder, click Browse files, open project-demo.sas, and Run. It imports claims.csv and saves reviewed.csv. See project-files.md for relative paths, permission/reconnection rules, overwrite behavior, and the current PROC IMPORT/EXPORT subset.

This patch adds Chart.js plots, titles, and PNG downloads. Open charts-demo.sas from the included demo-project folder and Run to create five charts; it needs no folder connection. Choose each chart in the Session output dropdown. Chart.js is bundled inside the HTML and works offline. See charts.md for supported syntax and limits. Permanent JSON libraries and the SPI logo are included. Open library-demo.sas from the included demo-project folder to create a native table. See native-tables.md for the file schema, library syntax and limits. Folder permission rules remain unchanged. Further small releases can use v0.4.5, v0.4.6, and so on; a major milestone can be cut when agreed.

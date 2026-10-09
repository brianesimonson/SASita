# Programs and project folders — v0.4.0

The app remains one HTML file, with no backend or installed desktop runtime. Download `dist/SASita-v0.4.0.zip`, unzip it, and open `data-step-lab.html` in desktop Chrome or Edge. The ZIP includes a `demo-project` folder with a CSV and runnable program.

## Try the folder workflow

1. Click **Choose project folder**, select the unzipped **demo-project** folder, and grant the browser read/write access.
2. Click **Browse files** and open **project-demo.sas**.
3. Click **Run program**. WORK.REVIEWED contains six rows, and **reviewed.csv** is saved in that folder. Rerunning explicitly replaces that CSV.
4. Edit the program and click **Save** to write back to the opened file. **Save as…** chooses another target. Ctrl/Cmd+S saves; Shift+Ctrl/Cmd+S saves as.

**Open program** opens a .sas/.txt file. Supported browsers retain its file handle for direct saves during the session. Other browsers use uploads and downloads. **New** starts a blank program. Unsaved edits prompt before replacement; a browser-local recovery draft can survive closing/reloading, but is not a saved file. Restored code is not executed automatically. Only the built-in sample runs at startup.

## Remembering authorization

The app stores the chosen directory handle in IndexedDB in this browser when available. After reload it queries existing permission, without silently requesting a new grant. If read/write permission remains granted, the project reconnects automatically. Otherwise, **Reconnect folder** requests it during your click. Ordinary program reads/writes query permission and never open a picker. Expired permission disconnects the active handle and exposes Reconnect.

Browsers control permission lifetime. You may need to reconnect after browser restarts, site-data deletion, private browsing, moving the HTML to another origin/location, or browser policy changes. Remembering a handle does not bypass browser consent. **Disconnect & forget** removes the app's stored project reference when storage permits; browser permissions can also be revoked in browser settings.

## Supported file syntax

```sas
filename source 'inputs/claims.csv';
proc import datafile=source out=claims dbms=csv replace;
  getnames=yes;
  guessingrows=max;
run;
data result;
  set claims;
  doubled=paid_amount*2;
run;
proc export data=result outfile='outputs/result.csv' dbms=csv replace;
run;
```

Paths refer to the selected project root. Existing subfolders work; create them in your file manager first. Program files can live in any subfolder, but CSV paths always start at the project root, not the program's directory. FILENAME aliases are run-scoped and can be reassigned or cleared. Double-quoted paths support the existing macro expansion; SAS-style single-quoted paths remain literal.

File procedures support CSV only, WORK datasets, a header row, all-row numeric type inference, and optional REPLACE. GETNAMES=NO, other DBMS values, additional SAS import/export options, absolute OS paths, URLs, parent traversal, LIBNAME directory libraries, DATA-step INFILE/INPUT/FILE/PUT, and %INCLUDE are not implemented. CSV import retains the existing interpreter's type/missing conventions; it is not all of SAS PROC IMPORT.

CSV files are limited to 20 MB each, total prepared exports to 50 MB per run, project programs to 200 steps, and each dataset to 100,000 rows. The worker retains the 8-second limit, including import waits; disk saves occur after computation. Program files are limited to 1 MB. Directory browsing shows up to 500 entries per folder.

## Save behavior

Imports enter a temporary WORK workspace. Exports are prepared as raw numeric CSV, with formats used for display only. Importing the exact path of a prior prepared export in the same run reads that prepared content. If parsing, imports, or calculations fail, no program export is written and WORK is unchanged.

After computation succeeds, every export path and overwrite rule is checked before any write. Existing targets require REPLACE. The app then saves files individually and commits WORK after all saves succeed. There is no filesystem-wide transaction: disk-full/device/permission failures may leave earlier exports saved. The Log lists paths possibly changed, and WORK remains unchanged on save failure. Writable streams are aborted after a write failure where possible.

Manual **Save CSV to project** is an explicit overwrite action for `<selected-dataset>.csv` in the project root. **Download CSV** is the normal download fallback. **Save program** overwrites its opened target; **Save as…** uses the browser's save picker. If save pickers are unavailable, the app downloads the program and leaves the editor labeled as a draft.

## Validation and remaining checks

`npm test` includes path validation, macro paths, FILENAME clearing, imported/derived/staged datasets, prior-export reads, failed-run rollback, export bounds, all-target overwrite preflight, permission expiry/reconnect, and partial disk-save reporting. Existing arithmetic/MT32/merge regression checks remain enabled. The offline build contains all new modules and still needs no external resources.

The Chromium suite exercises both modular and standalone builds, native browser sandbox directory/file handles and writable streams, IndexedDB persistence across reload, program open/direct save, automatic project CSV import/export, overwrite refusal, failed-run disk rollback, draft recovery, and all existing examples/import/download checks. It also runs the prior 20K arithmetic, 40K merge, and large-number programs with their full CSV comparisons.

The test substitutes browser sandbox handles for an OS folder picker. Real desktop picker dialogs, OS folder permissions, and Windows file:// launch still need a manual Chrome/Edge check. This cloud browser blocks file:// navigation by policy; that is not a tested app failure. Folder APIs are feature-detected; unsupported browsers retain upload/download functionality. If local-file storage or folder access is blocked by your browser, the UI reports it and offers session-only/manual workflows.

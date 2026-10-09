# Sassy native JSON tables, version 1

Sassy v0.4.3 supports `LIBNAME` for permanent tables inside the project folder selected by the user. Files are readable JSON; no SAS7BDAT engine or installed runtime is involved.

```sas
libname saved 'tables';
data saved.reviewed;
  set work.claims;
  if paid_amount > 1000;
run;
/* Another run can read it: */
data restored;
  set saved.reviewed;
run;
```

Create the tables subfolder yourself before assigning it, or use `libname saved '.';` for the selected project root. Existing subfolders are supported; absolute paths, URLs and parent traversal are rejected. Library names are case-insensitive SAS identifiers of at most 8 characters; WORK, SASHELP and SASUSER are reserved. Member/column names in native files use lower-case SAS identifiers of at most 32 characters. Bindings persist across runs in the current tab, not across reloads. Reissue LIBNAME when opening another session. Changing/disconnecting the project clears bindings and cached library members. Files are not deleted by `libname saved clear;`.

`data saved.reviewed` prepares `tables/reviewed.sassy-table.json`. One-level names and `work.name` remain temporary. DATA and PROC SORT replace a named target when the run succeeds. CSV PROC IMPORT can target a named library when REPLACE is supplied (required for all permanent CSV imports in this implementation); CSV PROC EXPORT can read library members. Other LIBNAME engines/options and concatenated libraries are unsupported. Libraries do not create folders or request permission during a run.

The left sidebar groups WORK and assigned libraries. Saved members appear after a successful run; Refresh libraries rereads directory listings. Clicking a member reads its JSON from disk. SET/MERGE/PROC SORT reads named tables from disk on first use in each run, so cached display data does not hide external changes. Later uses see the current run's data. Aliases of the same folder can read a preceding staged table. Repeated writes to the same native path save only the final version. A library cannot be cleared or reassigned after writing through it in the same program.

All native/CSV saves are prepared before disk writing. Each target is preflighted before any write; a later syntax/schema error saves nothing. Multiple disk saves cannot be atomic; a storage failure may leave earlier files saved, and the log reports possibly changed paths. WORK and bindings commit only after file saves succeed. Permission can expire; click Reconnect and rerun. Each table is limited to 20 MB UTF-8, 100,000 rows and 1–1024 columns. Combined prepared CSV/native files are limited to 50 MB. Directory listings currently inspect at most 500 entries.

A machine-readable JSON Schema is included as native-table-v1.schema.json in the ZIP (source: docs/schemas/native-table-v1.schema.json). It covers the structural contract; the app additionally checks rows against descriptors, unique columns, supported formats and file-size limits.

## File structure

```json
{
  "format": "sassy-table",
  "version": 1,
  "name": "reviewed",
  "columns": [
    {"name": "id", "type": "numeric", "length": 8, "format": null},
    {"name": "label", "type": "character", "length": 20, "format": null}
  ],
  "rows": [
    {"id": 1, "label": "Example"}
  ]
}
```

Column order is the descriptor-array order. Row order is significant. Every row contains exactly the descriptor names; duplicate columns, unknown versions, incompatible types/lengths/formats, and corrupt JSON are rejected. Numeric values are finite double-precision numbers or null for missing. Character values are strings (including empty strings); null is also accepted to preserve the current engine's missing character values. Numeric length is 8, describing the app's double representation. Character length is the declared length when known; null means undeclared/unbounded in the current interpreter. Known character lengths propagate through SET/MERGE/rename and SORT, and assignments use that limit. This remains a SAS subset, not full SAS descriptor creation semantics. Formats use the app's supported SAS-style specifications; they affect display, not stored raw numbers.

The writer and JavaScript JSON parser preserve finite doubles exactly, including negative zero (written as the JSON literal -0). This is not arbitrary decimal precision; other platforms must use a suitable numeric parser for equivalent precision. Ordinary JSON writers may normalize negative zero. Engine special SAS missing values are not supported.

Other tools can analyze the ordinary row objects without a Sassy runtime. For example, in JavaScript:

```js
const table = JSON.parse(fileText);
console.log(table.rows);       // array of objects for analysis
console.log(table.columns);    // ordered type/length/format metadata
```

CSV remains the preferred simple interchange with SAS. Native JSON files cannot be directly opened as SAS7BDAT tables. Keep the format/version marker when producing files externally; Sassy validates the current schema on load.

The ZIP includes library-demo.sas and an existing tables folder in demo-project. Choose demo-project, Browse files, open library-demo.sas, and Run; it writes a reviewed native table and reads it back.

# LIBNAME and permanent tables: proposed next milestone

This is a design proposal, not an implemented feature in v0.4.2. The user requested a discussion of persistent table storage before building LIBNAME.

Recommended first implementation: one versioned JSON file per native Sassy table, using the extension .sassy-table.json. A single file holds schemaVersion, dataset name, ordered column descriptors (name, type, format, and character length when implemented), and ordered rows. Preserve numeric missing and character blanks distinctly. Validate every loaded schema and value; reject unsupported schema versions. JSON serialization and parsing preserve finite JavaScript double values exactly on round trip. This preserves current computed numbers, not exact arbitrary decimal arithmetic or full SAS semantics. Engine descriptor support may need extension to retain character lengths accurately.

Example proposed syntax:

```sas
libname saved 'tables';
data saved.reviewed;
  set work.claims;
  if paid_amount > 1000;
run;
```

With a user-authorized project folder, saved refers to its existing tables subfolder. The result is tables/reviewed.sassy-table.json. A later SET saved.reviewed reads it without manually importing CSV. One-level names continue to refer to temporary WORK. Library bindings belong to the current session, can be reassigned or cleared, and must not imply permanent browser permission. Directory handles may be remembered but browser access must still be checked.

Keep all reads/writes scoped to selected folder handles and relative paths. Stage permanent table writes until successful computation, preflight all targets, and report partial multi-file writes honestly. Define SAS-style replacement semantics for DATA library.member independently from PROC EXPORT's explicit REPLACE requirement. Add bounded file/row limits, schema validation, corrupt-file and permission-expiry tests, and discover library members in the left panel.

CSV remains an explicit import/export format; it does not preserve schema by itself. SAS7BDAT is not recommended for the first version: writing compatible native SAS files requires a dedicated implementation and verification. SQLite/Parquet can be evaluated later if scale or interoperability needs warrant their additional code and format complexity. Native JSON files cannot be opened directly as SAS datasets; use CSV for SAS interchange.

Decisions for discussion: accept the native JSON format, finalize descriptor fields and replacement behavior, then implement LIBNAME/read/write/library browsing as a separate feature milestone.

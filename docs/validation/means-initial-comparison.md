# Initial PROC MEANS SAS comparison — October 10, 2026

User-uploaded 02-sas-comparison-results.html is preserved alongside this note.
SHA-256: 315080c2d3b83318aec4a871f423d07702d1d79b3aefd291c4230f63257ae423

Six PROC COMPARE sections exist, but the first (means_all by script order) is
empty. The other five show only dataset/variable summaries, not value summaries.
In script order their observations and conflicting-type counts are:

| Table | SAS rows | App rows | Conflicting types |
|---|---:|---:|---:|
| means_missing | 14 | 14 | 6 |
| means_nway | 6 | 6 | 5 |
| means_default | 5 | 5 | 4 |
| means_by | 3 | 3 | 5 |
| means_large | 1 | 1 | 7 |

The conflicts equal the numeric-column counts in each table; character site/_STAT_
columns are not conflicting. This is consistent with numeric CSV columns imported
as character. The HTML does not show the import code/log or variable descriptors,
so the exact cause (inference, uploaded CSV representation, or modified code) is not
proven. Matching row counts are useful structural evidence, not proof of matching
keys, frequencies or calculations. The missing first comparison needs the SAS log.

A separate fix branch replaces PROC IMPORT guessing with generated LENGTH and
INFILE DSD/INPUT statements for each actual column. Types, character lengths and
header order derive from Sassy's generated result datasets. Table-specific TITLE
identifies each report. Numerical CSVs and app code are unchanged. No actual SAS
rerun of the corrected harness has yet been supplied; this remains pending.

# PROC SQL comparison — Sassy v0.4.21

SQL validation is complete for all sixteen corrected groups / 71 matched records, combining fifteen original passes with the focused grouped STD/VAR rerun. All compared values were reported exactly equal. No further SQL-kit rerun is needed.

For optional future regression, upload/run 01-sas-sql-comparison.sas for all sixteen groups or 02-sas-grouped-comparison.sas for only the three-row grouped case. No CSV uploads, folder paths or edits are required. The original STDDEV program failed function resolution; use STD in SQL. Its evidence is preserved alongside the corrected passing evidence in fixtures/sas.

Comparisons sort all output columns at relative numeric tolerance 1e-10 and also compare character values. Original query order, full descriptors/layout and behavior outside these cases are not certified. The expected-table helper declares character columns wide (for example g length128 versus source4), so attribute notes can appear despite equal values. The full GROUP BY-without-summary case may produce SAS's documented transformation warning; the focused case does not. SQL remerging, subqueries, DML, set operations, views and macro INTO remain unsupported.

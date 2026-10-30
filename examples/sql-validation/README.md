# PROC SQL comparison — Sassy v0.4.21

For the remaining test, upload/run only **02-sas-grouped-comparison.sas** in SAS Studio. The first actual run passed fifteen groups / 68 records exactly, while sql_grouped did not run because SAS rejected STDDEV(x). The revised grouped test uses STD(x) and has three expected rows. Return its Results and Log.

For a complete sixteen-group regression run instead, use 01-sas-sql-comparison.sas. No CSV uploads, folders or edits are needed. Return Results and Log. Sixteen groups cover joins (including duplicate/missing keys), grouped statistics, DISTINCT/UNIQUE, CASE, CALCULATED, row functions, HAVING, empty summaries and missing predicates.

The revised grouped expectations await actual SAS validation. Original first-run evidence and kit are preserved in fixtures/sas; passing first-run groups remain recorded as passed. Comparisons sort by all columns before matching values; original SQL row order and exact descriptors/layout are outside this certification. Relative numeric tolerance is 1e-10; character values are also compared. One GROUP BY-without-summary test may produce SAS's expected transformation warning. SQL remerging, subqueries, DML, set operations, views and macro INTO are deliberately unsupported. Original models/CSVs are reference material and need not be uploaded.

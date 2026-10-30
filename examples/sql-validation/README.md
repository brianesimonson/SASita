# PROC SQL comparison — Sassy v0.4.20

Upload/run only 01-sas-sql-comparison.sas in SAS Studio. No CSV uploads, folders or edits are needed. Return Results and Log. Sixteen groups cover joins (including duplicate/missing keys), grouped statistics, DISTINCT/UNIQUE, CASE, CALCULATED, row functions, HAVING, empty summaries and missing predicates.

These are app-generated expectations awaiting actual SAS validation. Comparisons sort by all columns before matching values; original SQL row order and exact descriptors/layout are outside this certification. Relative numeric tolerance is 1e-10; character values are also compared. One GROUP BY-without-summary test may produce SAS's expected transformation warning. SQL remerging, subqueries, DML, set operations, views and macro INTO are deliberately unsupported. Original models/CSVs are reference material and need not be uploaded.

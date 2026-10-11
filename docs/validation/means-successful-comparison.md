# Successful PROC MEANS reference comparison

User-supplied `02-sas-comparison-results (1).html` is the corrected run on
SAS 9.4 M8. Source upload: file_00000000592481f58ed2442d74ccf133.
The report compares Sassy v0.4.8 CSVs with SAS-produced datasets using RELATIVE
criterion 1e-12. All six comparisons executed with matching row counts and IDs,
and no values classified as unequal at that tolerance.

| Table | Rows | Compared variables | Values not exactly equal | Maximum criterion value |
| --- | ---: | ---: | ---: | ---: |
| means_all | 12 | 15 | 12 | 2.5879e-16 |
| means_missing | 14 | 4 | 1 | 2.1328e-16 |
| means_nway | 6 | 3 | 0 | 0 |
| means_default | 5 | 3 | 1 | 1.4253e-16 |
| means_by | 3 | 4 | 2 | 2.1328e-16 |
| means_large | 1 | 6 | 0 | 0 |

The report confirms the tested CLASS total/subtotal keys, NWAY, missing-class
handling, default _STAT_ output, BY grouping, frequencies and named statistics.
Seventeen individual values differ at floating-point rounding scale. The
maximum is a relative criterion value, not an absolute error. This is reference
validation for these inputs, not exhaustive PROC MEANS compatibility or a claim
of bit-identical results. Metadata can differ: SAS's default table is marked
SUMMARY with label SUMMARY STATISTICS; the imported app table lacks those.

Prior aborted comparisons and their corrections remain documented separately.

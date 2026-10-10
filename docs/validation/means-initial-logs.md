# PROC MEANS initial SAS logs — October 10, 2026

Original user-uploaded HTML logs remain in the attached workspace files; hashes:
- 01-means-validation-log.html: `4a050d38327fe22aea18871b675ec0a13c6c556e464d3f6d3bcfed96816b778a`
- 02-sas-comparison-log.html: `32adc54b58bb3d51abcd4603b29f0a6f83a1120ba734f2b9945fdee42f3bce9c`

01 completed without ERROR/WARNING diagnostics. SAS created:

| Table | Rows | Variables |
|---|---:|---:|
| means_all | 12 | 18 |
| means_missing | 14 | 7 |
| means_nway | 6 | 6 |
| means_default | 5 | 5 |
| means_by | 3 | 6 |
| means_large | 1 | 7 |

These dimensions match Sassy's fixtures. They do not establish equal keys or values.
02 is the ORIGINAL PROC IMPORT script, not the newly generated typed-input helper.
Its generated imports explicitly used character informats/input (`$`) for numeric
CSV columns. PROC COMPARE aborted for ID type conflicts on PERIOD/_TYPE_.
The first comparison aborted earlier with `Variable AMOUNT_STD not found` and
`Variable OTHER_STD not found` in SAS's base dataset. SAS AUTONAME canonicalizes
STD to the StdDev suffix; Sassy incorrectly used the literal STD suffix.

v0.4.8 changes only generated STD/STDDEV names, not the statistical arithmetic or
explicit user output names. Both keywords now generate *_stddev, with repeated
requests generating *_stddev2. The six generated CSVs retain identical numeric
values; means_all headers change. The updated SAS helper uses explicit numeric
LENGTH/INPUT with INFILE DSD and includes PROC CONTENTS for MEANS_ALL to expose
actual SAS variable names in the next results. The corrected harness is still
awaiting actual SAS execution. No numerical SAS-equivalence claim is made.

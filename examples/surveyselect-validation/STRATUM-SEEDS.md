# Focused stratum-seed investigation

Run `03-stratum-seed-probe.sas` in SAS Studio and return its HTML Results and log.
No input CSVs, folder edits, previous session or CSV downloads are needed. The
program creates 25 synthetic units in five strata and prints just 35 selected
rows across four cases.

The existing four-stratum test is now reproducible using only the main seed:
initialize a separate master default stream with 12345, use 12345 for the first
stratum, and convert consecutive master draws to integer seeds for the rest.
Two candidate conversion rules both reproduce 1252620909, 2133794239 and
1262479164: floor(U*2^31) and floor(U*(2^31-1)). They predict different fifth
seeds: 1841400342 versus 1841400341. The new test distinguishes those rules,
or could show both are wrong outside the four-stratum example.

Changing sample size (one versus two units) and method (SRS versus SYS) checks
whether seed derivation is separate from sample selection. A second main seed
24680 checks that the rule is not an accidental fit to seed 12345.

This remains empirical investigation. Do not claim the full automatic SAS seed
rule is verified until this result and any contradictory cases are examined.
The app still has no PROC SURVEYSELECT implementation.

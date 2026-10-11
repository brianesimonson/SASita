# PROC SURVEYSELECT — Sassy v0.4.10

Runs locally in the offline browser app and the exported Node runtime (also
through the Python wrapper). No server or SAS installation is needed.

```sas
proc surveyselect data=population out=sample
    method=srs seed=12345 sampsize=10 stats outsize outseed;
    strata region;
run;
```

DATA= and OUT= are required. WORK tables and assigned JSON libraries are accepted
as sources/targets; permanent outputs follow the same staged-save rules as DATA
and PROC SORT. Programs may use macros, subsequent DATA steps, charts and MEANS
on the sampled tables. Library paths remain relative to the chosen project.

## Implemented

| Method/option | Behavior |
| --- | --- |
| METHOD=SRS (default) | Equal probability without replacement, Floyd algorithm; selected rows retain input order |
| METHOD=URS | Equal probability with replacement; one row per selected unit with NumberHits |
| OUTHITS | URS expanded rows; each copy retains the unit's total NumberHits |
| METHOD=SYS | Random start and interval N/n, including fractional intervals; uses existing input order |
| SAMPSIZE= / N= | One positive scalar integer, applied per stratum if STRATA is present |
| SAMPRATE= / RATE= | SRS/URS; multiply each population size and round up; 0–1 proportions or percentages >1–100; 1 means 100% |
| STRATA | 1–8 explicit variables; input sorted ascending by all keys; numeric/character and blank/missing strata accepted |
| SEED= | One main seed; positive seeds reproduce runs; omitted/nonpositive seeds are automatically chosen and logged |
| Default stratum streams | First stratum uses main seed; later seeds come from a separate master stream, floor(U*2147483647) |
| STRATUMSEED=NONE | Single continuous stream across strata; cannot combine with OUTSEED |
| REPS= | 1–100, without STRATA; appends Replicate and continues the stream across replicates |
| STATS | Adds SelectionProb/SamplingWeight, or ExpectedHits/SamplingWeight for URS; these are also included by default for STRATA |
| OUTSIZE | Adds Total and SampleSize or SamplingRate |
| OUTSEED | Adds InitialSeed (unstratified main seed or derived stratum seed) |
| NOPRINT | Suppresses the app's selection-summary report; output table still created |

Source variable types, lengths and formats are retained. Output columns use
case-insensitive SAS names; internally names are lower case. Generated name
collisions fail rather than overwriting input variables. Count/probability/seed
columns are numeric. Summary reports append to session Output, independently of
saved datasets. The report layout is Sassy's, not an exact SAS ODS reproduction.

## Not implemented

PPS/unequal-probability designs, SIZE/CLUSTER/SAMPLINGUNIT, CONTROL and serpentine
sorting, BY, ID, FREQ, allocation, per-stratum size/rate/seed lists or input
datasets, zero-size or SELECTALL strata, OUTALL/OUTSORT/JTPROBS, INTERVAL/START,
SAMPRATE with SYS, formatted strata, stratified REPS, METHOD=SRS2/SEQ/BERNOULLI,
RANUNI and STRATUMSEED=RESTORE. Unsupported syntax fails explicitly. Use an
unformatted grouping column and PROC SORT before STRATA.

Bounds: 100,000 frame rows and output rows per procedure; 1,000 strata; 100
replicates; scalar sample size up to 100,000. Expanded replacement samples are
bounded by requested draws before allocation. A derived zero stratum seed fails
explicitly because that rare case is outside the verified subset. Browser runs
retain the existing timeout; reports share the 20-report/100,000-row run limit.

## What matches SAS

The integrated runtime is compared against twelve user-generated SAS 9.4 M8 /
SAS/STAT 15.3 CSV tables plus all 35 rows of the five-stratum seed probe, using
main seeds 12345 and 24680. IDs, hits, replicates, derived seeds, ordering,
columns and checked design values match; CSV weight comparison allows decimal
export rounding. It never uses saved stratum seeds to choose samples. See
validation/surveyselect-stratum-seeds.md and fixtures/sas/surveyselect-9.4m8.

This verifies those cases, not every SAS release, seed or option. Default/hybrid
exceptional seeds, legacy initialization, very long default streams and the
newly supported character/missing-stratum edge cases lack actual SAS fixtures.
See random-numbers.md for the distinction between the verified uniform streams
and paired NORMAL reference checks with last-bit differences. The included ninth example needs no folder.

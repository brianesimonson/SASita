# Automatic stratum seed derivation: focused SAS probe

User sources: `03-stratum-seed-probe-results.html` (upload
file_000000003ee0823088ebebe1cc67fae8) and `03-stratum-seed-probe-log.html`
(file_000000000c5481f588437a0eb10a80b2). HTML hashes and all 35 printed rows
are stored in fixtures/sas/surveyselect-9.4m8/stratum-seed-probe.json.
The log has no errors or warnings; all four procedure/PRINT steps completed.

## Verified rule for these references

1. Initialize a separate master default uniform stream from the procedure seed.
2. Use the procedure seed as the initial seed of stratum 1.
3. For each subsequent stratum, use floor(nextMasterUniform * 2147483647).
4. Initialize a separate sampling stream with that stratum's derived seed.

Do not consume the sampling stream to derive the later strata's seeds. The
observed seeds stay the same when changing sample size or switching SRS/SYS.

| Stratum | Main seed 12345 | Main seed 24680 |
| --- | ---: | ---: |
| 1 | 12345 | 24680 |
| 2 | 1252620909 | 2025365895 |
| 3 | 2133794239 | 503201303 |
| 4 | 1262479164 | 16721855 |
| 5 | 1841400341 | 1994925196 |

The fifth stratum for seed 12345 rejects the competing scale 2147483648,
which would give 1841400342. The correct scale 2147483647 also reproduces all
five seeds and selected IDs for main seed 24680. No saved InitialSeed value
is used as input to the JavaScript calculation; reference rows are only
assertion targets.

`node scripts/check-surveyselect-reference.mjs` passes all earlier twelve
sampling cases plus all 35 rows of these four new cases: SRS n=1, SRS n=2,
SYS n=2 at seed 12345 and SRS n=2 at seed 24680. This verifies selected IDs
as well as derived seeds. Earlier 400-value explicit/default uniform checks
continue to pass exactly.

This resolves the conversion ambiguity for the tested SAS 9.4 M8/SAS/STAT
15.3 behavior. It is not certification for every seed, default/hybrid generator
exception, legacy STRATUMSEED=RESTORE, replicated stratified stream lifecycle,
zero-size strata, or special sorting/grouping case. App integration is still
separate work; no additional user reference run is needed for this ambiguity.

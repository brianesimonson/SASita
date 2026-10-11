# SURVEYSELECT reference collection

Completed focused follow-up: `stratum-seed-probe.zip` contains the standalone
`03-stratum-seed-probe.sas` program already run by the user. Its 35 rows confirm
the scale 2^31-1 seed derivation at two main seeds; no saved seed inputs are
needed in the JavaScript replay. See STRATUM-SEEDS.md and
docs/validation/surveyselect-stratum-seeds.md. No additional SAS run is needed
for this ambiguity. The original collection below has already been received
and preserved in fixtures/sas/surveyselect-9.4m8.

This is a SAS-only investigation kit, not a new Sassy release. Sassy v0.4.8 does
not implement PROC SURVEYSELECT yet. The kit collects actual selected IDs,
NumberHits, sampling information, output descriptors, and SAS version details
before we claim exact sample reproduction.

## Run in SAS Studio

1. Extract the ZIP and upload `01-surveyselect-reference.sas` and
   `sassy_mt32_uniform.csv` into your `sasuser.v94` folder.
2. Open and run the entire SAS program. It defaults to the SASUSER directory;
   if you used a different folder, change `fixture_folder` and `output_folder`
   at the top. The resolved output path is printed in the log.
3. Download the HTML Results and HTML log. Also return the generated `ss_*.csv`
   files, preferably together in a ZIP. The HTML tables provide the small-sample
   selections if downloading the CSVs is inconvenient.

The program creates/replaces only its own WORK ss_* tables and named ss_*.csv
exports. It does not import or modify your other datasets. SAS/STAT must be
available. This kit targets the modern SAS 9.4 environment used for the earlier
tests; the historical PDF's RANUNI behavior is not the default target.

## Recover the first run's exports

The initial helper used the reserved SAS macro name SAVE. The uploaded log
confirms all sampling and comparison steps completed, but the final print/export
section failed. The corrected collector uses `sassy_export_reference` instead.

If your original SAS session still has its WORK SS_* tables, upload and run only
`02-export-existing-reference.sas`. It prints descriptors and all selected rows
and exports the existing tables without rerunning sampling or requiring the MT32
input CSV. Return this program's HTML Results/log and the generated CSVs. If the
WORK tables are gone, run corrected `01-surveyselect-reference.sas` in full.

## Cases

All frames contain 20 records, IDs 1–20, in ascending ID order. Four numeric
strata contain five records each. The seed is 12345 unless explicitly stated.

| Output | Purpose | Expected rows/draws |
| --- | --- | --- |
| ss_srs | Floyd SRS without replacement | 7 distinct IDs |
| ss_srs_second_seed | Additional seed 24680 | 7 distinct IDs |
| ss_srs_rate | Rate 0.3 | 6 distinct IDs |
| ss_srs_census | Sample entire frame | 20 distinct IDs |
| ss_urs_collapsed | With replacement, collapsed | Sum NumberHits = 40 |
| ss_urs_hits | Same selection, OUTHITS | 40 rows |
| ss_urs_reps | Two independent replacement replicates | 7 rows per replicate |
| ss_sys_integer | Systematic interval 4 | 5 rows |
| ss_sys_fractional | Systematic interval 20/6 | 6 rows |
| ss_strata_srs | Default per-stratum streams | 2 IDs per stratum |
| ss_strata_single_stream | STRATUMSEED=NONE | 2 IDs per stratum |
| ss_strata_sys | Systematic within strata | 2 IDs per stratum |

The two uniform tables record 400 draws plus exact HEX16 representations:
explicit MT32 and default RAND. The uploaded Sassy CSV comes from the actual
existing engine and is verified against the first 400 draws of our prior SAS
seed-12345 reference. The explicit MT32 comparison should pass. Default RAND is
exploratory; agreement is not assumed. Neither comparison alone proves
SURVEYSELECT consumes the same stream in the same way.

The replacement representation check compares collapsed NumberHits with the
number of corresponding expanded rows; it should pass exactly. Do not sum
NumberHits over expanded rows, which could double-count repeated selections.

## Reproducibility boundaries

SAS documents a change from RANUNI to Mersenne Twister in SAS/STAT 12.1, and a
change in stratum stream initialization in 14.1. Compatibility options exist.
Record SAS release, input order, method, seed, stratum initialization and all
sampling parameters alongside any reference. This kit does not test legacy
RANUNI, STRATUMSEED=RESTORE, PPS, clusters, or allocation algorithms.

Source: [SAS/STAT 14.1 SURVEYSELECT](https://support.sas.com/documentation/cdl/en/statug/68162/HTML/default/statug_surveyselect_details03.htm)
and the user's readable historical SURVEYSELECT PDF. The initial sampling and
comparison sections ran in actual SAS 9.4 M8/SAS/STAT 15.3. The corrected export
section still needs execution in SAS; local packaging checks cannot validate
all SAS procedure syntax.

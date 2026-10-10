# PROC MEANS validation kit

01-means-validation.sas runs unchanged in Sassy and SAS. The supplied app_*.csv
files were computed by Sassy v0.4.7; regenerate with
`node scripts/package-means-validation.mjs` after rebuilding/changing the engine.

Run 01 in SAS, upload the six CSVs to the same SAS Studio folder, then edit
app_csv_folder in 02-sas-comparison.sas and run it in SAS. PROC COMPARE checks
keys (_TYPE_, CLASS/BY values or _STAT_), observation counts and statistics.
Default CLASS output includes all overall/subtotal types. NWAY has only the full
combination. Blank inactive CLASS columns and numeric missing values are intentional.
The corrected comparison program declares numeric and character types/lengths
explicitly and reads quoted CSV fields with INFILE DSD; no PROC IMPORT guessing.
It is regenerated from the app table schema. Dataset labels/formats can still
differ; examine values as well as metadata messages. Please return the SAS HTML results and log for review.

The kit is prepared for comparison, NOT evidence of an actual SAS comparison yet.
No random input or external project directory is needed for 01. The large-offset
case isolates variance accuracy rather than comparing only large magnitudes.

October 10 correction: the first uploaded SAS report stopped at conflicting types, so it did not establish numerical agreement. Replace only 02-sas-comparison.sas, set app_csv_folder again and rerun (run 01 first if the SAS WORK tables are no longer present). Existing six CSV files are unchanged. Please send both the new HTML results and SAS log.

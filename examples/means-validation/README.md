# PROC MEANS validation kit

01-means-validation.sas runs unchanged in Sassy and SAS. The supplied app_*.csv
files were computed by Sassy v0.4.7; regenerate with
`node scripts/package-means-validation.mjs` after rebuilding/changing the engine.

Run 01 in SAS, upload the six CSVs to the same SAS Studio folder, then edit
app_csv_folder in 02-sas-comparison.sas and run it in SAS. PROC COMPARE checks
keys (_TYPE_, CLASS/BY values or _STAT_), observation counts and statistics.
Default CLASS output includes all overall/subtotal types. NWAY has only the full
combination. Blank inactive CLASS columns and numeric missing values are intentional.
PROC IMPORT may infer different character lengths; examine values as well as
metadata messages. Please return the SAS HTML results and log for review.

The kit is prepared for comparison, NOT evidence of an actual SAS comparison yet.
No random input or external project directory is needed for 01. The large-offset
case isolates variance accuracy rather than comparing only large magnitudes.

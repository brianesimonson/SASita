# WEIGHT validation — Sassy v0.4.18

Upload only 01-sas-weight-comparison.sas to SAS Studio and run the entire program. No CSV imports or folder edits needed. Return the Results and Log. Fifteen comparison groups cover weighted MEANS CLASS totals, missing/nonpositive weights, EXCLNPWGT, four variance divisors, SUMWGT and standard errors, plus weighted GLM CLASS/interactions and a regression with excluded weights/missing responses.

Statistics use relative 1e-10 and modest-scale P/R use absolute 1e-12. The helper maps CV/coeffvar, fixture A*X/X*A labels and special missing codes for numeric comparison; descriptors/layout/bit identity are not certified. Predictions for excluded-weight rows and weighted fit statistics are specifically included for SAS confirmation.

Actual corrected v0.4.18 SAS rerun received 2026-10-28: all fifteen weighted MEANS/GLM groups and all 96 matched records pass, with no executed errors or warnings. This includes corrected _FREQ_ source counts independently of weight exclusions. No further weight-kit rerun is outstanding. Original failure and successful rerun evidence are preserved in fixtures/sas. WEIGHT is not FREQ or complex-survey variance estimation. Other model restrictions remain. Archive CSVs/models need not be uploaded for this comparison.

# WEIGHT validation — Sassy v0.4.14

Upload only 01-sas-weight-comparison.sas to SAS Studio and run the entire program. No CSV imports or folder edits needed. Return the Results and Log. Fifteen comparison groups cover weighted MEANS CLASS totals, missing/nonpositive weights, EXCLNPWGT, four variance divisors, SUMWGT and standard errors, plus weighted GLM CLASS/interactions and a regression with excluded weights/missing responses.

Statistics use relative 1e-10 and modest-scale P/R use absolute 1e-12. The helper maps CV/coeffvar, fixture A*X/X*A labels and special missing codes for numeric comparison; descriptors/layout/bit identity are not certified. Predictions for excluded-weight rows and weighted fit statistics are specifically included for SAS confirmation.

Local independent NumPy/SciPy weighted GLM and documented MEANS formula checks passed; this newly generated weighted SAS kit has not yet run in SAS. WEIGHT is not FREQ or complex-survey variance estimation. Other model restrictions remain. Archive CSVs/models need not be uploaded for this comparison.

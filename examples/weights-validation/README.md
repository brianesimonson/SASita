# WEIGHT validation — Sassy v0.4.18

Upload only 01-sas-weight-comparison.sas to SAS Studio and run the entire program. No CSV imports or folder edits needed. Return the Results and Log. Fifteen comparison groups cover weighted MEANS CLASS totals, missing/nonpositive weights, EXCLNPWGT, four variance divisors, SUMWGT and standard errors, plus weighted GLM CLASS/interactions and a regression with excluded weights/missing responses.

Statistics use relative 1e-10 and modest-scale P/R use absolute 1e-12. The helper maps CV/coeffvar, fixture A*X/X*A labels and special missing codes for numeric comparison; descriptors/layout/bit identity are not certified. Predictions for excluded-weight rows and weighted fit statistics are specifically included for SAS confirmation.

Actual SAS results received 2026-10-28: all ten weighted GLM comparisons passed. All five MEANS comparisons differed only in _FREQ_; v0.4.18 corrects source-row counts independently of weight exclusions. These regenerated expectations match the recorded SAS counts locally; a fresh SAS run of this revised kit remains pending. Original kit/evidence are preserved in fixtures/sas. WEIGHT is not FREQ or complex-survey variance estimation. Other model restrictions remain. Archive CSVs/models need not be uploaded for this comparison.

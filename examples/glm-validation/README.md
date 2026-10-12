# PROC GLM validation — Sassy v0.4.11

Upload only 01-sas-glm-comparison.sas to SAS Studio, open it and run the entire program. No folder edits or CSV uploads are needed: Sassy results are embedded with explicit types and full double precision. Download the SAS HTML Results and Log and return both.

Two models cover the manual’s unbalanced 2×2 example and an unbalanced 3×2 design with a numeric covariate, CLASS interaction and class-by-covariate interaction. Compare OverallANOVA, Type I/III ModelANOVA, SOLUTION estimates/SE/t/p, fit statistics, predictions and residuals. Relative criterion is 1e-10, not a promise of fixed decimal places or bit identity. Missing tables/columns are explicit errors, not passes. Label casing and multiple spaces are normalized. B flags, labels/formats/lengths and all ODS descriptors are not certified by these numeric checks.

The other SAS model files run in Sassy too; CSVs archive the expected results but are not needed for the SAS comparison. Models are deterministic and do not depend on random stream agreement. Current evidence is the published SAS table and independent NumPy/SciPy checks; this newly generated program has not yet run in SAS.

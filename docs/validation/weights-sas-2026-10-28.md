# Weighted SAS comparisons received 2026-10-28

## Corrected rerun: all fifteen groups passed

The second uploaded Results and Log confirm all fifteen v0.4.18 comparisons / 96 matched records pass, with zero unequal values under the stated criteria and no executed SAS errors or warnings. This includes all five corrected MEANS groups and all ten GLM groups. WEIGHT-SAS is complete for these cases. Structured provenance and each group outcome are in `fixtures/sas/weights-validation-v2-pass.json`. This is tolerance agreement, not full metadata or bit-identity certification.

## Original run and correction history

The user supplied actual SAS Studio Results and Log for the original self-contained weight kit (Sassy v0.4.14 expectations). All fifteen comparisons ran, with 96 matched records and no executed SAS errors or warnings. `ERROR:` text in the log occurs in unexecuted macro definitions, not emitted errors.

| Comparisons | Actual outcome |
| --- | --- |
| Five MEANS groups: DF, EXCLNPWGT, N, WDF, WGT | All requested statistics passed relative 1e-10. Only `_FREQ_` differed: eleven values across the five groups. |
| Five weighted CLASS/interactions GLM groups | All passed: ANOVA, Type I/III, SOLUTION, fit statistics and scored observations. |
| Five GLM weight-edge groups | All passed, including predictions/residuals for excluded-weight rows and missing responses. |

GLM statistics use relative 1e-10; predictions/residuals use absolute 1e-12. Largest scored differences reported were 7.1054e-15 and 3.5527e-15. The helper maps CV/coeffvar, fixture A*X/X*A names and special numeric missing values. This confirms numeric agreement for these cases, not bit identity or exact ODS metadata/layout.

## MEANS count correction

The eight-row source has four observations each in classes A and B. SAS reports `_FREQ_` as 8 overall and 4 for each class, with and without EXCLNPWGT. Original Sassy reported 7/4/3 by default and 5/2/3 with EXCLNPWGT. It incorrectly applied weight exclusions before counting source observations.

Version 0.4.18 groups/counts source rows first, retaining the existing CLASS missing-value policy. Weight exclusions then affect analysis N, NMISS and calculations separately. N Obs uses the same source count. All requested statistical calculations remain unchanged for the submitted cases. Local replay checks all five confirmed MEANS expectations and the observed SAS counts; additional BY, missing-CLASS and empty-analysis cases are local regression checks, not additional SAS fixtures.

The revised `examples/weights-validation/weights-validation.zip` embeds corrected expectations. Upload/run only `01-sas-weight-comparison.sas`; no CSV uploads or paths are needed. The subsequent corrected SAS rerun now passes all fifteen groups. The original five MEANS groups remain recorded as failures in the original evidence.

## Preserved evidence

`fixtures/sas/weights-validation-v1.json` records original uploaded filenames/SHA-256 hashes, original comparison-program hash, all fifteen comparison outcomes, tolerances and frozen MEANS expectations. The statistic values in that fixture are the original app expectations confirmed within tolerance, not full-precision raw SAS exports. Only `_FREQ_` is replaced with the actual SAS values from the difference tables.

`fixtures/sas/weights-validation-v1-original.zip` preserves the exact original kit before regeneration, so the user's uploaded Results/Log remain attributable to the program they ran. `VALIDATION-STATUS.md` records the completed weighted rerun and unrelated pending checks.

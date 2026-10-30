# Sassy validation checklist

Updated 2026-10-29. This is the current checklist for questions such as “what tests are outstanding?” Earlier pending notes in handoffs and historical documents may have been superseded here. Local tests are distinct from actual SAS and manual desktop validation. Do not mark a pending item passed without corresponding results/evidence.

## Outstanding

| ID | Status | What remains | How to complete |
| --- | --- | --- | --- |
| DATA-LAG-MATH | Pending actual SAS reference | v0.4.19 LAG/LAGn queue lifecycle, conditional calls, character/missing values, BY continuity and EXP/LOG/LOG10/LOG2 edge/precision behavior. Local semantic, analytic and portable tests pass; no new actual SAS results for these functions. | Focused SAS reference run when desired; no need to rerun the completed weight kit. |
| PRINT-SAS | Pending, lower priority | Fresh actual SAS comparison of PRINT OBS/FIRSTOBS/VAR/NOOBS, especially display/layout. Local semantic/browser/wrapper checks pass. | Run the PRINT example in SAS and compare the selected observations/numbering. Exact SAS styling is not a current promise. |
| GLM-METADATA | Pending compatibility scope | Original interaction names A*X versus X*A, special missing codes, Biased column type, exact ODS descriptor lengths/formats/order. Numeric comparisons normalize these distinctions. | Collect relevant SAS descriptors/raw outputs; implement and validate metadata separately if required by an integration. |
| WINDOWS-FILES | Pending manual validation | Real Windows file:// use, OS folder/file dialogs, remembered permissions/reconnection and Node rename/path behavior. Chromium cloud tests cover the app via HTTP and sandbox directory handles. | Exercise the downloaded standalone app and wrapper on Windows. |
| RNG-BROAD | Unverified beyond recorded cases | Additional seeds/distributions/extreme parameters and full normal bit identity. Uniform/normal/sampling claims remain limited to recorded fixture cases. | Focused independent SAS probes as needed; see docs/random-numbers.md. This is not a failure of the already-tested cases. |

WEIGHT-SAS is complete for the fifteen recorded test groups: the user supplied the corrected v0.4.18 SAS rerun on 2026-10-28. All 96 matched records pass. This supersedes the earlier deferral and partial result; no further weight-kit rerun is outstanding. Broader metadata and untested cases retain their stated limits.

SQL-SAS is complete for the recorded corrected v0.4.21 scope: focused grouped Results and Log received 2026-10-29 passed all three rows, completing sixteen groups / 71 records. No further SQL-kit rerun is outstanding. Earlier skipped-group notes are historical.

## Completed reference checks

| Area | Evidence and limits |
| --- | --- |
| SQL-SAS | **Complete for recorded corrected scope.** All sixteen groups / 71 matched records report exact value equality across the original fifteen passes and focused v0.4.21 grouped rerun. The three-row/eleven-variable grouped comparison includes STD/VAR and had no execution errors/warnings. Metadata/layout and original row order remain separate. [Evidence](fixtures/sas/sql-validation-v2-pass.json). |
| WEIGHT-SAS: weighted MEANS and GLM | **Passed actual SAS rerun, 2026-10-28.** All fifteen groups / 96 matched records pass, including corrected _FREQ_, variance divisors/standard errors, CLASS totals, Type I/III, SOLUTION, fit and P/R for excluded-weight rows. Relative 1e-10 statistics / absolute 1e-12 P/R, with documented normalizations; no executed SAS errors or warnings. [Evidence](fixtures/sas/weights-validation-v2-pass.json). |
| Unweighted GLM | All ten actual SAS comparisons / 89 matched records passed: relative 1e-10 statistics, absolute 1e-12 P/R, with documented name/missing/CV mappings. [Evidence](fixtures/sas/glm-validation-v2-pass.json). No bit-identity or full metadata certification. |
| Unweighted MEANS | Six actual SAS comparisons passed relative 1e-12. [Details](docs/validation/means-successful-comparison.md). |
| MT32 arithmetic/merge and large numbers | Actual reference comparisons recorded in [numeric/merge results](docs/validation/sas-seed12345-results.md) and [large-number results](docs/validation/large-number-sas-results.md). |
| SURVEYSELECT/default uniform | Supplied twelve CSVs and 35-row stratum probe checked; see [scope/evidence](docs/surveyselect.md). Broader designs/seeds are not implied. |
| NORMAL tested contexts | 52 printed SAS normals within tolerance (38 exact), 28 uniform witnesses exact; documented candidate summaries are separate evidence. See [random numbers](docs/random-numbers.md). |

## Maintenance

For new tests, add a stable ID, status, required inputs/actions and evidence location. After results arrive, record actual executed checks, failures/skips and tolerances; move completed items here or narrow the remaining gap. Preserve older evidence. AGENTS.md directs future sessions to read this file. This checklist does not schedule tests or send automatic reminders.

# Sassy validation checklist

Updated 2026-10-28. This is the current checklist for questions such as “what tests are outstanding?” Earlier pending notes in handoffs and historical documents may have been superseded here. Local tests are distinct from actual SAS and manual desktop validation. Do not mark a pending item passed without corresponding results/evidence.

## Outstanding

| ID | Status | What remains | How to complete |
| --- | --- | --- | --- |
| WEIGHT-SAS | **Partially validated; corrected MEANS counts await rerun** | Actual SAS ran all 15 groups: ten GLM groups passed; all MEANS statistics passed but five groups had eleven differing _FREQ_ values. v0.4.18 fixes source counts independently of weight exclusions, with local replay against recorded SAS counts. Fresh corrected SAS execution remains pending; metadata/layout parity is separate. | Upload/run only `01-sas-weight-comparison.sas` from the revised [kit](examples/weights-validation/weights-validation.zip); return Results and Log. No CSV uploads/path edits. [Evidence](docs/validation/weights-sas-2026-10-28.md). |
| PRINT-SAS | Pending, lower priority | Fresh actual SAS comparison of PRINT OBS/FIRSTOBS/VAR/NOOBS, especially display/layout. Local semantic/browser/wrapper checks pass. | Run the PRINT example in SAS and compare the selected observations/numbering. Exact SAS styling is not a current promise. |
| GLM-METADATA | Pending compatibility scope | Original interaction names A*X versus X*A, special missing codes, Biased column type, exact ODS descriptor lengths/formats/order. Numeric comparisons normalize these distinctions. | Collect relevant SAS descriptors/raw outputs; implement and validate metadata separately if required by an integration. |
| WINDOWS-FILES | Pending manual validation | Real Windows file:// use, OS folder/file dialogs, remembered permissions/reconnection and Node rename/path behavior. Chromium cloud tests cover the app via HTTP and sandbox directory handles. | Exercise the downloaded standalone app and wrapper on Windows. |
| RNG-BROAD | Unverified beyond recorded cases | Additional seeds/distributions/extreme parameters and full normal bit identity. Uniform/normal/sampling claims remain limited to recorded fixture cases. | Focused independent SAS probes as needed; see docs/random-numbers.md. This is not a failure of the already-tested cases. |

The user returned to WEIGHT-SAS and supplied actual Results and Log on 2026-10-28, superseding the earlier deferral. Keep the narrower MEANS-count rerun visible; do not block unrelated development or treat the original overall comparison as a complete pass.

## Completed reference checks

| Area | Evidence and limits |
| --- | --- |
| Weighted GLM | All ten actual SAS groups / 81 matched records passed, including Type I/III, SOLUTION, fit and P/R for excluded-weight rows. Relative 1e-10 statistics / absolute 1e-12 P/R, with documented normalizations. [Evidence](docs/validation/weights-sas-2026-10-28.md). |
| Unweighted GLM | All ten actual SAS comparisons / 89 matched records passed: relative 1e-10 statistics, absolute 1e-12 P/R, with documented name/missing/CV mappings. [Evidence](fixtures/sas/glm-validation-v2-pass.json). No bit-identity or full metadata certification. |
| Unweighted MEANS | Six actual SAS comparisons passed relative 1e-12. [Details](docs/validation/means-successful-comparison.md). |
| MT32 arithmetic/merge and large numbers | Actual reference comparisons recorded in [numeric/merge results](docs/validation/sas-seed12345-results.md) and [large-number results](docs/validation/large-number-sas-results.md). |
| SURVEYSELECT/default uniform | Supplied twelve CSVs and 35-row stratum probe checked; see [scope/evidence](docs/surveyselect.md). Broader designs/seeds are not implied. |
| NORMAL tested contexts | 52 printed SAS normals within tolerance (38 exact), 28 uniform witnesses exact; documented candidate summaries are separate evidence. See [random numbers](docs/random-numbers.md). |

## Maintenance

For new tests, add a stable ID, status, required inputs/actions and evidence location. After results arrive, record actual executed checks, failures/skips and tolerances; move completed items here or narrow the remaining gap. Preserve older evidence. AGENTS.md directs future sessions to read this file. This checklist does not schedule tests or send automatic reminders.

# PROC GLM — Sassy v0.4.11

This first implementation fits ordinary, unweighted fixed-effects least-squares models with one numeric response and an intercept. It supports numeric predictors, CLASS variables and hierarchical crossed interactions. It is a bounded SAS subset, with the same calculation engine in the offline browser app and portable Node runner.

```sas
ods output OverallANOVA=anova ModelANOVA=tests
    ParameterEstimates=parameters FitStatistics=fit;
proc glm data=study;
    class treatment site;
    model response=treatment|site / solution;
    output out=scored p=predicted r=residual;
run;
quit;
ods output close;
```

`SOLUTION` is a MODEL option after `/`, rather than a separate statement. Open Examples → PROC GLM for a complete seven-observation program.

## Syntax and calculations

- PROC options: required `DATA=`, `ORDER=FORMATTED` (default), `INTERNAL` or `DATA`, and `NOPRINT` (cannot combine with ODS OUTPUT).
- One CLASS statement before MODEL; numeric or character categories. Formatted values define levels. No automatic category removal from the user's program is needed.
- Explicit effects `a b x a*b a*x`, or bar expansion `a|b`, `a|b|c`. Interactions support up to degree three. Numeric products such as `x*x` are supported. CLASS interactions require every lower-order effect; `a*b` alone fails with an explanation.
- Type I tests are sequential, using MODEL effect order. Type III tests adjust for other effects using sum-to-zero contrasts and block hypotheses for this complete, hierarchical design subset. Default output includes both; `/ SS1`, `/ SS3` or `/ SS1 SS3` selects them.
- SOLUTION includes estimates, standard errors, t values and two-sided p values. Full CLASS indicator coding deliberately has dependent columns: preceding independent columns are retained and aliased estimates are zero with missing inferential values. `biased='B'` marks nonunique coefficients. Those parameter estimates depend on level order and are not a universal reference-coding convention.
- A parameter's t squared equals the corresponding one-degree-of-freedom F statistic. A CLASS effect can have several numerator degrees of freedom; its Type III test is a joint effect hypothesis, not an individual parameter's t test.
- One OUTPUT statement with `OUT=` and distinct `P=`/`PREDICTED=` and/or `R=`/`RESIDUAL=` names. All source rows and metadata are retained. Existing variable names cannot be overwritten by P/R.
- `RUN;` completes the procedure; immediate `QUIT;` is accepted. Interactive continuation is not supported.

Fitting excludes observations missing the response or any specified predictor/CLASS value. Level discovery uses these fitting observations. An excluded row with a missing response can still receive a prediction if its predictors and CLASS levels are valid; its residual is missing. Blank CLASS values are missing. No usable observations fails explicitly. Zero error degrees of freedom or variance produce missing inferential quantities with a log note.

## Reports and reusable datasets

Output history includes ClassLevels, NObs, OverallANOVA, FitStatistics, ModelANOVA and, with SOLUTION, ParameterEstimates. ODS OUTPUT can capture these six names into WORK or an assigned native JSON library. Bindings remain until `ODS OUTPUT CLOSE;`; capturing ParameterEstimates requires SOLUTION.

| Table | Sassy columns |
| --- | --- |
| ClassLevels | class, levels, values |
| NObs | nobsread, nobsused |
| OverallANOVA | dependent, source, df, ss, ms, fvalue, probf |
| FitStatistics | dependent, rsquare, coeffvar, rootmse, depmean |
| ModelANOVA | dependent, source, hypothesistype, df, ss, ms, fvalue, probf |
| ParameterEstimates | dependent, parameter, estimate, stderr, tvalue, probt, biased |

ModelANOVA contains separate rows identified by HypothesisType 1 or 3. Source names use uppercase effect names; parameter labels include formatted levels. The actual seven-row SAS run confirms displayed parameter labels (after case/space normalization) and all nine B flags. Exact ODS descriptors, character lengths, row order and display layout have not been certified. Do not assume complete metadata compatibility from agreement on numeric values.

GLM reports, datasets and native writes use the existing session history and staged-write workflow. A failed run does not commit partial results to the app. The portable runner returns report models and native table strings, rather than reproducing SAS's HTML rendering.

## Initial boundaries

Models must have full-rank contrast designs and complete categorical interaction cells. Expected CLASS coding dependencies are supported; additional collinearity, empty interaction cells or poor conditioning fail explicitly. These cases need proper estimability/hypothesis handling before expansion of the subset.

Limits are 100,000 fitting observations, eight CLASS variables, 32 levels per variable, 128 characters per level label, 20 effects, 200 indicator columns and 80 contrast columns. A matrix-work budget of 50 million also applies; not every combination of those limits is allowed.

Not implemented: multiple responses, NOINT, nested effects, `@` interaction expansion, BY, WEIGHT/FREQ, Type II/IV, custom TEST/CONTRAST/ESTIMATE, MEANS/LSMEANS, confidence intervals, selection, RANDOM, REPEATED, MANOVA, ABSORB, missing-cell Type III hypotheses and interactive model continuation. Unsupported syntax fails instead of silently approximating these features.

## Accuracy and validation

Calculations use JavaScript double precision, compensated sums and twice-reorthogonalized ordered QR. Type III block tests use a separate full-rank contrast representation. SAS documents a modified sweep/generalized inverse algorithm; our implementation targets the same statistical quantities, not identical intermediate floating-point operations or SAS's singularity threshold. Rescaling may be needed for poorly conditioned models. Precision is about significant digits, not a fixed number of digits after the decimal point at every scale.

The seven-row unbalanced two-factor example in the supplied GLM manual (printed pages 2989–2990) matches the published Type I sums of squares 80.047619, 11.266667 and 0.4, and Type III values 67.6, 10 and 0.4. A separate 33-row unbalanced CLASS/interaction/covariate fixture agrees with independently calculated NumPy least-squares values and SciPy F/t probabilities. Tests also cover three-way expansion, effect order, prediction, missing responses, formatted levels, native outputs, rejected designs, both browser builds and actual exported wrappers.

The user also supplied actual SAS Studio results and a clean log for the seven-row example (`10-glm-results.html`, `10-glm-log.html`). An automated comparison checks 69 numeric cells at their printed precision, 20 missing cells and nine B flags, all matching. The log confirms the expected output dataset row/column counts and seven scored observations; scored values are not displayed. The singular-matrix/generalized-inverse note is expected for full CLASS coding, not an execution error. This was the example program, not the self-contained two-model PROC COMPARE program. Printed HTML cannot establish full double precision or validate the larger ANCOVA case. The extracted actual values and original file hashes are preserved in fixtures/sas/glm-seven-row-printed.json.

These checks establish initial numerical confidence. They do not certify full PROC GLM equivalence or bit identity. In particular, the mixed CLASS/covariate Type III hypotheses and full-precision output values still need the two-model SAS comparison.

Download `examples/glm-validation/glm-validation.zip`, extract it and upload only `01-sas-glm-comparison.sas` to SAS Studio. Run the entire file and return the HTML Results and Log. It embeds Sassy's typed expected results for two deterministic models; no folder edits or CSV uploads are needed. This newly generated SAS comparison has not yet been executed in SAS. Missing tables or columns are reported as errors, not treated as passes.

### Actual two-model SAS comparison received

The user's `01-sas-glm-comparison-results.html` contains eight comparison groups. At the relative criterion 1e-10, all six seven-row effect-test rows and all nine parameter rows pass. In the 33-row ANCOVA model, eight matched effect-test rows, 13 matched parameter rows and all 33 predictions/residuals pass; the largest reported relative criterion across those groups is 3.2567e-13.

This is a partial validation, not a complete pass. SAS labels the numeric-by-CLASS effect `X*A`, while Sassy currently labels it `A*X`; two effect-test rows and three parameter rows are therefore unmatched. Their printed numbers also agree when those labels are explicitly mapped. SAS uses special missing `._` in some OverallANOVA cells, while Sassy's null imports as ordinary `.`; five missing-value comparisons per model fail for that reason. One seven-row residual is 3.553e-15 in SAS versus zero in Sassy; a purely relative test fails at zero despite the tiny absolute difference. Both full-precision FitStatistics comparison sections are absent; the log is still needed to diagnose why. Their printed values agree. CONTENTS identifies SAS's Biased column as numeric, whereas Sassy currently stores the displayed B flag as character.

The actual summaries and printed tables are retained in fixtures/sas/glm-two-model-comparison.json. No blanket full-precision, metadata, label or bit-identity certification follows from this evidence. The comparison kit needs follow-up corrections; the downloadable v0.4.11 package is unchanged.

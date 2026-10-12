# WEIGHT in MEANS and GLM — Sassy v0.4.14

Both procedures accept `WEIGHT variable;` with a numeric variable and noninteger weights. These are the respective SAS procedure rules, not FREQ replication or complex-survey variance estimates.

```sas
proc means data=study n mean var std stderr sumwgt;
    var response;
    weight sampling_weight;
    output out=statistics mean=average var=variance sumwgt=weight_total;
run;

proc glm data=study;
    class treatment;
    model response=treatment x treatment*x / solution;
    weight sampling_weight;
    output out=scored p=predicted r=residual;
run;
quit;
```

## MEANS

Missing weights exclude the row before counts, missing-value counts and grouping. By default, negative weights become zero and zero-weight rows still contribute to N, NMISS, N Obs/_FREQ_, and eligible MIN/MAX/RANGE. Add PROC option EXCLNPWGT (alias EXCLNPWGTS) to exclude nonpositive weights too. Each analysis variable handles its own missing values. An omitted VAR excludes the WEIGHT variable along with CLASS/BY variables.

For nonmissing analysis values, SUMWGT is the sum of effective weights, SUM is sum(w*x), MEAN is SUM/SUMWGT, CSS is sum(w*(x−mean)^2), and USS is sum(w*x*x). N counts eligible observations, not the sum of weights. VAR divides CSS by:

| VARDEF | Divisor |
| --- | --- |
| DF (default) | N−1 |
| N | N |
| WDF | SUMWGT−1 |
| WEIGHT or WGT | SUMWGT |

STD is sqrt(VAR). With VARDEF=DF, STDERR is STD/sqrt(SUMWGT). CV is 100*STD/MEAN. STDERR still requires DF in this subset. Empty/all-zero-weight analysis groups have missing means/variance/standard errors; eligible counts and weight/sum totals remain available. Nonpositive divisors produce missing variance. Overflow in weighted arithmetic fails explicitly with a rescaling message.

CLASS totals/subtotals, NWAY, formatted grouping, sorted BY, default _STAT_ rows, AUTONAME and native outputs retain their existing behavior. SUMWGT is also available without WEIGHT, where it equals N. There is one shared WEIGHT statement; VAR-specific WEIGHT= and FREQ remain unsupported. Existing bounds and deferred statistics apply.

## GLM

Only complete fitting rows with finite, strictly positive weights are used. Missing, zero and negative weights exclude a row from fitting. The objective is sum(w*(y−predicted)^2). Weighted corrected total SS uses the weighted response mean; Type I/III hypotheses and SOLUTION covariance use the weighted design. Error DF remains the number of used observations minus model rank, never SUMWGT minus rank. Root MSE uses weighted SSE/error DF.

Weights are normalized internally for numerical stability; sums of squares are restored to the original scale. Multiplying every positive weight by a constant preserves coefficients, standard errors and F tests while scaling sums of squares. Extreme weight ratios that underflow the working representation, or overflowing final sums of squares, fail with rescaling guidance. Hierarchy, rank, complete interaction-cell and matrix limits remain in force after fitting-row exclusion.

WEIGHT is accepted before CLASS/MODEL, between CLASS and MODEL, after MODEL or after OUTPUT, always before RUN. OUTPUT keeps all source rows and ordinary unweighted-unit P/R values. Current prediction code can predict excluded-weight rows if their predictors/known levels are complete; this edge behavior is specifically included in the SAS comparison kit and remains unconfirmed by a weighted SAS fixture. Missing-response rows can receive predictions; their residuals are missing. Other GLM restrictions are unchanged; no FREQ, RANDOM/REPEATED or survey-design inference is implied.

## Evidence and next SAS check

Rules come from the supplied Base SAS Procedures Guide: WEIGHT pp. 41–43 and 636–637, EXCLNPWGT p. 615, VARDEF pp. 620–621, missing values pp. 644–645 and weighted formulas pp. 1536–1541. The supplied GLM manual's WEIGHT statement (printed p. 3042) specifies positive-weight inclusion and weighted normal equations. These documents are reference material, not project instructions.

Local checks cover MEANS counts and formulas, missing/nonpositive weights, exclusion options, divisors, CLASS totals and standard errors; GLM agrees with an independent NumPy/SciPy weighted CLASS/covariate/interactions fixture, including Type I/III F tests, predictions and scaling invariance. Full regressions, both browser builds and exported Node/Python packages pass. Prior unweighted actual SAS fixtures continue to pass.

Actual weighted SAS validation is pending. Extract weights-validation.zip, upload only `01-sas-weight-comparison.sas` to SAS Studio and run it all. Return the Results and Log. Fifteen comparisons cover both procedures; the kit embeds typed full-precision app expectations. No CSV uploads/path edits are needed. The helper explicitly normalizes fixture interaction labels and special missing codes, and maps SAS CV to coeffvar when present. Descriptor/layout parity and bit identity are not certified. Open the twelfth Examples program for a smaller demo.

# Calculation and merge test pack

Download **validation-pack.zip**, unzip it, and double-click **data-step-lab.html**. Paste a program from **programs/** into the editor and click **Run program**. The same first two programs run in SAS without changes. No server or installation is required for the app.

The **results/** folder contains the current app's full raw CSV outputs. These are app-generated expectations, **not SAS-certified reference results**. A manifest records row counts and SHA-256 checksums. Both programs finish within the app's 8-second worker limit in the tested Linux Chromium environment; slower machines may differ.

## 01-calculations.sas

20,000 observations. Seed **12345**, explicit **MT32**, two uniform random values per observation. `systematic_x` runs from **1 to 20,000**; `systematic_y` runs from **20,001 to 40,000**.

Outputs:

- `numeric_inputs`: original random and systematic values, with HEX16 bit representations of the random inputs.
- `numeric_results`: addition, subtraction, multiplication, division, square, cube, square root, cube root using `** (1/3)`, SUM, MEAN, MIN, MAX, and a combined expression, applied independently to both pairs. Every tenth row also tests missing values: ordinary addition propagates missing, while SUM/MEAN/MIN/MAX use the available value. There is no SUMMIN function in this app; SUM and MIN are tested separately.
- `numeric_summary`: exact integer checks. Count **20,000**; total_x **200,010,000**; total_y **600,010,000**; total_product **6,667,066,670,000**; total_missing **2,000**.

SAS RAND parity remains unverified. MT19937 alone does not guarantee SAS's seed mapping and distribution transformations. Compare HEX16 columns for exact random-input parity; systematic arithmetic can be compared regardless. The SAS helper also recomputes using the app's saved random inputs, removing the random-generator difference from that arithmetic comparison. CSV imports use SAS's numeric parser; this is a decimal interchange test, not a guarantee of bit-identical parsing. HEX16 columns retain evidence of the original input bits.

These positive-input tests cover cube roots of positive numbers. They do not establish correctness of negative cube roots, extreme magnitudes, all rounding ties, other RAND distributions, or every function.

## 02-merge.sas

Left input: keys 1–10,000, two rows per key. Right input: keys 5,001–15,000, three rows per key. Sorting and match-MERGE produce **40,000 rows**, not a Cartesian product. Expect **10,000 left-only**, **15,000 matched**, **15,000 right-only**, and **15,000 BY groups**.

The third matched row retains the second left observation. Missing values reset at unmatched BY groups. Outputs preserve IN= indicators and FIRST./LAST. flags and exercise a shared variable overwritten by the input actually read. A six-row reverse-exhaustion check expects shared values **100, 12, 200, 22, 300, 32**. `merge_row` and `shared_row` provide unique comparison IDs.

## Compare in SAS

1. Open **03-sas-comparison.sas** and change its first `app_path` setting to your unzipped **results/** folder.
2. Run **that one program in SAS**. It rebuilds both original test programs automatically and uses separate dataset names for calculations on imported app inputs. You do not need to rerun programs 01 and 02 separately.
3. Read the PROC COMPARE reports: exact random bits, systematic arithmetic, exact integer summary, exact merge results, then random arithmetic recomputed from the same saved inputs. The last step also exports `sas_numeric_results.csv`; send that CSV and the comparison report back for investigation.

The floating-point comparison uses relative tolerance **1e-12**. A pass means differences are within that tolerance, not bit-for-bit equality. Integer summaries and merge values use exact comparison. The helper reads CSVs with explicit numeric informats, DSD quote handling, CRLF record handling, and 16-character HEX columns; it avoids automatic import type guessing. It rebuilds fresh SAS reference datasets and checks imported row counts and invalid numeric input. SASita does not implement these INFILE/INPUT statements, PROC COMPARE, or PROC EXPORT; the third helper intentionally requires SAS. The latest helper needs a SAS rerun; confirmed results from the uploaded report are described below.

## Rebuild and verify

From the repository root, run `node scripts/build-validation-pack.mjs`, then `python3 scripts/package-validation.py`. The first command runs both programs through the actual interpreter and checks every row against independent integer identities, inverse checks, missing-value rules, and deterministic merge expectations. It reproduces seeded inputs and checks raw CSV round-trips. The second packages these outputs, programs, this guide, and the standalone HTML.

`npm run test:browser -- --validation` additionally runs both full-sized programs in the modular and standalone browser builds, checks the actual worker timeout, and verifies full browser CSV exports against engine results. This establishes app consistency; SAS-reference validation requires the SAS run above.

## First uploaded SAS report: import blocked comparisons

The uploaded `03-sas-comparison-results.html` reports 5 conflicting types in numeric_inputs, 37 in numeric_results, and all 5 in numeric_summary. Numeric values were imported as character columns. The summary explicitly states that data-value comparisons were not performed. The later equal-values message follows 31 conflicting types and is not evidence of complete arithmetic equivalence. Merge comparison sections are absent. No MT32, systematic arithmetic, or merge pass/fail can be established from that report.

The corrected helper replaces PROC IMPORT with explicit numeric/text CSV input and prerequisite/row-count checks. The old helper replaced NUMERIC_INPUTS with the incorrectly typed imported dataset. The current helper regenerates these references automatically. Send both SAS Results and Log if another section is missing or an error appears. The explicit CSV reader executed in the second uploaded report; stale reference datasets prevented some comparisons.

## Second uploaded SAS report: scoped passes and stale references

The supplied `03-sas-comparison-results (1).html` establishes exact equality for all 40,000 merge observations (12 common variables, including the ID), all five merge-summary values, and all six shared-variable fixture observations. The same-input random arithmetic comparison evaluates all 15 selected numeric variables on 20,000 observations: zero unequal values at relative criterion 1e-12, 5,121 values not exactly equal, maximum criterion value 2.2194e-16. This is a tolerance pass for these expressions and inputs, not universal numeric equivalence.

Freshly imported numeric fields now have the intended numeric types. However, NUMERIC_INPUTS and the original NUMERIC_RESULTS/SUMMARY retain creation timestamps from the previous helper run. There are five type conflicts in the input reference and six in the calculated reference. The summary's total_missing is 0 versus the expected 2,000. These stale references block valid MT32, systematic, and missing-summary conclusions; they do not establish an engine defect.

The current helper embeds unchanged versions of both original programs and executes them on every run before importing app results. Imported-input computations use SAME_INPUTS, SAME_RESULTS, and SAME_SUMMARY, preserving the original NUMERIC_* references. The app-generated CSVs and HTML are unchanged. Local checks enforce that both embedded reference programs match the standalone sources, all CSV schema fields match engine headers/types, and isolated computations preserve the original datasets. Actual execution of this latest helper in SAS is pending.

## Third uploaded SAS report: fresh comparisons

`03-sas-comparison-results (2).html` has fresh correctly typed references. All 21 selected systematic variables on 20,000 rows pass relative tolerance 1e-12; 26 values are not exactly equal, maximum criterion 2.0648e-16. All five integer summary values, all merge rows, merge summary, and shared-variable fixture match exactly. Same-input random arithmetic passes again, with 5,121 nonexact values and maximum criterion 2.2194e-16.

The exact uniform RAND test fails all 40,000 values. The first 50 printed values of each column indicate matching underlying MT32 integers but a different uniform conversion. A candidate scaling constant reproduces all 100 displayed SAS bit patterns; this is insufficient to certify all 40,000 draws or other seeds. The core and app conversion remain unchanged pending full output validation; normal RAND parity is not tested here.

The helper additionally exports **sas_mt32_inputs.csv** into your app_path folder. Run it with your existing app_path and upload this CSV to verify the entire original SAS random sequence. It preserves the original HEX16 fields, so decimal export precision will not affect the exact comparison.

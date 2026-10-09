# Large-number precision test

This separate pack extends the already passing seed-12345 and merge validation. It does not replace the prior validation files. No app runtime changes are made.

Unzip **large-number-tests.zip** and double-click **data-step-lab.html**. Program **04-large-numbers.sas** runs unchanged in the app or SAS. It creates 3,000 deterministic input pairs over 15 scales, from tiny values to inputs around 1e102 and computed cubes around 1e307. It tests multiplication, division, square, cube, square root, cube root via `** (1/3)`, fourth powers, and a combined product/division expression. Nine additional rows show why consecutive integers cannot all be represented above 2^53.

The results folder includes full app CSVs and an independent high-precision report. This reference uses Python's standard Decimal arithmetic at 100 digits on the exact stored binary inputs. Python is used for development validation only; the app itself requires no Python. This tests computation error, not whether every input decimal was stored exactly.

## Local high-precision results

All 24,000 computed values meet an error threshold of 1e-10 relative to the high-precision result. Seven of the eight operations meet 1e-15 for all 3,000 values each. Cube roots via the approximate exponent 1/3 exceed 1e-15 on 2,028 cases; their maximum relative error is about 4.45e-15. Multiplication, division, squares, cubes and square roots each have maximum relative error around 1.1e-16. Fourth powers and the mixed expression remain below 4.35e-16.

These thresholds are convenient precision checks, not promises of correctly rounded decimal digits. At large magnitudes an absolute difference can be large while the leading digits remain accurate. Both SAS's default numeric type and JavaScript use double precision: about 15–16 significant decimal digits total, not 15 fractional digits at any magnitude. Cube-root accuracy can lose additional digits because 1/3 is approximate and exponentiation magnifies that approximation. Overflow, arbitrary precision, subtraction cancellation and all possible powers are not certified by this test.

## One SAS run

Upload **big_number_results.csv**, **big_integer_edges.csv**, and **05-sas-large-number-comparison.sas** to the same SAS cloud folder. Set `app_path` at the top of program 05 and run **05 alone**. It rebuilds fresh references itself. It reports:

- SAS/app comparisons at 1e-10 and 1e-15 relative thresholds.
- Exact comparison of the integer-boundary behavior.
- Absolute differences by operation and counts exceeding each precision threshold.

It exports **sas_big_number_differences.csv** beside your uploaded CSVs. Send back that file plus Results/Log for review. The 100-digit reference measures mathematical accuracy; the SAS run separately measures agreement with SAS. This new SAS comparison has not yet been run.

## Reproduce locally

Run `node scripts/build-large-number-pack.mjs`, then `python3 scripts/check-large-number-precision.py`. Browser delivery is checked with `npm run test:browser -- --large-numbers`. The browser check runs the full program and verifies both CSV exports in the modular and standalone builds.

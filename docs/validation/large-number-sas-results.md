# Confirmed large-number SAS comparison

The uploaded `05-sas-large-number-comparison-results.html` validates the expanded large-number program against actual SAS output. Both PROC COMPARE thresholds pass: relative criterion 1e-10 and the tighter 1e-15. All 3,000 observations have no unequal compared values at either threshold. Twelve non-ID variables are compared per observation. There are 761 values not exactly equal, with maximum reported comparison criterion 2.219e-16. No conflicting variable types are reported.

The nine-observation integer-boundary comparison passes with exact equality. The per-operation summary has 3,000 values for each of eight operations, zero missing results, zero failures at 1e-10, and zero failures at 1e-15.

| Operation | Maximum absolute SAS/app difference |
| --- | --- |
| Multiplication | 0 |
| Division | 0 |
| Square | 0 |
| Cube | 1.2474e291 |
| Square root | 0 |
| Cube root via **(1/3) | 0 |
| Fourth power | 2.3841858e-7 |
| Mixed product/division | 0 |

The large absolute cube difference occurs in a test containing results near 1e307; it still passes the 1e-15 scaled comparison. This is evidence of agreement with SAS for these inputs and expressions, not 15 fractional digits at arbitrary magnitude or exact agreement for every operation.

The independent 100-digit Decimal check remains a separate mathematical reference: both implementations can agree while sharing limitations of an approximate exponent. Cube roots via **(1/3) match SAS exactly here but exceed the independent 1e-15 threshold on 2,028 cases. This does not establish a JS/SAS cube-root incompatibility.

The tested program/pack was saved at commit `3b3e6ff` on `test/large-number-precision`. This confirmation is documentation only; application code and validation packages are unchanged. No additional rerun is required to complete this validation round. Main and v1.0 remain preserved.

Source: 05-sas-large-number-comparison-results.html, 69,169 bytes. SHA-256: `4b5480d84fd62505e4dc2312e681832dbc8ff5d5862a8be64951b79f781149e9`. SAS release/host are not provided. Raw SAS dataset timestamps are 09OCT26:01:51:14/15; timezone is not supplied.

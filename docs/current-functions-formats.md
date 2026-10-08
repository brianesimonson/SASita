# Current DATA step functions and formats

These are the 35 functions implemented in this app, not a complete SAS catalog. Names are case-insensitive. Brackets mean optional arguments, and … means repeated explicit arguments; OF variable lists and arrays are not supported. String handling, argument validation, type conversion, missing values, rounding, and date edge cases are a practical subset, not certified SAS behavior.

| Category | Function signature | Behavior | Example | Current result |
|---|---|---|---|---|
| Numeric | `ABS(x)` | Absolute value. | `abs(-5)` | `5` |
| Numeric | `SQRT(x)` | Square root; negative input returns numeric missing. | `sqrt(9)` | `3` |
| Numeric | `CEIL(x)` | Round upward to an integer. | `ceil(2.1)` | `3` |
| Numeric | `FLOOR(x)` | Round downward to an integer. | `floor(2.9)` | `2` |
| Numeric | `INT(x)` | Truncate toward zero. | `int(-2.9)` | `-2` |
| Numeric | `ROUND(x [, unit])` | Round to a multiple of unit; default unit is 1. Ties follow JavaScript Math.round. | `round(12.3,0.5)` | `12.5` |
| Numeric | `MOD(x, divisor)` | Remainder; zero divisor returns missing. Negative values follow JavaScript remainder semantics. | `mod(10,3)` | `1` |
| Aggregation | `SUM(x, …)` | Sum nonmissing numeric arguments; all missing returns missing. | `sum(1,.,3)` | `4` |
| Aggregation | `MEAN(x, …)` | Mean of nonmissing numeric arguments. | `mean(1,.,3)` | `2` |
| Aggregation | `MIN(x, …)` | Smallest nonmissing numeric argument. | `min(1,.,3)` | `1` |
| Aggregation | `MAX(x, …)` | Largest nonmissing numeric argument. | `max(1,.,3)` | `3` |
| Missing values | `MISSING(x)` | 1 for a missing value, otherwise 0. | `missing(.)` | `1` |
| Missing values | `N(x, …)` | Number of nonmissing numeric arguments. | `n(1,.,3)` | `2` |
| Missing values | `NMISS(x, …)` | Number of missing arguments; this implementation also counts empty strings. | `nmiss(1,.,3)` | `1` |
| Missing values | `COALESCE(x, …)` | First nonmissing argument, or numeric missing. Numeric-only arguments are not enforced. | `coalesce(.,7)` | `7` |
| Missing values | `COALESCEC(text, …)` | First nonmissing argument, or an empty string. Character-only arguments are not enforced. | `coalescec("","ok")` | `ok` |
| Character | `UPCASE(text)` | Convert to uppercase. | `upcase("Ab")` | `AB` |
| Character | `LOWCASE(text)` | Convert to lowercase. | `lowcase("Ab")` | `ab` |
| Character | `STRIP(text)` | Remove leading and trailing JavaScript whitespace. | `strip("  abc  ")` | `abc` |
| Character | `TRIM(text)` | Remove trailing JavaScript whitespace. | `trim("abc  ")` | `abc` |
| Character | `LEFT(text)` | Remove leading whitespace; does not preserve SAS fixed-length padding. | `left("  abc")` | `abc` |
| Character | `LENGTH(text)` | Length after trailing whitespace removal; returns at least 1. | `length("")` | `1` |
| Character | `LENGTHN(text)` | Length after trailing whitespace removal; empty text returns 0. | `lengthn("")` | `0` |
| Character | `SUBSTR(text, start [, count])` | 1-based substring; omitted count returns the rest. Assignment-form SUBSTR is unavailable. | `substr("abcd",2,2)` | `bc` |
| Character | `INDEX(text, search)` | 1-based position of first match; 0 if not found. | `index("abcd","bc")` | `2` |
| Character | `CATS(text, …)` | Trim each argument and concatenate. | `cats(" a "," b ")` | `ab` |
| Character | `CATX(separator, text, …)` | Trim arguments, omit empty ones, and join with separator. | `catx("-"," a ",""," b ")` | `a-b` |
| Date | `TODAY()` | Current UTC date as days since 1960-01-01; browser timezone behavior can differ from SAS. | `today()` | `Current UTC SAS date` |
| Date | `MDY(month, day, year)` | Create a date in days since 1960-01-01. Use four-digit years; SAS YEARCUTOFF is unavailable. | `mdy(1,1,2026)` | `24107` |
| Date | `YEAR(date)` | Extract the UTC year from a SAS date. | `year("01JAN2026"d)` | `2026` |
| Date | `MONTH(date)` | Extract the UTC month, 1–12. | `month("01JAN2026"d)` | `1` |
| Date | `DAY(date)` | Extract the UTC day of month. | `day("01JAN2026"d)` | `1` |
| Conversion | `INPUT(text, informat.)` | Parse text using a supported informat; optional ?/?? controls invalid-input notes and _ERROR_. | `input("2,115,353",comma9.)` | `2115353` |
| Conversion | `PUT(value, format.)` | Return width-padded character text; optional -L/-C/-R alignment. | `put(1350,z8.)` | `00001350` |
| Random | `RAND(distribution [, parameter1 [, parameter2]])` | UNIFORM and NORMAL after explicit CALL STREAMINIT('MT32',seed). Reproducible in this app; SAS distribution bit equivalence is unverified. | `rand("uniform")` after seed 5489 | `0.81472369201947` |

## Formats (20 families)

Table display omits alignment padding, while PUT returns padded strings. Width affects zero filling, date text, character truncation, and overflow. Numeric overflow uses asterisks rather than SAS adaptive BEST/precision fallback. Decimal precision is bounded to 0–15 and numeric rounding follows JavaScript. Character widths count UTF-16 units, not SAS encoded bytes. Fixed-length variable descriptors and complete SAS coercion are still outside the subset.

| Format family | Example | Current behavior |
|---|---|---|
| `w.d / Fw.d` | `6.3 → 23.450` | Fixed decimal text; PUT pads to width. |
| `Zw.d` | `z8. → 00001350` | Leading zeros; negative signs preserved. |
| `BESTw.` | `best12.` | Ordinary number text, not full SAS BEST adaptive precision. |
| `COMMAw.d` | `comma12.2 → 1,234.50` | US grouping; default precision 0. |
| `DOLLARw.d` | `dollar12.2 → $1,234.50` | US dollar prefix; default precision 2. |
| `PERCENTw.d` | `percent8.2 → 23.48%` | Display a fraction as a percent; default precision 0. |
| `HEX16.` | `1 → 3FF0000000000000` | IEEE-754 double bit representation. Other HEX widths are unavailable. |
| `DATEw.` | `date7. / date9. / date11.` | Day and month, with 2/4-digit year or hyphens according to width 5–11. |
| `MMDDYYw.` | `mmddyy10. → 03/15/2018` | Month/day/year. B/C/D/N/P/S separator variants supported. |
| `DDMMYYw.` | `ddmmyy10. → 15/03/2018` | Day/month/year. B/C/D/N/P/S separator variants supported. |
| `YYMMDDw.` | `yymmdd10. → 2018-03-15` | Year/month/day. Variants include YYMMDDN8. → 20180315. |
| `MONYYw.` | `monyy7. → MAR2018` | Widths 5–7 choose 2/4-digit year. |
| `TIMEw.d` | `time8. → 12:59:56` | Seconds since midnight, or signed duration; full clock widths only. |
| `HHMMw.d` | `hhmm8.2 → 12:59.93` | Hours/minutes, including fractional minutes. Values outside 0–24 hours show stars. |
| `DATETIMEw.d` | `datetime19.` | Seconds since 1960-01-01; full date/time widths only. |
| `E8601DA10.` | `2018-03-15` | ISO date, timezone independent. |
| `E8601DTw.d` | `2026-01-01T12:34:56.125` | ISO datetime; full width only, no timezone suffix. |
| `$w. / $Fw.` | `$3. → abc` | Character width truncation and padding in PUT. |
| `$CHARw.` | `$char6.` | Character text; leading blanks preserved. |
| `$UPCASEw.` | `$upcase5. → ABC` | Uppercase character text with width handling. |

## INPUT informats

Supported: numeric w.d/Fw.d/BESTw., COMMAw.d/DOLLARw.d, PERCENTw.d, DATEw., MMDDYYw., DDMMYYw., YYMMDDw., TIMEw., DATETIMEw., E8601DA10., E8601DTw.d, $w., $CHARw., and $UPCASEw. Width limits source characters. Numeric implied decimals apply when the input has no decimal point/exponent. Impossible dates return missing and set _ERROR_ unless ?? is used; a fixed 1926–2025 window resolves two-digit years. Date/time computations use UTC; dates use days since 1960 and times/datetimes use seconds. Invalid-source diagnostics and supported modifiers are tested. Unlisted informats and INPUT/PUT statements remain unavailable.

## RAND subset

Use `CALL STREAMINIT('MT32',12345);` or MT2002 before RAND. The seed must be an integer in 1–4294967295. The first initialization in each DATA step wins; separate steps and runs get separate stream state. UNIFORM accepts zero, one, or two bounds and NORMAL accepts optional mean/sigma. Normal sigma must be nonnegative; mean is bounded for finite computation. Missing/nonpositive seeds, default MTHYBRID, other RNGs, and other distributions are explicitly rejected.

MT19937/2002 integer output matches canonical reference vectors and 60,000 integers from an independent NumPy implementation. Uniform conversion is `(uint32 + 0.5) / 2^32`. Normal uses a Marsaglia polar sampler without caching its second variate. SAS uniform and normal bit sequences are not verified. See [implementation notes](formats-conversions-rand.md).

## Macro functions are separate

The macro expander supports `%EVAL(expression)` for integer expressions and `%UPCASE(text)`. They generate program text before DATA step execution; they are not additional DATA step functions.

## Source of this inventory

Audited directly from `dist/engine.mjs` (function registry, FORMAT parser, and display renderer) plus `dist/formats.mjs`, `dist/random.mjs`, and `dist/macros.mjs`. A function being callable does not establish SAS conformance for every input.

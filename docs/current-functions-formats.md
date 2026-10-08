# Current DATA step functions and formats

These are the 32 functions implemented in this app, not a complete SAS catalog. Names are case-insensitive. Brackets mean optional arguments, and … means repeated explicit arguments; OF variable lists and arrays are not supported. String handling, argument validation, type conversion, missing values, rounding, and date edge cases are a practical subset, not certified SAS behavior.

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

## Formats

Formats change the table display only. CSV export keeps raw values. Width w is parsed but is not enforced; decimal precision d is used by COMMA, DOLLAR, and PERCENT. DATE9 and YYMMDD10 require their documented exact forms. Arbitrary decimal precision can exceed JavaScript limits. Bare numeric formats (such as 8.2), character formats, time/datetime formats, informats, INPUT/PUT conversion functions, and user-defined formats are not implemented.

| Format family | Example | Display example | Behavior |
|---|---|---|---|
| `DATE9.` | `date9.` | `01JAN2026` | SAS date in days since 1960-01-01. Only the exact DATE9 form is rendered as a date. |
| `YYMMDD10.` | `yymmdd10.` | `2026-01-01` | SAS date in days since 1960-01-01. Only the exact YYMMDD10 form is rendered as a date. |
| `COMMAw.d` | `comma12.2` | `1,234.50` | US grouping separators; omitted decimal precision defaults to 0. |
| `DOLLARw.d` | `dollar12.2` | `$1,234.50` | US dollar prefix and grouping separators; omitted decimal precision defaults to 2. |
| `PERCENTw.d` | `percent8.1` | `12.5%` | Multiply by 100 and append %. Omitted decimal precision defaults to 0. |
| `BESTw.` | `best12.` | `1234.5` | Accepted but displays ordinary JavaScript number text. SAS BEST width/precision rules are not implemented. |

Display examples use 1 January 2026 for dates, 1234.5 for COMMA/DOLLAR/BEST, and 0.125 for PERCENT.

## Macro functions are separate

The macro expander supports `%EVAL(expression)` for integer expressions and `%UPCASE(text)`. They generate program text before DATA step execution; they are not additional DATA step functions.

## Source of this inventory

Audited directly from `dist/engine.mjs` (function registry, FORMAT parser, and display renderer) and `dist/macros.mjs`. A function being callable does not establish SAS conformance for every input.
